import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {error && (
        <div className="text-sm px-3 py-2.5 rounded-xl animate-fade-in"
          style={{ background: "rgba(229,57,53,.12)", border: "1px solid rgba(229,57,53,.25)", color: "#ef5350" }}>
          {error}
        </div>
      )}
      <div>
        <input className="input" type="email" placeholder="Email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} required autoFocus />
        <p className="text-xs mt-1 pl-1" style={{ color: "var(--text-muted)" }}>Used to sign in — not shown to others</p>
      </div>
      <div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold"
            style={{ color: "var(--accent)" }}>@</span>
          <input className="input" style={{ paddingLeft: "1.75rem" }}
            placeholder="username" value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            required autoCapitalize="none" autoComplete="off" />
        </div>
        <p className="text-xs mt-1 pl-1" style={{ color: "var(--text-muted)" }}>Your handle — visible to others in search</p>
      </div>
      <input className="input" type="password" placeholder="Password" value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })} required />
      <button className="btn-primary mt-1" disabled={loading}>
        {loading ? <Spinner /> : "Create Account"}
      </button>
      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <Link to="/login" className="font-semibold" style={{ color: "var(--accent)" }}>Sign in</Link>
      </p>
    </form>
  );
}

const Spinner = () => (
  <span className="flex items-center justify-center gap-2">
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity=".3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
    Creating…
  </span>
);
