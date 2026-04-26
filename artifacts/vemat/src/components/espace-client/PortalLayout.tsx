import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShoppingCart, Wrench, MapPin, User, LogOut, ChevronRight } from "lucide-react";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/lib/supabase";
import vematLogo from "@/assets/vemat-logo.png";

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { company, profile, signOut, loading, user } = useClientAuth();
  const [devisBadge, setDevisBadge] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/espace-client/connexion");
    }
  }, [loading, user]);

  useEffect(() => {
    if (!company) return;
    supabase
      .from("devis_requests")
      .select("id", { count: "exact" })
      .eq("company_id", company.id)
      .eq("status", "devis_envoye")
      .not("quote_amount", "is", null)
      .then(({ count }) => setDevisBadge(count ?? 0));
  }, [company]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const NAV = [
    { href: "/espace-client/dashboard", icon: LayoutDashboard, label: "Tableau de bord", badge: 0 },
    { href: "/espace-client/commandes", icon: ShoppingCart, label: "Mes commandes", badge: devisBadge },
    { href: "/espace-client/reparations", icon: Wrench, label: "Réparations", badge: 0 },
    { href: "/espace-client/chantiers", icon: MapPin, label: "Mes chantiers", badge: 0 },
    { href: "/espace-client/profil", icon: User, label: "Mon profil", badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-100 flex flex-col fixed left-0 top-0 h-full z-40 shrink-0">
        <div className="px-6 py-5 border-b border-zinc-100">
          <Link href="/">
            <img src={vematLogo} alt="Vemat" className="h-7 brightness-0" />
          </Link>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 mt-3">Espace Client</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label, badge }) => {
            const active = location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="bg-purple-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                    {badge}
                  </span>
                )}
                {active && badge === 0 && <ChevronRight className="h-3.5 w-3.5" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-100 p-4">
          <div className="mb-3">
            <p className="text-xs font-bold text-zinc-900 truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-[11px] text-zinc-400 truncate">{company?.name ?? "—"}</p>
          </div>
          <button
            onClick={async () => { await signOut(); navigate("/espace-client/connexion"); }}
            className="w-full flex items-center gap-2 text-xs text-zinc-500 hover:text-red-500 transition-colors py-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
