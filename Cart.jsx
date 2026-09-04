import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, total } = useCart();

  return (
    <div className="page no-nav">
      <TopBar title="Your cart" onBack={() => navigate("/buyer/home")} />
      <div className="content" style={{ padding: 0 }}>
        {items.length === 0 && (
          <div className="empty-state">Your cart is empty. Browse the marketplace to add produce.</div>
        )}

        {items.map((i) => (
          <div key={i.listing_id} className="card row-between">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{i.crop_name}</div>
              <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>₹{i.price_per_unit} / {i.unit}</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <div className="row" style={{ border: "1px solid var(--color-text)" }}>
                <button onClick={() => updateQuantity(i.listing_id, i.quantity - 1)} style={{ width: 30, height: 30, background: "transparent", border: 0, borderRight: "1px solid var(--color-text)", fontWeight: 800 }}>−</button>
                <div style={{ width: 32, textAlign: "center", fontSize: 13 }}>{i.quantity}</div>
                <button onClick={() => updateQuantity(i.listing_id, i.quantity + 1)} style={{ width: 30, height: 30, background: "transparent", border: 0, borderLeft: "1px solid var(--color-text)", fontWeight: 800 }}>+</button>
              </div>
              <button onClick={() => removeItem(i.listing_id)} style={{ background: "transparent", border: 0, color: "var(--color-danger)", fontSize: 12 }}>Remove</button>
            </div>
          </div>
        ))}

        {items.length > 0 && (
          <div className="content">
            <div className="row-between" style={{ fontWeight: 800, fontSize: 16 }}>
              <div>Total</div>
              <div>₹{total.toFixed(2)}</div>
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => navigate("/buyer/checkout")}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
