import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient";

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const { addItem, canAddFromFarmer } = useCart();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("listings")
        .select("*, profiles(name, village, district, phone)")
        .eq("id", id)
        .maybeSingle();
      setListing(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="spinner-wrap">Loading…</div>;
  if (!listing) return <div className="empty-state">Listing not found.</div>;

  const isOwnListing = profile?.role === "farmer" && profile.id === listing.farmer_id;

  const handleAdd = () => {
    if (!canAddFromFarmer(listing.farmer_id)) {
      const ok = window.confirm(
        "Your cart has produce from a different farmer. Orders are placed per farmer — start a new cart with this item?"
      );
      if (!ok) return;
    }
    addItem(listing, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="page no-nav">
      <div style={{ position: "relative" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ position: "absolute", top: 14, left: 14, background: "var(--color-bg)", border: "2px solid var(--color-text)", padding: "6px 10px", fontWeight: 800, zIndex: 2 }}
        >
          ←
        </button>
        <div className="product-thumb" style={{ aspectRatio: "4/3", borderRadius: 0 }}>
          {listing.images?.[0] ? (
            <img src={listing.images[0]} alt={listing.crop_name} />
          ) : (
            listing.crop_name?.[0] || "?"
          )}
        </div>
      </div>

      <div className="content">
        <div className="row-between">
          <div className="app-heading" style={{ fontSize: 22 }}>{listing.crop_name}</div>
          <span className="tag tag-accent">Grade {listing.quality_grade}</span>
        </div>
        {listing.variety && <div style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>{listing.variety}</div>}

        <div style={{ fontWeight: 800, fontSize: 22, marginTop: 10 }}>
          ₹{listing.price_per_unit} <span style={{ fontSize: 13, fontWeight: 500 }}>/ {listing.unit}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-neutral-700)", marginTop: 2 }}>
          {listing.quantity} {listing.unit} available
        </div>

        {listing.description && (
          <div style={{ fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>{listing.description}</div>
        )}

        <div className="divider" style={{ margin: "18px 0" }} />

        <div style={{ fontWeight: 700, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>
          Farmer gets
        </div>
        <div className="row-between" style={{ marginTop: 8 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{listing.profiles?.name}</div>
            <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>
              {listing.profiles?.village}, {listing.profiles?.district}
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-secondary" style={{ padding: "8px 12px" }} onClick={() => navigate(`/farmer-profile/${listing.farmer_id}`)}>
              Farm profile
            </button>
            {!isOwnListing && (
              <button className="btn btn-secondary" style={{ padding: "8px 12px" }} onClick={() => navigate(`/chat/listing-${listing.id}`)}>
                Chat
              </button>
            )}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "var(--color-neutral-700)", marginTop: 18, lineHeight: 1.5 }}>
          Transport is settled directly with the farmer in chat — pickup or delivery, who arranges
          it and who pays. BhumiPutra does not run logistics and adds no delivery charge.
        </div>
      </div>

      {!isOwnListing && (
        <div className="row" style={{ borderTop: "2px solid var(--color-divider)" }}>
          <div className="row" style={{ padding: "0 12px" }}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 46, height: 46, background: "transparent", border: 0, borderRight: "2px solid var(--color-text)", fontWeight: 800, fontSize: 20 }}>
              −
            </button>
            <div style={{ width: 40, textAlign: "center", fontWeight: 700 }}>{qty}</div>
            <button onClick={() => setQty((q) => q + 1)} style={{ width: 46, height: 46, background: "transparent", border: 0, borderLeft: "2px solid var(--color-text)", fontWeight: 800, fontSize: 20 }}>
              +
            </button>
          </div>
          <button className="btn btn-primary" style={{ flex: 1, padding: 16, borderLeft: "2px solid var(--color-text)" }} onClick={handleAdd}>
            {added ? "Added ✓" : "Add to cart"}
          </button>
        </div>
      )}
    </div>
  );
}
