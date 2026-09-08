import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle, ArrowRight, Inbox, FolderOpen, Plus, Package,
  X, Trash2, ChevronDown, ChevronRight, Clock, TrendingUp, AlertTriangle,
  CalendarDays, CalendarRange, Calendar,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import { supabasePdr } from "@/lib/supabase";
import {
  listDocuments, DOC_LABEL_SHORT, formatMoney, groupIntoFolders, computeKpis,
  SOURCE_LABEL, SOURCE_COLOR,
  COMM_STATUS_COLOR, COMM_STATUS_LABEL,
  COMMERCIAL_STATUS_COLOR, COMMERCIAL_STATUS_LABEL,
  OVERDUE_THRESHOLD_HOURS,
  type PdrDocument, type PdrDocType, type PdrSource, type PdrKpis,
} from "@/lib/pdrDocuments";

interface SpareRequest {
  id: string;
  reference: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  product_category: string | null;
  quantity: number;
  notes: string | null;
  status: string;
  created_at: string;
}

const TYPE_BADGE: Record<PdrDocType, string> = {
  devis: "bg-sky-100 text-sky-700",
  bon_commande: "bg-indigo-100 text-indigo-700",
  commande_fournisseur: "bg-amber-100 text-amber-700",
  bon_reception: "bg-amber-100 text-amber-700",
  bon_livraison: "bg-violet-100 text-violet-700",
  facture: "bg-emerald-100 text-emerald-700",
};

function formatDurationHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} d`;
}

function KpiTile({
  label, value, icon: Icon, sub, alert = false,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
  alert?: boolean;
}) {
  const border = alert ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white";
  const iconColor = alert ? "text-red-500" : "text-sky-600";
  const valueColor = alert ? "text-red-700" : "text-zinc-950";
  return (
    <div className={`rounded-2xl border ${border} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <p className="text-[11px] uppercase tracking-wider font-black text-zinc-500">{label}</p>
      </div>
      <p className={`text-3xl font-black ${valueColor} tabular-nums`}>{value}</p>
      {sub && <p className={`text-[11px] font-semibold mt-1 ${alert ? "text-red-600" : "text-zinc-500"}`}>{sub}</p>}
    </div>
  );
}

