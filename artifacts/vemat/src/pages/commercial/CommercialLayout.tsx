import { Link, useLocation } from "wouter";
import { LayoutDashboard, CalendarDays, FileText, TrendingUp, LogOut, Briefcase } from "lucide-react";
import { useCommercialAuth } from "@/contexts/CommercialAuthContext";
import { useLang } from "@/i18n/I18nProvider";
import vematLogo from "@/assets/vemat-logo.png";

const getNav = (t: (k: string) => string) => [
  { href: "/espace-commercial/dashboard", icon: LayoutDashboard, label: t("portal.commercial.nav.dashboard"), exact: true },
  { href: "/espace-commercial/calendrier", icon: CalendarDays, label: t("portal.commercial.nav.planning"), exact: false },
  { href: "/espace-commercial/reunions", icon: FileText, label: t("portal.commercial.nav.reports"), exact: false },
  { href: "/espace-commercial/ventes", icon: TrendingUp, label: t("portal.commercial.nav.sales"), exact: false },
];

export function CommercialLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { commercial, user, signOut, loading } = useCommercialAuth();
  const { lang, setLang, t } = useLang();
  const nav = getNav(t);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/espace-commercial/connexion");
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col fixed left-0 top-0 h-full z-40">
        <div className="px-5 py-5 border-b border-zinc-800">
          <img src={vematLogo} alt="Vemat" className="h-6 brightness-0 invert mb-3" />
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3 h-3 text-sky-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-400">{t("portal.commercial.title")}</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? location === href : location.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  active ? "bg-sky-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-4 space-y-3">
          {commercial && (
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                style={{ backgroundColor: commercial.color }}>
                {commercial.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{commercial.name}</p>
                <p className="text-[10px] text-sky-400">{commercial.title}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            className="w-full flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1"
          >
            <span className="text-sm">🌐</span>
            <span>{lang === "fr" ? "English" : "Français"}</span>
          </button>

          <button onClick={signOut}
            className="w-full flex items-center gap-2 text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1">
            <LogOut className="w-3.5 h-3.5" /> {t("portal.common.logout")}
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60 bg-zinc-950 min-h-screen">{children}</main>
    </div>
  );
}
