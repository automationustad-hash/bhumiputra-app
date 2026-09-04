import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const NEXT_STATUS = {
  pending: { next: "accepted", cta: "Accept order" },
  accepted: { next: "packed", cta: "Mark packed" },
  packed: { next: "in_transit", cta: "Mark in transit" },
  in_transit: { next: "delivered", cta: "Mark delivered" },
};

const STATUS_TAG = {
  pending: "tag-warn",
  accepted: "tag-neutral",
  packed: "tag-neutral",
  in_transit: "tag-neutral",
  delivered: "tag-success",
  cancelled: "tag-danger",
  disputed: "tag-danger",
};

export default function FarmerOrders() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, listings(crop_name, unit), buyer:profiles!orders_buyer_id_fkey(name, phone)")
      .eq("farmer_id", profile.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [profile?.id]);

  const advance = async (order) => {
    const step = NEXT_STATUS[order.status];
    if (!step) return;
    setBusyId(order.id);
    await supabase.from("orders").update({ status: step.next }).eq("id", order.id);
    await supabase.from("order_status_history").insert({ order_id: order.id, status: step.next });
    setBusyId(null);
    load();
  };

  return (
    <div className="page">
      <TopBar title="Orders" onBack={() => navigate("/farmer/home")} />
      <div className="content" style={{ padding: 0 }}>
        {loading && <div className="spinner-wrap">Loading orders…</div>}
        {!loading && orders.length === 0 && (
          <div className="empty-state">No orders yet. Once a buyer orders your produce, it'll show up here.</div>
        )}
        {orders.map((o) => {
          const step = NEXT_STATUS[o.status];
          return (
            <div key={o.id} className="card">
              <div className="row-between">
                <div style={{ fontWeight: 700, fontSize: 14 }}>{o.listings?.crop_name}</div>
                <span className={`tag ${STATUS_TAG[o.status] || "tag-neutral"}`}>{o.status}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--color-neutral-700)", marginTop: 4 }}>
                {o.quantity} {o.listings?.unit} · ₹{o.total_amount} · Buyer: {o.buyer?.name || "—"}
              </div>
              <div className="row" style={{ marginTop: 10, gap: 8 }}>
                {step && (
                  <button
                    className="btn btn-primary"
                    style={{ padding: "9px 14px" }}
                    disabled={busyId === o.id}
                    onClick={() => advance(o)}
                  >
                    {busyId === o.id ? "Updating…" : step.cta}
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  style={{ padding: "9px 14px" }}
                  onClick={() => navigate(`/chat/${o.id}`)}
                >
                  Message
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ marginLeft: "auto" }}
                  onClick={() => navigate(`/order/${o.id}`)}
                >
                  Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <BottomNav role="farmer" />
    </div>
  );
}
