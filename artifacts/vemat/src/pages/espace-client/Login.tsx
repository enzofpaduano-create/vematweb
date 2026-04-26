import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import vematLogo from "@/assets/vemat-logo.png";

export default function EspaceClientLogin() {
  const [, navigate] = useLocation();
  const { signIn } = useClientAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { setError(error); return; }
    navigate("/espace-client/dashboard");
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
          <div className="text-center mb-8">
            <Link href="/">
              <img src={vematLogo} alt="Vemat" className="h-8 brightness-0 mx-auto mb-6" />
            </Link>
            <h1 className="text-2xl font-black text-zinc-900">Espace Client</h1>
            <p className="text-sm text-zinc-500 mt-1">Connectez-vous à votre compte société</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                placeholder="contact@votresociete.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-accent-foreground font-bold py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Pas encore de compte ?{" "}
              <Link href="/espace-client/inscription" className="font-bold text-accent hover:underline">
                Créer un compte société
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          <Link href="/" className="hover:text-zinc-600">← Retour au site Vemat Group</Link>
        </p>
      </div>
    </div>
  );
}
