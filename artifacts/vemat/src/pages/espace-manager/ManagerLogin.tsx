import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Settings, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useManagerAuth } from "@/contexts/ManagerAuthContext";
import vematLogo from "@/assets/vemat-logo.png";

export default function ManagerLogin() {
  const [, navigate] = useLocation();
  const { signIn } = useManagerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    navigate("/espace-manager/dashboard");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/espace-vemat" className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-10">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour au portail
        </Link>

        <div className="text-center mb-8">
          <img src={vematLogo} alt="Vemat" className="h-8 brightness-0 invert mx-auto mb-6" />
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <Settings className="w-3 h-3" />
            Espace Manager
          </div>
          <h1 className="text-2xl font-black text-white">Connexion</h1>
          <p className="text-zinc-500 text-sm mt-1">Accès réservé au personnel Vemat</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="manager@vemat.ma"
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-zinc-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-accent placeholder:text-zinc-600 transition-colors"
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black py-3 rounded-xl transition-colors disabled:opacity-60 mt-2">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
