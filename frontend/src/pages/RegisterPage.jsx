import RegisterForm from "../components/auth/RegisterForm";
import AnogramLogo from "../components/AnogramLogo";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "var(--bg-base)" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(42,171,238,.07) 0%, transparent 70%)" }} />
      <div className="w-full max-w-sm animate-pop relative z-10">
        <div className="flex flex-col items-center mb-8">
          <AnogramLogo size={80} />
          <h1 className="text-2xl font-bold mt-4" style={{ color: "var(--text-primary)" }}>Anogram</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>No email. No trace.</p>
        </div>
        <div className="rounded-2xl p-6"
          style={{ background: "var(--bg-sidebar)", border: "1px solid var(--bg-card)" }}>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
