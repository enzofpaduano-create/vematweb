import { useState } from "react";
import { Building2, Save } from "lucide-react";
import { PortalLayout } from "@/components/espace-client/PortalLayout";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/lib/supabase";

export default function EspaceClientProfil() {
  const { profile, company, refreshProfile } = useClientAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: profile?.first_name ?? "", last_name: profile?.last_name ?? "", phone: profile?.phone ?? "" });
  const [companyForm, setCompanyForm] = useState({ name: company?.name ?? "", rc: company?.rc ?? "", ice: company?.ice ?? "", address: company?.address ?? "", city: company?.city ?? "", country: company?.country ?? "Maroc", phone: company?.phone ?? "" });

  const setP = (k: keyof typeof profileForm) => (e: React.ChangeEvent<HTMLInputElement>) => setProfileForm((f) => ({ ...f, [k]: e.target.value }));
  const setC = (k: keyof typeof companyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setCompanyForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await Promise.all([
      profile ? supabase.from("profiles").update(profileForm).eq("id", profile.id) : null,
      company ? supabase.from("companies").update(companyForm).eq("id", company.id) : null,
    ]);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <PortalLayout>
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-black text-zinc-900 mb-1">Mon profil</h1>
        <p className="text-sm text-zinc-500 mb-8">Gérez les informations de votre compte et de votre société</p>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500">Informations personnelles</h2>
            <div className="grid grid-cols-2 gap-4">
              {(["first_name", "last_name"] as const).map((k) => (
                <div key={k}>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">{k === "first_name" ? "Prénom" : "Nom"}</label>
                  <input value={profileForm[k]} onChange={setP(k)} className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">Téléphone</label>
              <input value={profileForm.phone} onChange={setP("phone")} className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Informations société
            </h2>
            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">Nom de la société</label>
              <input value={companyForm.name} onChange={setC("name")} className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">RC</label>
                <input value={companyForm.rc} onChange={setC("rc")} className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">ICE</label>
                <input value={companyForm.ice} onChange={setC("ice")} className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-accent" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">Adresse</label>
              <input value={companyForm.address} onChange={setC("address")} className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">Ville</label>
                <input value={companyForm.city} onChange={setC("city")} className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">Pays</label>
                <select value={companyForm.country} onChange={setC("country")} className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent">
                  {["Maroc", "Nigeria", "Mauritanie", "Émirats Arabes Unis", "Autre"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">Téléphone société</label>
              <input value={companyForm.phone} onChange={setC("phone")} className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold py-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saved ? "Enregistré ✓" : saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </PortalLayout>
  );
}
