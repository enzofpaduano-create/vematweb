import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, AlertCircle, BookOpen, Search, X } from "lucide-react";
import { DGGuard } from "./DGGuard";
import { DGLayout } from "./DGLayout";
import { supabaseDG } from "@/lib/supabase";
import { useLang } from "@/i18n/I18nProvider";
import { listCatalogues, type CatalogueIndexEntry } from "@/lib/cataloguesApi";

export default function DGCatalogues() {
  const { lang } = useLang();
  const [machines, setMachines] = useState<CatalogueIndexEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    listCatalogues(supabaseDG)
      .then((res) => { if (!cancelled) setMachines(res.machines); })
      .catch((e: Error) => { if (!cancelled) setError(e.message || "Erreur"); });
    return () => { cancelled = true; };
  }, []);

  const sorted = useMemo(
    () => (machines ? [...machines].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" })) : []),
    [machines],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((m) =>
      m.label.toLowerCase().includes(q) ||
      m.slug.toLowerCase().includes(q) ||
      (m.brand || "").toLowerCase().includes(q),
    );
  }, [sorted, query]);

  const totalParts = machines?.reduce((s, m) => s + (m.partCount ?? 0), 0) ?? 0;
  const totalSchemas = machines?.reduce((s, m) => s + (m.schemaCount ?? 0), 0) ?? 0;

  return (
    <DGGuard>
      <DGLayout>
        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-purple-600 mb-2">
              {lang === "fr" ? "Catalogues techniques" : "Technical catalogs"}
            </p>
            <h1 className="text-3xl lg:text-4xl font-black text-zinc-950 mb-2">
              {lang === "fr" ? "Catalogues internes" : "Internal catalogs"}
            </h1>
            <p className="text-zinc-500 text-sm max-w-2xl">
              {lang === "fr"
                ? "Catalogues de pièces détachées Terex Crespellano — accessibles uniquement à la Direction, aux Managers et aux Techniciens."
                : "Terex Crespellano spare parts catalogues — restricted to Direction, Managers and Technicians."}
            </p>
            {machines !== null && machines.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs text-zinc-500">
                <span><b className="text-zinc-900">{machines.length}</b> {lang === "fr" ? "machines" : "machines"}</span>
                <span><b className="text-zinc-900">{totalParts.toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</b> {lang === "fr" ? "pièces référencées" : "parts referenced"}</span>
                <span><b className="text-zinc-900">{totalSchemas.toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</b> {lang === "fr" ? "schémas techniques" : "technical diagrams"}</span>
              </div>
            )}
          </div>

          {machines !== null && machines.length > 0 && (
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === "fr" ? "Rechercher une machine…" : "Search a machine…"}
                className="w-full pl-9 pr-9 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                  aria-label={lang === "fr" ? "Effacer" : "Clear"}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-red-700">{lang === "fr" ? "Erreur" : "Error"}</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {machines === null && !error && (
            <div className="text-zinc-400 text-sm py-20 text-center animate-pulse">
              {lang === "fr" ? "Chargement…" : "Loading…"}
            </div>
          )}

          {machines !== null && machines.length === 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center">
              <BookOpen className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
              <p className="font-bold text-zinc-700 mb-1">
                {lang === "fr" ? "Aucun catalogue pour l'instant" : "No catalogues yet"}
              </p>
              <p className="text-sm text-zinc-500">
                {lang === "fr"
                  ? "Les catalogues apparaîtront ici dès qu'ils seront scrapés et uploadés."
                  : "Catalogues will appear here once scraped and uploaded."}
              </p>
            </div>
          )}

          {machines !== null && machines.length > 0 && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center">
              <Search className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
              <p className="font-bold text-zinc-700 mb-1">
                {lang === "fr" ? "Aucun résultat" : "No results"}
              </p>
              <p className="text-sm text-zinc-500">
                {lang === "fr" ? `Rien ne correspond à « ${query} ».` : `Nothing matches "${query}".`}
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => (
                <Link
                  key={m.slug}
                  href={`/direction/catalogues/${encodeURIComponent(m.slug)}`}
                  className="group bg-white rounded-2xl border border-zinc-200 p-6 hover:border-purple-400 hover:shadow-soft transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
                        {m.brand || "Terex"}
                      </p>
                      <h3 className="text-xl font-black text-zinc-950 group-hover:text-purple-600 transition-colors">
                        {m.label}
                      </h3>
                    </div>
                    <ArrowRight className="h-5 w-5 text-zinc-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
                    {typeof m.nodeCount === "number" && (
                      <span>
                        {m.nodeCount} {lang === "fr" ? "sous-assemblages" : "sub-assemblies"}
                      </span>
                    )}
                    {typeof m.schemaCount === "number" && (
                      <span>
                        {m.schemaCount} {lang === "fr" ? "schémas" : "diagrams"}
                      </span>
                    )}
                    {typeof m.partCount === "number" && (
                      <span>
                        {m.partCount.toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}{" "}
                        {lang === "fr" ? "pièces" : "parts"}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DGLayout>
    </DGGuard>
  );
}
