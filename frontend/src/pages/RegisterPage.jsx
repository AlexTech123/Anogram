import RegisterForm from "../components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "radial-gradient(ellipse at 60% 40%, #1a1040 0%, #0b0f19 60%)" }}
    >
      <div
        className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(40px)" }}
      />

      <div className="w-full max-w-sm animate-pop" style={{ zIndex: 10 }}>
        <div className="flex flex-col items-center mb-8 gap-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg mb-1"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            A
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Anogram
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Create your account</p>
        </div>

        <div
          className="rounded-2xl p-7 shadow-2xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
