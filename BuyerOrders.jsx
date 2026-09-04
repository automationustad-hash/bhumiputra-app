import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const STATUS_TAG = {
  pending: "tag-warn",
  accepted: "tag-neutral",
  packed: "tag-neutral",
  in_transit: "tag-neutral",
  delivered: "tag-success",
  cancelled: "tag-danger",
  disputed: "tag-danger",
};

export default function BuyerOrders() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("*, listings(crop_name, unit), farmer:profiles!orders_farmer_id_fkey(name, village)")
        .eq("buyer_id", profile.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    })();
  }, [profile?.id]);

  return (
    <div className="page">
      <div className="top-bar">
        <div className="title">Your orders</div>
      </div>
      <div className="content" style={{ padding: 0 }}>
        {loading && <div className="spinner-wrap">Loading orders…</div>}
        {!loading && orders.length === 0 && (
          <div className="empty-state">No orders yet. Head to the marketplace to place your first order.</div>
        )}
        {orders.map((o) => (
          <button
            key={o.id}
            onClick={() => navigate(`/order/${o.id}`)}
            style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: 0 }}
          >
            <div className="card">
              <div className="row-between">
                <div style={{ fontWeight: 700, fontSize: 14 }}>{o.listings?.crop_name}</div>
                <span className={`tag ${STATUS_TAG[o.status] || "tag-neutral"}`}>{o.status}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--color-neutral-700)", marginTop: 4 }}>
                {o.quantity} {o.listings?.unit} · ₹{o.total_amount} · from {o.farmer?.name}, {o.farmer?.village}
              </div>
            </div>
          </button>
        ))}
      </div>
      <BottomNav role="buyer" />
    </div>
  );
}
