import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const STATUS_STYLE = {
  pending: { label: "Pending", tag: "tag-warn", dot: "var(--color-warn)" },
  verified: { label: "Approved", tag: "tag-success", dot: "var(--color-success)" },
  rejected: { label: "Rejected", tag: "tag-danger", dot: "var(--color-danger)" },
};

export default function AdminQueue() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending"); // pending | all

  const load = async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "farmer")
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      const rank = { pending: 0, rejected: 1, verified: 2 };
      const sorted = [...(data || [])].sort(
        (a, b) => (rank[a.kyc_status] ?? 0) - (rank[b.kyc_status] ?? 0)
      );
      setFarmers(sorted);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const pendingCount = useMemo(() => farmers.filter((f) => f.kyc_status === "pending").length, [farmers]);
  const approvedCount = useMemo(() => farmers.filter((f) => f.kyc_status === "verified").length, [farmers]);
  const visible = filter === "pending" ? farmers.filter((f) => f.kyc_status === "pending") : farmers;

  const approve = async (farmer) => {
    setBusyId(farmer.id);
    setError("");
    const { error: err1 } = await supabase
      .from("profiles")
      .update({ kyc_status: "verified" })
      .eq("id", farmer.id);
    if (err1) {
      setError(err1.message);
      setBusyId(null);
      return;
    }
    // A farmer's listings created while unverified were saved as
    // pending_review — flip them live now that identity + land are approved.
    await supabase
      .from("listings")
      .update({ status: "active" })
      .eq("farmer_id", farmer.id)
      .eq("status", "pending_review");
    await load();
    setBusyId(null);
  };

  const reject = async (farmer) => {
    setBusyId(farmer.id);
    setError("");
    const { error: err } = await supabase
      .from("profiles")
      .update({ kyc_status: "rejected" })
      .eq("id", farmer.id);
    if (err) setError(err.message);
    await load();
    setBusyId(null);
  };

  const openProof = async (farmer) => {
    if (!farmer.land_doc_url) {
      alert("This farmer hasn't uploaded a land record yet.");
      return;
    }
    const { data, error: err } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(farmer.land_doc_url, 60);
    if (err) {
      alert(err.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="page no-nav">
      <TopBar
        title="Verification queue"
        onBack={() => navigate("/")}
        right={
          <button style={{ background: "transparent", border: 0, color: "var(--color-accent-700)", fontWeight: 700, fontSize: 11.5 }} onClick={handleSignOut}>
            Sign out
          </button>
        }
      />
      <div style={{ fontSize: 11, color: "var(--color-neutral-600)", padding: "10px 16px 0" }}>
        Admin · farmer KYC review
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "2px solid var(--color-divider)", marginTop: 10 }}>
        <div style={{ padding: 16, borderRight: "2px solid var(--color-divider)" }}>
          <div style={{ font: "600 10px/1 var(--font-body)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Pending</div>
          <div className="app-heading" style={{ fontSize: 16, marginTop: 8 }}>{pendingCount}</div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ font: "600 10px/1 var(--font-body)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Approved</div>
          <div className="app-heading" style={{ fontSize: 16, marginTop: 8 }}>{approvedCount}</div>
        </div>
      </div>

      <div className="row" style={{ padding: "10px 16px", gap: 8 }}>
        <button className={`chip ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>Pending only</button>
        <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All farmers</button>
      </div>

      {error && <div className="error-banner" style={{ margin: "0 16px" }}>{error}</div>}
      {loading && <div className="spinner-wrap">Loading queue…</div>}
      {!loading && visible.length === 0 && (
        <div className="empty-state">Nothing to review here.</div>
      )}

      <div>
        {visible.map((f) => {
          const s = STATUS_STYLE[f.kyc_status] || STATUS_STYLE.pending;
          return (
            <div key={f.id} style={{ padding: 16, borderBottom: "2px solid var(--color-divider)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ font: "600 10px/1 ui-monospace, Menlo, monospace", color: "var(--color-neutral-600)" }}>
                  {f.id.slice(0, 8)}
                </span>
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, font: "600 10.5px/1 var(--font-body)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                  <span style={{ width: 12, height: 12, border: "2px solid var(--color-text)", background: s.dot }} />
                  {s.label}
                </span>
              </div>

              <div className="app-heading" style={{ fontSize: 17, marginTop: 9 }}>{f.name || "Unnamed farmer"}</div>
              <div style={{ fontSize: 12, color: "var(--color-neutral-700)", marginTop: 5 }}>
                {[f.village, f.district, f.state].filter(Boolean).join(", ") || "No location on file"}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "flex-start" }}>
                <div style={{ width: 52, height: 52, flex: "none", background: "var(--color-surface)", border: "2px solid var(--color-divider)" }} />
                <div style={{ flex: 1, fontSize: 12, lineHeight: 1.45, color: "var(--color-neutral-800)" }}>
                  {f.land_size ? `${f.land_size} acres` : "Land size not given"}
                  {f.crops?.length ? ` · Grows: ${f.crops.join(", ")}` : ""}
                  {f.email ? ` · ${f.email}` : ""}
                  {f.phone ? ` · ${f.phone}` : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  className="btn btn-primary"
                  style={{ padding: "9px 14px" }}
                  disabled={busyId === f.id || f.kyc_status === "verified"}
                  onClick={() => approve(f)}
                >
                  {busyId === f.id ? "Working…" : "Approve"}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "9px 14px" }}
                  disabled={busyId === f.id || f.kyc_status === "rejected"}
                  onClick={() => reject(f)}
                >
                  Reject
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "9px 10px", color: "var(--color-accent-700)" }}
                  onClick={() => openProof(f)}
                >
                  Open proof
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: 16, fontSize: 11.5, lineHeight: 1.6, color: "var(--color-neutral-600)" }}>
        A farm's listings stay hidden until identity and land record are approved. Registration is
        free, so a rejection costs the farmer nothing.
      </div>
    </div>
  );
}
