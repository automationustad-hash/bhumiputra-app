import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";

const BUYER_TYPES = ["Household", "Bulk / Business"];

export default function BuyerSignupDetails() {
  const navigate = useNavigate();
  const { profile, upsertProfile } = useAuth();

  const [name, setName] = useState(profile?.name || "");
  const [buyerType, setBuyerType] = useState(profile?.buyer_type || BUYER_TYPES[0]);
  const [address, setAddress] = useState(profile?.address || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Your name is required.");
    setBusy(true);
    try {
      await upsertProfile({ name: name.trim(), buyer_type: buyerType, address: address.trim() || null });
      navigate("/buyer/home");
    } catch (err) {
      setError(err.message || "Could not save your profile. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page no-nav">
      <TopBar title="Buyer registration" />
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </div>

          <div className="field">
            <label>Buyer type</label>
            <div style={{ display: "flex", gap: 8 }}>
              {BUYER_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  className="chip"
                  style={{
                    background: buyerType === t ? "var(--color-text)" : "var(--color-bg)",
                    color: buyerType === t ? "var(--color-bg)" : "var(--color-text)",
                  }}
                  onClick={() => setBuyerType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Delivery address</label>
            <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Where should orders be delivered / picked up from" />
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} disabled={busy}>
            {busy ? "Saving…" : "Create free account"}
          </button>
        </form>
      </div>
    </div>
  );
}
