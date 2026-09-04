import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";

/**
 * Deliberately separate from AuthOtp: that flow writes role="farmer"/"buyer"
 * on every verify, which would be wrong here (and is blocked for "admin"
 * anyway — see prevent_client_admin_promotion in schema.sql). This screen
 * only authenticates; whether the signed-in user is actually an admin is
 * decided by their existing `profiles.role`, which only the project owner
 * can set, directly in the Supabase SQL Editor.
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, profile, refreshProfile } = useAuth();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Enter your admin email address.");
    setBusy(true);
    try {
      await sendOtp(email.trim().toLowerCase());
      setStep("otp");
    } catch (err) {
      setError(err.message || "Could not send code. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.trim().length < 6) return setError("Enter the 6-digit code from your email.");
    setBusy(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), otp.trim());
      await refreshProfile();
      navigate("/admin/queue");
    } catch (err) {
      setError(err.message || "That code didn't work. Check it and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page no-nav">
      <TopBar title="Admin sign in" onBack={() => navigate("/")} />
      <div className="content">
        {step === "email" && (
          <form onSubmit={handleSendOtp}>
            <div style={{ fontSize: 13, color: "var(--color-neutral-700)", lineHeight: 1.5 }}>
              Sign in with the email address your account was granted admin access under.
            </div>
            <div className="field">
              <label>Admin email</label>
              <input
                type="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <div className="error-banner">{error}</div>}
            <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} disabled={busy}>
              {busy ? "Sending code…" : "Send code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerify}>
            <div style={{ fontSize: 13, color: "var(--color-neutral-700)", lineHeight: 1.5 }}>
              Enter the 6-digit code sent to <strong>{email}</strong>.
            </div>
            <div className="field">
              <label>Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            {error && <div className="error-banner">{error}</div>}
            <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} disabled={busy}>
              {busy ? "Verifying…" : "Verify and continue"}
            </button>
          </form>
        )}

        {profile && profile.role !== "admin" && (
          <div className="error-banner" style={{ marginTop: 20 }}>
            Signed in, but this account doesn't have admin access.
          </div>
        )}
      </div>
    </div>
  );
}
