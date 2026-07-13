import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, ArrowRight, Inbox, FolderOpen, Plus, Package, X, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import { supabasePdr } from "@/lib/supabase";
import {
  listDocuments, DOC_LABEL_SHORT, formatMoney, groupIntoFolders,
  type PdrDocument, type PdrDocType,
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
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of docs ?? []) c[d.type] = (c[d.type] ?? 0) + 1;
    return c;
  }, [docs]);
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

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {(["devis", "bon_commande", "commande_fournisseur", "bon_reception", "bon_livraison", "facture"] as PdrDocType[]).map((t) => (
              <div key={t} className="bg-white rounded-2xl border border-zinc-200 p-4">
                <p className="text-2xl font-black text-zinc-950">{counts[t] ?? 0}</p>
                <p className="text-[11px] text-zinc-500 font-semibold mt-1">{DOC_LABEL_SHORT[t]}</p>
              </div>
            ))}
          </div>

          {/* Incoming requests */}
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
                          <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[220px]">
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
