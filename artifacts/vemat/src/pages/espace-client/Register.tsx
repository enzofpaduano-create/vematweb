import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import type { SignUpData } from "@/contexts/ClientAuthContext";
import vematLogo from "@/assets/vemat-logo.png";

const FIELD = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">{label}</label>
    <input
      {...props}
      className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
    />
  </div>
);

export default function EspaceClientRegister() {
  const [, navigate] = useLocation();
  const { signUp } = useClientAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<SignUpData>({
    email: "", password: "", firstName: "", lastName: "", phone: "",
    companyName: "", companyRc: "", companyIce: "", companyAddress: "",
    companyCity: "", companyCountry: "Maroc", companyPhone: "",
  });

  const set = (k: keyof SignUpData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp(form);
    setLoading(false);
    if (error) { setError(error); return; }
    navigate("/espace-client/dashboard");
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
          <div className="text-center mb-8">
            <Link href="/"><img src={vematLogo} alt="Vemat" className="h-8 brightness-0 mx-auto mb-6" /></Link>
            <h1 className="text-2xl font-black text-zinc-900">Créer un compte société</h1>
            <p className="text-sm text-zinc-500 mt-1">Accédez à votre espace client Vemat Group</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step >= s ? "bg-accent border-accent text-white" : "border-zinc-200 text-zinc-400"}`}>{s}</div>
                <span className={`text-xs font-semibold ${step >= s ? "text-zinc-900" : "text-zinc-400"}`}>
                  {s === 1 ? "Votre compte" : "Votre société"}
                </span>
                {s < 2 && <div className={`flex-1 h-0.5 ${step > s ? "bg-accent" : "bg-zinc-200"}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FIELD label="Prénom" value={form.firstName} onChange={set("firstName")} required placeholder="Mohammed" />
                  <FIELD label="Nom" value={form.lastName} onChange={set("lastName")} required placeholder="Alaoui" />
                </div>
                <FIELD label="Email professionnel" type="email" value={form.email} onChange={set("email")} required placeholder="m.alaoui@societe.ma" />
                <FIELD label="Téléphone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+212 6XX XXX XXX" />
                <FIELD label="Mot de passe" type="password" value={form.password} onChange={set("password")} required minLength={8} placeholder="Minimum 8 caractères" />
                <button type="button" onClick={() => setStep(2)} disabled={!form.firstName || !form.email || !form.password}
                  className="w-full bg-accent text-accent-foreground font-bold py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-40">
                  Continuer →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <FIELD label="Nom de la société *" value={form.companyName} onChange={set("companyName")} required placeholder="Société ABC SARL" />
                <div className="grid grid-cols-2 gap-4">
                  <FIELD label="RC (Registre du commerce)" value={form.companyRc} onChange={set("companyRc")} placeholder="RC 12345" />
                  <FIELD label="ICE" value={form.companyIce} onChange={set("companyIce")} placeholder="001234567890123" />
                </div>
                <FIELD label="Adresse" value={form.companyAddress} onChange={set("companyAddress")} placeholder="123 Rue Mohammed V" />
                <div className="grid grid-cols-2 gap-4">
                  <FIELD label="Ville" value={form.companyCity} onChange={set("companyCity")} placeholder="Casablanca" />
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wide">Pays</label>
                    <select value={form.companyCountry} onChange={set("companyCountry")} className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent">
                      {["Maroc", "Nigeria", "Mauritanie", "Émirats Arabes Unis", "Autre"].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <FIELD label="Téléphone société" type="tel" value={form.companyPhone} onChange={set("companyPhone")} placeholder="+212 5XX XXX XXX" />

                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border border-zinc-200 text-zinc-600 font-bold py-2.5 rounded-lg hover:bg-zinc-50 transition-colors">← Retour</button>
                  <button type="submit" disabled={loading || !form.companyName}
                    className="flex-1 bg-accent text-accent-foreground font-bold py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-40">
                    {loading ? "Création..." : "Créer mon compte"}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Déjà un compte ?{" "}
            <Link href="/espace-client/connexion" className="font-bold text-accent hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
