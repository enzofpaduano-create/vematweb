import { useEffect, useState } from "react";
import { Calendar, Wrench, CheckCircle2, Plus, Pencil, X, Check, Phone, Mail, Power } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { AdminGuard } from "./AdminGuard";
import { RepairStatusBadge } from "@/components/espace-client/StatusBadge";
import { supabaseAdmin } from "@/lib/supabase";
import type { Technician, RepairRequest, Company } from "@/lib/database.types";

type RepairWithCompany = RepairRequest & { company?: Company };

const COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981",
  "#06b6d4", "#f59e0b", "#ef4444", "#84cc16", "#6366f1",
];

const emptyForm = () => ({ name: "", email: "", phone: "", color: COLORS[0], available: true, user_id: "" });

export default function AdminTechniciens() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [repairs, setRepairs] = useState<RepairWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      supabaseAdmin.from("technicians").select("*").order("name"),
      supabaseAdmin
        .from("repair_requests")
        .select("*, companies(*)")
        .not("status", "in", '("terminee","annulee")')
        .order("scheduled_date"),
    ]).then(([t, r]) => {
      setTechnicians(t.data ?? []);
      setRepairs(
        (r.data ?? []).map((rep: RepairRequest & { companies?: Company }) => ({
          ...rep,
          company: rep.companies,
        }))
      );
      setLoading(false);
    });
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setError(null);
    setShowModal(true);
  };

  const openEdit = (t: Technician) => {
    setEditId(t.id);
    setForm({ name: t.name, email: t.email ?? "", phone: t.phone ?? "", color: t.color, available: t.available, user_id: t.user_id ?? "" });
    setError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      color: form.color,
      available: form.available,
      user_id: form.user_id.trim() || null,
    };

    const { error: err } = editId
      ? await supabaseAdmin.from("technicians").update(payload).eq("id", editId)
      : await supabaseAdmin.from("technicians").insert(payload);

    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowModal(false);
    load();
  };

  const toggleAvailable = async (t: Technician) => {
    await supabaseAdmin.from("technicians").update({ available: !t.available }).eq("id", t.id);
    setTechnicians((prev) => prev.map((x) => x.id === t.id ? { ...x, available: !t.available } : x));
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-zinc-900">Techniciens</h1>
              <p className="text-sm text-zinc-500 mt-1">Gérez l'équipe et le planning des interventions</p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-accent text-accent-foreground font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nouveau technicien
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-zinc-100 py-16 text-center text-zinc-400">
              Chargement...
            </div>
          ) : technicians.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-100 py-20 text-center">
              <Wrench className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm mb-4">Aucun technicien enregistré</p>
              <button onClick={openCreate} className="text-accent font-semibold text-sm hover:underline">
                Ajouter le premier technicien →
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {technicians.map((tech) => {
                const techRepairs = repairs.filter((r) => r.technician_id === tech.id);
                const ongoing = techRepairs.filter((r) => r.status === "en_cours");
                const upcoming = techRepairs.filter((r) => r.status !== "en_cours");

                return (
                  <div key={tech.id} className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
                    {/* Tech header */}
                    <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                        style={{ backgroundColor: tech.color }}
                      >
                        {tech.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-zinc-900">{tech.name}</p>
                          {ongoing.length > 0 && (
                            <span className="text-[10px] font-black uppercase bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Wrench className="w-2.5 h-2.5" />En cours
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-0.5">
                          {tech.phone && (
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" />{tech.phone}
                            </span>
                          )}
                          {tech.email && (
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />{tech.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            techRepairs.length > 0
                              ? "bg-zinc-100 text-zinc-600"
                              : "bg-zinc-50 text-zinc-400"
                          }`}
                        >
                          {techRepairs.length} intervention{techRepairs.length !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={() => toggleAvailable(tech)}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                            tech.available
                              ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                              : "border-zinc-200 text-zinc-500 bg-zinc-50 hover:bg-zinc-100"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {tech.available ? "Disponible" : "Indisponible"}
                        </button>
                        <button
                          onClick={() => openEdit(tech)}
                          className="p-2 text-zinc-300 hover:text-zinc-600 transition-colors rounded-lg hover:bg-zinc-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Repairs list */}
                    {techRepairs.length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <CheckCircle2 className="w-8 h-8 text-zinc-100 mx-auto mb-2" />
                        <p className="text-sm text-zinc-400">Aucune intervention assignée</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-50">
                        {/* Ongoing first */}
                        {[...ongoing, ...upcoming].map((r) => (
                          <div key={r.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-bold text-zinc-900">{r.reference}</span>
                                {r.priority === "urgente" && (
                                  <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase">
                                    Urgent
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500">
                                {r.company?.name ?? "—"} · {r.equipment_type}
                                {r.equipment_brand ? ` ${r.equipment_brand}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              {r.scheduled_date && (
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(r.scheduled_date).toLocaleDateString("fr-FR", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </div>
                              )}
                              <RepairStatusBadge status={r.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <h2 className="font-black text-zinc-900">
                  {editId ? "Modifier le technicien" : "Nouveau technicien"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">
                    Nom complet *
                  </label>
                  <input
                    value={form.name}
                    onChange={set("name")}
                    required
                    placeholder="Ahmed Benali"
                    className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">
                      Téléphone
                    </label>
                    <input
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="+212 6XX XXX XXX"
                      className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="tech@vemat.ma"
                      className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* Supabase user_id for portal access */}
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">
                    ID Utilisateur Supabase
                    <span className="ml-2 font-normal normal-case text-zinc-400">(pour l'accès portail technicien)</span>
                  </label>
                  <input
                    value={form.user_id}
                    onChange={set("user_id")}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-accent placeholder:font-sans"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Créer l'utilisateur dans Supabase → Authentication → Users → "Invite user", puis coller son UUID ici.</p>
                </div>

                {/* Color picker */}
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-2">
                    Couleur calendrier
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className={`w-8 h-8 rounded-full transition-all ${
                          form.color === c ? "ring-2 ring-offset-2 ring-zinc-900 scale-110" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 bg-zinc-50 rounded-xl px-4 py-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm"
                    style={{ backgroundColor: form.color }}
                  >
                    {form.name
                      ? form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                      : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{form.name || "Prénom Nom"}</p>
                    <p className="text-xs text-zinc-400">{form.phone || "—"}</p>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 border border-zinc-200 text-zinc-600 font-bold text-sm py-2.5 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold text-sm py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? "Enregistrement..." : editId ? "Modifier" : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
