import { useEffect, useState } from "react";
import { Search, AlertTriangle, X, Check, ChevronRight } from "lucide-react";
import { DGLayout } from "./DGLayout";
import { DGGuard } from "./DGGuard";
import { RepairStatusBadge } from "@/components/espace-client/StatusBadge";
import { supabaseDG } from "@/lib/supabase";
import type { RepairRequest, Company, Technician, RepairStatus } from "@/lib/database.types";
import { useLang } from "@/i18n/I18nProvider";

type RepairWithCompany = RepairRequest & { company?: Company };

const REPAIR_STATUS_VALUES: RepairStatus[] = ["en_attente", "planifiee", "en_cours", "terminee", "annulee"];

export default function DGReparations() {
  const { lang, t } = useLang();
  const [repairs, setRepairs] = useState<RepairWithCompany[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit panel
  const [selected, setSelected] = useState<RepairWithCompany | null>(null);
  const [editTech, setEditTech] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<RepairStatus>("en_attente");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const [r, techData] = await Promise.all([
      supabaseDG.from("repair_requests").select("*, companies(*)").order("created_at", { ascending: false }),
      supabaseDG.from("technicians").select("*").order("name"),
    ]);
    setRepairs(
      (r.data ?? []).map((rep: RepairRequest & { companies?: Company }) => ({
        ...rep,
        company: rep.companies,
      }))
    );
    setTechnicians(techData.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const techById = (id: string | null) => (id ? technicians.find((t) => t.id === id) ?? null : null);

  const filtered = repairs.filter((r) => {
    const matchSearch =
      !search ||
      r.reference.toLowerCase().includes(search.toLowerCase()) ||
      r.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.equipment_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openPanel = (r: RepairWithCompany) => {
    setSelected(r);
    setEditTech(r.technician_id ?? "");
    setEditDate(r.scheduled_date ?? "");
    setEditStatus(r.status);
    setSaveError(null);
    setSaved(false);
  };

  const closePanel = () => { setSelected(null); setSaveError(null); setSaved(false); };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    const completedDate =
      editStatus === "terminee" && !selected.completed_date
        ? new Date().toISOString().split("T")[0]
        : selected.completed_date;
    const { error } = await supabaseDG.from("repair_requests").update({
      technician_id: editTech || null,
      scheduled_date: editDate || null,
      status: editStatus,
      completed_date: completedDate,
    }).eq("id", selected.id);
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setSaved(true);
    // Update local state
    setRepairs((prev) => prev.map((r) =>
      r.id === selected.id
        ? { ...r, technician_id: editTech || null, scheduled_date: editDate || null, status: editStatus, completed_date: completedDate }
        : r
    ));
    setSelected((prev) => prev ? { ...prev, technician_id: editTech || null, scheduled_date: editDate || null, status: editStatus } : null);
    setTimeout(() => setSaved(false), 2000);
  };

  const statusLabels: Record<RepairStatus, string> = {
    en_attente: t("portal.repairs.statusWaiting"),
    planifiee:  t("portal.repairs.statusPlanned"),
    en_cours:   t("portal.repairs.statusOngoing"),
    terminee:   t("portal.repairs.statusDone"),
    annulee:    t("portal.repairs.statusCancelled"),
  };

  return (
    <DGGuard>
      <DGLayout>
        <div className="flex h-full">
          {/* Main content */}
          <div className={`flex-1 p-8 transition-all duration-300 ${selected ? "mr-96" : ""}`}>
            <div className="mb-6">
              <h1 className="text-2xl font-black text-zinc-900">{t("portal.repairs.titleDG")}</h1>
              <p className="text-sm text-zinc-500 mt-1">
                {filtered.length} {filtered.length !== 1 ? t("portal.common.results") : t("portal.common.result")}
              </p>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("portal.repairs.searchPlaceholderDG")}
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="all">{t("portal.repairs.allStatuses")}</option>
                <option value="en_attente">{t("portal.repairs.statusWaiting")}</option>
                <option value="planifiee">{t("portal.repairs.statusPlanned")}</option>
                <option value="en_cours">{t("portal.repairs.statusOngoing")}</option>
                <option value="terminee">{t("portal.repairs.statusDone")}</option>
                <option value="annulee">{t("portal.repairs.statusCancelled")}</option>
              </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
              {loading ? (
                <div className="px-5 py-16 text-center text-sm text-zinc-400">{t("portal.common.loading")}</div>
              ) : filtered.length === 0 ? (
                <div className="px-5 py-16 text-center text-sm text-zinc-400">{t("portal.repairs.noRepairsFound")}</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">{t("portal.repairs.refCol")}</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">{t("portal.repairs.clientCol")}</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">{t("portal.repairs.equipmentCol")}</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">{t("portal.repairs.technicianCol")}</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">{t("portal.repairs.dateCol")}</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">{t("portal.repairs.statusCol")}</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">{t("portal.repairs.reportCol")}</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filtered.map((r) => {
                      const tech = techById(r.technician_id ?? null);
                      const isSelected = selected?.id === r.id;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => openPanel(r)}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-purple-50" : "hover:bg-zinc-50"}`}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900">{r.reference}</span>
                              {r.priority === "urgente" && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-zinc-600">{r.company?.name ?? "—"}</td>
                          <td className="px-5 py-3 text-zinc-600">{r.equipment_type}</td>
                          <td className="px-5 py-3">
                            {tech ? (
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                                  style={{ backgroundColor: tech.color }}>
                                  {tech.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                                </span>
                                <span className="text-zinc-700 text-xs">{tech.name}</span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-zinc-500 text-xs">
                            {r.scheduled_date
                              ? new Date(r.scheduled_date + "T00:00:00").toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                          </td>
                          <td className="px-5 py-3"><RepairStatusBadge status={r.status} /></td>
                          <td className="px-5 py-3">
                            {r.report_locked ? (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{t("portal.repairs.reportValidated")}</span>
                            ) : r.report_submitted_at ? (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{t("portal.repairs.reportPending")}</span>
                            ) : (
                              <span className="text-[10px] text-zinc-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <ChevronRight className={`w-4 h-4 transition-colors ${isSelected ? "text-purple-500" : "text-zinc-300"}`} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Edit panel */}
          {selected && (
            <div className="fixed top-0 right-0 h-full w-96 bg-white border-l border-zinc-200 shadow-2xl z-40 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <div>
                  <p className="font-black text-zinc-900 text-sm">{t("portal.dg.editMission")}</p>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{selected.reference}</p>
                </div>
                <button onClick={closePanel} className="text-zinc-400 hover:text-zinc-700 transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fields */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* Mission info (read-only) */}
                <div className="bg-zinc-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t("portal.repairs.equipmentCol")}</p>
                  <p className="text-sm font-semibold text-zinc-800">{selected.equipment_type}{selected.equipment_brand ? ` · ${selected.equipment_brand}` : ""}{selected.equipment_model ? ` ${selected.equipment_model}` : ""}</p>
                  <p className="text-xs text-zinc-500">{selected.company?.name ?? "—"}</p>
                  {selected.priority === "urgente" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> {t("portal.repairs.urgent")}
                    </span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t("portal.repairs.statusCol")}</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {REPAIR_STATUS_VALUES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEditStatus(s)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-colors text-left ${
                          editStatus === s
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          s === "en_attente" ? "bg-yellow-400" :
                          s === "planifiee"  ? "bg-blue-400" :
                          s === "en_cours"   ? "bg-orange-400" :
                          s === "terminee"   ? "bg-emerald-400" : "bg-red-400"
                        }`} />
                        {statusLabels[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Technician */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t("portal.dg.assignedTechnician")}</label>
                  <select
                    value={editTech}
                    onChange={(e) => setEditTech(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="">— {t("portal.repairs.none")} —</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>{tech.name}</option>
                    ))}
                  </select>
                  {editTech && (() => {
                    const tech = techById(editTech);
                    return tech ? (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                          style={{ backgroundColor: tech.color }}>
                          {tech.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </span>
                        <span className="text-xs text-zinc-600">{tech.name}</span>
                        {!tech.available && (
                          <span className="text-[10px] text-red-500 font-bold">{t("portal.common.unavailable")}</span>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t("portal.dg.interventionDate")}</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Error */}
                {saveError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
                )}

                {/* Success */}
                {saved && (
                  <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" /> {t("portal.common.saved") || "Enregistré ✓"}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-xl transition-colors disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  {saving ? t("portal.dg.saving") : t("portal.common.save")}
                </button>
              </div>
            </div>
          )}
        </div>
      </DGLayout>
    </DGGuard>
  );
}
