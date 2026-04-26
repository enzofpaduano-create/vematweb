import { Link } from "wouter";
import { ShoppingCart, Settings, Wrench, ArrowRight, Lock, UserPlus, TrendingUp, Briefcase } from "lucide-react";
import vematLogo from "@/assets/vemat-logo.png";

const PORTALS = [
  {
    href: "/espace-client/connexion",
    registerHref: "/espace-client/inscription",
    icon: ShoppingCart,
    label: "Espace Client",
    desc: "Suivez vos commandes, réparations et chantiers",
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/30 hover:border-blue-400/60",
    iconBg: "bg-blue-500/20 text-blue-400",
    badge: null,
    canRegister: true,
    registerLabel: "Créer un compte",
  },
  {
    href: "/espace-manager/connexion",
    registerHref: null,
    icon: Settings,
    label: "Espace Manager",
    desc: "Gérez les demandes, le planning et les techniciens",
    color: "from-accent/20 to-accent/5",
    border: "border-accent/30 hover:border-accent/60",
    iconBg: "bg-accent/20 text-accent",
    badge: "Personnel Vemat",
    canRegister: false,
    registerLabel: null,
  },
  {
    href: "/espace-technicien/connexion",
    registerHref: null,
    icon: Wrench,
    label: "Espace Technicien",
    desc: "Consultez vos missions et gérez vos interventions",
    color: "from-orange-500/20 to-orange-600/5",
    border: "border-orange-500/30 hover:border-orange-400/60",
    iconBg: "bg-orange-500/20 text-orange-400",
    badge: "Personnel Vemat",
    canRegister: false,
    registerLabel: null,
  },
  {
    href: "/direction/connexion",
    registerHref: null,
    icon: TrendingUp,
    label: "Espace Direction",
    desc: "Supervision globale, planning et validation des rapports",
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/30 hover:border-purple-400/60",
    iconBg: "bg-purple-500/20 text-purple-400",
    badge: "Direction",
    canRegister: false,
    registerLabel: null,
  },
  {
    href: "/espace-commercial/connexion",
    registerHref: null,
    icon: Briefcase,
    label: "Espace Commercial",
    desc: "Planning, ventes machines et comptes-rendus clients",
    color: "from-sky-500/20 to-sky-600/5",
    border: "border-sky-500/30 hover:border-sky-400/60",
    iconBg: "bg-sky-500/20 text-sky-400",
    badge: "Personnel Vemat",
    canRegister: false,
    registerLabel: null,
  },
];

export default function EspaceVemat() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <div className="text-center mb-14">
        <img src={vematLogo} alt="Vemat Group" className="h-9 brightness-0 invert mx-auto mb-6" />
        <h1 className="text-3xl font-black text-white">Portail Vemat</h1>
        <p className="text-zinc-500 mt-2">Choisissez votre espace de connexion</p>
      </div>

      {/* Portal cards */}
      <div className="grid grid-cols-1 gap-5 w-full max-w-6xl sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PORTALS.map(({ href, registerHref, icon: Icon, label, desc, color, border, iconBg, badge, canRegister, registerLabel }) => (
          <div
            key={label}
            className={`relative bg-gradient-to-br ${color} border ${border} rounded-2xl p-6 flex flex-col transition-all duration-200`}
          >
            {badge && (
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">
                <Lock className="w-3 h-3" />{badge}
              </div>
            )}
            {!badge && <div className="mb-4 h-[22px]" />}

            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
              <Icon className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-black text-white mb-6">{label}</h2>

            <div className="space-y-2 mt-auto">
              <Link href={href}>
                <div className="flex items-center justify-between bg-white/10 hover:bg-white/15 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer">
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
              {canRegister && registerHref && (
                <Link href={registerHref}>
                  <div className="flex items-center justify-center gap-2 text-zinc-400 hover:text-white text-xs font-semibold py-2 transition-colors cursor-pointer">
                    <UserPlus className="w-3.5 h-3.5" />
                    {registerLabel}
                  </div>
                </Link>
              )}
              {!canRegister && (
                <p className="text-center text-[11px] text-zinc-700 py-1">
                  Accès sur invitation uniquement
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-zinc-700 text-xs mt-12">© {new Date().getFullYear()} Vemat Group · Tous droits réservés</p>
    </div>
  );
}
