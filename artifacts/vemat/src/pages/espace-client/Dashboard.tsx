import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ShoppingCart, Wrench, Plus, ArrowRight, Clock, CheckCircle2, FileText, Bell } from "lucide-react";
import { PortalLayout } from "@/components/espace-client/PortalLayout";
import { OrderStatusBadge, RepairStatusBadge } from "@/components/espace-client/StatusBadge";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/lib/supabase";
import type { DevisRequest, RepairRequest } from "@/lib/database.types";

export default function EspaceClientDashboard() {
  const { company, profile, user, loading: authLoading } = useClientAuth();
  const [orders, setOrders] = useState<DevisRequest[]>([]);
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [pendingDevis, setPendingDevis] = useState<DevisRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!company) { setLoading(false); return; }
    Promise.all([
      supabase.from("devis_requests").select("*").eq("company_id", company.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("repair_requests").select("*").eq("company_id", company.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("devis_requests").select("*").eq("company_id", company.id).eq("status", "devis_envoye").not("quote_amount", "is", null),
    ]).then(([o, r, p]) => {
      setOrders(o.data ?? []);
      setRepairs(r.data ?? []);
      setPendingDevis(p.data ?? []);
      setLoading(false);
    });
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
    setPendingDevis((prev) => prev.filter((o) => o.id !== order.id));
    setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "commande_payee" as const } : o));
    setValidating(null);
  };

  const activeOrders = orders.filter((o) => !["livree", "annulee"].includes(o.status)).length;
  const activeRepairs = repairs.filter((r) => !["terminee", "annulee"].includes(r.status)).length;

  return (
    <PortalLayout>
      <div className="p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-zinc-900">Bonjour, {profile?.first_name} 👋</h1>
          <p className="text-zinc-500 mt-1 text-sm">{company?.name}</p>
        </div>

        {/* ── Devis en attente de validation ── */}
        {!loading && pendingDevis.length > 0 && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-purple-100 bg-purple-100/50">
              <Bell className="w-4 h-4 text-purple-600 shrink-0" />
              <p className="text-sm font-black text-purple-900 flex-1">
                {pendingDevis.length === 1 ? "Un devis attend votre validation" : `${pendingDevis.length} devis attendent votre validation`}
              </p>
            </div>
            <div className="divide-y divide-purple-100">
              {pendingDevis.map((order) => (
                <div key={order.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900">{order.reference}</p>
                    <p className="text-xs text-purple-700 font-semibold mt-0.5">
                      Montant : {order.quote_amount!.toLocaleString("fr-FR")} MAD
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/espace-client/commandes/${order.id}`}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-900 px-3 py-1.5 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                      Voir le devis
                    </Link>
                    <button
                      onClick={() => handleValidate(order)}
                      disabled={validating === order.id}
                      className="flex items-center gap-1.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {validating === order.id ? "En cours..." : "Valider la commande"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Link href="/espace-client/commandes" className="bg-white rounded-xl border border-zinc-100 p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-blue-600 bg-blue-50">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-zinc-900">{loading ? "—" : activeOrders}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Commandes actives</p>
          </Link>

          <Link href="/espace-client/reparations" className="bg-white rounded-xl border border-zinc-100 p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-orange-600 bg-orange-50">
              <Wrench className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-zinc-900">{loading ? "—" : activeRepairs}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Réparations en cours</p>
          </Link>

          <Link href="/espace-client/commandes" className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${!loading && pendingDevis.length > 0 ? "border-purple-200 bg-purple-50/30" : "border-zinc-100"}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${!loading && pendingDevis.length > 0 ? "text-purple-600 bg-purple-100" : "text-zinc-400 bg-zinc-50"}`}>
              <FileText className="w-5 h-5" />
            </div>
            <p className={`text-2xl font-black ${!loading && pendingDevis.length > 0 ? "text-purple-700" : "text-zinc-900"}`}>{loading ? "—" : pendingDevis.length}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Devis à valider</p>
          </Link>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link href="/espace-client/commandes/nouvelle"
            className="bg-accent text-accent-foreground rounded-xl p-5 flex items-center gap-4 hover:bg-accent/90 transition-colors group">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Nouvelle demande de devis</p>
              <p className="text-xs opacity-80">Pièces de rechange</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/espace-client/reparations/nouvelle"
            className="bg-zinc-900 text-white rounded-xl p-5 flex items-center gap-4 hover:bg-zinc-800 transition-colors group">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Demande de réparation</p>
              <p className="text-xs opacity-60">Planifier une intervention</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto opacity-50 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-zinc-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h2 className="font-bold text-zinc-900 text-sm">Dernières commandes</h2>
              <Link href="/espace-client/commandes" className="text-xs text-accent font-semibold hover:underline">Voir tout</Link>
            </div>
            <div className="divide-y divide-zinc-50">
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-zinc-400">Chargement...</div>
              ) : orders.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-zinc-400 mb-2">Aucune commande</p>
                  <Link href="/espace-client/commandes/nouvelle" className="text-xs text-accent font-semibold hover:underline">Créer une demande →</Link>
                </div>
              ) : orders.map((o) => (
                <Link key={o.id} href={`/espace-client/commandes/${o.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{o.reference}</p>
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(o.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h2 className="font-bold text-zinc-900 text-sm">Dernières réparations</h2>
              <Link href="/espace-client/reparations" className="text-xs text-accent font-semibold hover:underline">Voir tout</Link>
            </div>
            <div className="divide-y divide-zinc-50">
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-zinc-400">Chargement...</div>
              ) : repairs.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-zinc-400 mb-2">Aucune réparation</p>
                  <Link href="/espace-client/reparations/nouvelle" className="text-xs text-accent font-semibold hover:underline">Créer une demande →</Link>
                </div>
              ) : repairs.map((r) => (
                <Link key={r.id} href={`/espace-client/reparations/${r.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{r.reference}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{r.equipment_type}</p>
                  </div>
                  <RepairStatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