function SourceDonut({ data }: { data: PdrKpis["bySource"] }) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-zinc-400 py-10">
        No source data yet — set the source on new documents.
      </div>
    );
  }
  const chartData = data.map((d) => ({
    name: SOURCE_LABEL[d.source],
    value: d.count,
    source: d.source,
  }));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              strokeWidth={2}
              stroke="#fff"
            >
              {chartData.map((entry) => (
                <Cell key={entry.source} fill={SOURCE_COLOR[entry.source as PdrSource]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => [`${v} (${((v / total) * 100).toFixed(1)}%)`, ""]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2">
        {data.map((d) => {
          const pct = ((d.count / total) * 100).toFixed(0);
          return (
            <li key={d.source} className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: SOURCE_COLOR[d.source] }}
              />
              <span className="text-sm text-zinc-700 flex-1">{SOURCE_LABEL[d.source]}</span>
              <span className="text-sm font-black text-zinc-950 tabular-nums">{d.count}</span>
              <span className="text-xs text-zinc-400 tabular-nums w-10 text-right">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function PdrDashboard() {
  const [requests, setRequests] = useState<SpareRequest[] | null>(null);
  const [docs, setDocs] = useState<PdrDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ignoringId, setIgnoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let reqData: SpareRequest[] = [];
        const { data, error: reqErr } = await supabasePdr
          .from("form_devis")
          .select("id, reference, company_name, contact_name, contact_phone, contact_email, product_category, quantity, notes, status, created_at")
          .eq("is_spare_parts", true)
          .order("created_at", { ascending: false })
          .limit(50);
        if (reqErr) throw new Error(reqErr.message);
        reqData = (data ?? []) as SpareRequest[];
        const docData = await listDocuments();
        if (!cancelled) {
          setRequests(reqData);
          setDocs(docData);
          const folders = groupIntoFolders(docData).slice(0, 6);
          setOpenFolders(new Set(folders.map((f) => f.id)));
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function ignoreRequest(id: string) {
    setIgnoringId(id);
    try {
      const { error: updErr } = await supabasePdr.from("form_devis").update({ status: "ignore" }).eq("id", id);
      if (updErr) throw new Error(updErr.message);
      setRequests((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, status: "ignore" } : r)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIgnoringId(null);
    }
  }

  async function deleteRequest(id: string) {
    if (!window.confirm("Delete this quote request from the database? This cannot be undone.")) return;
    setDeletingId(id);
    setError(null);
    try {
      const { error: delErr } = await supabasePdr.from("form_devis").delete().eq("id", id);
      if (delErr) throw new Error(delErr.message);
      setRequests((prev) => (prev ?? []).filter((r) => r.id !== id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const openRequests = useMemo(() => (requests ?? []).filter((r) => r.status === "nouveau"), [requests]);
  const kpis = useMemo(() => (docs ? computeKpis(docs) : null), [docs]);

  const notCommunicatedDocs = useMemo(
    () => (docs ?? [])
      .filter((d) => d.communication_status !== "communique")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [docs],
  );

  const recentFolders = useMemo(() => groupIntoFolders(docs ?? []).slice(0, 6), [docs]);

  function toggleFolder(id: string) {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-sky-600 mb-2">Spare parts</p>
              <h1 className="text-3xl lg:text-4xl font-black text-zinc-950">Dashboard</h1>
            </div>
            <Link href="/espace-pdr/devis/nouveau">
              <div className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer">
                <Plus className="w-4 h-4" /> New quote
              </div>
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-red-700">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {docs === null && !error && (
            <p className="text-zinc-400 text-sm py-8 text-center animate-pulse">Loading dashboard…</p>
          )}

          {kpis && (
            <>
              {/* Volume KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                <KpiTile label="Today" value={kpis.totalToday} icon={CalendarDays} sub="new requests" />
                <KpiTile label="This week" value={kpis.totalWeek} icon={CalendarRange} sub="new requests" />
                <KpiTile label="This month" value={kpis.totalMonth} icon={Calendar} sub="new requests" />
                <KpiTile
                  label="Not communicated"
                  value={kpis.notCommunicated}
                  icon={kpis.notCommunicatedOverdue > 0 ? AlertTriangle : Inbox}
                  sub={kpis.notCommunicatedOverdue > 0
                    ? `⚠️ ${kpis.notCommunicatedOverdue} > ${OVERDUE_THRESHOLD_HOURS}h`
                    : "still to send"}
                  alert={kpis.notCommunicatedOverdue > 0}
                />
                <KpiTile
                  label="Transformation"
                  value={kpis.transformationRate !== null ? `${kpis.transformationRate.toFixed(0)}%` : "—"}
                  icon={TrendingUp}
                  sub="won / communicated"
                />
              </div>

              {/* Second row: response time + source distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <p className="text-[11px] uppercase tracking-wider font-black text-zinc-500">Average response time</p>
                  </div>
                  <p className="text-3xl font-black text-zinc-950 tabular-nums">
                    {formatDurationHours(kpis.avgResponseHours)}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-semibold mt-1">from creation to communication</p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="w-4 h-4 text-sky-600" />
                    <p className="text-[11px] uppercase tracking-wider font-black text-zinc-500">Requests by source</p>
                  </div>
                  <SourceDonut data={kpis.bySource} />
                </div>
              </div>

              {/* Not-yet-communicated documents — actionable list */}
              {notCommunicatedDocs.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className={`w-4 h-4 ${kpis.notCommunicatedOverdue > 0 ? "text-red-500" : "text-amber-500"}`} />
                    <h2 className="text-lg font-black text-zinc-950">Not yet communicated to client</h2>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${kpis.notCommunicatedOverdue > 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {notCommunicatedDocs.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {notCommunicatedDocs.slice(0, 6).map((d) => {
                      const ageHours = (Date.now() - new Date(d.created_at).getTime()) / (60 * 60 * 1000);
                      const overdue = ageHours > OVERDUE_THRESHOLD_HOURS;
                      return (
                        <Link key={d.id} href={`/espace-pdr/document/${d.id}`}>
                          <div className={`bg-white rounded-2xl border p-4 flex items-start justify-between gap-4 flex-wrap hover:border-sky-300 transition-colors cursor-pointer ${overdue ? "border-red-300" : "border-zinc-200"}`}>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-mono text-xs text-zinc-500">{d.reference}</span>
                                <span className={`text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${COMM_STATUS_COLOR[d.communication_status]}`}>
                                  {COMM_STATUS_LABEL[d.communication_status]}
                                </span>
                                {d.assigned_agent && (
                                  <span className="text-[11px] text-zinc-500">· {d.assigned_agent}</span>
                                )}
                              </div>
                              <p className="font-bold text-zinc-950">{d.client_company || d.client_name || "—"}</p>
                              <p className={`text-xs ${overdue ? "font-bold text-red-600" : "text-zinc-500"} mt-1`}>
                                Created {new Date(d.created_at).toLocaleDateString("en-GB")} · {ageHours < 24 ? `${ageHours.toFixed(1)}h ago` : `${(ageHours / 24).toFixed(1)} days ago`}
                                {overdue && ` · > ${OVERDUE_THRESHOLD_HOURS}h`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-zinc-900">{formatMoney(d.total_amount, d.currency)}</p>
                              <p className="text-[11px] text-zinc-400 mt-0.5">{DOC_LABEL_SHORT[d.type]}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                    {notCommunicatedDocs.length > 6 && (
                      <p className="text-xs text-zinc-500 text-center pt-2">
                        + {notCommunicatedDocs.length - 6} more — see all in <Link href="/espace-pdr/documents" className="text-sky-600 hover:underline">Documents</Link>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Incoming website requests */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Inbox className="w-4 h-4 text-sky-600" />
              <h2 className="text-lg font-black text-zinc-950">Requests from the website</h2>
              {openRequests.length > 0 && (
                <span className="bg-sky-100 text-sky-700 text-xs font-black px-2 py-0.5 rounded-full">{openRequests.length}</span>
              )}
            </div>
            {requests === null && !error && <p className="text-zinc-400 text-sm py-8 text-center animate-pulse">Loading…</p>}
            {requests !== null && openRequests.length === 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
                <Package className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No spare parts requests pending.</p>
              </div>
            )}
            {openRequests.length > 0 && (
              <div className="space-y-2">
                {openRequests.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-zinc-400">{r.reference}</span>
                        <span className="text-xs text-zinc-400">· {new Date(r.created_at).toLocaleDateString("en-GB")}</span>
                      </div>
                      <p className="font-bold text-zinc-950">{r.company_name}</p>
                      <p className="text-sm text-zinc-600">{r.contact_name} · {r.contact_phone}</p>
                      {r.product_category && <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{r.product_category}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => deleteRequest(r.id)}
                        disabled={deletingId === r.id || ignoringId === r.id}
                        className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm px-3 py-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete this request from the database"
                      >
                        <Trash2 className="w-4 h-4" /> {deletingId === r.id ? "Deleting…" : "Delete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => ignoreRequest(r.id)}
                        disabled={ignoringId === r.id || deletingId === r.id}
                        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 font-semibold text-sm px-3 py-2 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50"
                        title="Ignore this request"
                      >
                        <X className="w-4 h-4" /> Ignore
                      </button>
                      <Link href={`/espace-pdr/devis/nouveau?from=${r.id}`}>
                        <div className="inline-flex items-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap">
                          Create quote <ArrowRight className="w-4 h-4" />
                        </div>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent folders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-sky-600" />
                <h2 className="text-lg font-black text-zinc-950">Recent folders</h2>
              </div>
              <Link href="/espace-pdr/documents" className="text-sm text-sky-600 hover:underline font-semibold">View all</Link>
            </div>
            {docs !== null && recentFolders.length === 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
                <p className="text-sm text-zinc-500">No documents yet. Create your first quote.</p>
              </div>
            )}
            {recentFolders.length > 0 && (
              <div className="space-y-3">
                {recentFolders.map((folder) => {
                  const open = openFolders.has(folder.id);
                  return (
                    <div key={folder.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleFolder(folder.id)}
                        className="w-full flex items-center justify-between gap-4 p-4 hover:bg-zinc-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {open ? <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />}
                          <FolderOpen className="w-5 h-5 text-sky-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-black text-zinc-950 truncate">{folder.client}</p>
                            <p className="font-mono text-xs text-zinc-400">
                              {folder.root.reference}
                              <span className="text-zinc-300"> · </span>
                              {folder.docs.length} document{folder.docs.length > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[280px]">
                            <span className={`text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${COMMERCIAL_STATUS_COLOR[folder.root.commercial_status]}`}>
                              {COMMERCIAL_STATUS_LABEL[folder.root.commercial_status]}
                            </span>
                            {folder.docs.map((d) => (
                              <span key={d.id} className={`text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${TYPE_BADGE[d.type]}`}>
                                {DOC_LABEL_SHORT[d.type]}
                              </span>
                            ))}
                          </div>
                          <div className="text-right">
                            <p className="font-black text-zinc-950">{formatMoney(folder.root.total_amount, folder.root.currency)}</p>
                            <p className="text-[11px] text-zinc-400">{new Date(folder.latestAt).toLocaleDateString("en-GB")}</p>
                          </div>
                        </div>
                      </button>
                      {open && (
                        <div className="border-t border-zinc-100 divide-y divide-zinc-50 bg-zinc-50/50">
                          {folder.docs.map((d) => (
                            <Link key={d.id} href={`/espace-pdr/document/${d.id}`}>
                              <div className="flex items-center justify-between gap-4 px-4 py-3 pl-12 hover:bg-white transition-colors cursor-pointer">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-md shrink-0 ${TYPE_BADGE[d.type]}`}>
                                    {DOC_LABEL_SHORT[d.type]}
                                  </span>
                                  <p className="font-mono text-sm text-zinc-700 truncate">{d.reference}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-bold text-zinc-900">{formatMoney(d.total_amount, d.currency)}</p>
                                  <p className="text-[11px] text-zinc-400">{new Date(d.created_at).toLocaleDateString("en-GB")}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
