import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const CROPS = ["Wheat", "Rice", "Cotton", "Sugarcane", "Vegetables", "Fruits", "Pulses", "Spices"];

export default function FarmerKYC() {
  const navigate = useNavigate();
  const { user, profile, upsertProfile } = useAuth();

  const [name, setName] = useState(profile?.name || "");
  const [village, setVillage] = useState(profile?.village || "");
  const [district, setDistrict] = useState(profile?.district || "");
  const [state, setState] = useState(profile?.state || "");
  const [landSize, setLandSize] = useState(profile?.land_size || "");
  const [crops, setCrops] = useState(profile?.crops || []);
  const [landDoc, setLandDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggleCrop = (c) =>
    setCrops((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !village.trim() || !state.trim()) {
      return setError("Name, village and state are required.");
    }
    setBusy(true);
    try {
      let landDocPath = profile?.land_doc_url || null;
      if (landDoc) {
        const ext = landDoc.name.split(".").pop();
        const path = `${user.id}/land-doc-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("kyc-documents")
          .upload(path, landDoc, { upsert: true });
        if (upErr) throw upErr;
        landDocPath = path;
      }
      await upsertProfile({
        name: name.trim(),
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        land_size: landSize ? Number(landSize) : null,
        crops,
        land_doc_url: landDocPath,
        kyc_status: "pending",
      });
      navigate("/farmer/home");
    } catch (err) {
      setError(err.message || "Could not save your profile. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page no-nav">
      <TopBar title="Farmer registration" />
      <div className="content">
        <div style={{ fontSize: 13, color: "var(--color-neutral-700)", lineHeight: 1.5 }}>
          Step 2 of 2. Buyers see this profile before they order. Listings go live once identity
          and land record are verified.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </div>
          <div className="field">
            <label>Village</label>
            <input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Village name" />
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <div className="field" style={{ flex: 1, marginTop: 0 }}>
              <label>District</label>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1, marginTop: 0 }}>
              <label>State</label>
              <input value={state} onChange={(e) => setState(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Land size (acres)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={landSize}
              onChange={(e) => setLandSize(e.target.value)}
              placeholder="e.g. 3.5"
            />
          </div>

          <div className="field">
            <label>Crops you grow</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CROPS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`chip ${crops.includes(c) ? "active" : ""}`}
                  onClick={() => toggleCrop(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Land record / 7-12 extract (photo or PDF)</label>
            <div
              style={{
                aspectRatio: "3 / 1",
                border: "2px dashed var(--color-neutral-400)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-neutral-500)",
                fontWeight: 800,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {landDoc ? landDoc.name : "+ Upload document"}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setLandDoc(e.target.files?.[0] || null)}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              />
            </div>
            <div className="hint">
              Used to verify you farm the land you're listing. Kept private, visible only to
              BhumiPutra's verification team.
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} disabled={busy}>
            {busy ? "Submitting…" : "Submit for verification"}
          </button>
        </form>
      </div>
    </div>
  );
}
