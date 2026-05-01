import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Clock, Search, ChevronLeft, ChevronRight, Download, Calendar } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { AdminGuard } from "./AdminGuard";
import { OrderStatusBadge } from "@/components/espace-client/StatusBadge";
import { supabaseAdmin } from "@/lib/supabase";
import type { DevisRequest, Company, OrderStatus } from "@/lib/database.types";
import { ORDER_STATUSES } from "@/lib/database.types";
import { useLang } from "@/i18n/I18nProvider";

type OrderWithCompany = DevisRequest & { company?: Company };
type DateFilter = "all" | "today" | "week" | "month";

const PAGE_SIZE = 20;

function getDateRange(f: DateFilter): { from?: string; to?: string } {
  const now = new Date();
  if (f === "today") {
    const d = now.toISOString().split("T")[0];
    return { from: d + "T00:00:00", to: d + "T23:59:59.999" };
  }
  if (f === "week") {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString() };
  }
  if (f === "month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() };
  }
  return {};
}

function getDateFilters(t: (k: string) => string): { value: DateFilter; label: string }[] {
  return [
    { value: "all", label: t("portal.common.all") },
    { value: "today", label: t("portal.common.today") },
    { value: "week", label: t("portal.common.week") },
    { value: "month", label: t("portal.common.month") },
  ];
}

export default function AdminCommandes() {
  const { lang, t } = useLang();
  const DATE_FILTERS = getDateFilters(t);
  const [orders, setOrders] = useState<OrderWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabaseAdmin.from("devis_requests").select("*, companies(*)", { count: "exact" }).order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    if (debouncedSearch.trim()) q = q.ilike("reference", `%${debouncedSearch.trim()}%`);
    const { from: df, to: dt } = getDateRange(dateFilter);
    if (df) q = q.gte("created_at", df);
    if (dt) q = q.lte("created_at", dt);
    q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1).then(({ data, count }: { data: (DevisRequest & { companies?: Company })[] | null; count: number | null }) => {
      setOrders((data ?? []).map((o) => ({ ...o, company: o.companies })));
      setTotal(count ?? 0);
      setLoading(false);
    });
  }, [page, filter, dateFilter, debouncedSearch]);

  const exportCSV = async () => {
    setExporting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabaseAdmin.from("devis_requests").select("*, companies(*)").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    if (debouncedSearch.trim()) q = q.ilike("reference", `%${debouncedSearch.trim()}%`);
    const { from: df, to: dt } = getDateRange(dateFilter);
    if (df) q = q.gte("created_at", df);
    if (dt) q = q.lte("created_at", dt);
    const { data } = await q;
    const headers = [t("portal.common.reference"), t("portal.common.client"), t("portal.common.date"), t("portal.orders.amountMAD"), t("portal.common.status")];
    const rows = (data ?? []).map((o: DevisRequest & { companies?: Company }) => [
      o.reference,
      (o.companies as Company | undefined)?.name ?? "",
      new Date(o.created_at).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB"),
      o.quote_amount ?? "",
      ORDER_STATUSES.find((s) => s.value === o.status)?.label ?? o.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map(String).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commandes_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-900">{t("portal.manager.nav.orders")}</h1>
              {!loading && <p className="text-sm text-zinc-500 mt-1">{total} {total !== 1 ? t("portal.orders.ordersPlural") : t("portal.orders.order")}</p>}
            </div>
            <button onClick={exportCSV} disabled={exporting || loading}
              className="flex items-center gap-2 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
              <Download className="w-4 h-4" />{exporting ? t("portal.common.exporting") : t("portal.common.export")}
            </button>
          </div>

          <div className="flex gap-3 mb-4 flex-wrap items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("portal.orders.searchPlaceholder")}
                className="w-full pl-9 pr-3.5 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="flex items-center gap-0.5 bg-zinc-100 rounded-lg p-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 mx-1.5" />
              {DATE_FILTERS.map((d) => (
                <button key={d.value} onClick={() => { setDateFilter(d.value); setPage(0); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${dateFilter === d.value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mb-5">
            <button onClick={() => { setFilter("all"); setPage(0); }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${filter === "all" ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600"}`}>
              {t("portal.common.all")}
            </button>
            {ORDER_STATUSES.map((s) => (
              <button key={s.value} onClick={() => { setFilter(s.value as OrderStatus); setPage(0); }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${filter === s.value ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
            {loading ? (
              <div className="divide-y divide-zinc-50">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-4 w-36 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse ml-auto" />
                    <div className="h-5 w-20 bg-zinc-100 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 text-sm">{t("portal.orders.noOrders")}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    {[t("portal.common.reference"), t("portal.common.client"), t("portal.common.date"), t("portal.common.amount"), t("portal.common.status"), ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-zinc-900">{o.reference}</td>
                      <td className="px-5 py-4 text-zinc-600">{o.company?.name ?? "—"}</td>
                      <td className="px-5 py-4 text-zinc-500">
                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{new Date(o.created_at).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB")}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-zinc-700">{o.quote_amount ? `${o.quote_amount.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB")} MAD` : "—"}</td>
                      <td className="px-5 py-4"><OrderStatusBadge status={o.status} /></td>
                      <td className="px-5 py-4"><Link href={`/espace-manager/commandes/${o.id}`} className="text-xs text-accent font-bold hover:underline">{t("portal.common.manage")} →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-zinc-400">{from}–{to} {t("portal.common.of")} {total} {total !== 1 ? t("portal.common.results") : t("portal.common.result")}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> {t("portal.common.previous")}
                </button>
                <span className="text-xs font-bold text-zinc-700 px-1">{t("portal.common.page")} {page + 1} / {totalPages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {t("portal.common.next")} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
