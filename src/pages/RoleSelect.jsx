import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function RoleSelect() {
  const navigate = useNavigate();
  const { session, profile, loading, upsertProfile } = useAuth();
  const [busy, setBusy] = useState(null); // "farmer" | "buyer" | null
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !session || !profile?.role) return;
    if (profile.role === "admin") {
      navigate("/admin/queue", { replace: true });
    } else {
      navigate(profile.role === "farmer" ? "/farmer/home" : "/buyer/home", { replace: true });
    }
  }, [loading, session, profile, navigate]);

  // Handles the email-confirmation-link flow: clicking the link in the
  // signup email lands the user right back here, already authenticated
  // (Supabase parses the access token from the URL automatically), but
  // with no profile role chosen yet. In that case we don't need to send
  // another email — just record the role and move straight into onboarding.
  const chooseRole = async (role) => {
    setError("");
    if (session) {
      setBusy(role);
      try {
        await upsertProfile({ role });
        navigate(role === "farmer" ? "/farmer/kyc" : "/buyer/signup-details");
      } catch (err) {
        setError(err.message || "Could not save your role. Try again.");
      } finally {
        setBusy(null);
      }
    } else {
      navigate(role === "farmer" ? "/farmer/signup" : "/buyer/signup");
    }
  };

  return (
    <div className="page no-nav">
      <div className="content" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ marginTop: 56 }}>
          <div className="app-heading" style={{ fontSize: 40 }}>BhumiPutra</div>
          <div style={{ fontSize: 13.5, color: "var(--color-neutral-700)", marginTop: 8, lineHeight: 1.5 }}>
            Farm to buyer, direct. No middlemen, fair prices, transport settled between you two.
          </div>
        </div>

        {session && !profile?.role && (
          <div style={{ fontSize: 12.5, color: "var(--color-success)", marginTop: 16 }}>
            You're signed in — choose a role below to finish setting up your account.
          </div>
        )}

        <div style={{ marginTop: 44 }}>
          <button
            className="btn btn-primary btn-block"
            style={{ padding: 18 }}
            disabled={busy !== null}
            onClick={() => chooseRole("farmer")}
          >
            <div>
              <div className="app-heading" style={{ fontSize: 22 }}>
                {busy === "farmer" ? "Setting up…" : "Farmer / किसान"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>List your produce, reach buyers directly</div>
            </div>
          </button>
          <button
            className="btn btn-secondary btn-block"
            style={{ padding: 18, marginTop: 12 }}
            disabled={busy !== null}
            onClick={() => chooseRole("buyer")}
          >
            <div>
              <div className="app-heading" style={{ fontSize: 22 }}>
                {busy === "buyer" ? "Setting up…" : "Buyer / खरीदार"}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>Order fresh produce straight from farms</div>
            </div>
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div style={{ marginTop: "auto", paddingTop: 40, fontSize: 11.5, color: "var(--color-neutral-600)", lineHeight: 1.5 }}>
          Buyers are household and bulk; the marketplace splits by order size.
        </div>
      </div>
    </div>
  );
}
