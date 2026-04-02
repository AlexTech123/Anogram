import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #07091a 0%, #0f0b2e 50%, #0a0d1a 100%)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", top:"-15%", left:"-10%", background:"radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)", filter:"blur(40px)", animation:"glow 4s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", bottom:"-10%", right:"-5%", background:"radial-gradient(circle, rgba(139,92,246,.15) 0%, transparent 70%)", filter:"blur(50px)", animation:"glow 6s ease-in-out infinite", animationDelay:"2s" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(124,111,255,.07) 1px, transparent 1px)", backgroundSize:"40px 40px" }}/>
      </div>
      <div className="w-full max-w-sm animate-slide-up relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4"
            style={{ background:"var(--accent-gradient)", boxShadow:"0 8px 32px rgba(99,102,241,.5)" }}>
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color:"var(--text-primary)" }}>Anogram</h1>
          <p className="text-sm mt-1.5" style={{ color:"var(--text-secondary)" }}>Ваше личное пространство</p>
        </div>
        <div className="glass-card rounded-3xl p-7"><LoginForm /></div>
      </div>
    </div>
  );
}
