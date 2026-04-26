import { useEffect, useState, useMemo } from "react";
import { Wrench, AlertTriangle, CalendarDays, CheckCircle2, Clock, X, UserCheck, Edit3, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DGLayout } from "./DGLayout";
import { DGGuard } from "./DGGuard";
import { RepairStatusBadge } from "@/components/espace-client/StatusBadge";
import { supabaseDG } from "@/lib/supabase";
import type { RepairRequest, Company, Technician, DevisRequest, CommercialSale, Commercial } from "@/lib/database.types";

type RepairWithCompany = RepairRequest & { company?: Company };

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DGDashboard() {
  const [repairs, setRepairs] = useState<RepairWithCompany[]>([]);
  const [orders, setOrders] = useState<DevisRequest[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [commercialSales, setCommercialSales] = useState<CommercialSale[]>([]);
  const [commercials, setCommerciaux] = useState<Commercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState<RepairWithCompany | null>(null);
  const [newTechId, setNewTechId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [saving, setSaving] = useState(false);

  const todayStr = toDateStr(new Date());

  useEffect(() => {
    Promise.all([
      supabaseDG.from("repair_requests").select("*, companies(*)").order("created_at", { ascending: false }).limit(200),
      supabaseDG.from("technicians").select("*").order("name"),
      supabaseDG.from("devis_requests").select("id, status, quote_amount, created_at").not("quote_amount", "is", null),
      supabaseDG.from("commercial_sales").select("*").in("status", ["facture", "paye"]),
      supabaseDG.from("commercials").select("*").order("name"),
    ]).then(([r, t, o, cs, com]) => {
      setRepairs((r.data ?? []).map((rep: RepairRequest & { companies?: Company }) => ({ ...rep, company: rep.companies })));
      setTechnicians(t.data ?? []);
      setOrders(o.data ?? []);
      setCommercialSales(cs.data ?? []);
      setCommerciaux(com.data ?? []);
      setLoading(false);
    });
  }, []);

  const activeRepairs = repairs.filter((r) => !["terminee", "annulee"].includes(r.status));
  const urgentRepairs = activeRepairs.filter((r) => r.priority === "urgente");
  const todayRepairs = activeRepairs.filter((r) => r.scheduled_date === todayStr);
  const reportsToValidate = repairs.filter((r) => r.report_submitted_at && !r.report_locked);
  const recentFinished = repairs.filter((r) => r.status === "terminee").slice(0, 8);

  const paidOrders = orders.filter((o) => ["commande_payee", "en_livraison", "livree"].includes(o.status));
  const totalCA = paidOrders.reduce((s, o) => s + (o.quote_amount ?? 0), 0);

  const now = new Date();
  const thisMonthCA = paidOrders
    .filter((o) => { const d = new Date(o.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((s, o) => s + (o.quote_amount ?? 0), 0);

  const monthlyCA = useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
    }
    paidOrders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in months) months[key] += o.quote_amount ?? 0;
    });
    return Object.entries(months).map(([key, value]) => ({
      month: new Date(key + "-01").toLocaleDateString("fr-FR", { month: "short" }),
      ca: value,
    }));
  }, [paidOrders]);

  const totalCAMachines = commercialSales.reduce((s, o) => s + (o.invoice_amount ?? 0), 0);
  const thisMonthCAMachines = commercialSales
    .filter((o) => { const d = new Date(o.invoice_date ?? o.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((s, o) => s + (o.invoice_amount ?? 0), 0);

  const techById = (id: string | null) => (id ? technicians.find((t) => t.id === id) ?? null : null);

  const openReassign = (repair: RepairWithCompany) => {
    setReassignTarget(repair);
    setNewTechId(repair.technician_id ?? "");
    setNewDate(repair.scheduled_date ?? "");
  };

  const saveReassign = async () => {
    if (!reassignTarget) return;
    setSaving(true);
    const updates: Record<string, unknown> = { technician_id: newTechId || null, scheduled_date: newDate || null };
    if (newTechId && newDate && reassignTarget.status === "en_attente") updates.status = "planifiee";
    await supabaseDG.from("repair_requests").update(updates).eq("id", reassignTarget.id);
    setRepairs((prev) =>
      prev.map((r) => r.id === reassignTarget.id
        ? { ...r, technician_id: newTechId || null, scheduled_date: newDate || null, status: (updates.status as RepairWithCompany["status"]) ?? r.status }
        : r)
    );
    setSaving(false);
    setReassignTarget(null);
  };

  const lockReport = async (repair: RepairWithCompany) => {
    setLocking(repair.id);
    await supabaseDG.from("repair_requests").update({ report_locked: true, status: "terminee" }).eq("id", repair.id);
    setRepairs((prev) => prev.map((r) => r.id === repair.id ? { ...r, report_locked: true, status: "terminee" } : r));
    setLocking(null);
  };

  const operationalStats = [
    { icon: Wrench, label: "Missions actives", value: activeRepairs.length, color: "text-orange-600 bg-orange-50" },
    { icon: AlertTriangle, label: "Urgentes", value: urgentRepairs.length, color: "text-red-600 bg-red-50" },
    { icon: CalendarDays, label: "Aujourd'hui", value: todayRepairs.length, color: "text-blue-600 bg-blue-50" },
    { icon: CheckCircle2, label: "Rapports à valider", value: reportsToValidate.length, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <DGGuard>
      <DGLayout>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-zinc-900">Tableau de bord Direction</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Operational stats */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            {operationalStats.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-zinc-100 p-5">
                {loading ? (
                  <>
                    <div className="w-10 h-10 bg-zinc-100 rounded-lg animate-pulse mb-3" />
                    <div className="h-7 w-12 bg-zinc-100 rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
                  </>
                ) : (
                  <>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-black text-zinc-900">{value}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Financial KPIs + Chart */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-zinc-100 p-5">
              {loading ? (
                <>
                  <div className="w-10 h-10 bg-zinc-100 rounded-lg animate-pulse mb-3" />
                  <div className="h-7 w-32 bg-zinc-100 rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-emerald-600 bg-emerald-50">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-black text-zinc-900 leading-tight">{totalCA > 0 ? `${totalCA.toLocaleString("fr-FR")} MAD` : "—"}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">CA total facturé</p>
                </>
              )}
            </div>

            <div className="bg-white rounded-xl border border-zinc-100 p-5">
              {loading ? (
                <>
                  <div className="w-10 h-10 bg-zinc-100 rounded-lg animate-pulse mb-3" />
                  <div className="h-7 w-32 bg-zinc-100 rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-blue-600 bg-blue-50">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-black text-zinc-900 leading-tight">{thisMonthCA > 0 ? `${thisMonthCA.toLocaleString("fr-FR")} MAD` : "—"}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">CA ce mois · {new Date().toLocaleDateString("fr-FR", { month: "long" })}</p>
                </>
              )}
            </div>

          </div>

          {/* Monthly CA chart */}
          {!loading && totalCA > 0 && (
            <div className="bg-white rounded-xl border border-zinc-100 p-6 mb-6">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4">Chiffre d'affaires mensuel (6 derniers mois)</h2>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={monthlyCA} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString("fr-FR")} MAD`, "CA"]}
                    contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, padding: "6px 12px" }}
                    cursor={{ fill: "#f4f4f5" }}
                  />
                  <Bar dataKey="ca" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Commercial CA section */}
          {!loading && (totalCAMachines > 0 || commercials.length > 0) && (
            <div className="bg-white rounded-xl border border-zinc-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-500" />
                  <h2 className="font-bold text-zinc-900 text-sm">Ventes machines (commercial)</h2>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-zinc-500">Total : <span className="font-bold text-zinc-900">{totalCAMachines > 0 ? `${totalCAMachines.toLocaleString("fr-FR")} MAD` : "—"}</span></span>
                  <span className="text-zinc-500">Ce mois : <span className="font-bold text-zinc-900">{thisMonthCAMachines > 0 ? `${thisMonthCAMachines.toLocaleString("fr-FR")} MAD` : "—"}</span></span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {commercials.map((com) => {
                  const comSales = commercialSales.filter((s) => s.commercial_id === com.id);
                  const comCA = comSales.reduce((sum, s) => sum + (s.invoice_amount ?? 0), 0);
                  const comMonthCA = comSales.filter((s) => { const d = new Date(s.invoice_date ?? s.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((sum, s) => sum + (s.invoice_amount ?? 0), 0);
                  return (
                    <div key={com.id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ backgroundColor: com.color }}>
                        {com.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-900">{com.name}</p>
                        <p className="text-xs text-zinc-500">{comSales.length} vente{comSales.length !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-zinc-900">{comCA > 0 ? `${comCA.toLocaleString("fr-FR")} MAD` : "—"}</p>
                        {comMonthCA > 0 && <p className="text-xs text-sky-600 font-semibold">+{comMonthCA.toLocaleString("fr-FR")} ce mois</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active missions */}
          <div className="bg-white rounded-xl border border-zinc-100 mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" />
                <h2 className="font-bold text-zinc-900 text-sm">Missions en cours</h2>
                {!loading && activeRepairs.length > 0 && (
                  <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{activeRepairs.length}</span>
                )}
              </div>
              <p className="text-xs text-zinc-400">Cliquez sur Modifier pour réassigner</p>
            </div>

            {loading ? (
              <div className="divide-y divide-zinc-50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse ml-auto" />
                    <div className="h-5 w-16 bg-zinc-100 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : activeRepairs.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-zinc-400">Aucune mission active</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Réf.</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Client</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Équipement</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Technicien</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Statut</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {activeRepairs.map((r) => {
                      const tech = techById(r.technician_id ?? null);
                      return (
                        <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900">{r.reference}</span>
                              {r.priority === "urgente" && (
                                <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase">Urgent</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-zinc-600">{r.company?.name ?? "—"}</td>
                          <td className="px-5 py-3 text-zinc-600">{r.equipment_type}</td>
                          <td className="px-5 py-3">
                            {tech ? (
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black" style={{ backgroundColor: tech.color }}>
                                  {tech.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                                </span>
                                <span className="text-zinc-700 text-xs">{tech.name}</span>
                              </div>
                            ) : <span className="text-zinc-400 text-xs">Non assigné</span>}
                          </td>
                          <td className="px-5 py-3 text-zinc-600 text-xs">
                            {r.scheduled_date
                              ? new Date(r.scheduled_date + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                              : <span className="text-zinc-400">—</span>}
                          </td>
                          <td className="px-5 py-3"><RepairStatusBadge status={r.status} /></td>
                          <td className="px-5 py-3">
                            <button onClick={() => openReassign(r)}
                              className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
                              <Edit3 className="w-3 h-3" /> Modifier
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Reports to validate */}
            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <h2 className="font-bold text-zinc-900 text-sm">Rapports à valider</h2>
                {!loading && reportsToValidate.length > 0 && (
                  <span className="text-xs font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{reportsToValidate.length}</span>
                )}
              </div>
              <div className="divide-y divide-zinc-50">
                {loading ? (
                  <div className="px-5 py-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-zinc-100 rounded animate-pulse" />)}
                  </div>
                ) : reportsToValidate.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-zinc-400">Aucun rapport en attente</div>
                ) : reportsToValidate.map((r) => {
                  const tech = techById(r.technician_id ?? null);
                  return (
                    <div key={r.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{r.reference}</p>
                        <p className="text-xs text-zinc-400">{r.company?.name ?? "—"}{tech ? ` · ${tech.name}` : ""}</p>
                        {r.report_submitted_at && (
                          <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />Soumis le {new Date(r.report_submitted_at).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                      <button onClick={() => lockReport(r)} disabled={locking === r.id}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        <UserCheck className="w-3.5 h-3.5" />{locking === r.id ? "..." : "Valider"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent finished */}
            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h2 className="font-bold text-zinc-900 text-sm">Missions terminées récentes</h2>
              </div>
              <div className="divide-y divide-zinc-50">
                {loading ? (
                  <div className="px-5 py-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-zinc-100 rounded animate-pulse" />)}
                  </div>
                ) : recentFinished.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-zinc-400">Aucune mission terminée</div>
                ) : recentFinished.map((r) => {
                  const tech = techById(r.technician_id ?? null);
                  return (
                    <div key={r.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-zinc-900">{r.reference}</p>
                          {r.report_locked && (
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full uppercase">Validé</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400">{r.company?.name ?? "—"}{tech ? ` · ${tech.name}` : ""}</p>
                        {r.completed_date && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">Terminée le {new Date(r.completed_date + "T00:00:00").toLocaleDateString("fr-FR")}</p>
                        )}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${r.report_locked ? "bg-emerald-400" : r.report_submitted_at ? "bg-amber-400" : "bg-zinc-300"}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Reassign modal */}
        {reassignTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                <div>
                  <h3 className="font-black text-zinc-900">Modifier la mission</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">{reassignTarget.reference} · {reassignTarget.company?.name}</p>
                </div>
                <button onClick={() => setReassignTarget(null)} className="text-zinc-400 hover:text-zinc-700 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-2">Technicien assigné</label>
                  <select value={newTechId} onChange={(e) => setNewTechId(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 bg-white">
                    <option value="">— Non assigné —</option>
                    {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide mb-2">Date d'intervention</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setReassignTarget(null)}
                  className="flex-1 border border-zinc-200 text-zinc-600 font-bold py-2.5 rounded-xl hover:bg-zinc-50 transition-colors">
                  Annuler
                </button>
                <button onClick={saveReassign} disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-2.5 rounded-xl transition-colors disabled:opacity-60">
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </DGLayout>
    </DGGuard>
  );
}
