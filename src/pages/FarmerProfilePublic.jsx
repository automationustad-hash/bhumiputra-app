import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import { supabase } from "../lib/supabaseClient";

export default function FarmerProfilePublic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farmer, setFarmer] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: f }, { data: l }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("listings").select("*").eq("farmer_id", id).eq("status", "active"),
      ]);
      setFarmer(f);
      setListings(l || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="spinner-wrap">Loading…</div>;
  if (!farmer) return <div className="empty-state">Farmer not found.</div>;

  return (
    <div className="page no-nav">
      <TopBar title="Farm profile" onBack={() => navigate(-1)} />
      <div className="content">
        <div className="app-heading" style={{ fontSize: 20 }}>{farmer.name}</div>
        <div style={{ fontSize: 12.5, color: "var(--color-neutral-700)", marginTop: 4 }}>
          {farmer.village}, {farmer.district}, {farmer.state}
        </div>
        <span className={`tag ${farmer.kyc_status === "verified" ? "tag-success" : "tag-warn"}`} style={{ marginTop: 8 }}>
          {farmer.kyc_status === "verified" ? "Verified" : "Pending verification"}
        </span>

        <div style={{ fontSize: 13, marginTop: 14, lineHeight: 1.8 }}>
          <div><strong>Land size:</strong> {farmer.land_size ? `${farmer.land_size} acres` : "—"}</div>
          <div><strong>Crops grown:</strong> {farmer.crops?.join(", ") || "—"}</div>
        </div>

        <div style={{ fontWeight: 700, fontSize: 13, marginTop: 20 }}>Active listings</div>
        <div className="product-grid" style={{ marginTop: 8, marginLeft: -16, marginRight: -16, width: "calc(100% + 32px)" }}>
          {listings.map((l) => (
            <button key={l.id} className="product-card" onClick={() => navigate(`/product/${l.id}`)}>
              <div className="product-thumb">{l.images?.[0] ? <img src={l.images[0]} alt={l.crop_name} /> : l.crop_name?.[0]}</div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{l.crop_name}</div>
                <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>₹{l.price_per_unit}/{l.unit}</div>
              </div>
            </button>
          ))}
          {listings.length === 0 && <div className="empty-state">No active listings right now.</div>}
        </div>
      </div>
    </div>
  );
}
