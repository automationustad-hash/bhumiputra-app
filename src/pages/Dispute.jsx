import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const REASONS = [
  "Produce quality didn't match listing",
  "Order never arrived",
  "Wrong quantity delivered",
  "Payment issue",
  "Other",
];

export default function Dispute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const preselectedOrder = searchParams.get("order");
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState(preselectedOrder || "");
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!profile?.id || preselectedOrder) return;
    const column = profile.role === "farmer" ? "farmer_id" : "buyer_id";
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, listings(crop_name)")
        .eq(column, profile.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setOrders(data || []);
    })();
  }, [profile, preselectedOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!orderId) return setError("Select the order this relates to.");
    if (!description.trim()) return setError("Describe what went wrong.");
    setBusy(true);
    try {
      const { error: insertErr } = await supabase.from("disputes").insert({
        order_id: orderId,
        raised_by: profile.id,
        reason,
        description: description.trim(),
        status: "open",
      });
      if (insertErr) throw insertErr;
      await supabase.from("orders").update({ status: "disputed" }).eq("id", orderId);
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not submit the dispute. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="page no-nav">
        <TopBar title="Dispute submitted" onBack={() => navigate(-1)} />
        <div className="content">
          <div className="success-banner">
            Your dispute has been logged and the order is on hold.
          </div>
          <div className="row" style={{ gap: 12, marginTop: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-surface)" }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--color-neutral-500)" }}>The other party responds</div>
              <div style={{ fontSize: 11.5, color: "var(--color-neutral-600)", marginTop: 4 }}>Usually within 48 hours</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-block" style={{ marginTop: 20 }} onClick={() => navigate(`/chat/${orderId}`)}>
            Message the other party
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page no-nav">
      <TopBar title="Report a problem" onBack={() => navigate(-1)} />
      <div className="content">
        <form onSubmit={handleSubmit}>
          {!preselectedOrder && (
            <div className="field">
              <label>Which order?</label>
              <div>
                {orders.map((o) => (
                  <button
                    type="button"
                    key={o.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      textAlign: "left",
                      padding: "13px 16px",
                      background: orderId === o.id ? "var(--color-surface)" : "transparent",
                      border: 0,
                      borderBottom: "2px solid var(--color-divider)",
                    }}
                    onClick={() => setOrderId(o.id)}
                  >
                    {o.listings?.crop_name} — {o.id.slice(0, 8)}
                  </button>
                ))}
                {orders.length === 0 && <div className="hint">No orders found.</div>}
              </div>
            </div>
          )}

          <div className="field">
            <label>Reason</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {REASONS.map((r) => (
                <button type="button" key={r} className={`chip ${reason === r ? "active" : ""}`} onClick={() => setReason(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Describe what happened</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} disabled={busy}>
            {busy ? "Submitting…" : "Submit dispute"}
          </button>
        </form>
      </div>
    </div>
  );
}
