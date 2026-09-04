import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const STAGES = ["pending", "accepted", "packed", "in_transit", "delivered"];

const STAGE_LABEL = {
  pending: "Order placed",
  accepted: "Accepted by farmer",
  packed: "Packed",
  in_transit: "In transit",
  delivered: "Delivered",
};

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: o }, { data: h }] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "*, listings(crop_name, unit), farmer:profiles!orders_farmer_id_fkey(id, name, village, phone), buyer:profiles!orders_buyer_id_fkey(id, name, phone)"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at"),
    ]);
    setOrder(o);
    setHistory(h || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <div className="spinner-wrap">Loading order…</div>;
  if (!order) return <div className="empty-state">Order not found.</div>;

  const isFarmer = profile?.id === order.farmer_id;
  const otherParty = isFarmer ? order.buyer : order.farmer;
  const currentIndex = STAGES.indexOf(order.status);

  return (
    <div className="page no-nav">
      <TopBar title={`Order · ${order.listings?.crop_name}`} onBack={() => navigate(-1)} />
      <div className="content">
        {order.status === "disputed" || order.status === "cancelled" ? (
          <div className="error-banner">This order is currently {order.status}.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STAGES.map((s, idx) => (
              <div key={s} className="row" style={{ gap: 12, padding: "8px 0" }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: idx <= currentIndex ? "var(--color-accent)" : "var(--color-neutral-300)",
                    flex: "none",
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: idx === currentIndex ? 700 : 400, color: idx <= currentIndex ? "var(--color-text)" : "var(--color-neutral-500)" }}>
                  {STAGE_LABEL[s]}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="divider" style={{ margin: "16px 0" }} />

        <div style={{ fontSize: 13.5, lineHeight: 1.8 }}>
          <div><strong>Quantity:</strong> {order.quantity} {order.listings?.unit}</div>
          <div><strong>Total:</strong> ₹{order.total_amount}</div>
          <div><strong>Payment:</strong> {order.payment_method === "upi" ? "UPI" : "Cash on delivery / pickup"}</div>
          <div><strong>Address:</strong> {order.delivery_address}</div>
          <div>
            <strong>{isFarmer ? "Buyer" : "Farmer"}:</strong> {otherParty?.name}
            {otherParty?.phone ? ` · ${otherParty.phone}` : ""}
          </div>
        </div>

        <button className="btn btn-secondary btn-block" style={{ marginTop: 20 }} onClick={() => navigate(`/chat/${order.id}`)}>
          Message {isFarmer ? "buyer" : "the farmer"}
        </button>
        <button className="btn btn-ghost" style={{ marginTop: 10, color: "var(--color-accent-700)" }} onClick={() => navigate(`/dispute?order=${order.id}`)}>
          Report a problem with this order
        </button>
      </div>
    </div>
  );
}
