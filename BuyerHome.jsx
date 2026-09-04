import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient";

const CATEGORIES = ["All", "Grains", "Vegetables", "Fruits", "Pulses", "Spices", "Other"];

export default function BuyerHome() {
  const navigate = useNavigate();
  const { count } = useCart();
  const [category, setCategory] = useState("All");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from("listings")
        .select("*, profiles(name, village)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (category !== "All") query = query.eq("category", category);
      const { data } = await query;
      setListings(data || []);
      setLoading(false);
    })();
  }, [category]);

  return (
    <div className="page">
      <div className="top-bar">
        <div className="title">Marketplace</div>
        <button
          className="spacer"
          style={{ marginLeft: "auto", background: "var(--color-text)", color: "var(--color-bg)", border: 0, padding: "9px 12px", fontWeight: 700, fontSize: 11 }}
          onClick={() => navigate("/buyer/cart")}
        >
          CART {count}
        </button>
      </div>

      <button
        style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 16px", background: "var(--color-surface)", border: 0, borderBottom: "2px solid var(--color-divider)", fontSize: 13.5, color: "var(--color-neutral-700)" }}
        onClick={() => navigate("/buyer/search")}
      >
        Search produce, farmers, villages…
      </button>

      <div style={{ display: "flex", overflowX: "auto", borderBottom: "2px solid var(--color-divider)" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            style={{
              flex: "none",
              padding: "12px 14px",
              background: category === c ? "var(--color-text)" : "transparent",
              color: category === c ? "var(--color-bg)" : "var(--color-text)",
              border: 0,
              borderRight: "2px solid var(--color-divider)",
              fontWeight: 600,
              fontSize: 11.5,
              whiteSpace: "nowrap",
            }}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <div className="spinner-wrap">Loading marketplace…</div>}
      {!loading && listings.length === 0 && (
        <div className="empty-state">No listings in this category yet. Check back soon.</div>
      )}

      <div className="product-grid">
        {listings.map((l) => (
          <button key={l.id} className="product-card" onClick={() => navigate(`/product/${l.id}`)}>
            <div className="product-thumb">
              {l.images?.[0] ? <img src={l.images[0]} alt={l.crop_name} /> : l.crop_name?.[0] || "?"}
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{l.crop_name}</div>
              <div style={{ fontSize: 11.5, color: "var(--color-neutral-700)" }}>
                {l.profiles?.name} · {l.profiles?.village}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>
                ₹{l.price_per_unit}/{l.unit}
              </div>
            </div>
          </button>
        ))}
      </div>

      <BottomNav role="buyer" />
    </div>
  );
}
