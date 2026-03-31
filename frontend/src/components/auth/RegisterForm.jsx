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

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <div className="mb-1">
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Create account</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Join Anogram today</p>
      </div>

      {error && (
        <div
          className="text-sm px-3 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
        >
          ⚠ {error}
        </div>
      )}

      <Field label="Email — used to sign in">
        <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required autoFocus />
      </Field>

      <Field label="Username — shown to others, used for search">
        <input className="input" placeholder="coolname" value={form.username} onChange={set("username")} required />
      </Field>

      <Field label="Password">
        <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required />
      </Field>

      <button className="btn-primary mt-1" type="submit" disabled={loading}>
        {loading ? <Spinner text="Creating account…" /> : "Create account"}
      </button>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <Link to="/login" className="font-semibold hover:underline" style={{ color: "var(--accent-hover)" }}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium pl-1" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}

function Spinner({ text }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {text}
    </span>
  );
}
