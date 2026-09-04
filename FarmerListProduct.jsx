import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const CATEGORIES = ["Grains", "Vegetables", "Fruits", "Pulses", "Spices", "Other"];
const UNITS = ["kg", "quintal", "ton", "dozen", "piece"];
const GRADES = ["A", "B", "C"];

export default function FarmerListProduct() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [cropName, setCropName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(UNITS[0]);
  const [price, setPrice] = useState("");
  const [grade, setGrade] = useState(GRADES[0]);
  const [harvestDate, setHarvestDate] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canPublish = profile?.kyc_status === "verified";

  const handleFiles = (e) => {
    const chosen = Array.from(e.target.files || []).slice(0, 3);
    setFiles(chosen);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setError("");
    if (!cropName.trim() || !quantity || !price) {
      return setError("Crop name, quantity and price are required.");
    }
    setBusy(true);
    try {
      const imageUrls = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("listing-images").upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("listing-images").getPublicUrl(path);
        imageUrls.push(pub.publicUrl);
      }

      const { error: insertErr, data } = await supabase
        .from("listings")
        .insert({
          farmer_id: profile.id,
          crop_name: cropName.trim(),
          category,
          variety: variety.trim() || null,
          quantity: Number(quantity),
          unit,
          price_per_unit: Number(price),
          quality_grade: grade,
          harvest_date: harvestDate || null,
          description: description.trim() || null,
          images: imageUrls,
          status: canPublish ? "active" : "pending_review",
        })
        .select()
        .single();
      if (insertErr) throw insertErr;
      navigate(`/product/${data.id}`);
    } catch (err) {
      setError(err.message || "Could not publish this listing. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <TopBar title="New listing" onBack={() => navigate("/farmer/home")} />
      <div className="content">
        {!canPublish && (
          <div className="error-banner">
            Your KYC is still {profile?.kyc_status || "pending"}. You can prepare this listing now
            — it'll go live to buyers automatically once you're verified.
          </div>
        )}

        <form onSubmit={handlePublish}>
          <div className="field">
            <label>Crop name</label>
            <input value={cropName} onChange={(e) => setCropName(e.target.value)} placeholder="e.g. Tomato" />
          </div>

          <div className="field">
            <label>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`chip ${category === c ? "active" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Variety (optional)</label>
            <input value={variety} onChange={(e) => setVariety(e.target.value)} placeholder="e.g. Roma" />
          </div>

          <div className="row" style={{ marginTop: 16 }}>
            <div className="field" style={{ flex: 1, marginTop: 0 }}>
              <label>Quantity</label>
              <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1, marginTop: 0 }}>
              <label>Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Price per {unit} (₹)</label>
            <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>

          <div className="field">
            <label>Quality grade</label>
            <div style={{ display: "flex", gap: 8 }}>
              {GRADES.map((g) => (
                <button
                  type="button"
                  key={g}
                  className={`chip ${grade === g ? "active" : ""}`}
                  onClick={() => setGrade(g)}
                >
                  Grade {g}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Harvest date</label>
            <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} />
          </div>

          <div className="field">
            <label>Description (optional)</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="field">
            <label>Photos (up to 3)</label>
            <div
              style={{
                height: 130,
                border: "2px dashed var(--color-neutral-400)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-neutral-500)",
                position: "relative",
              }}
            >
              {files.length ? `${files.length} photo(s) selected` : "Add product photos — up to 3"}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              />
            </div>
          </div>

          <div style={{ fontSize: 11.5, color: "var(--color-neutral-600)", marginTop: 12, lineHeight: 1.5 }}>
            Transport is settled directly with the buyer in chat — pickup or delivery, who arranges
            it and who pays. BhumiPutra does not run logistics and adds no delivery charge.
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} disabled={busy}>
            {busy ? "Publishing…" : canPublish ? "Publish listing" : "Save listing (pending KYC)"}
          </button>
        </form>
      </div>
      <BottomNav role="farmer" />
    </div>
  );
}
