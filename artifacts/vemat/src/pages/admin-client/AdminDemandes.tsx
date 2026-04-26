import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  FileText, Wrench, Search, ChevronDown, ChevronRight, Clock, CheckCircle2,
  ArrowRight, RefreshCw, Phone, Mail, MapPin, Calendar, Hash, Building2,
} from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { AdminGuard } from "./AdminGuard";
import { supabaseAdmin } from "@/lib/supabase";
import type { PublicDevisRequest, PublicInterventionRequest, FormDevisStatus, FormInterventionStatus, InterventionUrgency } from "@/lib/database.types";

type Tab = "devis" | "interventions";

// ── Status helpers ────────────────────────────────────────────────────────────
const DEVIS_STATUS: Record<FormDevisStatus, { label: string; color: string }> = {
  nouveau: { label: "Nouveau", color: "bg-sky-100 text-sky-700" },
  traite: { label: "Traité", color: "bg-zinc-100 text-zinc-600" },
  converti: { label: "Converti", color: "bg-emerald-100 text-emerald-700" },
};

const INTERV_STATUS: Record<FormInterventionStatus, { label: string; color: string }> = {
  nouveau: { label: "Nouveau", color: "bg-orange-100 text-orange-700" },
  traite: { label: "Traité", color: "bg-zinc-100 text-zinc-600" },
  cree: { label: "Réparation créée", color: "bg-emerald-100 text-emerald-700" },
};

const URGENCY_LABELS: Record<InterventionUrgency, { label: string; color: string }> = {
  normale: { label: "Normale", color: "bg-zinc-100 text-zinc-600" },
  urgente: { label: "Urgente", color: "bg-amber-100 text-amber-700" },
  tres_urgente: { label: "Très urgente", color: "bg-red-100 text-red-700" },
};

