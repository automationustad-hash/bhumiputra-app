# BhumiPutra

Farm to buyer, direct — a mobile-first marketplace connecting farmers with buyers.
React + Vite frontend, Supabase for auth/database/storage/realtime, deployable on Netlify.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New project. Pick any name/region, set a database password (you won't need it day to day).
2. Wait for the project to finish provisioning (~2 minutes).
3. Open **SQL Editor** → New query → paste the entire contents of `supabase/schema.sql` from this project → **Run**.
   This creates all tables, Row Level Security policies, storage buckets (`listing-images`, `kyc-documents`), and enables realtime for chat.
4. Open **Authentication → Providers → Email** and confirm "Email OTP" / "Enable email provider" is turned on (it's on by default). No SMS/Twilio setup is required — this app signs people in with a 6-digit code emailed to them.
5. Open **Authentication → Email Templates → Magic Link / OTP** if you want to customize the email copy (optional — the default works fine).
6. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key — you'll need both next.

## 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). Sign up as a farmer or buyer with any real email you can check — you'll get a 6-digit code.

## 4. Deploy to Netlify

**Option A — Netlify UI (no CLI needed)**
1. Push this project to a GitHub repo.
2. In Netlify: **Add new site → Import an existing project** → pick the repo.
3. Build command and publish directory are already set via `netlify.toml` (`npm run build`, `dist`) — Netlify will detect them automatically.
4. Before the first deploy (or right after), go to **Site configuration → Environment variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. Netlify builds and gives you a live `*.netlify.app` URL. Add a custom domain under **Domain management** whenever you're ready.

**Option B — Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set VITE_SUPABASE_URL "https://YOUR-PROJECT-REF.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-public-key"
netlify deploy --prod
```

## 5. Admin: verifying farmers (KYC)

There's a full admin screen at **`/admin/queue`** — pending/approved counts, per-farmer
review (name, location, land size, crops, a signed link to their uploaded land
document), and one-tap Approve/Reject. Approving a farmer also auto-activates
any listings they created while still pending.

**Admin access is intentionally not self-service** — there's no public signup
for it, and the database will refuse any client request that tries to set
`role = 'admin'` on a profile (see the trigger in `supabase/schema.sql`). The
only way to grant admin is directly in the Supabase SQL Editor, which runs
outside that restriction:

1. Have the intended admin sign in through the app once (as a farmer or
   buyer — role doesn't matter, this just creates their account) at
   `/farmer/signup` or `/buyer/signup`.
2. In Supabase → **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'admin' where email = 'admin@example.com';
   ```
3. They can now sign in at **`yoursite.com/admin/login`** (this URL isn't
   linked anywhere in the app UI — bookmark it) and land on the verification
   queue at `/admin/queue`.

If you ran `schema.sql` before this admin screen was added, just re-run the
whole file — every statement in it is idempotent (`if not exists`, `drop … if
exists` before `create`), so re-running is safe and picks up the new admin
policies and the role-check widening (`farmer`/`buyer` → `farmer`/`buyer`/`admin`).

## What's implemented vs. simplified from the original design

| Area | Status |
|---|---|
| Farmer signup, KYC (land doc upload), home, list product, orders, profile | ✅ Full |
| Buyer signup, marketplace, search, product detail, cart, checkout, order tracking, profile | ✅ Full |
| Real-time chat (per order, and pre-order inquiry from a listing) | ✅ Full |
| Disputes | ✅ Filing + status; no admin resolution UI yet |
| Admin KYC verification queue | ✅ Full — approve/reject, proof doc, auto-activates listings |
| OTP delivery | Email OTP (free, built into Supabase) instead of SMS OTP (needs paid Twilio) |
| Payments | UPI/COD selection only — no payment gateway wired in; settlement happens directly between buyer and farmer, as the design intends |

## Project structure

```
src/
  lib/supabaseClient.js     Supabase client (reads VITE_ env vars)
  context/AuthContext.jsx   session, profile, OTP sign-in
  context/CartContext.jsx   local cart (per-farmer), persisted to localStorage
  components/               TopBar, BottomNav, ProtectedRoute
  pages/                    one file per screen
supabase/schema.sql         tables, RLS policies, storage buckets, realtime
netlify.toml                build + SPA redirect config
```

## Notes on the auth design

Supabase's email OTP creates the `auth.users` row on first successful verify —
there's no separate "sign up" call. The `profiles` row (name, role, village,
etc.) is created/updated separately via `upsertProfile`, keyed to the auth
user's id. This is why `ProtectedRoute` checks both "is there a session" and
"does the profile have a role/required fields yet" — a user can be
authenticated but mid-onboarding.
