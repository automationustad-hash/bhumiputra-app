import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function RoleSelect() {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && session && profile?.role) {
      navigate(profile.role === "farmer" ? "/farmer/home" : "/buyer/home", { replace: true });
    }
  }, [loading, session, profile, navigate]);

  return (
    <div className="page no-nav">
      <div className="content" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ marginTop: 56 }}>
          <div className="app-heading" style={{ fontSize: 40 }}>BhumiPutra</div>
          <div style={{ fontSize: 13.5, color: "var(--color-neutral-700)", marginTop: 8, lineHeight: 1.5 }}>
            Farm to buyer, direct. No middlemen, fair prices, transport settled between you two.
          </div>
        </div>

        <div style={{ marginTop: 44 }}>
          <button className="btn btn-primary btn-block" style={{ padding: 18 }} onClick={() => navigate("/farmer/signup")}>
            <div>
              <div className="app-heading" style={{ fontSize: 22 }}>Farmer / किसान</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>List your produce, reach buyers directly</div>
            </div>
          </button>
          <button className="btn btn-secondary btn-block" style={{ padding: 18, marginTop: 12 }} onClick={() => navigate("/buyer/signup")}>
            <div>
              <div className="app-heading" style={{ fontSize: 22 }}>Buyer / खरीदार</div>
              <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>Order fresh produce straight from farms</div>
            </div>
          </button>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 40, fontSize: 11.5, color: "var(--color-neutral-600)", lineHeight: 1.5 }}>
          Buyers are household and bulk; the marketplace splits by order size.
        </div>
      </div>
    </div>
  );
}
