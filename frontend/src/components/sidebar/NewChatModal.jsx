import { useEffect, useRef, useState } from "react";
import { createChat, searchUsers } from "../../api/chats";
import { Avatar } from "./Sidebar";

export default function NewChatModal({ onClose, onCreated }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  const search = (raw) => {
    const q = raw.replace(/^@/, "");
    setQuery(raw);
    setSelected(null);
    clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try { const { data } = await searchUsers(q); setResults(data); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 280);
  };

  const submit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { data } = await createChat({ chat_type: "dm", name: null, member_ids: [selected.id] });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-sm sm:mx-4 flex flex-col gap-4 animate-slide-up sm:animate-pop"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04) inset",
          borderRadius: "24px 24px 0 0",
          padding: "20px 16px calc(20px + env(safe-area-inset-bottom))",
        }}
      >
        {/* Handle */}
        <div className="sm:hidden w-10 h-1 rounded-full mx-auto"
          style={{ background: "var(--bg-elevated)" }} />

        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>New Message</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Find by @username</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-2xl flex items-center justify-center text-sm transition-all active:scale-90"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>✕</button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm select-none pointer-events-none"
            style={{ color: "var(--accent)" }}>@</span>
          <input
            ref={inputRef}
            className="input"
            style={{ paddingLeft: "1.75rem" }}
            placeholder="username"
            value={query.replace(/^@/, "")}
            onChange={e => search(e.target.value)}
            autoCapitalize="none" autoComplete="off"
          />
          {searching && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          )}
        </div>

        {/* No results */}
        {query.replace(/^@/, "").trim() && !searching && !results.length && (
          <div className="rounded-2xl px-4 py-4 text-sm text-center animate-fade-in"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
            No users found
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <ul className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)", maxHeight: 220, overflowY: "auto" }}>
            {results.map((u, i) => {
              const chosen = selected?.id === u.id;
              return (
                <li key={u.id} style={{ borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <button
                    onClick={() => setSelected(chosen ? null : u)}
                    className="w-full flex items-center gap-3 px-3 py-3 transition-all active:scale-[.98]"
                    style={{ background: chosen ? "rgba(124,111,255,.12)" : "var(--bg-base)" }}
                    onMouseEnter={e => { if (!chosen) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={e => { if (!chosen) e.currentTarget.style.background = "var(--bg-base)"; }}
                  >
                    <Avatar name={u.username} size={9} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{u.username}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{u.username}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150"
                      style={chosen
                        ? { background: "var(--accent)", borderColor: "var(--accent)" }
                        : { borderColor: "var(--text-muted)" }}>
                      {chosen && (
                        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {error && <p className="text-xs animate-fade-in" style={{ color: "#f87171" }}>{error}</p>}

        <button onClick={submit} disabled={loading || !selected} className="btn-primary">
          {loading ? "Opening…" : selected ? `Message @${selected.username}` : "Select a user"}
        </button>
      </div>
    </div>
  );
}
