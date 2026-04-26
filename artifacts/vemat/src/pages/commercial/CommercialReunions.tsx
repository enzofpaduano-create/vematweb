import { useEffect, useState } from "react";
import { Plus, X, Check, Pencil, Trash2, FileText, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { CommercialLayout } from "./CommercialLayout";
import { useCommercialAuth } from "@/contexts/CommercialAuthContext";
import { supabaseCommercial } from "@/lib/supabase";
import type { CommercialMeetingReport } from "@/lib/database.types";

const OUTCOMES = [
  { value: "positif",       label: "Positif",       color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { value: "neutre",        label: "Neutre",         color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  { value: "negatif",       label: "Négatif",        color: "text-red-400 bg-red-500/10 border-red-500/30" },
  { value: "a_recontacter", label: "À recontacter",  color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
];

const emptyForm = () => ({ client_name: "", date: "", summary: "", outcome: "" as CommercialMeetingReport["outcome"] | "", next_step: "" });

export default function CommercialReunions() {
  const { commercial } = useCommercialAuth();
  const [reports, setReports] = useState<CommercialMeetingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editReport, setEditReport] = useState<CommercialMeetingReport | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!commercial) return;
    setLoading(true);
    const { data } = await supabaseCommercial.from("commercial_meeting_reports")
      .select("*").eq("commercial_id", commercial.id).order("date", { ascending: false });
    setReports(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [commercial]);

  const openCreate = () => { setEditReport(null); setForm(emptyForm()); setShowForm(true); };
  const openEdit = (r: CommercialMeetingReport) => {
    setEditReport(r);
    setForm({ client_name: r.client_name, date: r.date, summary: r.summary ?? "", outcome: r.outcome ?? "", next_step: r.next_step ?? "" });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commercial || !form.client_name || !form.date) return;
    setSaving(true);
    const payload = { commercial_id: commercial.id, client_name: form.client_name, date: form.date, summary: form.summary || null, outcome: (form.outcome || null) as CommercialMeetingReport["outcome"] | null, next_step: form.next_step || null };
    if (editReport) {
      await supabaseCommercial.from("commercial_meeting_reports").update(payload).eq("id", editReport.id);
    } else {
      await supabaseCommercial.from("commercial_meeting_reports").insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditReport(null);
    load();
  };

  const handleDelete = async (r: CommercialMeetingReport) => {
    if (!confirm("Supprimer ce compte-rendu ?")) return;
    await supabaseCommercial.from("commercial_meeting_reports").delete().eq("id", r.id);
    setShowForm(false);
    load();
  };

  const filtered = filter === "all" ? reports : reports.filter((r) => r.outcome === filter);

  const outcomeFor = (v: string | null) => OUTCOMES.find((o) => o.value === v);

  return (
    <CommercialLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Comptes-rendus</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Retours de visites et réunions clients</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Nouveau compte-rendu
          </button>
        </div>

        {/* Outcome filter */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {[{ value: "all", label: "Tous" }, ...OUTCOMES].map((o) => (
            <button key={o.value} onClick={() => setFilter(o.value)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${filter === o.value ? "bg-sky-600 border-sky-600 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}>
              {o.label}
              {o.value !== "all" && <span className="ml-1.5 opacity-60">{reports.filter((r) => r.outcome === o.value).length}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-16 text-center">
            <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Aucun compte-rendu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const oc = outcomeFor(r.outcome);
              return (
                <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-white text-sm">{r.client_name}</p>
                        {oc && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${oc.color}`}>{oc.label}</span>}
                      </div>
                      <p className="text-xs text-zinc-500">
                        {new Date(r.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <button onClick={() => openEdit(r)} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 shrink-0">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  {r.summary && <p className="text-sm text-zinc-300 whitespace-pre-line mb-3 leading-relaxed">{r.summary}</p>}
                  {r.next_step && (
                    <div className="flex items-start gap-2 bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-2">
                      <RefreshCw className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-sky-300"><span className="font-bold">Suite :</span> {r.next_step}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900">
              <h3 className="font-black text-white">{editReport ? "Modifier le compte-rendu" : "Nouveau compte-rendu"}</h3>
              <button onClick={() => { setShowForm(false); setEditReport(null); }} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Client / Société *</label>
                  <input value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))} required
                    placeholder="Nom du client" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Résumé de la réunion</label>
                <textarea value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} rows={4}
                  placeholder="Ce qui a été discuté, les besoins du client, les machines présentées…"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Résultat</label>
                <div className="grid grid-cols-2 gap-2">
                  {OUTCOMES.map((o) => (
                    <button key={o.value} type="button" onClick={() => setForm((f) => ({ ...f, outcome: f.outcome === o.value ? "" : o.value as CommercialMeetingReport["outcome"] }))}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${form.outcome === o.value ? o.color : "border-zinc-700 text-zinc-500 hover:border-zinc-600"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Suite à donner</label>
                <input value={form.next_step} onChange={(e) => setForm((f) => ({ ...f, next_step: e.target.value }))}
                  placeholder="Envoyer devis, rappeler le 15, présenter modèle X…"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500" />
              </div>
              <div className="flex gap-3 pt-1">
                {editReport && (
                  <button type="button" onClick={() => handleDelete(editReport)}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                )}
                <button type="button" onClick={() => { setShowForm(false); setEditReport(null); }}
                  className="flex-1 border border-zinc-700 text-zinc-400 font-bold py-2.5 rounded-xl hover:bg-zinc-800 transition-colors text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-black py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm">
                  <Check className="w-4 h-4" /> {saving ? "..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CommercialLayout>
  );
}
