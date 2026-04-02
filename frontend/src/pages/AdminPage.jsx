import { useEffect, useRef, useState } from "react";
import {
  adminLogin, adminLogout, hasAdminToken,
  getAdminStats, getAdminUsers, getAdminChats,
  getAdminStorage, getAdminSystem, deleteAdminUser,
} from "../api/admin";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtBytes(b) {
  if (!b) return "0 B";
  if (b >= 1024 ** 3) return (b / 1024 ** 3).toFixed(2) + " GB";
  if (b >= 1024 ** 2) return (b / 1024 ** 2).toFixed(1) + " MB";
  if (b >= 1024)      return (b / 1024).toFixed(1) + " KB";
  return b + " B";
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function fmtRelative(iso) {
  if (!iso) return "никогда";
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)     return "только что";
  if (diff < 3600)   return Math.floor(diff / 60) + " мин назад";
  if (diff < 86400)  return Math.floor(diff / 3600) + " ч назад";
  return Math.floor(diff / 86400) + " дн назад";
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, sub, accent }) {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02]"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: accent ? "rgba(124,111,255,.15)" : "var(--bg-elevated)" }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold" style={{ color: accent ? "var(--accent-light)" : "var(--text-primary)" }}>
          {fmt(value)}
        </p>
        <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

function Bar({ percent, color = "var(--accent)", bg = "var(--bg-elevated)", height = 8 }) {
  return (
    <div style={{ background: bg, borderRadius: height, height, overflow: "hidden" }}>
      <div style={{
        width: `${Math.min(percent, 100)}%`, height: "100%",
        background: color, borderRadius: height,
        transition: "width .6s cubic-bezier(.25,.8,.25,1)",
      }} />
    </div>
  );
}

function GaugeCard({ label, percent, used, total, color }) {
  const danger = percent > 85;
  const warn   = percent > 65;
  const c = danger ? "#f87171" : warn ? "#fbbf24" : color || "var(--accent)";
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-end justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</p>
        <p className="text-2xl font-bold" style={{ color: c }}>{percent?.toFixed(1)}%</p>
      </div>
      <Bar percent={percent} color={c} />
      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{used} / {total}</p>
    </div>
  );
}

