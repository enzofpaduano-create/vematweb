import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Download } from "lucide-react";
import { DGLayout } from "./DGLayout";
import { DGGuard } from "./DGGuard";
import { OrderStatusBadge } from "@/components/espace-client/StatusBadge";
import { OrderTimeline } from "@/components/espace-client/StatusTimeline";
import { supabaseDG } from "@/lib/supabase";
import type { DevisRequest, Company, OrderItem } from "@/lib/database.types";

export default function DGCommandeDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<DevisRequest | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseDG.from("devis_requests").select("*, companies(*)").eq("id", id!).single()
      .then(({ data }) => {
        if (!data) return;
        const o = data as DevisRequest & { companies?: Company };
        setOrder(o);
        setCompany(o.companies ?? null);
        setLoading(false);
      });
  }, [id]);

  const downloadQuote = async () => {
    if (!order?.quote_pdf_url) return;
    const { data } = await supabaseDG.storage.from("quotes").createSignedUrl(order.quote_pdf_url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (loading) return <DGGuard><DGLayout><div className="p-8 text-zinc-400">Chargement...</div></DGLayout></DGGuard>;
  if (!order) return <DGGuard><DGLayout><div className="p-8 text-zinc-400">Commande introuvable.</div></DGLayout></DGGuard>;

  const items = (order.items as unknown as OrderItem[]) ?? [];

  return (
    <DGGuard>
      <DGLayout>
        <div className="p-8 max-w-4xl">
          <Link href="/direction/commandes" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour aux commandes
          </Link>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-900">{order.reference}</h1>
              <p className="text-zinc-500 text-sm mt-1">
                {company?.name} · {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              {order.quote_pdf_url && (
                <button onClick={downloadQuote}
                  className="flex items-center gap-2 border border-zinc-200 text-zinc-700 font-bold text-sm px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors">
                  <Download className="w-4 h-4" /> Télécharger le devis
                </button>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-zinc-100 p-6 mb-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-5">Avancement</h2>
            <OrderTimeline status={order.status} />
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
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4">Articles ({items.length})</h2>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-zinc-100">
                  <th className="text-left pb-2 text-xs text-zinc-500 font-semibold">Référence</th>
                  <th className="text-left pb-2 text-xs text-zinc-500 font-semibold">Description</th>
                  <th className="text-right pb-2 text-xs text-zinc-500 font-semibold">Qté</th>
                  {items.some((i) => i.unit_price) && <th className="text-right pb-2 text-xs text-zinc-500 font-semibold">P.U. (MAD)</th>}
                  {items.some((i) => i.unit_price) && <th className="text-right pb-2 text-xs text-zinc-500 font-semibold">Total</th>}
                </tr></thead>
                <tbody className="divide-y divide-zinc-50">
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 font-mono text-xs text-zinc-700">{item.part_number || "—"}</td>
                      <td className="py-3 text-zinc-700">{item.description || "—"}</td>
                      <td className="py-3 text-right font-bold text-zinc-900">{item.quantity}</td>
                      {items.some((it) => it.unit_price) && (
                        <td className="py-3 text-right text-zinc-700">{item.unit_price ? `${item.unit_price.toLocaleString("fr-FR")} MAD` : "—"}</td>
                      )}
                      {items.some((it) => it.unit_price) && (
                        <td className="py-3 text-right font-semibold text-zinc-700">
                          {item.unit_price ? `${(item.unit_price * item.quantity).toLocaleString("fr-FR")} MAD` : "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                {items.some((i) => i.unit_price) && (
                  <tfoot>
                    <tr className="border-t border-zinc-200">
                      <td colSpan={items.some((i) => i.unit_price) ? 4 : 3} className="pt-3 text-sm font-semibold text-zinc-600 text-right">Total</td>
                      <td className="pt-3 text-right font-black text-zinc-900">
                        {items.reduce((s, i) => s + (i.unit_price ? i.unit_price * i.quantity : 0), 0).toLocaleString("fr-FR")} MAD
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* Infos */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-zinc-100 p-5">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Société</h2>
              <p className="font-bold text-zinc-900">{company?.name ?? "—"}</p>
              {company?.address && <p className="text-sm text-zinc-500 mt-1">{company.address}</p>}
              {company?.email && <p className="text-sm text-zinc-500">{company.email}</p>}
              {company?.phone && <p className="text-sm text-zinc-500">{company.phone}</p>}
            </div>
            {order.notes && (
              <div className="bg-white rounded-xl border border-zinc-100 p-5">
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Notes client</h2>
                <p className="text-sm text-zinc-700 whitespace-pre-line">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </DGLayout>
    </DGGuard>
  );
}
