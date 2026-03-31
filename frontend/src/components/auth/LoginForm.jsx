import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Incorrect email or password");
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
      <input className="input" type="email" placeholder="Email" value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })} required autoFocus />
      <input className="input" type="password" placeholder="Password" value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })} required />
      <button className="btn-primary mt-1" disabled={loading}>
        {loading ? <Spinner /> : "Sign In"}
      </button>
      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        No account?{" "}
        <Link to="/register" className="font-semibold" style={{ color: "var(--accent)" }}>Register</Link>
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
    Signing in…
  </span>
);
