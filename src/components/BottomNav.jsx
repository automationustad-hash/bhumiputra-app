import { useNavigate, useLocation } from "react-router-dom";

const FARMER_TABS = [
  { label: "HOME", path: "/farmer/home" },
  { label: "LIST", path: "/farmer/list" },
  { label: "ORDERS", path: "/farmer/orders" },
  { label: "PROFILE", path: "/farmer/profile" },
];

const BUYER_TABS = [
  { label: "MARKET", path: "/buyer/home" },
  { label: "SEARCH", path: "/buyer/search" },
  { label: "ORDERS", path: "/buyer/orders" },
  { label: "PROFILE", path: "/buyer/profile" },
];

export default function BottomNav({ role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = role === "farmer" ? FARMER_TABS : BUYER_TABS;

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={location.pathname.startsWith(tab.path) ? "active" : ""}
          onClick={() => navigate(tab.path)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