function Avatar({ name, src, size = 8 }) {
  const palettes = [
    ["#818cf8","#6366f1"],["#f472b6","#ec4899"],["#fb923c","#f97316"],
    ["#34d399","#10b981"],["#60a5fa","#3b82f6"],["#a78bfa","#8b5cf6"],
  ];
  const [a, b] = palettes[(name?.charCodeAt(0) || 65) % palettes.length];
  const px = size * 4;
  if (src) return <img src={src} alt={name} style={{ width: px, height: px, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: px, height: px, borderRadius: 10, background: `linear-gradient(135deg,${a},${b})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 700, fontSize: Math.round(px * .4) }}>
      {(name || "?").replace(/^@/, "").charAt(0).toUpperCase()}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="rgba(124,111,255,.3)" strokeWidth="3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function Empty({ text = "Нет данных" }) {
  return <div className="text-center py-16 text-sm" style={{ color: "var(--text-muted)" }}>{text}</div>;
}

// ── tabs ──────────────────────────────────────────────────────────────────────

function TabOverview({ stats }) {
  if (!stats) return <Spinner />;
  const usedPct = stats.storage_quota_bytes > 0
    ? (stats.storage_used_bytes / stats.storage_quota_bytes) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon="👤" value={stats.users_total}      label="Пользователей"    sub={`+${fmt(stats.users_active_24h)} за 24ч`} accent />
        <StatCard icon="💬" value={stats.messages_total}   label="Сообщений"        sub={`+${fmt(stats.messages_today)} сегодня`} />
        <StatCard icon="📁" value={stats.chats_total}      label="Чатов" />
        <StatCard icon="🖼" value={stats.media_files}      label="Медиафайлов" />
        <StatCard icon="💾" value={stats.storage_used_mb + " МБ"} label="Занято на диске"
          sub={`из ${fmt(stats.storage_quota_mb)} МБ`} accent />
        <StatCard icon="📊" value={usedPct.toFixed(1) + "%"} label="Использование квоты" />
      </div>

      <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Хранилище медиа</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {fmtBytes(stats.storage_used_bytes)} / {fmtBytes(stats.storage_quota_bytes)}
          </p>
        </div>
        <Bar percent={usedPct}
          color={usedPct > 85 ? "#f87171" : usedPct > 65 ? "#fbbf24" : "var(--accent)"}
          height={10} />
      </div>
    </div>
  );
}

function TabUsers({ users, onDeleted }) {
  const [q, setQ] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (!users) return <Spinner />;
  const filtered = users.filter(u =>
    u.username.includes(q) || (u.display_name || "").toLowerCase().includes(q.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (confirmId !== id) { setConfirmId(id); return; }
    setDeleting(true);
    try {
      await deleteAdminUser(id);
      onDeleted(id);
      setConfirmId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        className="input text-sm"
        placeholder="Поиск по имени…"
        value={q}
        onChange={e => { setQ(e.target.value); setConfirmId(null); }}
      />
      {!filtered.length ? <Empty text="Пользователи не найдены" /> : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: 11 }}>
                {["Пользователь", "Сообщений", "Чатов", "Регистрация", "Последний визит", "Статус", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id}
                  style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-sidebar)", borderTop: "1px solid var(--border)" }}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.username} src={u.avatar_url} size={7} />
                      <div>
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                          {u.display_name || `@${u.username}`}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{fmt(u.message_count)}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{fmt(u.chat_count)}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{fmtRelative(u.last_seen)}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: u.is_active ? "rgba(74,222,128,.15)" : "rgba(248,113,113,.15)", color: u.is_active ? "#4ade80" : "#f87171" }}>
                      {u.is_active ? "активен" : "заблок."}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      disabled={deleting && confirmId === u.id}
                      onClick={() => handleDelete(u.id)}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                      style={{
                        background: confirmId === u.id ? "rgba(239,68,68,.7)" : "rgba(239,68,68,.1)",
                        color: confirmId === u.id ? "#fff" : "#f87171",
                        border: "1px solid rgba(239,68,68,.3)",
                      }}
                      onMouseLeave={() => { if (!deleting) setConfirmId(null); }}>
                      {deleting && confirmId === u.id ? "…" : confirmId === u.id ? "Точно?" : "Удалить"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabChats({ chats }) {
  const [q, setQ] = useState("");
  if (!chats) return <Spinner />;
  const filtered = chats.filter(c =>
    (c.name || c.members.join(" ")).toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="space-y-3">
      <input className="input text-sm" placeholder="Поиск по чату…" value={q} onChange={e => setQ(e.target.value)} />
      {!filtered.length ? <Empty text="Чаты не найдены" /> : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: 11 }}>
                {["Чат", "Участники", "Сообщений", "Создан", "Последнее"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id}
                  style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-sidebar)", borderTop: "1px solid var(--border)" }}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: c.chat_type === "dm" ? "rgba(124,111,255,.15)" : "rgba(59,130,246,.15)", color: c.chat_type === "dm" ? "var(--accent-light)" : "#60a5fa" }}>
                        {c.chat_type === "dm" ? "DM" : "группа"}
                      </span>
                      <span className="font-semibold truncate max-w-[160px]" style={{ color: "var(--text-primary)" }}>
                        {c.name || c.members.join(" & ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {c.members.map(m => `@${m}`).join(", ")}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{fmt(c.message_count)}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(c.created_at)}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs truncate max-w-[180px]" style={{ color: "var(--text-muted)" }}>
                      {c.last_message_content
                        ? <><span style={{ color: "var(--text-secondary)" }}>{c.last_message_content}</span></>
                        : "—"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                      {fmtRelative(c.last_message_at)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MediaTypeIcon({ url }) {
  const ext = url?.split(".").pop()?.toLowerCase() || "";
  if (["jpg","jpeg","png","gif","webp","avif"].includes(ext))
    return <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />;
  if (["mp4","webm","mov"].includes(ext))
    return <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>;
  if (["webm","mp3","ogg","wav","m4a"].includes(ext))
    return <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>;
  return <div className="w-full h-full flex items-center justify-center text-2xl">📄</div>;
}

function TabStorage({ storage }) {
  const [q, setQ] = useState("");
  if (!storage) return <Spinner />;
  const { files = [], total_bytes = 0 } = storage;
  const filtered = files.filter(f => f.filename.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <input className="input text-sm flex-1 mr-3" placeholder="Поиск по имени файла…" value={q} onChange={e => setQ(e.target.value)} />
        <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
          {files.length} файлов · {fmtBytes(total_bytes)}
        </span>
      </div>
      {!filtered.length ? <Empty text="Медиафайлы не найдены" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((f, i) => (
            <a key={i} href={f.url} target="_blank" rel="noreferrer"
              className="rounded-2xl overflow-hidden block transition-all hover:scale-[1.03] active:scale-95"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", textDecoration: "none" }}>
              <div className="w-full aspect-square overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                <MediaTypeIcon url={f.url} />
              </div>
              <div className="p-2">
                <p className="text-xs truncate font-medium" style={{ color: "var(--text-primary)" }}>{f.filename}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {fmtBytes(f.size_bytes)}
                  {f.chat_id && <span> · чат #{f.chat_id}</span>}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10 }}>{fmtRelative(f.modified_at)}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function TabSystem({ system }) {
  if (!system) return <Spinner />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <GaugeCard
        label="Процессор"
        percent={system.cpu_percent}
        used={system.cpu_percent?.toFixed(1) + "%"}
        total="100%"
        color="#818cf8"
      />
      <GaugeCard
        label="Оперативная память"
        percent={system.ram_percent}
        used={system.ram_used_mb + " МБ"}
        total={system.ram_total_mb + " МБ"}
        color="var(--accent)"
      />
      <GaugeCard
        label="Диск"
        percent={system.disk_percent}
        used={system.disk_used_gb + " ГБ"}
        total={system.disk_total_gb + " ГБ"}
        color="#34d399"
      />
    </div>
  );
}

// ── login screen ──────────────────────────────────────────────────────────────

function AdminLogin({ onAuth }) {
  const [pw, setPw]     = useState("");
  const [err, setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await adminLogin(pw);
      onAuth();
    } catch {
      setErr("Неверный пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm px-4">
        <form onSubmit={submit} className="glass-card rounded-3xl p-8 flex flex-col gap-5">
          <div className="text-center mb-1">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,.2), rgba(139,92,246,.15))", border: "1px solid rgba(124,111,255,.25)" }}>
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" style={{ color: "var(--accent)" }}>
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l6 2.67V11c0 3.94-2.71 7.62-6 8.93-3.29-1.31-6-4.99-6-8.93V7.67L12 5z"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Anogram Admin</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Введите пароль для входа</p>
          </div>

          {err && (
            <div className="text-sm px-4 py-3 rounded-2xl text-center"
              style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#f87171" }}>
              {err}
            </div>
          )}

          <input
            className="input"
            type="password"
            placeholder="Пароль администратора"
            value={pw}
            onChange={e => setPw(e.target.value)}
            autoFocus
            required
          />

          <button className="btn-primary" disabled={loading}>
            {loading ? "Вход…" : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

const TABS = ["Обзор", "Пользователи", "Чаты", "Медиа", "Система"];

export default function AdminPage() {
  const [authed, setAuthed] = useState(hasAdminToken());
  const [tab, setTab]       = useState(0);
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState(null);
  const [chats,   setChats]   = useState(null);
  const [storage, setStorage] = useState(null);
  const [system,  setSystem]  = useState(null);
  const sysInterval = useRef(null);

  const load = async () => {
    try {
      const [s, u, c, st, sy] = await Promise.all([
        getAdminStats(), getAdminUsers(), getAdminChats(),
        getAdminStorage(), getAdminSystem(),
      ]);
      setStats(s); setUsers(u); setChats(c); setStorage(st); setSystem(sy);
    } catch (e) {
      if (e.response?.status === 403) { adminLogout(); setAuthed(false); }
    }
  };

  useEffect(() => {
    if (!authed) return;
    load();
    // Refresh system stats every 5s
    sysInterval.current = setInterval(async () => {
      try { setSystem(await getAdminSystem()); } catch {}
    }, 5000);
    return () => clearInterval(sysInterval.current);
  }, [authed]);

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* Header */}
      <div className="glass-panel sticky top-0 z-10" style={{ borderBottom: "1px solid var(--glass-border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-4" style={{ height: 58 }}>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" style={{ color: "var(--accent)" }}>
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <span className="font-black text-lg tracking-tight select-none"
              style={{ background: "linear-gradient(90deg, #a78bfa, #818cf8, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Anogram
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(124,111,255,.15)", color: "var(--accent-light)" }}>
              admin
            </span>
          </div>
          <button onClick={load}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
            title="Обновить"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button onClick={() => { adminLogout(); setAuthed(false); }}
            className="text-xs px-3 py-1.5 rounded-xl transition-all"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(248,113,113,.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
            Выйти
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex gap-1 p-1 rounded-2xl mb-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className="flex-1 py-2 text-sm font-medium rounded-xl transition-all duration-150"
              style={{
                background: tab === i ? "var(--accent-gradient)" : "transparent",
                color: tab === i ? "#fff" : "var(--text-secondary)",
                boxShadow: tab === i ? "0 2px 12px rgba(99,102,241,.4)" : "none",
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pb-8">
          {tab === 0 && <TabOverview stats={stats} />}
          {tab === 1 && <TabUsers users={users} onDeleted={id => setUsers(prev => prev.filter(u => u.id !== id))} />}
          {tab === 2 && <TabChats chats={chats} />}
          {tab === 3 && <TabStorage storage={storage} />}
          {tab === 4 && <TabSystem system={system} />}
        </div>
      </div>
    </div>
  );
}
