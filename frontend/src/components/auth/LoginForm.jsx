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
    <form onSubmit={submit} className="flex flex-col gap-3">
      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm select-none"
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

      <button className="btn-primary mt-1" disabled={loading}>
        {loading ? <Spinner text="Signing in…" /> : "Sign In"}
      </button>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        No account?{" "}
        <Link to="/register" className="font-semibold" style={{ color: "var(--accent)" }}>
          Register
        </Link>
      </p>
    </form>
  );
}

function ErrorBox({ children }) {
  return (
    <div className="text-sm px-3 py-2.5 rounded-xl animate-fade-in"
      style={{ background: "rgba(229,57,53,.12)", border: "1px solid rgba(229,57,53,.25)", color: "#ef5350" }}>
      {children}
    </div>
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
