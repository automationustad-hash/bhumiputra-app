import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const statusTag = (status) => {
  if (status === "verified") return <span className="tag tag-success">Verified</span>;
  if (status === "rejected") return <span className="tag tag-danger">Rejected</span>;
  return <span className="tag tag-warn">Pending verification</span>;
};

export default function FarmerHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoading(true);
      const [{ data: listingsData }, { count }] = await Promise.all([
        supabase
          .from("listings")
          .select("*")
          .eq("farmer_id", profile.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("farmer_id", profile.id)
          .eq("status", "pending"),
      ]);
      setListings(listingsData || []);
      setPendingOrders(count || 0);
      setLoading(false);
    })();
  }, [profile?.id]);

  return (
    <div className="page">
      <div className="top-bar">
        <div className="title">Hi, {profile?.name?.split(" ")[0] || "Farmer"}</div>
        <span className="tag tag-accent spacer">Farmer</span>
        {statusTag(profile?.kyc_status)}
      </div>

      <div className="content">
        <button className="btn btn-primary btn-block" onClick={() => navigate("/farmer/list")}>
          List a new product / नया उत्पाद जोड़ें
        </button>

        <div className="row-between" style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Your listings</div>
          <button
            style={{ background: "transparent", border: 0, color: "var(--color-accent-700)", fontWeight: 700, fontSize: 11.5 }}
            onClick={() => navigate("/farmer/orders")}
          >
            Orders {pendingOrders > 0 ? `(${pendingOrders} new)` : ""} →
          </button>
        </div>

        {loading && <div className="spinner-wrap">Loading your listings…</div>}

        {!loading && listings.length === 0 && (
          <div className="empty-state">
            You haven't listed any produce yet. Tap "List a new product" to get your first crop in
            front of buyers.
          </div>
        )}

        <div className="product-grid" style={{ marginTop: 12, marginLeft: -16, marginRight: -16, width: "calc(100% + 32px)" }}>
          {listings.map((l) => (
            <button key={l.id} className="product-card" onClick={() => navigate(`/product/${l.id}`)}>
              <div className="product-thumb">
                {l.images?.[0] ? <img src={l.images[0]} alt={l.crop_name} /> : l.crop_name?.[0] || "?"}
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{l.crop_name}</div>
                <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>
                  ₹{l.price_per_unit}/{l.unit} · {l.quantity} {l.unit} left
                </div>
                <span className={`tag ${l.status === "active" ? "tag-success" : "tag-neutral"}`} style={{ marginTop: 6 }}>
                  {l.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav role="farmer" />
    </div>
  );
}
