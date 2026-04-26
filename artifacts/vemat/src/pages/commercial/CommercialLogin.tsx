import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Briefcase } from "lucide-react";
import { useCommercialAuth } from "@/contexts/CommercialAuthContext";
import vematLogo from "@/assets/vemat-logo.png";

export default function CommercialLogin() {
  const [, setLocation] = useLocation();
  const { signIn } = useCommercialAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError("Identifiants incorrects"); return; }
    setLocation("/espace-commercial/dashboard");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={vematLogo} alt="Vemat" className="h-7 brightness-0 invert mx-auto mb-6" />
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <h1 className="text-xl font-black text-white">Espace Commercial</h1>
          <p className="text-zinc-500 text-sm mt-1">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="vous@vemat.ma"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-2">Mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-3 rounded-xl transition-colors disabled:opacity-60 mt-2">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
