import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
      {/* subtle radial glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(42,171,238,.06) 0%, transparent 70%)"
      }} />
      <div className="w-full max-w-sm animate-pop relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg"
            style={{ background: "var(--accent-gradient)" }}>
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.19-1.82 6.98-3.02 8.38-3.61 3.99-1.66 4.82-1.95 5.36-1.96.12 0 .38.03.55.18.14.12.18.29.2.45-.01.06-.01.24-.02.27z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Anogram</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Sign in to your account</p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-sidebar)", border: "1px solid var(--bg-card)" }}>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
