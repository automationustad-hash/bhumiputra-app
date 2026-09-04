import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const QUICK_REPLIES = ["Is this still available?", "Can you deliver?", "What's your best price?", "Sounds good"];

/**
 * Route param `key` is either:
 *  - an order UUID (chat scoped to that order), or
 *  - "listing-<listingId>" (pre-order inquiry chat with the farmer)
 */
export default function Chat() {
  const { key } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [otherParty, setOtherParty] = useState(null);
  const [conversationKey, setConversationKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (key.startsWith("listing-")) {
        const listingId = key.replace("listing-", "");
        const { data: listing } = await supabase
          .from("listings")
          .select("farmer_id, profiles(id, name)")
          .eq("id", listingId)
          .maybeSingle();
        if (listing) {
          setOtherParty(listing.profiles);
          setConversationKey(`listing-${listingId}-${profile.id}`);
        }
      } else {
        const { data: order } = await supabase
          .from("orders")
          .select("farmer_id, buyer_id, farmer:profiles!orders_farmer_id_fkey(id,name), buyer:profiles!orders_buyer_id_fkey(id,name)")
          .eq("id", key)
          .maybeSingle();
        if (order) {
          setOtherParty(profile.id === order.farmer_id ? order.buyer : order.farmer);
          setConversationKey(`order-${key}`);
        }
      }
      setLoading(false);
    })();
  }, [key, profile?.id]);

  useEffect(() => {
    if (!conversationKey) return;
    let channel;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_key", conversationKey)
        .order("created_at");
      setMessages(data || []);

      channel = supabase
        .channel(`chat-${conversationKey}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_key=eq.${conversationKey}` },
          (payload) => setMessages((prev) => [...prev, payload.new])
        )
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [conversationKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (content) => {
    const body = content ?? text;
    if (!body.trim() || !otherParty || !conversationKey) return;
    setText("");
    await supabase.from("messages").insert({
      conversation_key: conversationKey,
      sender_id: profile.id,
      receiver_id: otherParty.id,
      content: body.trim(),
    });
  };

  return (
    <div className="page no-nav" style={{ display: "flex", flexDirection: "column" }}>
      <TopBar title={otherParty?.name || "Chat"} onBack={() => navigate(-1)} />
      <div className="content" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {loading && <div className="spinner-wrap">Loading chat…</div>}
        {!loading && messages.length === 0 && (
          <div className="empty-state">No messages yet. Say hello 👋</div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === profile.id;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "78%",
                background: mine ? "var(--color-accent)" : "var(--color-surface)",
                color: mine ? "#fff" : "var(--color-text)",
                padding: "9px 12px",
                fontSize: 13.5,
                lineHeight: 1.4,
              }}
            >
              {m.content}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "8px 16px", display: "flex", gap: 8, overflowX: "auto" }}>
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            style={{ flex: "none", background: "transparent", color: "var(--color-text)", border: "1px solid var(--color-text)", padding: "7px 11px", fontSize: 11.5, whiteSpace: "nowrap" }}
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="row"
        style={{ borderTop: "2px solid var(--color-divider)", padding: 10, gap: 8 }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          style={{ flex: 1, padding: "12px 14px", background: "var(--color-surface)", border: "2px solid var(--color-text)" }}
        />
        <button className="btn btn-primary" style={{ padding: "12px 14px" }}>Send</button>
      </form>
    </div>
  );
}
