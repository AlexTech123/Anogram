import { useState } from "react";
import { createChat, searchUsers } from "../../api/chats";
import { Avatar } from "./Sidebar";

export default function NewChatModal({ onClose, onCreated }) {
  const [tab, setTab] = useState("dm");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async (q) => {
    setQuery(q);
    if (q.length < 1) { setResults([]); return; }
    const { data } = await searchUsers(q);
    setResults(data);
  };

  const toggle = (user) => {
    setSelected((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const submit = async () => {
    if (!selected.length) { setError("Select at least one user"); return; }
    if (tab === "group" && !groupName.trim()) { setError("Group name is required"); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await createChat({
        chat_type: tab,
        name: tab === "group" ? groupName.trim() : null,
        member_ids: selected.map((u) => u.id),
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
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl flex flex-col gap-5 p-6 animate-pop"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>New conversation</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "var(--bg-base)" }}>
          {[{ id: "dm", label: "Direct message" }, { id: "group", label: "Group chat" }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
              style={
                tab === t.id
                  ? { background: "var(--accent)", color: "#fff", boxShadow: "0 2px 12px rgba(99,102,241,0.4)" }
                  : { background: "transparent", color: "var(--text-secondary)" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "group" && (
          <input
            className="input"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            autoFocus
          />
        )}

        <div className="relative">
          <svg viewBox="0 0 24 24" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 fill-current" style={{ color: "var(--text-muted)" }}>
            <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search by username…"
            value={query}
            onChange={(e) => search(e.target.value)}
          />
        </div>

        {results.length > 0 && (
          <ul
            className="max-h-40 overflow-y-auto rounded-xl divide-y"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border)", divideColor: "var(--border)" }}
          >
            {results.map((u) => {
              const isChosen = !!selected.find((s) => s.id === u.id);
              return (
                <li key={u.id}>
                  <button
                    onClick={() => toggle(u)}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors text-sm"
                    style={isChosen ? { background: "rgba(99,102,241,0.1)" } : {}}
                    onMouseEnter={e => { if (!isChosen) e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={e => { if (!isChosen) e.currentTarget.style.background = "transparent"; }}
                  >
                    <Avatar name={u.username} size={7} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: "var(--text-primary)" }}>{u.display_name || u.username}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{u.username}</p>
                    </div>
                    {isChosen && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent)" }}>
                        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((u) => (
              <span
                key={u.id}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}
              >
                {u.username}
                <button onClick={() => toggle(u)} className="opacity-60 hover:opacity-100 ml-0.5">✕</button>
              </span>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs animate-fade-in" style={{ color: "#f87171" }}>{error}</p>
        )}

        <button
          onClick={submit}
          disabled={loading || !selected.length}
          className="btn-primary"
        >
          {loading ? "Creating…" : "Start conversation"}
        </button>
      </div>
    </div>
  );
}
