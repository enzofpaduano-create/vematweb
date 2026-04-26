import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Search, Building2, Phone, MapPin, ShoppingCart, Wrench, TrendingUp, ChevronRight } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { AdminGuard } from "./AdminGuard";
import { supabaseAdmin } from "@/lib/supabase";
import type { Company, DevisRequest, RepairRequest } from "@/lib/database.types";

type CompanyWithStats = Company & {
  ordersCount: number;
  ordersTotal: number;
  activeOrdersCount: number;
  repairsCount: number;
  activeRepairsCount: number;
};

export default function AdminClients() {
  const [clients, setClients] = useState<CompanyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      supabaseAdmin.from("companies").select("*").order("name"),
      supabaseAdmin.from("devis_requests").select("id, company_id, status, quote_amount"),
      supabaseAdmin.from("repair_requests").select("id, company_id, status"),
    ]).then(([companies, orders, repairs]) => {
      const orderData = (orders.data ?? []) as Pick<DevisRequest, "id" | "company_id" | "status" | "quote_amount">[];
      const repairData = (repairs.data ?? []) as Pick<RepairRequest, "id" | "company_id" | "status">[];

      const withStats: CompanyWithStats[] = (companies.data ?? []).map((c: Company) => {
        const co = orderData.filter((o) => o.company_id === c.id);
        const cr = repairData.filter((r) => r.company_id === c.id);
        return {
          ...c,
          ordersCount: co.length,
          ordersTotal: co.reduce((s, o) => s + (o.quote_amount ?? 0), 0),
          activeOrdersCount: co.filter((o) => !["livree", "annulee"].includes(o.status)).length,
          repairsCount: cr.length,
          activeRepairsCount: cr.filter((r) => !["terminee", "annulee"].includes(r.status)).length,
        };
      });

      setClients(withStats);
      setLoading(false);
    });
  }, []);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = clients.reduce((s, c) => s + c.ordersTotal, 0);

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-zinc-900">Clients</h1>
              <p className="text-sm text-zinc-500 mt-1">{clients.length} sociétés enregistrées</p>
            </div>
            {!loading && (
              <div className="flex items-center gap-1.5 bg-white border border-zinc-100 rounded-xl px-4 py-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-black text-zinc-900">{totalRevenue.toLocaleString("fr-FR")} MAD</span>
                <span className="text-xs text-zinc-400">total facturé</span>
              </div>
            )}
          </div>

          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client..."
              className="w-full pl-9 pr-3.5 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-accent max-w-sm" />
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-zinc-100 py-16 text-center text-zinc-400">Chargement...</div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">Société</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">Contact</th>
                    <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">Commandes</th>
                    <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">Réparations</th>
                    <th className="text-right px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">CA total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 text-sm">{c.name}</p>
                            {c.city && (
                              <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />{c.city}{c.country ? `, ${c.country}` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {c.phone && <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Phone className="w-3 h-3 shrink-0" />{c.phone}</p>}
                        {c.email && <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-40">{c.email}</p>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <ShoppingCart className="w-3.5 h-3.5 text-zinc-300" />
                          <span className="font-bold text-zinc-900">{c.ordersCount}</span>
                          {c.activeOrdersCount > 0 && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">{c.activeOrdersCount} actives</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-zinc-300" />
                          <span className="font-bold text-zinc-900">{c.repairsCount}</span>
                          {c.activeRepairsCount > 0 && (
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">{c.activeRepairsCount} en cours</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-black text-zinc-900">
                          {c.ordersTotal > 0 ? `${c.ordersTotal.toLocaleString("fr-FR")} MAD` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/espace-manager/clients/${c.id}`}
                          className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-accent transition-colors group-hover:text-accent">
                          Voir <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
