import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, ArrowRight, Inbox, FileText, Plus, Package } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import { supabasePdr } from "@/lib/supabase";
import {
  listDocuments, DOC_LABEL_SHORT, formatMoney,
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: reqData, error: reqErr } = await supabasePdr
          .from("form_devis")
          .select("id, reference, company_name, contact_name, contact_phone, contact_email, product_category, quantity, notes, status, created_at")
          .eq("is_spare_parts", true)
          .order("created_at", { ascending: false })
          .limit(50);
        if (reqErr) throw new Error(reqErr.message);
        const docData = await listDocuments();
        if (!cancelled) {
          setRequests((reqData ?? []) as SpareRequest[]);
          setDocs(docData);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const openRequests = useMemo(() => (requests ?? []).filter((r) => r.status === "nouveau"), [requests]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of docs ?? []) c[d.type] = (c[d.type] ?? 0) + 1;
    return c;
  }, [docs]);
  const recentDocs = useMemo(() => (docs ?? []).slice(0, 8), [docs]);

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-sky-600 mb-2">Pièces de rechange</p>
              <h1 className="text-3xl lg:text-4xl font-black text-zinc-950">Tableau de bord</h1>
            </div>
            <Link href="/espace-pdr/devis/nouveau">
              <div className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer">
                <Plus className="w-4 h-4" /> Nouveau devis
              </div>
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-red-700">Erreur</p>
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

          {/* Demandes reçues */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Inbox className="w-4 h-4 text-sky-600" />
              <h2 className="text-lg font-black text-zinc-950">Demandes reçues du site</h2>
              {openRequests.length > 0 && (
                <span className="bg-sky-100 text-sky-700 text-xs font-black px-2 py-0.5 rounded-full">{openRequests.length}</span>
              )}
            </div>
            {requests === null && !error && <p className="text-zinc-400 text-sm py-8 text-center animate-pulse">Chargement…</p>}
            {requests !== null && openRequests.length === 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
                <Package className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Aucune demande de pièces en attente.</p>
              </div>
            )}
            {openRequests.length > 0 && (
              <div className="space-y-2">
                {openRequests.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-zinc-400">{r.reference}</span>
                        <span className="text-xs text-zinc-400">· {new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <p className="font-bold text-zinc-950">{r.company_name}</p>
                      <p className="text-sm text-zinc-600">{r.contact_name} · {r.contact_phone}</p>
                      {r.product_category && <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{r.product_category}</p>}
                    </div>
                    <Link href={`/espace-pdr/devis/nouveau?from=${r.id}`}>
                      <div className="inline-flex items-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap">
                        Créer un devis <ArrowRight className="w-4 h-4" />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents récents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <h2 className="text-lg font-black text-zinc-950">Documents récents</h2>
              </div>
              <Link href="/espace-pdr/documents" className="text-sm text-sky-600 hover:underline font-semibold">Voir tout</Link>
            </div>
            {docs !== null && recentDocs.length === 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
                <p className="text-sm text-zinc-500">Aucun document pour l'instant. Créez un premier devis.</p>
              </div>
            )}
            {recentDocs.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
                {recentDocs.map((d) => (
                  <Link key={d.id} href={`/espace-pdr/document/${d.id}`}>
                    <div className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-md ${TYPE_BADGE[d.type]}`}>{DOC_LABEL_SHORT[d.type]}</span>
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
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
