import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, Search, X, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import { SavGuard } from "./SavGuard";
import { SavLayout } from "./SavLayout";
import {
  listSavDocuments, DOC_LABEL_SHORT, formatMoney, groupSavIntoFolders,
  type SavDocument, type SavDocType, type SavFolder,
} from "@/lib/savDocuments";

const TYPE_BADGE: Record<SavDocType, string> = {
  devis: "bg-emerald-100 text-emerald-700",
  bon_commande: "bg-indigo-100 text-indigo-700",
  bon_livraison: "bg-violet-100 text-violet-700",
  facture: "bg-amber-100 text-amber-700",
};

const FILTERS: (SavDocType | "all")[] = ["all", "devis", "bon_commande", "bon_livraison", "facture"];

export default function SavDocuments() {
  const [docs, setDocs] = useState<SavDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SavDocType | "all">("all");
  const [query, setQuery] = useState("");
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    listSavDocuments()
      .then((d) => { if (cancelled) return; setDocs(d); setOpenFolders(new Set(groupSavIntoFolders(d).map((f) => f.id))); })
      .catch((e) => { if (!cancelled) setError((e as Error).message); });
    return () => { cancelled = true; };
  }, []);

  const folders = useMemo(() => {
    const all = groupSavIntoFolders(docs ?? []);
    const q = query.trim().toLowerCase();
    return all.map((folder): SavFolder | null => {
      let list = folder.docs;
      if (filter !== "all") list = list.filter((d) => d.type === filter);
      if (q) {
        const folderMatch = folder.client.toLowerCase().includes(q) || (folder.root.reference ?? "").toLowerCase().includes(q);
        if (!folderMatch) list = list.filter((d) => (d.reference ?? "").toLowerCase().includes(q) || (d.client_company ?? "").toLowerCase().includes(q) || (d.client_name ?? "").toLowerCase().includes(q));
      }
      if (list.length === 0) return null;
      return { ...folder, docs: list };
    }).filter((f): f is SavFolder => f !== null);
  }, [docs, filter, query]);

  function toggleFolder(id: string) {
    setOpenFolders((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  return (
    <SavGuard>
      <SavLayout>
        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
          <p className="text-[10px] uppercase tracking-[0.25em] font-black text-emerald-600 mb-2">Service</p>
          <h1 className="text-3xl lg:text-4xl font-black text-zinc-950 mb-6">All documents</h1>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${filter === f ? "bg-emerald-600 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
                {f === "all" ? "All" : DOC_LABEL_SHORT[f]}
              </button>
            ))}
          </div>

          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search (ref, client)…"
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors" />
            {query && <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100" aria-label="Clear"><X className="h-4 w-4" /></button>}
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3 mb-6"><AlertCircle className="h-5 w-5 text-red-500 shrink-0" /><p className="text-sm text-red-600">{error}</p></div>}
          {docs === null && !error && <p className="text-zinc-400 text-sm py-20 text-center animate-pulse">Loading…</p>}
          {docs !== null && folders.length === 0 && <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center"><p className="text-sm text-zinc-500">No documents.</p></div>}

          {folders.length > 0 && (
            <div className="space-y-3">
              {folders.map((folder) => {
                const open = openFolders.has(folder.id);
                return (
                  <div key={folder.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                    <button type="button" onClick={() => toggleFolder(folder.id)} className="w-full flex items-center justify-between gap-4 p-4 hover:bg-zinc-50 transition-colors text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        {open ? <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />}
                        <FolderOpen className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-black text-zinc-950 truncate">{folder.client}</p>
                          <p className="font-mono text-xs text-zinc-400">{folder.root.reference}<span className="text-zinc-300"> · </span>{folder.docs.length} document{folder.docs.length > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[260px]">
                          {folder.docs.map((d) => <span key={d.id} className={`text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${TYPE_BADGE[d.type]}`}>{DOC_LABEL_SHORT[d.type]}</span>)}
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
                          <Link key={d.id} href={`/espace-sav/document/${d.id}`}>
                            <div className="flex items-center justify-between gap-4 px-4 py-3 pl-12 hover:bg-white transition-colors cursor-pointer">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-md shrink-0 ${TYPE_BADGE[d.type]}`}>{DOC_LABEL_SHORT[d.type]}</span>
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
      </SavLayout>
    </SavGuard>
  );
}
