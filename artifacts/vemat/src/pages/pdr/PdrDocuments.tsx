import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, Search, X } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import { listDocuments, DOC_LABEL, DOC_LABEL_SHORT, formatMoney, type PdrDocument, type PdrDocType } from "@/lib/pdrDocuments";

const TYPE_BADGE: Record<PdrDocType, string> = {
  devis: "bg-sky-100 text-sky-700",
  bon_commande: "bg-indigo-100 text-indigo-700",
  commande_fournisseur: "bg-amber-100 text-amber-700",
  bon_reception: "bg-amber-100 text-amber-700",
  bon_livraison: "bg-violet-100 text-violet-700",
  facture: "bg-emerald-100 text-emerald-700",
};

const FILTERS: (PdrDocType | "all")[] = ["all", "devis", "bon_commande", "commande_fournisseur", "bon_reception", "bon_livraison", "facture"];

export default function PdrDocuments() {
  const [docs, setDocs] = useState<PdrDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PdrDocType | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    listDocuments()
      .then((d) => { if (!cancelled) setDocs(d); })
      .catch((e) => { if (!cancelled) setError((e as Error).message); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = docs ?? [];
    if (filter !== "all") list = list.filter((d) => d.type === filter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((d) =>
      (d.reference ?? "").toLowerCase().includes(q) ||
      (d.client_company ?? "").toLowerCase().includes(q) ||
      (d.client_name ?? "").toLowerCase().includes(q));
    return list;
  }, [docs, filter, query]);

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
          <p className="text-[10px] uppercase tracking-[0.25em] font-black text-sky-600 mb-2">Pièces de rechange</p>
          <h1 className="text-3xl lg:text-4xl font-black text-zinc-950 mb-6">Tous les documents</h1>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${filter === f ? "bg-sky-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
                {f === "all" ? "Tous" : DOC_LABEL_SHORT[f]}
              </button>
            ))}
          </div>

          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher (réf, client)…"
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-colors" />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100" aria-label="Effacer"><X className="h-4 w-4" /></button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" /><p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {docs === null && !error && <p className="text-zinc-400 text-sm py-20 text-center animate-pulse">Chargement…</p>}
          {docs !== null && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center">
              <p className="text-sm text-zinc-500">Aucun document.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
              {filtered.map((d) => (
                <Link key={d.id} href={`/espace-pdr/document/${d.id}`}>
                  <div className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-md shrink-0 ${TYPE_BADGE[d.type]}`}>{DOC_LABEL[d.type]}</span>
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-zinc-400">{d.reference}</p>
                        <p className="font-bold text-zinc-900 truncate">{d.client_company || d.client_name || "—"}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-zinc-950">{formatMoney(d.total_amount, d.currency)}</p>
                      <p className="text-[11px] text-zinc-400">{new Date(d.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
