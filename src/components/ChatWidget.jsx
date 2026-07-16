import { useEffect, useRef, useState } from "react";
import { sendWebsiteChatMessage } from "../lib/fastapiClient";

const BOT_NAME = "Ace";
const BRAND = "#e63946";
const BRAND_DARK = "#be123c";
const INK = "#1e293b";

const SHORTCUTS = [
  { label: "Stock", message: "Is this product in stock?", icon: (
    <svg width="18" height="18" fill="none" stroke={BRAND} strokeWidth="2" viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/></svg>
  ) },
  { label: "Pricing", message: "How much does this cost?", icon: (
    <svg width="18" height="18" fill="none" stroke={BRAND} strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ) },
  { label: "Shipping", message: "How much does shipping cost?", icon: (
    <svg width="18" height="18" fill="none" stroke={BRAND} strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="1.5"/><circle cx="18.5" cy="18.5" r="1.5"/></svg>
  ) },
];

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center", padding: "10px 13px" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "#cbd5e1",
          animation: `sw-chat-bounce 1.1s ${i * 0.15}s infinite ease-in-out`,
        }} />
      ))}
    </span>
  );
}

function BotIcon({ size = 18, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 12a8 8 0 1 1 3.2 6.4L4 19.5l1.1-3.3A7.96 7.96 0 0 1 4 12z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("home"); // "home" | "chat"
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setView("chat");
    setMessages(m => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const result = await sendWebsiteChatMessage(trimmed);
      setMessages(m => [...m, { role: "assistant", text: result.reply }]);
    } catch (e) {
      console.error("Website chat failed:", e);
      setMessages(m => [...m, { role: "assistant", text: "Sorry, I couldn't reach the assistant service right now." }]);
    } finally {
      setLoading(false);
    }
  }

  function goHome() {
    setView("home");
  }

  return (
    <>
      <style>{`
        @keyframes sw-chat-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }
        @keyframes sw-chat-pop { from { opacity: 0; transform: translateY(12px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes sw-chat-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .sw-chat-panel { animation: sw-chat-pop 0.18s ease-out; }
        .sw-chat-launcher:hover { transform: scale(1.06); box-shadow: 0 10px 28px rgba(230,57,70,0.45); }
        .sw-chat-suggestion:hover { background: ${BRAND} !important; color: #fff !important; }
        .sw-chat-cta:hover { border-color: ${BRAND} !important; background: #fff7f7 !important; }
        .sw-chat-shortcut:hover { border-color: ${BRAND} !important; }
        .sw-chat-send:not(:disabled):hover { background: ${BRAND_DARK} !important; }
        .sw-chat-icon-btn:hover { background: #f1f5f9 !important; }
      `}</style>

      <div style={{ position: "relative" }}>
        <button
          className="sw-chat-launcher"
          onClick={() => setOpen(o => !o)}
          aria-label={`Chat with ${BOT_NAME}, the Sports Way assistant`}
          style={{
            width: 58, height: 58, borderRadius: "50%",
            background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
            color: "#fff", border: "3px solid #fff", cursor: "pointer",
            boxShadow: "0 8px 24px rgba(230,57,70,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
        >
          {open ? (
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <BotIcon size={26} />
          )}
        </button>

        {open && (
          <div className="sw-chat-panel" style={{
            position: "absolute", right: 0, bottom: "calc(100% + 14px)",
            width: 360, maxWidth: "calc(100vw - 48px)", height: 520, maxHeight: "calc(100vh - 200px)",
            background: "#fff", borderRadius: 22, boxShadow: "0 24px 64px rgba(15,23,42,0.3)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            fontFamily: "'Inter',system-ui,sans-serif", border: "1px solid #f1f5f9",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
              {view === "chat" ? (
                <button onClick={goHome} className="sw-chat-icon-btn" aria-label="Back"
                  style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" fill="none" stroke={INK} strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 9, background: BRAND, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BotIcon size={17} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: 15, margin: 0, color: INK }}>{BOT_NAME}</p>
                {view === "home" && <p style={{ fontSize: 11, color: "#94a3b8", margin: "1px 0 0" }}>Sports Way Assistant</p>}
              </div>
              <button onClick={() => setOpen(false)} className="sw-chat-icon-btn" aria-label="Close"
                style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>

            {view === "home" ? (
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                {!bannerDismissed && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff1f2", padding: "10px 16px", fontSize: 12, color: BRAND_DARK, fontWeight: 600 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0, animation: "sw-chat-pulse 1.6s infinite" }} />
                    <span style={{ flex: 1 }}>I can check live stock &amp; pricing for you.</span>
                    <button onClick={() => setBannerDismissed(true)} style={{ border: "none", background: "transparent", cursor: "pointer", color: BRAND_DARK, opacity: 0.6, fontSize: 13, lineHeight: 1 }}>×</button>
                  </div>
                )}

                <div style={{ padding: "22px 20px 10px", textAlign: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <BotIcon size={26} />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: INK, margin: 0, lineHeight: 1.4 }}>
                    Hi, I'm {BOT_NAME} — I'll help you check stock, prices, and shipping in seconds.
                  </p>
                </div>

                <div style={{ padding: "10px 20px" }}>
                  <button className="sw-chat-cta" onClick={() => sendMessage(SHORTCUTS[0].message)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s, background 0.15s" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {SHORTCUTS[0].icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: INK, margin: 0 }}>Check product stock</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: "1px 0 0" }}>Live from our inventory</p>
                    </div>
                    <svg width="16" height="16" fill="none" stroke="#cbd5e1" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 20px", color: "#cbd5e1", fontSize: 11, fontWeight: 700 }}>
                  <span style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
                  or explore
                  <span style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
                </div>

                <div style={{ display: "flex", gap: 10, padding: "12px 20px 20px" }}>
                  {SHORTCUTS.slice(1).map(s => (
                    <button key={s.label} className="sw-chat-shortcut" onClick={() => sendMessage(s.message)}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", transition: "border-color 0.15s" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {s.icon}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: INK }}>{s.label}</span>
                    </button>
                  ))}
                  <a href="https://wa.me/97439963997" target="_blank" rel="noreferrer" className="sw-chat-shortcut"
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", transition: "border-color 0.15s", textDecoration: "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" fill="none" stroke={BRAND} strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: INK }}>Human</span>
                  </a>
                </div>
              </div>
            ) : (
              <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10, background: "#f8fafc" }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%", padding: "9px 13px", borderRadius: 14,
                    fontSize: 13, lineHeight: 1.4,
                    background: m.role === "user" ? BRAND : "#fff",
                    color: m.role === "user" ? "#fff" : INK,
                    border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                    boxShadow: m.role === "user" ? "0 2px 8px rgba(230,57,70,0.25)" : "none",
                  }}>
                    {m.text}
                  </div>
                ))}
                {loading && (
                  <div style={{ alignSelf: "flex-start", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14 }}>
                    <TypingDots />
                  </div>
                )}
              </div>
            )}

            <form
              onSubmit={e => { e.preventDefault(); sendMessage(input); }}
              style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid #f1f5f9", background: "#fff" }}
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Message ${BOT_NAME}…`}
                style={{ flex: 1, height: 42, padding: "0 16px", borderRadius: 21, border: "1.5px solid #e2e8f0", outline: "none", fontSize: 13, color: INK, background: "#f8fafc" }}
              />
              <button type="submit" className="sw-chat-send" disabled={loading || !input.trim()} aria-label="Send"
                style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: loading || !input.trim() ? "#e2e8f0" : BRAND, color: loading || !input.trim() ? "#94a3b8" : "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "background 0.15s" }}>
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
