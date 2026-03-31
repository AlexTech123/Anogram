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
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-sm sm:mx-4 flex flex-col gap-3 animate-pop"
        style={{
          background: "var(--bg-sidebar)",
          borderRadius: "16px 16px 0 0",
          padding: "20px 16px calc(20px + env(safe-area-inset-bottom))",
        }}
      >
        {/* handle */}
        <div className="sm:hidden w-8 h-1 rounded-full mx-auto mb-1" style={{ background: "var(--bg-elevated)" }} />

        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>New Message</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>✕</button>
        </div>

        {/* Search input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm select-none"
            style={{ color: "var(--accent)" }}>@</span>
          <input
            ref={inputRef}
            className="input"
            style={{ paddingLeft: "1.75rem" }}
            placeholder="username"
            value={query.replace(/^@/, "")}
            onChange={e => search(e.target.value)}
            autoCapitalize="none"
            autoComplete="off"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          )}
        </div>

        {/* Empty state */}
        {query.replace(/^@/, "").trim() && !searching && !results.length && (
          <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>
            No users found
          </p>
        )}

        {/* Results */}
        {results.length > 0 && (
          <ul className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--bg-elevated)", maxHeight: 200, overflowY: "auto" }}>
            {results.map((u, i) => {
              const chosen = selected?.id === u.id;
              return (
                <li key={u.id} style={{ borderTop: i ? "1px solid var(--bg-elevated)" : "none" }}>
                  <button
                    onClick={() => setSelected(chosen ? null : u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors"
                    style={{ background: chosen ? "rgba(42,171,238,.12)" : "var(--bg-card)" }}
                    onMouseEnter={e => { if (!chosen) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={e => { if (!chosen) e.currentTarget.style.background = "var(--bg-card)"; }}
                  >
                    <Avatar name={u.username} size={9} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{u.username}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{u.username}</p>
                    </div>
                    {chosen && (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" style={{ color: "var(--accent)" }}>
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {error && <p className="text-xs" style={{ color: "#ef5350" }}>{error}</p>}

        <button onClick={submit} disabled={loading || !selected} className="btn-primary mt-1">
          {loading ? "Opening…" : selected ? `Message @${selected.username}` : "Select a user"}
        </button>
      </div>
    </div>
  );
}
