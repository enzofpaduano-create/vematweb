import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Plus, Search, Clock, CheckCircle2, FileText, Download } from "lucide-react";
import { PortalLayout } from "@/components/espace-client/PortalLayout";
import { OrderStatusBadge } from "@/components/espace-client/StatusBadge";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/lib/supabase";
import type { DevisRequest, OrderStatus } from "@/lib/database.types";
import { ORDER_STATUSES } from "@/lib/database.types";

export default function EspaceClientCommandes() {
  const { company, user, loading: authLoading } = useClientAuth();
  const [orders, setOrders] = useState<DevisRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [validating, setValidating] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!company) { setLoading(false); return; }
    supabase.from("devis_requests").select("*").eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setOrders(data ?? []); setLoading(false); });
  }, [company, authLoading]);

  const handleValidate = async (order: DevisRequest) => {
    if (!user) return;
    setValidating(order.id);
    await supabase.from("devis_requests").update({ status: "commande_payee" }).eq("id", order.id);
    await supabase.from("status_history").insert({
      entity_type: "devis",
      entity_id: order.id,
      old_status: order.status,
      new_status: "commande_payee",
    });
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: `Devis validé : ${order.reference}`,
      message: `Le client a confirmé sa commande${order.quote_amount ? ` — ${order.quote_amount.toLocaleString("fr-FR")} MAD` : ""}. À préparer.`,
      read: false,
      type: "devis_valide",
      link: `/espace-manager/commandes/${order.id}`,
    });
    setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "commande_payee" as const } : o));
    setValidating(null);
  };

  const downloadQuote = async (order: DevisRequest) => {
    if (!order.quote_pdf_url) return;
    const { data } = await supabase.storage.from("quotes").createSignedUrl(order.quote_pdf_url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const pendingDevis = orders.filter((o) => o.status === "devis_envoye" && o.quote_amount);

  const filtered = orders.filter((o) => {
    const matchSearch = o.reference.toLowerCase().includes(search.toLowerCase()) || o.notes?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || o.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-zinc-900">Mes commandes</h1>
            <p className="text-sm text-zinc-500 mt-1">Suivi de vos demandes de pièces de rechange</p>
          </div>
          <Link href="/espace-client/commandes/nouvelle"
            className="flex items-center gap-2 bg-accent text-accent-foreground font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-accent/90 transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle demande
          </Link>
        </div>

        {/* ── Devis à valider ── */}
        {!loading && pendingDevis.length > 0 && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-purple-100 bg-purple-100/60">
              <p className="text-xs font-black text-purple-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                {pendingDevis.length === 1 ? "1 devis attend votre validation" : `${pendingDevis.length} devis attendent votre validation`}
              </p>
            </div>
            <div className="divide-y divide-purple-100">
              {pendingDevis.map((order) => (
                <div key={order.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900">{order.reference}</p>
                    <p className="text-xs text-purple-700 font-semibold mt-0.5">
                      {order.quote_amount!.toLocaleString("fr-FR")} MAD
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {order.quote_pdf_url && (
                      <button onClick={() => downloadQuote(order)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors">
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    )}
                    <Link href={`/espace-client/commandes/${order.id}`}
                      className="text-xs font-semibold text-zinc-600 border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors">
                      Détail
                    </Link>
                    <button
                      onClick={() => handleValidate(order)}
                      disabled={validating === order.id}
                      className="flex items-center gap-1.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {validating === order.id ? "En cours..." : "Valider"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une référence..."
              className="w-full pl-9 pr-3.5 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-accent" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter("all")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${filter === "all" ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>
              Tous
            </button>
            {ORDER_STATUSES.map((s) => (
              <button key={s.value} onClick={() => setFilter(s.value as OrderStatus)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${filter === s.value ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-zinc-400 text-sm">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-zinc-400 text-sm mb-4">Aucune commande trouvée</p>
              <Link href="/espace-client/commandes/nouvelle" className="text-accent font-semibold text-sm hover:underline">
                Créer votre première demande de devis →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-500">Référence</th>
                  <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-500">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-500">Montant</th>
                  <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-500">Statut</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map((o) => (
                  <tr key={o.id} className={`hover:bg-zinc-50 transition-colors ${o.status === "devis_envoye" && o.quote_amount ? "bg-purple-50/30" : ""}`}>
                    <td className="px-5 py-4">
                      <p className="font-bold text-zinc-900">{o.reference}</p>
                      {o.notes && <p className="text-xs text-zinc-400 truncate max-w-48">{o.notes}</p>}
                    </td>
                    <td className="px-5 py-4 text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(o.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-zinc-700">
                      {o.quote_amount ? `${o.quote_amount.toLocaleString("fr-FR")} MAD` : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={o.status} />
                        {o.status === "devis_envoye" && o.quote_amount && (
                          <span className="text-[10px] font-black text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">Action requise</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/espace-client/commandes/${o.id}`} className="text-xs text-accent font-bold hover:underline">
                        Voir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
