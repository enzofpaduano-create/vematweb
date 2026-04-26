import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ShoppingCart, TrendingUp, CheckCircle2, Clock, Search, AlertTriangle } from "lucide-react";
import { DGLayout } from "./DGLayout";
import { DGGuard } from "./DGGuard";
import { OrderStatusBadge } from "@/components/espace-client/StatusBadge";
import { supabaseDG } from "@/lib/supabase";
import { ORDER_STATUSES } from "@/lib/database.types";
import type { DevisRequest, Company, OrderStatus } from "@/lib/database.types";

type OrderWithCompany = DevisRequest & { company?: Company };
type Period = "semaine" | "mois" | "annee";

const BAR_COLORS: Record<string, string> = {
  en_traitement: "bg-blue-400",
  devis_envoye: "bg-violet-400",
  commande_payee: "bg-green-400",
  en_livraison: "bg-orange-400",
  livree: "bg-emerald-500",
  annulee: "bg-red-400",
};

function getStartDate(period: Period): Date {
  const now = new Date();
  if (period === "semaine") { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
  if (period === "mois") return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

export default function DGCommandes() {
  const [orders, setOrders] = useState<OrderWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("mois");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    supabaseDG.from("devis_requests").select("*, companies(*)").order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []).map((o: DevisRequest & { companies?: Company }) => ({ ...o, company: o.companies })));
        setLoading(false);
      });
  }, []);

  const startDate = getStartDate(period);
  const periodOrders = orders.filter((o) => new Date(o.created_at) >= startDate);

  const totalValue = periodOrders.reduce((s, o) => s + (o.quote_amount ?? 0), 0);
  const validatedCount = periodOrders.filter((o) => ["commande_payee", "en_livraison", "livree"].includes(o.status)).length;
  const pendingValidation = periodOrders.filter((o) => o.status === "devis_envoye").length;
  const avgValue = periodOrders.filter((o) => o.quote_amount).length
    ? totalValue / periodOrders.filter((o) => o.quote_amount).length
    : 0;

  const statusCounts = ORDER_STATUSES.map((s) => ({
    ...s,
    count: periodOrders.filter((o) => o.status === s.value).length,
  }));
  const maxCount = Math.max(...statusCounts.map((s) => s.count), 1);

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.reference.toLowerCase().includes(search.toLowerCase()) ||
      (o.company?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const PERIOD_LABELS: Record<Period, string> = { semaine: "7 derniers jours", mois: "Ce mois", annee: "Cette année" };

  return (
    <DGGuard>
      <DGLayout>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-900">Commandes</h1>
              <p className="text-sm text-zinc-500 mt-1">Vue direction · {filtered.length} commandes au total</p>
            </div>
            <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
              {(["semaine", "mois", "annee"] as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${period === p ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
                  {p === "semaine" ? "Semaine" : p === "mois" ? "Mois" : "Année"}
                </button>
              ))}
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { icon: ShoppingCart, label: `Commandes · ${PERIOD_LABELS[period]}`, value: loading ? "—" : String(periodOrders.length), color: "text-blue-600 bg-blue-50" },
              { icon: TrendingUp, label: "Valeur totale (MAD)", value: loading ? "—" : totalValue.toLocaleString("fr-FR"), color: "text-emerald-600 bg-emerald-50" },
              { icon: CheckCircle2, label: "Commandes validées", value: loading ? "—" : String(validatedCount), color: "text-purple-600 bg-purple-50" },
              { icon: Clock, label: "Devis en attente client", value: loading ? "—" : String(pendingValidation), color: "text-amber-600 bg-amber-50" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-zinc-100 p-5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-zinc-900 truncate">{value}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Breakdown + avg */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Bar chart */}
            <div className="col-span-2 bg-white rounded-xl border border-zinc-100 p-6">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-5">
                Répartition par statut · {PERIOD_LABELS[period]}
              </h2>
              {loading ? (
                <div className="text-sm text-zinc-400 py-4">Chargement...</div>
              ) : periodOrders.length === 0 ? (
                <div className="text-sm text-zinc-400 py-4">Aucune commande sur cette période</div>
              ) : (
                <div className="space-y-3.5">
                  {statusCounts.map((s) => (
                    <div key={s.value} className="flex items-center gap-4">
                      <div className="w-36 shrink-0">
                        <span className="text-xs font-semibold text-zinc-600">{s.label}</span>
                      </div>
                      <div className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[s.value] ?? "bg-zinc-400"}`}
                          style={{ width: s.count > 0 ? `${Math.max((s.count / maxCount) * 100, 5)}%` : "0%" }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs font-black text-zinc-900">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Avg + breakdown */}
            <div className="bg-white rounded-xl border border-zinc-100 p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4">Panier moyen</h2>
                <p className="text-3xl font-black text-zinc-900">
                  {loading ? "—" : avgValue > 0 ? avgValue.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) : "—"}
                </p>
                <p className="text-sm text-zinc-400 mt-1">MAD par commande</p>
              </div>
              <div className="mt-6 space-y-2 border-t border-zinc-100 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Avec devis</span>
                  <span className="font-bold text-zinc-900">{periodOrders.filter((o) => o.quote_amount).length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Sans devis</span>
                  <span className="font-bold text-zinc-900">{periodOrders.filter((o) => !o.quote_amount).length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Annulées</span>
                  <span className="font-bold text-zinc-900">{periodOrders.filter((o) => o.status === "annulee").length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Référence ou société..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusFilter === "all" ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>
                  Tous
                </button>
                {ORDER_STATUSES.map((s) => (
                  <button key={s.value} onClick={() => setStatusFilter(s.value as OrderStatus)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusFilter === s.value ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-zinc-400">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-zinc-400">Aucune commande</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    {["Référence", "Société", "Date", "Montant", "Statut"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filtered.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50 transition-colors cursor-pointer">
                      <td className="px-5 py-3.5">
                        <Link href={`/direction/commandes/${o.id}`} className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 hover:text-purple-600 transition-colors">{o.reference}</span>
                          {o.status === "devis_envoye" && (
                            <span title="En attente validation client"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></span>
                          )}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600">{o.company?.name ?? "—"}</td>
                      <td className="px-5 py-3.5 text-zinc-500 text-xs">
                        {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-zinc-700">
                        {o.quote_amount ? `${o.quote_amount.toLocaleString("fr-FR")} MAD` : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <OrderStatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </DGLayout>
    </DGGuard>
  );
}
