import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Upload, Save } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { AdminGuard } from "./AdminGuard";
import { OrderStatusBadge } from "@/components/espace-client/StatusBadge";
import { OrderTimeline } from "@/components/espace-client/StatusTimeline";
import { supabaseAdmin } from "@/lib/supabase";
import type { DevisRequest, Company, OrderStatus, OrderItem } from "@/lib/database.types";
import { ORDER_STATUSES } from "@/lib/database.types";

export default function AdminCommandeDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<DevisRequest | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<OrderStatus>("en_traitement");
  const [amount, setAmount] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editableItems, setEditableItems] = useState<OrderItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    supabaseAdmin.from("devis_requests").select("*, companies(*)").eq("id", id!).single()
      .then(({ data }) => {
        if (!data) return;
        const o = data as DevisRequest & { companies?: Company };
        setOrder(o);
        setCompany(o.companies ?? null);
        setStatus(o.status);
        setAmount(o.quote_amount?.toString() ?? "");
        setEditableItems((o.items as unknown as OrderItem[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, [id]);

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    let pdfUrl = order.quote_pdf_url;

    if (pdfFile) {
      setUploading(true);
      const path = `${order.company_id}/${order.id}/${pdfFile.name}`;
      await supabaseAdmin.storage.from("quotes").upload(path, pdfFile, { upsert: true });
      pdfUrl = path;
      setUploading(false);
    }

    const oldStatus = order.status;
    await supabaseAdmin.from("devis_requests").update({
      status,
      quote_amount: amount ? parseFloat(amount) : null,
      quote_pdf_url: pdfUrl,
      items: editableItems as unknown as import("@/lib/database.types").Json,
    }).eq("id", order.id);

    if (oldStatus !== status) {
      await supabaseAdmin.from("status_history").insert({
        entity_type: "devis",
        entity_id: order.id,
        old_status: oldStatus,
        new_status: status,
      });
      // Notify when devis is sent to client or order is being prepared
      if (status === "devis_envoye" || status === "en_livraison") {
        const notifTitle = status === "devis_envoye"
          ? `Devis envoyé : ${order.reference}`
          : `Commande en livraison : ${order.reference}`;
        const notifMsg = status === "devis_envoye"
          ? `Devis de ${amount ? parseFloat(amount).toLocaleString("fr-FR") : "—"} MAD envoyé au client — en attente de validation.`
          : `La commande ${order.reference} est en cours de livraison.`;
        await supabaseAdmin.from("notifications").insert({
          user_id: order.created_by ?? order.company_id,
          title: notifTitle,
          message: notifMsg,
          read: false,
          type: status === "devis_envoye" ? "devis_envoye" : "commande_livraison",
          link: `/espace-manager/commandes/${order.id}`,
        });
      }
    }

    setSaving(false);
    setPdfFile(null);
    load();
  };

  if (loading) return <AdminGuard><AdminLayout><div className="p-8 text-zinc-400">Chargement...</div></AdminLayout></AdminGuard>;
  if (!order) return <AdminGuard><AdminLayout><div className="p-8 text-zinc-400">Commande introuvable.</div></AdminLayout></AdminGuard>;

  const updateItemPrice = (i: number, value: string) => {
    setEditableItems((prev) => prev.map((it, idx) => idx === i ? { ...it, unit_price: value ? parseFloat(value) : undefined } : it));
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-8 max-w-4xl">
          <Link href="/espace-manager/commandes" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour aux commandes
          </Link>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-900">{order.reference}</h1>
              <p className="text-zinc-500 text-sm mt-1">{company?.name} · {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-zinc-100 p-6 mb-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-5">Avancement</h2>
            <OrderTimeline status={order.status} />
          </div>

          {/* Admin controls */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4">Gestion de la commande</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">Statut</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent">
                  {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">Montant du devis (MAD)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex: 15000"
                  className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5">Devis PDF</label>
                <div className="flex items-center gap-3">
                  <input ref={fileRef} type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} className="hidden" />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 border border-zinc-200 text-zinc-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors">
                    <Upload className="w-4 h-4" /> {pdfFile ? pdfFile.name : "Choisir un PDF"}
                  </button>
                  {order.quote_pdf_url && !pdfFile && <span className="text-xs text-emerald-600 font-semibold">✓ PDF déjà uploadé</span>}
                </div>
              </div>
              <button onClick={handleSave} disabled={saving || uploading}
                className="flex items-center gap-2 bg-accent text-accent-foreground font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60">
                <Save className="w-4 h-4" />
                {uploading ? "Upload PDF..." : saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </div>

          {/* Items */}
          {editableItems.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-100 p-6 mb-5">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-1">Articles demandés ({editableItems.length})</h2>
              <p className="text-xs text-zinc-400 mb-4">Saisissez le prix unitaire par article — sauvegardez ensuite via le bouton ci-dessus.</p>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-zinc-100">
                  <th className="text-left pb-2 text-xs text-zinc-500 font-semibold">Référence</th>
                  <th className="text-left pb-2 text-xs text-zinc-500 font-semibold">Description</th>
                  <th className="text-right pb-2 text-xs text-zinc-500 font-semibold">Qté</th>
                  <th className="text-right pb-2 text-xs text-zinc-500 font-semibold">P.U. (MAD)</th>
                  <th className="text-right pb-2 text-xs text-zinc-500 font-semibold">Total</th>
                </tr></thead>
                <tbody className="divide-y divide-zinc-50">
                  {editableItems.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 font-mono text-xs text-zinc-700">{item.part_number || "—"}</td>
                      <td className="py-3 text-zinc-700">{item.description || "—"}</td>
                      <td className="py-3 text-right font-bold text-zinc-900">{item.quantity}</td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unit_price ?? ""}
                          onChange={(e) => updateItemPrice(i, e.target.value)}
                          placeholder="0.00"
                          className="w-28 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-sm text-right focus:outline-none focus:border-accent"
                        />
                      </td>
                      <td className="py-3 text-right text-zinc-700 font-semibold">
                        {item.unit_price ? `${(item.unit_price * item.quantity).toLocaleString("fr-FR")} MAD` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {editableItems.some((i) => i.unit_price) && (
                  <tfoot>
                    <tr className="border-t border-zinc-200">
                      <td colSpan={4} className="pt-3 text-sm font-semibold text-zinc-600 text-right">Total estimé</td>
                      <td className="pt-3 text-right font-black text-zinc-900">
                        {editableItems.reduce((s, i) => s + (i.unit_price ? i.unit_price * i.quantity : 0), 0).toLocaleString("fr-FR")} MAD
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {order.notes && (
            <div className="bg-zinc-50 rounded-xl border border-zinc-100 p-5">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">Notes client</h2>
              <p className="text-sm text-zinc-700 whitespace-pre-line">{order.notes}</p>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
