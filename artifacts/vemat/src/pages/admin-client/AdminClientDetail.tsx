import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Building2, Phone, MapPin, Mail, ShoppingCart, Wrench, TrendingUp, FileText } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { AdminGuard } from "./AdminGuard";
import { OrderStatusBadge, RepairStatusBadge } from "@/components/espace-client/StatusBadge";
import { supabaseAdmin } from "@/lib/supabase";
import type { Company, DevisRequest, RepairRequest } from "@/lib/database.types";

export default function AdminClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [orders, setOrders] = useState<DevisRequest[]>([]);
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabaseAdmin.from("companies").select("*").eq("id", id!).single(),
      supabaseAdmin.from("devis_requests").select("*").eq("company_id", id!).order("created_at", { ascending: false }),
      supabaseAdmin.from("repair_requests").select("*").eq("company_id", id!).order("created_at", { ascending: false }),
    ]).then(([c, o, r]) => {
      setCompany(c.data);
      setOrders(o.data ?? []);
      setRepairs(r.data ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <AdminGuard><AdminLayout><div className="p-8 text-zinc-400">Chargement...</div></AdminLayout></AdminGuard>;
  if (!company) return <AdminGuard><AdminLayout><div className="p-8 text-zinc-400">Client introuvable.</div></AdminLayout></AdminGuard>;

  const totalCA = orders.reduce((s, o) => s + (o.quote_amount ?? 0), 0);
  const activeOrders = orders.filter((o) => !["livree", "annulee"].includes(o.status));
  const activeRepairs = repairs.filter((r) => !["terminee", "annulee"].includes(r.status));

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-8 max-w-5xl">
          <Link href="/espace-manager/clients" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour aux clients
          </Link>

          {/* Header */}
          <div className="flex items-start gap-5 mb-6">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-zinc-900">{company.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {company.city && (
                  <span className="text-sm text-zinc-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />{[company.address, company.city, company.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {company.phone && (
                  <span className="text-sm text-zinc-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />{company.phone}
                  </span>
                )}
                {company.email && (
                  <span className="text-sm text-zinc-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />{company.email}
                  </span>
                )}
              </div>
              {(company.rc || company.ice) && (
                <p className="text-xs text-zinc-400 font-mono mt-1.5">
                  {company.rc ? `RC: ${company.rc}` : ""}{company.rc && company.ice ? " · " : ""}{company.ice ? `ICE: ${company.ice}` : ""}
                </p>
              )}
            </div>
            <p className="text-xs text-zinc-400 shrink-0">Client depuis {new Date(company.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { icon: ShoppingCart, label: "Commandes totales", value: orders.length, color: "text-blue-600 bg-blue-50" },
              { icon: ShoppingCart, label: "Commandes actives", value: activeOrders.length, color: "text-indigo-600 bg-indigo-50" },
              { icon: Wrench, label: "Réparations", value: repairs.length, color: "text-orange-600 bg-orange-50" },
              { icon: TrendingUp, label: "CA total (MAD)", value: totalCA > 0 ? totalCA.toLocaleString("fr-FR") : "—", color: "text-emerald-600 bg-emerald-50" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-zinc-100 p-5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-zinc-900 truncate">{value}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Commandes */}
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden mb-5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <h2 className="font-bold text-zinc-900 text-sm">Commandes ({orders.length})</h2>
              </div>
              {activeOrders.length > 0 && (
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{activeOrders.length} actives</span>
              )}
            </div>
            {orders.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-400">Aucune commande</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-50 bg-zinc-50/50">
                    <th className="text-left px-5 py-2.5 text-xs font-bold text-zinc-400">Référence</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-zinc-400">Date</th>
                    <th className="text-right px-4 py-2.5 text-xs font-bold text-zinc-400">Montant</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-zinc-400">Statut</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3 font-bold text-zinc-900">{o.reference}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-700">{o.quote_amount ? `${o.quote_amount.toLocaleString("fr-FR")} MAD` : "—"}</td>
                      <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                      <td className="px-4 py-3">
                        <Link href={`/espace-manager/commandes/${o.id}`} className="text-xs text-accent font-bold hover:underline">Voir →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {totalCA > 0 && (
                  <tfoot>
                    <tr className="border-t border-zinc-200 bg-zinc-50">
                      <td colSpan={2} className="px-5 py-3 text-xs font-bold text-zinc-500">Total facturé</td>
                      <td className="px-4 py-3 text-right font-black text-zinc-900">{totalCA.toLocaleString("fr-FR")} MAD</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>

          {/* Réparations */}
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-zinc-400" />
                <h2 className="font-bold text-zinc-900 text-sm">Réparations ({repairs.length})</h2>
              </div>
              {activeRepairs.length > 0 && (
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{activeRepairs.length} en cours</span>
              )}
            </div>
            {repairs.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-400">Aucune réparation</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-50 bg-zinc-50/50">
                    <th className="text-left px-5 py-2.5 text-xs font-bold text-zinc-400">Référence</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-zinc-400">Équipement</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-zinc-400">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-zinc-400">Statut</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {repairs.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900">{r.reference}</span>
                          {r.priority === "urgente" && (
                            <span className="text-[9px] font-black uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Urgent</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{r.equipment_type}{r.equipment_brand ? ` · ${r.equipment_brand}` : ""}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3"><RepairStatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">
                        <Link href={`/espace-manager/reparations/${r.id}`} className="text-xs text-accent font-bold hover:underline">Voir →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
