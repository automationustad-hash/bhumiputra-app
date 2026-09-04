import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient";

const METHODS = [
  { id: "cod", label: "Cash on delivery / pickup" },
  { id: "upi", label: "UPI (settled directly with farmer)" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { items, total, clearCart } = useCart();

  const [address, setAddress] = useState(profile?.address || "");
  const [method, setMethod] = useState(METHODS[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const payLabel = `₹${total.toFixed(2)}`;

  const handlePlaceOrder = async () => {
    setError("");
    if (!address.trim()) return setError("Enter a delivery / pickup address.");
    if (items.length === 0) return setError("Your cart is empty.");
    setBusy(true);
    try {
      const rows = items.map((i) => ({
        buyer_id: profile.id,
        farmer_id: i.farmer_id,
        listing_id: i.listing_id,
        quantity: i.quantity,
        unit_price: i.price_per_unit,
        total_amount: i.price_per_unit * i.quantity,
        status: "pending",
        payment_method: method,
        delivery_address: address.trim(),
      }));
      const { data, error: insertErr } = await supabase.from("orders").insert(rows).select();
      if (insertErr) throw insertErr;

      await supabase
        .from("order_status_history")
        .insert(data.map((o) => ({ order_id: o.id, status: "pending" })));

      clearCart();
      navigate(data.length === 1 ? `/order/${data[0].id}` : "/buyer/orders");
    } catch (err) {
      setError(err.message || "Could not place your order. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page no-nav">
      <TopBar title="Checkout" onBack={() => navigate("/buyer/cart")} />
      <div className="content">
        {items.map((i) => (
          <div key={i.listing_id} style={{ display: "flex", padding: "9px 0", borderBottom: "1px solid var(--color-neutral-300)", fontSize: 13 }}>
            <div style={{ flex: 1 }}>{i.crop_name} × {i.quantity} {i.unit}</div>
            <div style={{ fontWeight: 700 }}>₹{(i.price_per_unit * i.quantity).toFixed(2)}</div>
          </div>
        ))}

        <div className="field">
          <label>Delivery / pickup address</label>
          <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Where the farmer should deliver, or where you'll pick up from" />
        </div>

        <div className="field">
          <label>Payment method</label>
          <div>
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  textAlign: "left",
                  padding: "14px 16px",
                  background: "transparent",
                  border: 0,
                  borderBottom: "2px solid var(--color-divider)",
                  fontWeight: method === m.id ? 700 : 400,
                }}
                onClick={() => setMethod(m.id)}
              >
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--color-text)", background: method === m.id ? "var(--color-accent)" : "transparent" }} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="row-between" style={{ fontWeight: 800, fontSize: 16, marginTop: 16 }}>
          <div>Total</div>
          <div>{payLabel}</div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy} onClick={handlePlaceOrder}>
          {busy ? "Placing order…" : `Place order · ${payLabel}`}
        </button>
      </div>
    </div>
  );
}
