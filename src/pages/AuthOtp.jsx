import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";

/**
 * Passwordless signup/login shared by farmer and buyer.
 * Step 1: enter email, we send a 6-digit OTP.
 * Step 2: enter OTP, verify, then move into the role's profile-completion step.
 */
export default function AuthOtp({ role }) {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, upsertProfile, profile } = useAuth();

  const [step, setStep] = useState("email"); // email | otp
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const roleLabel = role === "farmer" ? "Farmer" : "Buyer";
  const nextPath = role === "farmer" ? "/farmer/kyc" : "/buyer/signup-details";

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Enter your email address.");
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
      // Seed the role + phone immediately so ProtectedRoute knows which
      // onboarding flow this user belongs to even before KYC/profile is done.
      await upsertProfile({ role, phone: phone.trim() || null, email: email.trim().toLowerCase() });
      navigate(nextPath);
    } catch (err) {
      setError(err.message || "That code didn't work. Check it and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page no-nav">
      <TopBar title={`${roleLabel} sign in`} onBack={() => navigate("/")} />
      <div className="content">
        {step === "email" && (
          <form onSubmit={handleSendOtp}>
            <div style={{ fontSize: 13, color: "var(--color-neutral-700)", lineHeight: 1.5 }}>
              We'll email you a one-time code — no password to remember.
            </div>
            <div className="field">
              <label>Email address</label>
              <input
                type="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Phone number (optional)</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <div className="hint">Buyers and other party will use this to coordinate pickup/delivery.</div>
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
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: 8 }}
              onClick={() => setStep("email")}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
