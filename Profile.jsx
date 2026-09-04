import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const role = profile?.role || "buyer";

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="page">
      <div className="top-bar">
        <div className="title">Profile</div>
      </div>
      <div className="content">
        <div className="card" style={{ borderBottom: "2px solid var(--color-divider)", padding: "16px 0" }}>
          <div style={{ fontWeight: 800, fontSize: 20 }} className="app-heading">
            {profile?.name || "Complete your profile"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--color-neutral-700)", marginTop: 4 }}>
            {profile?.email}
            {profile?.phone ? ` · ${profile.phone}` : ""}
          </div>
          {role === "farmer" && (
            <div style={{ marginTop: 8 }}>
              <span
                className={`tag ${
                  profile?.kyc_status === "verified" ? "tag-success" : profile?.kyc_status === "rejected" ? "tag-danger" : "tag-warn"
                }`}
              >
                {profile?.kyc_status === "verified" ? "Verified" : profile?.kyc_status === "rejected" ? "Rejected" : "Pending verification"}
              </span>
            </div>
          )}
        </div>

        {role === "farmer" && (
          <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.8 }}>
            <div><strong>Village:</strong> {profile?.village || "—"}</div>
            <div><strong>District:</strong> {profile?.district || "—"}</div>
            <div><strong>State:</strong> {profile?.state || "—"}</div>
            <div><strong>Land size:</strong> {profile?.land_size ? `${profile.land_size} acres` : "—"}</div>
            <div><strong>Crops:</strong> {profile?.crops?.join(", ") || "—"}</div>
          </div>
        )}

        {role === "buyer" && (
          <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.8 }}>
            <div><strong>Buyer type:</strong> {profile?.buyer_type || "—"}</div>
            <div><strong>Delivery address:</strong> {profile?.address || "—"}</div>
          </div>
        )}

        <div style={{ marginTop: 26 }}>
          <button
            className="btn btn-secondary btn-block"
            onClick={() => navigate("/dispute")}
          >
            Help &amp; disputes
          </button>
          <button className="btn btn-secondary btn-block" style={{ marginTop: 10 }} onClick={handleSignOut}>
            Switch role / sign out
          </button>
        </div>

        <div style={{ marginTop: 24, fontSize: 11.5, lineHeight: 1.5, color: "var(--color-neutral-600)" }}>
          Transport is settled between the two of you — mode, charge and who pays. BhumiPutra
          neither arranges nor bills it.
        </div>
      </div>
      <BottomNav role={role} />
    </div>
  );
}
