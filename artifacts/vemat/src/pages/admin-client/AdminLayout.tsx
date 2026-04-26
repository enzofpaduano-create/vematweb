import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShoppingCart, Wrench, Users, Hammer, LogOut, CalendarDays, Bell, Search, X, FileText, Building2, Inbox } from "lucide-react";
import { useManagerAuth } from "@/contexts/ManagerAuthContext";
import { supabaseAdmin } from "@/lib/supabase";
import vematLogo from "@/assets/vemat-logo.png";
import type { Notification } from "@/lib/database.types";

const NAV = [
  { href: "/espace-manager/dashboard", icon: LayoutDashboard, label: "Tableau de bord", exact: true },
  { href: "/espace-manager/calendrier", icon: CalendarDays, label: "Calendrier", exact: false },
  { href: "/espace-manager/commandes", icon: ShoppingCart, label: "Commandes", exact: false },
  { href: "/espace-manager/reparations", icon: Wrench, label: "Réparations", exact: false },
  { href: "/espace-manager/techniciens", icon: Hammer, label: "Techniciens", exact: false },
  { href: "/espace-manager/clients", icon: Users, label: "Clients", exact: false },
  { href: "/espace-manager/demandes", icon: Inbox, label: "Demandes entrantes", exact: false },
];

type SearchResult = {
  type: "commande" | "reparation" | "client";
  id: string;
  label: string;
  sub: string;
  href: string;
};

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); }
    else setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const [orders, repairs, companies] = await Promise.all([
        supabaseAdmin.from("devis_requests").select("id, reference, status, companies(name)").ilike("reference", `%${q}%`).limit(4),
        supabaseAdmin.from("repair_requests").select("id, reference, status, equipment_type, companies(name)").or(`reference.ilike.%${q}%,equipment_type.ilike.%${q}%`).limit(4),
        supabaseAdmin.from("companies").select("id, name, city").ilike("name", `%${q}%`).limit(4),
      ]);

      const res: SearchResult[] = [
        ...(orders.data ?? []).map((o: { id: string; reference: string; status: string; companies?: { name: string } | null }) => ({
          type: "commande" as const,
          id: o.id, label: o.reference,
          sub: (o.companies as { name: string } | null)?.name ?? o.status,
          href: `/espace-manager/commandes/${o.id}`,
        })),
        ...(repairs.data ?? []).map((r: { id: string; reference: string; equipment_type: string; companies?: { name: string } | null }) => ({
          type: "reparation" as const,
          id: r.id, label: r.reference,
          sub: `${r.equipment_type}${(r.companies as { name: string } | null)?.name ? " · " + (r.companies as { name: string }).name : ""}`,
          href: `/espace-manager/reparations/${r.id}`,
        })),
        ...(companies.data ?? []).map((c: { id: string; name: string; city?: string | null }) => ({
          type: "client" as const,
          id: c.id, label: c.name,
          sub: c.city ?? "",
          href: `/espace-manager/clients/${c.id}`,
        })),
      ];
      setResults(res);
      setSearching(false);
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const navigate = (href: string) => {
    setOpen(false);
    setLocation(href);
  };

  const typeIcon = (type: SearchResult["type"]) => {
    if (type === "commande") return <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />;
    if (type === "reparation") return <Wrench className="w-3.5 h-3.5 text-orange-500" />;
    return <Building2 className="w-3.5 h-3.5 text-zinc-400" />;
  };
  const typeLabel = (type: SearchResult["type"]) => ({ commande: "Commande", reparation: "Réparation", client: "Client" }[type]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors py-1.5 px-2 rounded-lg hover:bg-zinc-800 mb-1"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Rechercher…</span>
        <span className="text-[10px] font-mono bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700">⌘K</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-24 px-4" onClick={() => setOpen(false)}>
          <div ref={containerRef} className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une commande, réparation, client…"
                className="flex-1 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-zinc-300 hover:text-zinc-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-xs text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded px-1.5 py-0.5 font-mono transition-colors">Esc</button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {query.length < 2 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-400">Tapez au moins 2 caractères pour rechercher</div>
              ) : searching ? (
                <div className="divide-y divide-zinc-50">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-6 h-6 bg-zinc-100 rounded animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-24 bg-zinc-100 rounded animate-pulse" />
                        <div className="h-3 w-36 bg-zinc-100 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-400">Aucun résultat pour « {query} »</div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {results.map((r) => (
                    <button key={r.id} onClick={() => navigate(r.href)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                        {typeIcon(r.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">{r.label}</p>
                        {r.sub && <p className="text-xs text-zinc-400 truncate">{r.sub}</p>}
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full shrink-0">{typeLabel(r.type)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div className="px-4 py-2 border-t border-zinc-100 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <FileText className="w-3 h-3 text-blue-400" />{results.filter((r) => r.type === "commande").length} commande{results.filter((r) => r.type === "commande").length !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <Wrench className="w-3 h-3 text-orange-400" />{results.filter((r) => r.type === "reparation").length} réparation{results.filter((r) => r.type === "reparation").length !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <Building2 className="w-3 h-3 text-zinc-400" />{results.filter((r) => r.type === "client").length} client{results.filter((r) => r.type === "client").length !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { profile, signOut } = useManagerAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [newFormsCount, setNewFormsCount] = useState(0);

  useEffect(() => {
    async function fetchNewForms() {
      const [d, i] = await Promise.all([
        supabaseAdmin.from("form_devis").select("id", { count: "exact", head: true }).eq("status", "nouveau"),
        supabaseAdmin.from("form_interventions").select("id", { count: "exact", head: true }).eq("status", "nouveau"),
      ]);
      setNewFormsCount((d.count ?? 0) + (i.count ?? 0));
    }
    fetchNewForms();

    const ch1 = supabaseAdmin.channel("layout-form-devis")
      .on("postgres_changes", { event: "*", schema: "public", table: "form_devis" }, fetchNewForms)
      .subscribe();
    const ch2 = supabaseAdmin.channel("layout-form-interventions")
      .on("postgres_changes", { event: "*", schema: "public", table: "form_interventions" }, fetchNewForms)
      .subscribe();
    return () => { supabaseAdmin.removeChannel(ch1); supabaseAdmin.removeChannel(ch2); };
  }, []);

  useEffect(() => {
    supabaseAdmin.from("notifications").select("*").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setNotifications(data ?? []));

    const channel = supabaseAdmin.channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabaseAdmin.removeChannel(channel); };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    await supabaseAdmin.from("notifications").update({ read: true }).in("id", ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneRead = async (n: Notification) => {
    if (n.read) return;
    await supabaseAdmin.from("notifications").update({ read: true }).eq("id", n.id);
    setNotifications((prev) => prev.map((notif) => notif.id === n.id ? { ...notif, read: true } : notif));
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col fixed left-0 top-0 h-full z-40">
        <div className="px-5 py-5 border-b border-zinc-800">
          <img src={vematLogo} alt="Vemat" className="h-6 brightness-0 invert mb-3" />
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Espace Manager</p>
        </div>

        <div className="px-2 pt-3 pb-1">
          <GlobalSearch />
        </div>

        <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? location === href : location.startsWith(href);
            const isDemandes = href === "/espace-manager/demandes";
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  active ? "bg-accent text-accent-foreground" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {isDemandes && newFormsCount > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    active ? "bg-white/20 text-white" : "bg-red-500 text-white"
                  }`}>
                    {newFormsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-4 space-y-3">
          <div className="relative">
            <button
              onClick={() => { setShowNotifs((v) => !v); if (showNotifs) markAllRead(); }}
              className="w-full flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors py-1.5 px-2 rounded-lg hover:bg-zinc-800"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-accent text-accent-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
                  <span className="text-xs font-bold text-zinc-300">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-zinc-500 hover:text-white transition-colors">Tout marquer lu</button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-zinc-500">Aucune notification</div>
                  ) : notifications.slice(0, 10).map((n) => (
                    <Link key={n.id} href={n.link ?? "#"}
                      onClick={() => { markOneRead(n); setShowNotifs(false); }}
                      className={`block px-3 py-2.5 hover:bg-zinc-700/50 transition-colors cursor-pointer ${n.read ? "opacity-50" : "bg-zinc-800/50"}`}>
                      {!n.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mb-1" />}
                      <p className="text-xs font-semibold text-zinc-200 leading-tight">{n.title}</p>
                      {n.message && <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-[9px] text-zinc-600 mt-1">
                        {new Date(n.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {profile && (
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-black shrink-0">
                {[profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join("") || "M"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{profile.first_name} {profile.last_name}</p>
                <p className="text-[10px] text-zinc-500">Manager</p>
              </div>
            </div>
          )}

          <button onClick={signOut}
            className="w-full flex items-center gap-2 text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1">
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60 bg-zinc-50 min-h-screen">{children}</main>
    </div>
  );
}
