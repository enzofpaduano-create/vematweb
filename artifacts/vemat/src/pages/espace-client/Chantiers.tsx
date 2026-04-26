import { useEffect, useState } from "react";
import { MapPin, Plus, Phone, User, Pencil, X, Check, Wrench } from "lucide-react";
import { PortalLayout } from "@/components/espace-client/PortalLayout";
import { RepairStatusBadge } from "@/components/espace-client/StatusBadge";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/lib/supabase";
import type { Chantier, RepairRequest } from "@/lib/database.types";

const empty = (): Omit<Chantier, "id" | "company_id" | "created_at"> => ({
  name: "", address: "", city: "", gps_lat: null, gps_lng: null,
  contact_name: "", contact_phone: "", active: true,
});

export default function EspaceClientChantiers() {
  const { company } = useClientAuth();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [repairsByChantier, setRepairsByChantier] = useState<Record<string, RepairRequest[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = () => {
    if (!company) { setLoading(false); return; }
    Promise.all([
      supabase.from("chantiers").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
      supabase.from("repair_requests")
        .select("id, reference, status, equipment_type, chantier_id, priority")
        .eq("company_id", company.id)
        .not("chantier_id", "is", null)
        .order("created_at", { ascending: false }),
    ]).then(([{ data: c }, { data: r }]) => {
      setChantiers(c ?? []);
      const grouped: Record<string, RepairRequest[]> = {};
      (r ?? []).forEach((repair) => {
        if (repair.chantier_id) {
          if (!grouped[repair.chantier_id]) grouped[repair.chantier_id] = [];
          grouped[repair.chantier_id].push(repair as RepairRequest);
        }
      });
      setRepairsByChantier(grouped);
      setLoading(false);
    });
  };

  useEffect(load, [company]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !form.name) return;
    setSaving(true);
    setSaveError(null);
    const { error } = editId
      ? await supabase.from("chantiers").update({ ...form }).eq("id", editId)
      : await supabase.from("chantiers").insert({ ...form, company_id: company.id });
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setShowForm(false);
    setEditId(null);
    setForm(empty());
    load();
  };

  const toggleActive = async (c: Chantier) => {
    await supabase.from("chantiers").update({ active: !c.active }).eq("id", c.id);
    setChantiers((prev) => prev.map((x) => x.id === c.id ? { ...x, active: !x.active } : x));
  };

  const startEdit = (c: Chantier) => {
    setForm({ name: c.name, address: c.address ?? "", city: c.city ?? "", gps_lat: c.gps_lat, gps_lng: c.gps_lng, contact_name: c.contact_name ?? "", contact_phone: c.contact_phone ?? "", active: c.active });
    setEditId(c.id);
    setShowForm(true);
  };

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-zinc-900">Mes chantiers</h1>
            <p className="text-sm text-zinc-500 mt-1">Gérez vos sites et localisations d'intervention</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(empty()); }}
            className="flex items-center gap-2 bg-accent text-accent-foreground font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-accent/90 transition-colors">
            <Plus className="w-4 h-4" /> Nouveau chantier
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-zinc-200 p-6 mb-6 shadow-sm">
            <h2 className="font-bold text-zinc-900 mb-4">{editId ? "Modifier le chantier" : "Nouveau chantier"}</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wide block mb-1.5">Nom du chantier *</label>
                <input value={form.name} onChange={set("name")} required placeholder="Projet Tour A - Casablanca" className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wide block mb-1.5">Adresse</label>
                <input value={form.address ?? ""} onChange={set("address")} placeholder="123 Boulevard Hassan II" className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wide block mb-1.5">Ville</label>
                <input value={form.city ?? ""} onChange={set("city")} placeholder="Casablanca" className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wide block mb-1.5">Contact sur place</label>
                <input value={form.contact_name ?? ""} onChange={set("contact_name")} placeholder="Nom du chef de chantier" className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wide block mb-1.5">Téléphone contact</label>
                <input value={form.contact_phone ?? ""} onChange={set("contact_phone")} placeholder="+212 6XX XXX XXX" className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>
            {saveError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{saveError}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex items-center gap-2 border border-zinc-200 text-zinc-600 font-bold text-sm px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors"><X className="w-4 h-4" /> Annuler</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-accent text-accent-foreground font-bold text-sm px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60"><Check className="w-4 h-4" /> {saving ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-zinc-100 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-zinc-100 rounded-lg animate-pulse" />
                  <div className="h-4 w-32 bg-zinc-100 rounded animate-pulse" />
                </div>
                <div className="h-3.5 w-48 bg-zinc-100 rounded animate-pulse" />
                <div className="h-3 w-36 bg-zinc-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : chantiers.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-100 py-16 text-center">
            <MapPin className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">Aucun chantier enregistré</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {chantiers.map((c) => {
              const repairs = repairsByChantier[c.id] ?? [];
              const activeRepairs = repairs.filter((r) => !["terminee", "annulee"].includes(r.status));
              return (
                <div key={c.id} className={`bg-white rounded-xl border p-5 transition-all ${c.active ? "border-zinc-100" : "border-zinc-100 opacity-60"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">{c.name}</p>
                        {!c.active && <span className="text-[10px] font-bold text-zinc-400 uppercase">Inactif</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(c)} className="text-zinc-300 hover:text-zinc-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => toggleActive(c)} className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${c.active ? "border-zinc-200 text-zinc-500 hover:border-red-200 hover:text-red-500" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                        {c.active ? "Désactiver" : "Réactiver"}
                      </button>
                    </div>
                  </div>

                  {(c.address || c.city) && (
                    <p className="text-sm text-zinc-500 flex items-start gap-1.5 mb-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />{[c.address, c.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {c.contact_name && (
                    <p className="text-sm text-zinc-500 flex items-center gap-1.5 mb-1">
                      <User className="w-3.5 h-3.5 shrink-0" />{c.contact_name}
                    </p>
                  )}
                  {c.contact_phone && (
                    <p className="text-sm text-zinc-500 flex items-center gap-1.5 mb-3">
                      <Phone className="w-3.5 h-3.5 shrink-0" />{c.contact_phone}
                    </p>
                  )}

                  {/* Réparations liées */}
                  {repairs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wrench className="w-3 h-3 text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-500">
                          {repairs.length} réparation{repairs.length > 1 ? "s" : ""}
                          {activeRepairs.length > 0 && (
                            <span className="ml-1.5 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">{activeRepairs.length} en cours</span>
                          )}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {repairs.slice(0, 3).map((r) => (
                          <div key={r.id} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-zinc-600 font-mono truncate">{r.reference}</span>
                            <RepairStatusBadge status={r.status} />
                          </div>
                        ))}
                        {repairs.length > 3 && (
                          <p className="text-xs text-zinc-400">+{repairs.length - 3} autre{repairs.length - 3 > 1 ? "s" : ""}…</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
