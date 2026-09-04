import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ role, children }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="spinner-wrap">Loading…</div>;
  }
  if (!session) {
    return <Navigate to={role === "admin" ? "/admin/login" : "/"} replace />;
  }
  if (role === "admin") {
    // Admin status is granted only by direct SQL (see schema.sql) — never
    // through the app — so there's no "finish onboarding" redirect here,
    // just gate on whatever profile.role already is.
    return profile?.role === "admin" ? children : <Navigate to="/admin/login" replace />;
  }
  if (role && profile?.role && profile.role !== role) {
    return <Navigate to={profile.role === "farmer" ? "/farmer/home" : "/buyer/home"} replace />;
  }
  if (role && !profile?.role) {
    // Signed in but hasn't finished role-specific onboarding yet.
    return <Navigate to={role === "farmer" ? "/farmer/signup" : "/buyer/signup"} replace />;
  }
  return children;
}
