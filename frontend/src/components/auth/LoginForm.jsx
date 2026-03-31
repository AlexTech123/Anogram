import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="mb-2">
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Welcome back</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Sign in to continue</p>
      </div>

      {error && (
        <div
          className="text-sm px-3 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
        >
          <span>⚠</span> {error}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium pl-1" style={{ color: "var(--text-secondary)" }}>Username</label>
        <input
          className="input"
          placeholder="your_username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium pl-1" style={{ color: "var(--text-secondary)" }}>Password</label>
        <input
          type="password"
          className="input"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
      </div>

      <button className="btn-primary mt-1" type="submit" disabled={loading}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner /> Signing in…
          </span>
        ) : (
          "Sign in"
        )}
      </button>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        No account?{" "}
        <Link to="/register" className="font-semibold hover:underline" style={{ color: "var(--accent-hover)" }}>
          Register
        </Link>
      </p>
    </form>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
