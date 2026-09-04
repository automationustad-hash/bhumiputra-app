-- ============================================================================
-- BhumiPutra — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor (or via `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── profiles ─────────────────────────────────────────────────────────────
-- One row per auth.users id. role is set right after first OTP verify.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text check (role in ('farmer', 'buyer')),
  name text,
  email text,
  phone text,
  avatar_url text,

  -- farmer-only fields
  village text,
  district text,
  state text,
  land_size numeric,
  crops text[],
  land_doc_url text,
  kyc_status text default 'pending' check (kyc_status in ('pending', 'verified', 'rejected')),

  -- buyer-only fields
  buyer_type text check (buyer_type in ('Household', 'Bulk / Business')),
  address text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── listings ─────────────────────────────────────────────────────────────
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles (id) on delete cascade,
  crop_name text not null,
  category text not null,
  variety text,
  quantity numeric not null check (quantity >= 0),
  unit text not null,
  price_per_unit numeric not null check (price_per_unit >= 0),
  quality_grade text,
  harvest_date date,
  description text,
  images text[] default '{}',
  status text not null default 'pending_review'
    check (status in ('pending_review', 'active', 'sold', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_farmer_id_idx on public.listings (farmer_id);
create index if not exists listings_status_category_idx on public.listings (status, category);

-- ── orders ───────────────────────────────────────────────────────────────
-- One row per listing per checkout (a multi-item cart from one farmer
-- creates several sibling order rows, one per line item).
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  farmer_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  total_amount numeric not null check (total_amount >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'packed', 'in_transit', 'delivered', 'cancelled', 'disputed')),
  payment_method text check (payment_method in ('cod', 'upi')),
  delivery_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_buyer_id_idx on public.orders (buyer_id);
create index if not exists orders_farmer_id_idx on public.orders (farmer_id);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ── messages ─────────────────────────────────────────────────────────────
-- conversation_key is either "order-<order_id>" or "listing-<listing_id>-<buyer_id>"
-- (pre-order inquiry chat). Kept as free text rather than a strict FK so a
-- single table covers both conversation shapes without a join table.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_key text not null,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_key_idx on public.messages (conversation_key, created_at);

-- ── disputes ─────────────────────────────────────────────────────────────
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  raised_by uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'rejected')),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disputes_order_id_idx on public.disputes (order_id);

-- ── updated_at trigger helper ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists trg_disputes_updated_at on public.disputes;
create trigger trg_disputes_updated_at before update on public.disputes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.messages enable row level security;
alter table public.disputes enable row level security;

-- profiles: anyone signed in can read (needed to show farmer/buyer names on
-- listings, orders and chat); a user can only write their own row.
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- listings: public read of active listings; farmers manage their own rows
-- (any status, so they can see pending/inactive listings too).
drop policy if exists "listings_select_active_or_own" on public.listings;
create policy "listings_select_active_or_own" on public.listings
  for select using (status = 'active' or farmer_id = auth.uid());

drop policy if exists "listings_insert_own" on public.listings;
create policy "listings_insert_own" on public.listings
  for insert with check (farmer_id = auth.uid());

drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own" on public.listings
  for update using (farmer_id = auth.uid());

drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own" on public.listings
  for delete using (farmer_id = auth.uid());

-- orders: visible and editable only by the buyer or farmer on that order.
drop policy if exists "orders_select_party" on public.orders;
create policy "orders_select_party" on public.orders
  for select using (buyer_id = auth.uid() or farmer_id = auth.uid());

drop policy if exists "orders_insert_buyer" on public.orders;
create policy "orders_insert_buyer" on public.orders
  for insert with check (buyer_id = auth.uid());

drop policy if exists "orders_update_party" on public.orders;
create policy "orders_update_party" on public.orders
  for update using (buyer_id = auth.uid() or farmer_id = auth.uid());

-- order_status_history: readable/writable by either party on the parent order.
drop policy if exists "order_history_select_party" on public.order_status_history;
create policy "order_history_select_party" on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (o.buyer_id = auth.uid() or o.farmer_id = auth.uid())
    )
  );

drop policy if exists "order_history_insert_party" on public.order_status_history;
create policy "order_history_insert_party" on public.order_status_history
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (o.buyer_id = auth.uid() or o.farmer_id = auth.uid())
    )
  );

-- messages: sender or receiver only.
drop policy if exists "messages_select_party" on public.messages;
create policy "messages_select_party" on public.messages
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "messages_insert_sender" on public.messages;
create policy "messages_insert_sender" on public.messages
  for insert with check (sender_id = auth.uid());

drop policy if exists "messages_update_receiver_read" on public.messages;
create policy "messages_update_receiver_read" on public.messages
  for update using (receiver_id = auth.uid());

-- disputes: raised-by user or the other party on that order.
drop policy if exists "disputes_select_party" on public.disputes;
create policy "disputes_select_party" on public.disputes
  for select using (
    raised_by = auth.uid()
    or exists (
      select 1 from public.orders o
      where o.id = disputes.order_id
        and (o.buyer_id = auth.uid() or o.farmer_id = auth.uid())
    )
  );

drop policy if exists "disputes_insert_party" on public.disputes;
create policy "disputes_insert_party" on public.disputes
  for insert with check (
    raised_by = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = disputes.order_id
        and (o.buyer_id = auth.uid() or o.farmer_id = auth.uid())
    )
  );

-- ============================================================================
-- Storage buckets
-- ============================================================================
insert into storage.buckets (id, name, public)
  values ('listing-images', 'listing-images', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('kyc-documents', 'kyc-documents', false)
  on conflict (id) do nothing;

-- listing-images: public read; only the owning farmer (folder = their uid) can write.
drop policy if exists "listing_images_public_read" on storage.objects;
create policy "listing_images_public_read" on storage.objects
  for select using (bucket_id = 'listing-images');

drop policy if exists "listing_images_owner_write" on storage.objects;
create policy "listing_images_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- kyc-documents: strictly private, owner-only read/write.
drop policy if exists "kyc_docs_owner_read" on storage.objects;
create policy "kyc_docs_owner_read" on storage.objects
  for select using (
    bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "kyc_docs_owner_write" on storage.objects;
create policy "kyc_docs_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- Realtime (for chat)
-- ============================================================================
alter publication supabase_realtime add table public.messages;

-- ============================================================================
-- Admin support (safe to run again on an existing install)
-- ============================================================================

-- Allow 'admin' as a role. The original CHECK only allowed farmer/buyer, and
-- CREATE TABLE IF NOT EXISTS above is a no-op on an existing table, so this
-- constraint has to be widened explicitly.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('farmer', 'buyer', 'admin'));

-- Security: prevent any client request from ever setting role = 'admin'.
-- auth.uid() is only non-null for requests that go through PostgREST/the
-- Supabase client (i.e. carry a user JWT). Queries run directly in the
-- Supabase SQL Editor as the postgres role have no JWT, so auth.uid() is
-- null there and this trigger does not block them — that's the intended
-- escape hatch: the ONLY way to grant admin is
--   update public.profiles set role = 'admin' where email = '...';
-- run by the project owner in the SQL Editor, never through the app.
create or replace function public.prevent_client_admin_promotion()
returns trigger language plpgsql security definer as $$
begin
  if new.role = 'admin' and auth.uid() is not null then
    if tg_op = 'INSERT' or old.role is distinct from 'admin' then
      raise exception 'role cannot be set to admin from a client request';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_client_admin_promotion on public.profiles;
create trigger trg_prevent_client_admin_promotion
  before insert or update on public.profiles
  for each row execute function public.prevent_client_admin_promotion();

-- Admins can update any profile (used to set kyc_status) and any listing
-- (used to auto-activate a farmer's pending listings on approval).
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "listings_update_admin" on public.listings;
create policy "listings_update_admin" on public.listings
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Admins can read any farmer's private KYC document to review it.
drop policy if exists "kyc_docs_admin_read" on storage.objects;
create policy "kyc_docs_admin_read" on storage.objects
  for select using (
    bucket_id = 'kyc-documents'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
