import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, ArrowRight, Inbox, FolderOpen, Plus, Wrench, X, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { SavGuard } from "./SavGuard";
import { SavLayout } from "./SavLayout";
import { supabaseSav } from "@/lib/supabase";
import {
  listSavDocuments, DOC_LABEL_SHORT, formatMoney, groupSavIntoFolders,
  type SavDocument, type SavDocType,
} from "@/lib/savDocuments";

interface InterventionRequest {
  id: string;
  reference: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  machine_type: string;
  machine_brand: string | null;
  machine_model: string | null;
  problem_description: string;
  urgency: string;
  location: string;
  status: string;
  created_at: string;
}

const TYPE_BADGE: Record<SavDocType, string> = {
  devis: "bg-emerald-100 text-emerald-700",
  bon_commande: "bg-indigo-100 text-indigo-700",
  bon_livraison: "bg-violet-100 text-violet-700",
  facture: "bg-amber-100 text-amber-700",
};

const URGENCY: Record<string, { label: string; cls: string }> = {
  normale: { label: "Normal", cls: "bg-zinc-100 text-zinc-600" },
  urgente: { label: "Urgent", cls: "bg-amber-100 text-amber-700" },
  tres_urgente: { label: "Very urgent", cls: "bg-red-100 text-red-700" },
};

export default function SavDashboard() {
  const [requests, setRequests] = useState<InterventionRequest[] | null>(null);
  const [docs, setDocs] = useState<SavDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ignoringId, setIgnoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: reqErr } = await supabaseSav
          .from("form_interventions")
          .select("id, reference, company_name, contact_name, contact_phone, machine_type, machine_brand, machine_model, problem_description, urgency, location, status, created_at")
          .order("created_at", { ascending: false })
          .limit(50);
        if (reqErr) throw new Error(reqErr.message);
        const docData = await listSavDocuments();
        if (!cancelled) {
          setRequests((data ?? []) as InterventionRequest[]);
          setDocs(docData);
          setOpenFolders(new Set(groupSavIntoFolders(docData).slice(0, 6).map((f) => f.id)));
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
      const { error: e } = await supabaseSav.from("form_interventions").update({ status: "traite" }).eq("id", id);
      if (e) throw new Error(e.message);
      setRequests((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, status: "traite" } : r)));
    } catch (e) { setError((e as Error).message); }
    finally { setIgnoringId(null); }
  }

  async function deleteRequest(id: string) {
    if (!window.confirm("Delete this intervention request from the database? This cannot be undone.")) return;
    setDeletingId(id);
    setError(null);
    try {
      const { error: e } = await supabaseSav.from("form_interventions").delete().eq("id", id);
      if (e) throw new Error(e.message);
      setRequests((prev) => (prev ?? []).filter((r) => r.id !== id));
    } catch (e) { setError((e as Error).message); }
    finally { setDeletingId(null); }
  }

  const openRequests = useMemo(() => (requests ?? []).filter((r) => r.status === "nouveau"), [requests]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of docs ?? []) c[d.type] = (c[d.type] ?? 0) + 1;
    return c;
  }, [docs]);
  const recentFolders = useMemo(() => groupSavIntoFolders(docs ?? []).slice(0, 6), [docs]);

  function toggleFolder(id: string) {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <SavGuard>
      <SavLayout>
        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-emerald-600 mb-2">Service</p>
              <h1 className="text-3xl lg:text-4xl font-black text-zinc-950">Dashboard</h1>
            </div>
            <Link href="/espace-sav/offre/nouvelle">
              <div className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer">
                <Plus className="w-4 h-4" /> New offer
              </div>
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div><p className="font-bold text-red-700">Error</p><p className="text-sm text-red-600">{error}</p></div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {(["devis", "bon_commande", "bon_livraison", "facture"] as SavDocType[]).map((t) => (
              <div key={t} className="bg-white rounded-2xl border border-zinc-200 p-4">
                <p className="text-2xl font-black text-zinc-950">{counts[t] ?? 0}</p>
                <p className="text-[11px] text-zinc-500 font-semibold mt-1">{DOC_LABEL_SHORT[t]}</p>
              </div>
            ))}
          </div>

          {/* Incoming intervention requests */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Inbox className="w-4 h-4 text-emerald-600" />
              <h2 className="text-lg font-black text-zinc-950">Intervention requests from the website</h2>
              {openRequests.length > 0 && <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-full">{openRequests.length}</span>}
            </div>
            {requests === null && !error && <p className="text-zinc-400 text-sm py-8 text-center animate-pulse">Loading…</p>}
            {requests !== null && openRequests.length === 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
                <Wrench className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No intervention requests pending.</p>
              </div>
            )}
            {openRequests.length > 0 && (
              <div className="space-y-2">
                {openRequests.map((r) => {
                  const u = URGENCY[r.urgency] ?? URGENCY.normale;
                  const machine = [r.machine_brand, r.machine_model, r.machine_type].filter(Boolean).join(" ");
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs text-zinc-400">{r.reference}</span>
                          <span className="text-xs text-zinc-400">· {new Date(r.created_at).toLocaleDateString("en-GB")}</span>
                          <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${u.cls}`}>{u.label}</span>
                        </div>
                        <p className="font-bold text-zinc-950">{r.company_name}</p>
                        <p className="text-sm text-zinc-600">{r.contact_name} · {r.contact_phone}</p>
                        {machine && <p className="text-sm text-zinc-500 mt-1">{machine} · {r.location}</p>}
                        {r.problem_description && <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{r.problem_description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => deleteRequest(r.id)} disabled={deletingId === r.id || ignoringId === r.id}
                          className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-700 font-semibold text-sm px-3 py-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                          <Trash2 className="w-4 h-4" /> {deletingId === r.id ? "Deleting…" : "Delete"}
                        </button>
                        <button type="button" onClick={() => ignoreRequest(r.id)} disabled={ignoringId === r.id || deletingId === r.id}
                          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 font-semibold text-sm px-3 py-2 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50">
                          <X className="w-4 h-4" /> Ignore
                        </button>
                        <Link href={`/espace-sav/offre/nouvelle?from=${r.id}`}>
                          <div className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap">
                            Create offer <ArrowRight className="w-4 h-4" />
                          </div>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent folders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-600" />
                <h2 className="text-lg font-black text-zinc-950">Recent folders</h2>
              </div>
              <Link href="/espace-sav/documents" className="text-sm text-emerald-600 hover:underline font-semibold">View all</Link>
            </div>
            {docs !== null && recentFolders.length === 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
                <p className="text-sm text-zinc-500">No documents yet. Create your first offer.</p>
              </div>
            )}
            {recentFolders.length > 0 && (
              <div className="space-y-3">
                {recentFolders.map((folder) => {
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
                          <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[220px]">
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
        </div>
      </SavLayout>
    </SavGuard>
  );
}
