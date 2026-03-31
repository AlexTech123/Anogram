import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
      setError(err.response?.data?.detail || "Incorrect username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="mb-1">
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Welcome back</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Sign in to continue</p>
      </div>

      {error && (
        <div className="animate-fade-in text-sm px-4 py-3 rounded-2xl"
          style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#f87171" }}>
          {error}
        </div>
      )}

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm select-none pointer-events-none"
          style={{ color: "var(--accent)" }}>@</span>
        <input className="input" style={{ paddingLeft: "1.75rem" }}
          placeholder="username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          required autoFocus autoCapitalize="none" autoComplete="username" />
      </div>

      <input className="input" type="password" placeholder="Password"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })}
        required autoComplete="current-password" />

      <button className="btn-primary" disabled={loading}>
        {loading ? <Spinner text="Signing in…" /> : "Sign In"}
      </button>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        No account?{" "}
        <Link to="/register" className="font-semibold hover:underline" style={{ color: "var(--accent-light)" }}>
          Register
        </Link>
      </p>
    </form>
  );
}

function Spinner({ text }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity=".3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      {text}
    </span>
  );
}
