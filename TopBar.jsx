import { useNavigate } from "react-router-dom";

export default function TopBar({ title, onBack, right }) {
  const navigate = useNavigate();
  return (
    <div className="top-bar">
      <button className="back" onClick={onBack ?? (() => navigate(-1))} aria-label="Go back">
        ←
      </button>
      <div className="title">{title}</div>
      {right && <div className="spacer">{right}</div>}
    </div>
  );
}