// ── Row: Devis ────────────────────────────────────────────────────────────────
function DevisRow({ item, onMarkDone }: {
  item: PublicDevisRequest;
  onMarkDone: (id: string, status: FormDevisStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const s = DEVIS_STATUS[item.status];

  return (
    <div className={`border-b border-zinc-100 last:border-0 transition-colors ${item.status === "nouveau" ? "bg-sky-50/40" : "bg-white"}`}>
      {/* Header row */}
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-zinc-800">{item.reference}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
          </div>
          <p className="text-sm text-zinc-600 mt-0.5 truncate">
            <span className="font-semibold">{item.company_name}</span>
            {item.contact_name && <span className="text-zinc-400"> · {item.contact_name}</span>}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          {item.product_brand && (
            <p className="text-xs text-zinc-500">{item.product_brand} {item.product_model && `· ${item.product_model}`}</p>
          )}
          <p className="text-xs text-zinc-400">
            {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />}
      </button>

      {/* Expanded details */}
      {open && (
        <div className="px-5 pb-5 bg-zinc-50 border-t border-zinc-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {/* Contact */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contact</p>
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />{item.company_name}
              </div>
              {item.contact_name && (
                <div className="flex items-center gap-2 text-sm text-zinc-700">
                  <Hash className="w-3.5 h-3.5 text-zinc-400 shrink-0" />{item.contact_name}
                </div>
              )}
              {item.contact_phone && (
                <a href={`tel:${item.contact_phone}`} className="flex items-center gap-2 text-sm text-sky-600 hover:underline">
                  <Phone className="w-3.5 h-3.5 shrink-0" />{item.contact_phone}
                </a>
              )}
              {item.contact_email && (
                <a href={`mailto:${item.contact_email}`} className="flex items-center gap-2 text-sm text-sky-600 hover:underline">
                  <Mail className="w-3.5 h-3.5 shrink-0" />{item.contact_email}
                </a>
              )}
            </div>

            {/* Machine */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Machine</p>
              {item.product_category && (
                <div className="text-sm text-zinc-700">{item.product_category}</div>
              )}
              {item.product_brand && (
                <div className="text-sm font-semibold text-zinc-800">{item.product_brand}</div>
              )}
              {item.product_model && (
                <div className="text-sm text-zinc-700">Modèle : {item.product_model}</div>
              )}
              <div className="text-sm text-zinc-700">Quantité : <span className="font-bold">{item.quantity}</span></div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Détails</p>
              {item.location && (
                <div className="flex items-center gap-2 text-sm text-zinc-700">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />{item.location}
                </div>
              )}
              {item.desired_date && (
                <div className="flex items-center gap-2 text-sm text-zinc-700">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  {new Date(item.desired_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              )}
              {item.notes && (
                <p className="text-sm text-zinc-600 italic">{item.notes}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-zinc-200">
            {item.status === "nouveau" && (
              <button
                onClick={() => onMarkDone(item.id, "traite")}
                className="flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />Marquer traité
              </button>
            )}
            <button
              onClick={() => setLocation("/espace-manager/commandes")}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent/80 text-accent-foreground text-xs font-bold px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />Créer une commande
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Row: Intervention ─────────────────────────────────────────────────────────
function InterventionRow({ item, onMarkDone }: {
  item: PublicInterventionRequest;
  onMarkDone: (id: string, status: FormInterventionStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const s = INTERV_STATUS[item.status];
  const u = URGENCY_LABELS[item.urgency];

  return (
    <div className={`border-b border-zinc-100 last:border-0 transition-colors ${item.status === "nouveau" ? "bg-orange-50/40" : "bg-white"}`}>
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-zinc-800">{item.reference}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${u.color}`}>{u.label}</span>
          </div>
          <p className="text-sm text-zinc-600 mt-0.5 truncate">
            <span className="font-semibold">{item.company_name}</span>
            {item.machine_type && <span className="text-zinc-400"> · {item.machine_type}</span>}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          {item.location && <p className="text-xs text-zinc-500">{item.location}</p>}
          <p className="text-xs text-zinc-400">
            {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-5 bg-zinc-50 border-t border-zinc-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {/* Contact */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contact</p>
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />{item.company_name}
              </div>
              {item.contact_name && (
                <div className="flex items-center gap-2 text-sm text-zinc-700">
                  <Hash className="w-3.5 h-3.5 text-zinc-400 shrink-0" />{item.contact_name}
                </div>
              )}
              {item.contact_phone && (
                <a href={`tel:${item.contact_phone}`} className="flex items-center gap-2 text-sm text-sky-600 hover:underline">
                  <Phone className="w-3.5 h-3.5 shrink-0" />{item.contact_phone}
                </a>
              )}
              {item.contact_email && (
                <a href={`mailto:${item.contact_email}`} className="flex items-center gap-2 text-sm text-sky-600 hover:underline">
                  <Mail className="w-3.5 h-3.5 shrink-0" />{item.contact_email}
                </a>
              )}
            </div>

            {/* Machine */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Machine</p>
              <div className="text-sm font-semibold text-zinc-800">{item.machine_type}</div>
              {item.machine_brand && <div className="text-sm text-zinc-700">Marque : {item.machine_brand}</div>}
              {item.machine_model && <div className="text-sm text-zinc-700">Modèle : {item.machine_model}</div>}
              {item.machine_serial && <div className="text-sm text-zinc-700">N° série : {item.machine_serial}</div>}
            </div>

            {/* Intervention */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Intervention</p>
              {item.location && (
                <div className="flex items-start gap-2 text-sm text-zinc-700">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />{item.location}
                </div>
              )}
              {item.problem_description && (
                <p className="text-sm text-zinc-600">{item.problem_description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-zinc-200">
            {item.status === "nouveau" && (
              <button
                onClick={() => onMarkDone(item.id, "traite")}
                className="flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />Marquer traité
              </button>
            )}
            <button
              onClick={() => setLocation("/espace-manager/reparations")}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />Créer une réparation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminDemandes() {
  const [tab, setTab] = useState<Tab>("devis");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FormDevisStatus | FormInterventionStatus | "all">("nouveau");
  const [devisItems, setDevisItems] = useState<PublicDevisRequest[]>([]);
  const [interventionItems, setInterventionItems] = useState<PublicInterventionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDevisCount, setNewDevisCount] = useState(0);
  const [newIntervCount, setNewIntervCount] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [devisRes, intervRes] = await Promise.all([
      supabaseAdmin.from("form_devis").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("form_interventions").select("*").order("created_at", { ascending: false }),
    ]);
    const d = (devisRes.data ?? []) as PublicDevisRequest[];
    const i = (intervRes.data ?? []) as PublicInterventionRequest[];
    setDevisItems(d);
    setInterventionItems(i);
    setNewDevisCount(d.filter((x) => x.status === "nouveau").length);
    setNewIntervCount(i.filter((x) => x.status === "nouveau").length);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time subscription
  useEffect(() => {
    const ch1 = supabaseAdmin.channel("form-devis-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "form_devis" }, loadData)
      .subscribe();
    const ch2 = supabaseAdmin.channel("form-interventions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "form_interventions" }, loadData)
      .subscribe();
    return () => { supabaseAdmin.removeChannel(ch1); supabaseAdmin.removeChannel(ch2); };
  }, [loadData]);

  async function markDevisDone(id: string, status: FormDevisStatus) {
    await supabaseAdmin.from("form_devis").update({ status }).eq("id", id);
    setDevisItems((prev) => prev.map((x) => x.id === id ? { ...x, status } : x));
    setNewDevisCount((c) => status === "nouveau" ? c + 1 : Math.max(0, c - 1));
  }

  async function markIntervDone(id: string, status: FormInterventionStatus) {
    await supabaseAdmin.from("form_interventions").update({ status }).eq("id", id);
    setInterventionItems((prev) => prev.map((x) => x.id === id ? { ...x, status } : x));
    setNewIntervCount((c) => status === "nouveau" ? c + 1 : Math.max(0, c - 1));
  }

  const q = search.toLowerCase().trim();

  const filteredDevis = devisItems.filter((d) => {
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const matchSearch = !q || [d.reference, d.company_name, d.contact_name, d.contact_email, d.product_model].some(
      (v) => v?.toLowerCase().includes(q)
    );
    return matchStatus && matchSearch;
  });

  const filteredInterv = interventionItems.filter((i) => {
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    const matchSearch = !q || [i.reference, i.company_name, i.contact_name, i.contact_email, i.machine_type, i.machine_model].some(
      (v) => v?.toLowerCase().includes(q)
    );
    return matchStatus && matchSearch;
  });

  const devisStatusFilters = [
    { value: "all", label: "Toutes" },
    { value: "nouveau", label: "Nouveaux" },
    { value: "traite", label: "Traités" },
    { value: "converti", label: "Convertis" },
  ];
  const intervStatusFilters = [
    { value: "all", label: "Toutes" },
    { value: "nouveau", label: "Nouvelles" },
    { value: "traite", label: "Traitées" },
    { value: "cree", label: "Réparation créée" },
  ];

  const currentFilters = tab === "devis" ? devisStatusFilters : intervStatusFilters;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-black text-zinc-900">Demandes entrantes</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Formulaires soumis depuis le site public</p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => { setTab("devis"); setStatusFilter("nouveau"); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === "devis"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <FileText className="w-4 h-4" />
              Devis
              {newDevisCount > 0 && (
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  tab === "devis" ? "bg-white/20 text-white" : "bg-sky-100 text-sky-700"
                }`}>
                  {newDevisCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setTab("interventions"); setStatusFilter("nouveau"); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === "interventions"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              <Wrench className="w-4 h-4" />
              Interventions
              {newIntervCount > 0 && (
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  tab === "interventions" ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                }`}>
                  {newIntervCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par référence, société, contact…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
              />
            </div>
            <div className="flex gap-1.5">
              {currentFilters.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value as FormDevisStatus | FormInterventionStatus | "all")}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                    statusFilter === value
                      ? "bg-zinc-900 text-white"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-zinc-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm">Chargement…</span>
              </div>
            ) : tab === "devis" ? (
              filteredDevis.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="w-10 h-10 text-zinc-200 mb-3" />
                  <p className="text-sm font-bold text-zinc-400">Aucune demande de devis</p>
                  <p className="text-xs text-zinc-300 mt-1">
                    {statusFilter !== "all" ? "Essayez de changer le filtre." : "Les formulaires soumis apparaîtront ici."}
                  </p>
                </div>
              ) : (
                filteredDevis.map((item) => (
                  <DevisRow key={item.id} item={item} onMarkDone={markDevisDone} />
                ))
              )
            ) : (
              filteredInterv.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Wrench className="w-10 h-10 text-zinc-200 mb-3" />
                  <p className="text-sm font-bold text-zinc-400">Aucune demande d'intervention</p>
                  <p className="text-xs text-zinc-300 mt-1">
                    {statusFilter !== "all" ? "Essayez de changer le filtre." : "Les formulaires soumis apparaîtront ici."}
                  </p>
                </div>
              ) : (
                filteredInterv.map((item) => (
                  <InterventionRow key={item.id} item={item} onMarkDone={markIntervDone} />
                ))
              )
            )}
          </div>

          {/* Count footer */}
          {!loading && (
            <p className="text-xs text-zinc-400 text-right mt-2">
              {tab === "devis"
                ? `${filteredDevis.length} demande${filteredDevis.length !== 1 ? "s" : ""} affichée${filteredDevis.length !== 1 ? "s" : ""}`
                : `${filteredInterv.length} demande${filteredInterv.length !== 1 ? "s" : ""} affichée${filteredInterv.length !== 1 ? "s" : ""}`
              }
            </p>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
