import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, uploadAvatar, deleteAvatar } from "../../api/users";
import { Avatar } from "../sidebar/Sidebar";

export default function ProfileModal({ onClose }) {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    display_name: user?.display_name || "",
    bio: user?.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);
  const { } = useAuth();

  // Reload user after changes by re-fetching /users/me via AuthContext
  const reload = async () => {
    const { getMe } = await import("../../api/auth");
    const { data } = await getMe();
    // Patch user in context — simplest: re-set via localStorage trick
    // Actually just close & re-open triggers a re-fetch on next open
    return data;
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({
        display_name: form.display_name.trim() || null,
        bio: form.bio.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Force AuthContext to reload
      const { getMe } = await import("../../api/auth");
      await getMe();
      window.location.reload(); // simplest way to refresh user context
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarProgress(0);
    try {
      await uploadAvatar(file, setAvatarProgress);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
      setAvatarProgress(null);
    }
  };

  const handleDeleteAvatar = async () => {
    await deleteAvatar();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm mx-4 rounded-3xl flex flex-col gap-5 p-6 animate-pop"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Редактировать профиль</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>✕</button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <Avatar name={user?.username || "?"} size={20} src={user?.avatar_url} />
            {avatarProgress !== null && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(0,0,0,.5)" }}>
                <span className="text-white font-bold text-sm">{avatarProgress}%</span>
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,.45)" }}>
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M20 4H16.83L15 2H9L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z"/>
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-xl transition-all"
              style={{ background: "var(--accent-gradient)", color: "#fff" }}>
              Изменить фото
            </button>
            {user?.avatar_url && (
              <button onClick={handleDeleteAvatar}
                className="text-xs px-3 py-1.5 rounded-xl transition-all"
                style={{ background: "rgba(239,68,68,.15)", color: "#f87171" }}>
                Удалить
              </button>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium pl-1 mb-1 block" style={{ color: "var(--text-secondary)" }}>
              Отображаемое имя
            </label>
            <input className="input" placeholder={`@${user?.username}`}
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
              maxLength={100} />
            <p className="text-xs mt-1 pl-1" style={{ color: "var(--text-muted)" }}>
              Отображается вместо @никнейма в чатах
            </p>
          </div>
          <div>
            <label className="text-xs font-medium pl-1 mb-1 block" style={{ color: "var(--text-secondary)" }}>
              О себе
            </label>
            <textarea className="input resize-none" rows={3} placeholder="Расскажите о себе…"
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              maxLength={300} />
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary">
          {saved ? "✓ Сохранено" : saving ? "Сохранение…" : "Сохранить изменения"}
        </button>
      </div>
    </div>
  );
}
