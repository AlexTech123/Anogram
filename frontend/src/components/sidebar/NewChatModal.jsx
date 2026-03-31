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
  const timerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = (q) => {
    setQuery(q);
    setSelected(null);
    clearTimeout(timerRef.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await searchUsers(q.trim());
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const submit = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await createChat({
        chat_type: "dm",
        name: null,
        member_ids: [selected.id],
      });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl flex flex-col gap-4 p-6 animate-pop"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>New message</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Search by username</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
            {searching
              ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
                </svg>
            }
          </div>
          <input
            ref={inputRef}
            className="input pl-9"
            placeholder="Enter username…"
            value={query}
            onChange={(e) => search(e.target.value)}
          />
        </div>

        {/* Results */}
        {query.trim() && !searching && results.length === 0 && (
          <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>
            No users found for «{query}»
          </p>
        )}

        {results.length > 0 && (
          <ul className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {results.map((u) => {
              const isChosen = selected?.id === u.id;
              return (
                <li key={u.id} style={{ borderTop: "1px solid var(--border)" }} className="first:border-t-0">
                  <button
                    onClick={() => setSelected(isChosen ? null : u)}
                    className="w-full text-left px-3 py-3 flex items-center gap-3 transition-colors"
                    style={isChosen ? { background: "rgba(99,102,241,0.15)" } : { background: "var(--bg-base)" }}
                    onMouseEnter={e => { if (!isChosen) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={e => { if (!isChosen) e.currentTarget.style.background = "var(--bg-base)"; }}
                  >
                    <Avatar name={u.username} size={9} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {u.display_name || u.username}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>@{u.username}</p>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={isChosen
                        ? { background: "var(--accent)", borderColor: "var(--accent)" }
                        : { borderColor: "var(--text-muted)" }
                      }
                    >
                      {isChosen && (
                        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
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

        <button
          onClick={submit}
          disabled={loading || !selected}
          className="btn-primary"
        >
          {loading ? "Opening…" : selected ? `Message ${selected.display_name || selected.username}` : "Select a user"}
        </button>
      </div>
    </div>
  );
}
