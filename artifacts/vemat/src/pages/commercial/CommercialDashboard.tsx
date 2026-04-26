import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CalendarDays, TrendingUp, FileText, AlertCircle, Clock, CheckCircle2, Target } from "lucide-react";
import { CommercialLayout } from "./CommercialLayout";
import { useCommercialAuth } from "@/contexts/CommercialAuthContext";
import { supabaseCommercial } from "@/lib/supabase";
import type { CommercialEvent, CommercialSale, CommercialTarget } from "@/lib/database.types";

const SALE_STATUS: Record<string, { label: string; color: string }> = {
  devis:       { label: "Devis",           color: "text-zinc-400 bg-zinc-800 border-zinc-700" },
  bon_commande:{ label: "Bon de commande", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  facture:     { label: "Facturé",         color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  paye:        { label: "Payé",            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

const EVENT_TYPE: Record<string, { label: string; color: string }> = {
  visite:  { label: "Visite client", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  reunion: { label: "Réunion",       color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  appel:   { label: "Appel",         color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  autre:   { label: "Autre",         color: "bg-zinc-700 text-zinc-400 border-zinc-600" },
};

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CommercialDashboard() {
  const { commercial } = useCommercialAuth();
  const [todayEvents, setTodayEvents] = useState<CommercialEvent[]>([]);
  const [recentSales, setRecentSales] = useState<CommercialSale[]>([]);
  const [target, setTarget] = useState<CommercialTarget | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const todayStr = toDateStr(now);

  useEffect(() => {
    if (!commercial) return;
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    Promise.all([
      supabaseCommercial.from("commercial_events").select("*").eq("commercial_id", commercial.id).eq("date", todayStr).order("start_time"),
      supabaseCommercial.from("commercial_sales").select("*").eq("commercial_id", commercial.id).order("created_at", { ascending: false }).limit(6),
      supabaseCommercial.from("commercial_targets").select("*").eq("commercial_id", commercial.id).eq("year", year).eq("month", month).single(),
    ]).then(([ev, sales, tgt]) => {
      setTodayEvents(ev.data ?? []);
      setRecentSales(sales.data ?? []);
      setTarget(tgt.data ?? null);
      setLoading(false);
    });
  }, [commercial]);

  const paidSales = recentSales.filter((s) => ["facture", "paye"].includes(s.status));
  const thisMonthCA = recentSales
    .filter((s) => ["facture", "paye"].includes(s.status) && s.invoice_date?.startsWith(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`))
    .reduce((sum, s) => sum + (s.invoice_amount ?? 0), 0);
  const targetAmount = target?.target_amount ?? 0;
  const progress = targetAmount > 0 ? Math.min((thisMonthCA / targetAmount) * 100, 100) : 0;

  return (
    <CommercialLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">
            Bonjour, {commercial?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* CA ce mois */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            {loading ? (
              <><div className="w-10 h-10 bg-zinc-800 rounded-lg animate-pulse mb-3" /><div className="h-6 w-28 bg-zinc-800 rounded animate-pulse mb-1" /><div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" /></>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-xl font-black text-white">{thisMonthCA > 0 ? `${thisMonthCA.toLocaleString("fr-FR")} MAD` : "—"}</p>
                <p className="text-xs text-zinc-500 mt-0.5">CA facturé ce mois</p>
              </>
            )}
          </div>

          {/* Objectif */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            {loading ? (
              <><div className="w-10 h-10 bg-zinc-800 rounded-lg animate-pulse mb-3" /><div className="h-6 w-24 bg-zinc-800 rounded animate-pulse mb-1" /><div className="h-2 w-full bg-zinc-800 rounded-full animate-pulse mt-3" /></>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                  <Target className="w-5 h-5" />
                </div>
                <p className="text-xl font-black text-white">
                  {targetAmount > 0 ? `${Math.round(progress)}%` : "—"}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {targetAmount > 0 ? `Objectif : ${targetAmount.toLocaleString("fr-FR")} MAD` : "Aucun objectif fixé"}
                </p>
                {targetAmount > 0 && (
                  <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Aujourd'hui */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            {loading ? (
              <><div className="w-10 h-10 bg-zinc-800 rounded-lg animate-pulse mb-3" /><div className="h-6 w-8 bg-zinc-800 rounded animate-pulse mb-1" /><div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" /></>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <p className="text-xl font-black text-white">{todayEvents.length}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Événement{todayEvents.length !== 1 ? "s" : ""} aujourd'hui</p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Today's events */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <h2 className="font-bold text-white text-sm">Planning du jour</h2>
              </div>
              <Link href="/espace-commercial/calendrier">
                <span className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer">Voir tout →</span>
              </Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />)}</div>
            ) : todayEvents.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-600">Aucun événement aujourd'hui</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {todayEvents.map((ev) => {
                  const et = EVENT_TYPE[ev.type] ?? EVENT_TYPE.autre;
                  return (
                    <div key={ev.id} className="px-5 py-3 flex items-start gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${et.color}`}>{et.label}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{ev.title}</p>
                        {ev.client_name && <p className="text-xs text-zinc-500 truncate">{ev.client_name}</p>}
                        {(ev.start_time || ev.location) && (
                          <p className="text-xs text-zinc-600 mt-0.5">{[ev.start_time, ev.location].filter(Boolean).join(" · ")}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent sales */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <h2 className="font-bold text-white text-sm">Mes ventes récentes</h2>
              </div>
              <Link href="/espace-commercial/ventes">
                <span className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer">Voir tout →</span>
              </Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />)}</div>
            ) : recentSales.length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-600">Aucune vente enregistrée</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {recentSales.map((s) => {
                  const st = SALE_STATUS[s.status] ?? SALE_STATUS.devis;
                  return (
                    <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{s.client_name}</p>
                        <p className="text-xs text-zinc-500 truncate">{[s.machine_brand, s.machine_model].filter(Boolean).join(" ")}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">{s.invoice_amount ? `${s.invoice_amount.toLocaleString("fr-FR")} MAD` : "—"}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pending alert */}
        {!loading && recentSales.filter((s) => s.status === "devis").length > 0 && (
          <div className="mt-5 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300">
              <span className="font-bold">{recentSales.filter((s) => s.status === "devis").length} vente{recentSales.filter((s) => s.status === "devis").length > 1 ? "s" : ""}</span> en statut Devis — à relancer ou à confirmer.
            </p>
            <Link href="/espace-commercial/ventes">
              <span className="ml-auto text-xs text-yellow-400 font-bold cursor-pointer hover:text-yellow-300">Gérer →</span>
            </Link>
          </div>
        )}
      </div>
    </CommercialLayout>
  );
}
