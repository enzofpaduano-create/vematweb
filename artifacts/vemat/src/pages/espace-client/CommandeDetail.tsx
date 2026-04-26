import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, CheckCircle2, Download, FileText, Package, History } from "lucide-react";
import { PortalLayout } from "@/components/espace-client/PortalLayout";
import { OrderStatusBadge } from "@/components/espace-client/StatusBadge";
import { OrderTimeline } from "@/components/espace-client/StatusTimeline";
import { supabase } from "@/lib/supabase";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import type { DevisRequest, Chantier, OrderItem, StatusHistory } from "@/lib/database.types";

const STATUS_LABELS: Record<string, string> = {
  en_traitement: "En traitement",
  devis_envoye: "Devis envoyé",
  commande_payee: "Commande validée",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

export default function EspaceClientCommandeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useClientAuth();
  const [order, setOrder] = useState<DevisRequest | null>(null);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("devis_requests").select("*").eq("id", id!).single(),
      supabase.from("status_history").select("*").eq("entity_id", id!).order("created_at", { ascending: true }),
    ]).then(([{ data: o }, { data: h }]) => {
      setOrder(o);
      setHistory(h ?? []);
      setLoading(false);
      if (o?.chantier_id) {
        supabase.from("chantiers").select("*").eq("id", o.chantier_id).single().then(({ data: c }) => setChantier(c));
      }
    });
  }, [id]);

  const downloadQuote = async () => {
    if (!order?.quote_pdf_url) return;
    const { data } = await supabase.storage.from("quotes").createSignedUrl(order.quote_pdf_url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleValidate = async () => {
    if (!order || !user) return;
    setValidating(true);
    await supabase.from("devis_requests").update({ status: "commande_payee" }).eq("id", order.id);
    await supabase.from("status_history").insert({ entity_type: "devis", entity_id: order.id, old_status: order.status, new_status: "commande_payee" });
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: `Devis validé : ${order.reference}`,
      message: `Le client a confirmé sa commande${order.quote_amount ? ` — ${order.quote_amount.toLocaleString("fr-FR")} MAD` : ""}. À préparer.`,
      read: false, type: "devis_valide", link: `/espace-manager/commandes/${order.id}`,
    });
    const newEntry: StatusHistory = {
      id: crypto.randomUUID(), entity_type: "devis", entity_id: order.id,
      old_status: order.status, new_status: "commande_payee",
      note: null, changed_by: null, created_at: new Date().toISOString(),
    };
    setHistory((prev) => [...prev, newEntry]);
    setValidating(false);
    setOrder({ ...order, status: "commande_payee" });
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="p-8 max-w-4xl space-y-5">
          <div className="h-5 w-32 bg-zinc-100 rounded animate-pulse" />
          <div className="h-8 w-48 bg-zinc-100 rounded animate-pulse" />
          <div className="bg-white rounded-xl border border-zinc-100 p-6 space-y-4">
            <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
            <div className="h-12 bg-zinc-100 rounded animate-pulse" />
          </div>
        </div>
      </PortalLayout>
    );
  }
  if (!order) return <PortalLayout><div className="p-8 text-zinc-400">Commande introuvable.</div></PortalLayout>;

  const items = (order.items as unknown as OrderItem[]) ?? [];

  return (
    <PortalLayout>
      <div className="p-8 max-w-4xl">
        <Link href="/espace-client/commandes" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux commandes
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-zinc-900">{order.reference}</h1>
            <p className="text-zinc-500 text-sm mt-1">Créée le {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            {order.quote_pdf_url && (
              <button onClick={downloadQuote}
                className="flex items-center gap-2 border border-zinc-200 text-zinc-700 font-bold text-sm px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors">
                <Download className="w-4 h-4" /> Télécharger le devis
              </button>
            )}
            {order.status === "devis_envoye" && order.quote_amount && (
              <button onClick={handleValidate} disabled={validating}
                className="flex items-center gap-2 bg-emerald-600 text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60">
                <CheckCircle2 className="w-4 h-4" /> {validating ? "Validation..." : "Valider le devis"}
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-zinc-100 p-6 mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-5">Suivi de commande</h2>
          <OrderTimeline status={order.status} />
          {order.status === "devis_envoye" && (
            <div className="mt-5 flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
              <FileText className="w-5 h-5 text-purple-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-purple-900">Votre devis est prêt</p>
                <p className="text-xs text-purple-600">
                  {order.quote_amount ? `Montant : ${order.quote_amount.toLocaleString("fr-FR")} MAD · ` : ""}
                  Validez pour confirmer votre commande
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {order.quote_pdf_url && (
                  <button onClick={downloadQuote} className="text-xs font-bold text-purple-700 hover:underline">Télécharger →</button>
                )}
                {order.quote_amount && (
                  <button onClick={handleValidate} disabled={validating}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {validating ? "..." : "Valider"}
                  </button>
                )}
              </div>
            </div>
          )}
          {order.quote_amount && (
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-600">Montant du devis</span>
              <span className="text-lg font-black text-zinc-900">{order.quote_amount.toLocaleString("fr-FR")} MAD</span>
            </div>
          )}
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-100 p-6 mb-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4">Articles demandés</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-zinc-100">
                <th className="text-left pb-2 text-xs text-zinc-500 font-semibold">Référence</th>
                <th className="text-left pb-2 text-xs text-zinc-500 font-semibold">Description</th>
                <th className="text-right pb-2 text-xs text-zinc-500 font-semibold">Qté</th>
                {items.some((i) => i.unit_price) && <th className="text-right pb-2 text-xs text-zinc-500 font-semibold">P.U.</th>}
              </tr></thead>
              <tbody className="divide-y divide-zinc-50">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 font-mono text-xs text-zinc-700">{item.part_number}</td>
                    <td className="py-3 text-zinc-700">{item.description}</td>
                    <td className="py-3 text-right font-bold text-zinc-900">{item.quantity}</td>
                    {items.some((it) => it.unit_price) && (
                      <td className="py-3 text-right text-zinc-700">{item.unit_price ? `${item.unit_price.toLocaleString("fr-FR")} MAD` : "—"}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Infos */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          {chantier && (
            <div className="bg-white rounded-xl border border-zinc-100 p-5">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Chantier</h2>
              <p className="font-bold text-zinc-900">{chantier.name}</p>
              {chantier.address && <p className="text-sm text-zinc-500 mt-1">{chantier.address}, {chantier.city}</p>}
            </div>
          )}
          {order.notes && (
            <div className="bg-white rounded-xl border border-zinc-100 p-5">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Notes</h2>
              <p className="text-sm text-zinc-700 whitespace-pre-line">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Status history */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-100 p-6 mb-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Historique
            </h2>
            <div className="space-y-3">
              {history.map((entry, i) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${i === history.length - 1 ? "bg-accent" : "bg-zinc-300"}`} />
                    {i < history.length - 1 && <div className="w-px flex-1 bg-zinc-100 mt-1 mb-0 min-h-[16px]" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-sm font-semibold text-zinc-900">
                      {STATUS_LABELS[entry.new_status] ?? entry.new_status}
                    </p>
                    {entry.old_status && (
                      <p className="text-xs text-zinc-400">depuis : {STATUS_LABELS[entry.old_status] ?? entry.old_status}</p>
                    )}
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(entry.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 flex items-center gap-4">
          <Package className="w-6 h-6 text-zinc-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-zinc-700">Besoin d'aide sur cette commande ?</p>
            <p className="text-xs text-zinc-500">Contactez notre équipe : <a href="mailto:contact@vemat.ma" className="text-accent font-semibold">contact@vemat.ma</a> · +212 650 14 64 64</p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
