import { useState } from "react";
import { useLocation } from "wouter";
import { Wrench, Eye, EyeOff } from "lucide-react";
import { useTechnicienAuth } from "@/contexts/TechnicienAuthContext";
import vematLogo from "@/assets/vemat-logo.png";

export default function TechnicienLogin() {
  const [, navigate] = useLocation();
  const { signIn } = useTechnicienAuth();
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
    if (err) { setError("Email ou mot de passe incorrect."); return; }
    navigate("/espace-technicien/missions");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={vematLogo} alt="Vemat" className="h-8 brightness-0 invert mx-auto mb-6" />
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <Wrench className="w-3 h-3" />
            Accès Technicien
          </div>
          <h1 className="text-2xl font-black text-white">Bonjour 👷</h1>
          <p className="text-zinc-500 text-sm mt-1">Connectez-vous pour voir vos missions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="votre@email.com"
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 placeholder:text-zinc-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 placeholder:text-zinc-600 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-3 rounded-xl transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
