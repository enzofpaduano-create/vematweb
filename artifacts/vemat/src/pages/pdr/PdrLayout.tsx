import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutGrid, FileText, LogOut, Package, Plus } from "lucide-react";
import { usePdrAuth } from "@/contexts/PdrAuthContext";
import vematLogo from "@/assets/vemat-logo.png";

const NAV = [
  { href: "/espace-pdr/tableau", icon: LayoutGrid, label: "Dashboard" },
  { href: "/espace-pdr/documents", icon: FileText, label: "All documents" },
  { href: "/espace-pdr/devis/nouveau", icon: Plus, label: "New quote" },
];

export function PdrLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { signOut, user, loading } = usePdrAuth();

  useEffect(() => {
    if (!loading && !user) navigate("/espace-pdr/connexion");
  }, [loading, user, navigate]);

  if (!user) return null;

  const initials = (user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col fixed left-0 top-0 h-full z-40">
        <div className="px-5 py-5 border-b border-zinc-800">
          <img src={vematLogo} alt="Vemat" className="h-12 w-auto brightness-0 invert mb-4" />
          <div className="flex items-center gap-2">
            <Package className="w-3 h-3 text-sky-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-400">PDR Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = location === href || (href !== "/espace-pdr/tableau" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  active ? "bg-sky-500 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-black shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.email}</p>
              <p className="text-[10px] text-zinc-500">Spare parts</p>
            </div>
          </div>
          <button
            onClick={async () => { await signOut(); navigate("/espace-pdr/connexion"); }}
            className="w-full flex items-center gap-2 text-xs text-zinc-500 hover:text-red-400 transition-colors py-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60 bg-zinc-50 min-h-screen">{children}</main>
    </div>
  );
}
