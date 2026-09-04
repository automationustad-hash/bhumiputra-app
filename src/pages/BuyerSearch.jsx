import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabaseClient";

export default function BuyerSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setSearched(true);
      const { data } = await supabase
        .from("listings")
        .select("*, profiles(name, village)")
        .eq("status", "active")
        .or(`crop_name.ilike.%${query}%,variety.ilike.%${query}%`)
        .limit(30);
      setResults(data || []);
      setLoading(false);
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="page">
      <TopBar title="Search" onBack={() => navigate("/buyer/home")} />
      <div className="content" style={{ paddingTop: 12 }}>
        <div className="field" style={{ marginTop: 0 }}>
          <input
            autoFocus
            placeholder="Search produce, farmers, villages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading && <div className="spinner-wrap">Searching…</div>}
        {!loading && searched && results.length === 0 && (
          <div className="empty-state">No matches for "{query}".</div>
        )}

        <div style={{ marginTop: 12 }}>
          {results.map((p) => (
            <button
              key={p.id}
              style={{ display: "flex", gap: 12, width: "100%", textAlign: "left", padding: "14px 0", background: "transparent", border: 0, borderBottom: "2px solid var(--color-divider)" }}
              onClick={() => navigate(`/product/${p.id}`)}
            >
              <div className="product-thumb" style={{ width: 64, height: 64, flex: "none" }}>
                {p.images?.[0] ? <img src={p.images[0]} alt={p.crop_name} /> : p.crop_name?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.crop_name}</div>
                <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>
                  {p.profiles?.name} · {p.profiles?.village}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>
                  ₹{p.price_per_unit}/{p.unit}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <BottomNav role="buyer" />
    </div>
  );
}
