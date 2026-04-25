import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, Filter, ChevronDown, Info } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ProductCatalog } from "./ProductCatalog";
import { productDetails } from "@/data/productDetails";
import { parseSpecValue, SPEC_KEYS } from "@/utils/specs";
import type { SubCategory, Model } from "@/data/products";
import { useLang } from "@/i18n/I18nProvider";

interface ProductBrowserProps {
  initialSubcategories: SubCategory[];
  categoryType: "nacelles" | "grues" | "elevateurs" | "construction";
}

export function ProductBrowser({ initialSubcategories, categoryType }: ProductBrowserProps) {
  const { lang, t } = useLang();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [minHeight, setMinHeight] = useState<number>(0);
  const [maxHeight, setMaxHeight] = useState<number>(100);
  const [minCapacity, setMinCapacity] = useState<number>(0);
  
  const filteredSubcategories = useMemo(() => {
    return initialSubcategories.map(sub => {
      const filteredModels = sub.models.filter(model => {
        // 1. Search Filter
        const matchesSearch = model.name.toLowerCase().includes(search.toLowerCase()) || 
                              model.brand.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        // 2. Technical Filters (if slug exists)
        if (model.slug && productDetails[model.slug]) {
          const details = productDetails[model.slug];
          const specs = details.specifications;

          // Height Check
          if (minHeight > 0) {
            const heightKey = SPEC_KEYS.HEIGHT.find(k => specs[k]);
            if (!heightKey) return false; // Hide if no height spec but filter active
            const raw = specs[heightKey];
            const val = parseSpecValue(typeof raw === "string" ? raw : raw?.fr);
            if (val === null || val < minHeight) return false;
          }

          // Capacity Check
          if (minCapacity > 0) {
            const capKey = SPEC_KEYS.CAPACITY.find(k => specs[k]);
            if (!capKey) return false; // Hide if no capacity spec but filter active
            const raw = specs[capKey];
            const val = parseSpecValue(typeof raw === "string" ? raw : raw?.fr);
            if (val === null || val < minCapacity) return false;
          }
        } else if (minHeight > 0 || minCapacity > 0) {
          // If filtering but no technical details available for this model slug
          return false;
        }

        return true;
      });

      return {
        ...sub,
        models: filteredModels,
        totalCount: filteredModels.length
      };
    }).filter(sub => sub.models.length > 0);
  }, [initialSubcategories, search, minHeight, minCapacity]);

  const hasActiveFilters = search || minHeight > 0 || minCapacity > 0;

  const resetFilters = () => {
    setSearch("");
    setMinHeight(0);
    setMinCapacity(0);
  };

  const maxH = categoryType === 'grues' ? 200 : 60;
  const maxC = categoryType === 'grues' ? 10000 : 2000;

  return (
    <div className="space-y-8">
      {/* Search & Toggle */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-zinc-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input 
            placeholder="Rechercher..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 md:h-14 bg-zinc-50 border-transparent rounded-xl md:rounded-2xl focus:bg-white focus:ring-accent transition-all"
          />
        </div>
        <Button 
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? "default" : "outline"}
          className={`w-full md:w-auto h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl gap-3 font-bold uppercase tracking-widest text-[9px] md:text-[10px] transition-all ${showFilters ? 'bg-zinc-950 text-white' : 'border-zinc-200'}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres Techniques
          {hasActiveFilters && !showFilters && (
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          )}
        </Button>
      </div>

      {/* Advanced Filters Drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 p-6 md:p-12 mb-8 md:mb-12 shadow-soft">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                {/* Height Filter */}
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block">
                    {categoryType === 'grues' ? 'Hauteur de levage' : 'Hauteur de travail'} (min)
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max={maxH} 
                      step="1"
                      value={minHeight}
                      onChange={(e) => setMinHeight(Number(e.target.value))}
                      className="flex-1 accent-accent"
                    />
                    <span className="w-16 h-10 flex items-center justify-center bg-zinc-50 rounded-xl font-bold text-sm">
                      {minHeight}m
                    </span>
                  </div>
                </div>

                {/* Capacity Filter */}
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block">
                    Capacité (min)
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max={maxC} 
                      step={categoryType === 'grues' ? 100 : 50}
                      value={minCapacity}
                      onChange={(e) => setMinCapacity(Number(e.target.value))}
                      className="flex-1 accent-accent"
                    />
                    <span className="w-16 h-10 flex items-center justify-center bg-zinc-50 rounded-xl font-bold text-sm">
                      {minCapacity}{categoryType === 'grues' ? 'kg' : 'kg'}
                    </span>
                  </div>
                </div>

                {/* Info / Action */}
                <div className="flex flex-col justify-end gap-4">
                  <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                    <Info className="h-3 w-3 inline mr-1" />
                    Les filtres s'appliquent sur les spécifications techniques officielles des constructeurs.
                  </p>
                  <Button 
                    onClick={resetFilters}
                    variant="ghost" 
                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Réinitialiser tout
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {filteredSubcategories.length > 0 ? (
        <ProductCatalog subcategories={filteredSubcategories} />
      ) : (
        <div className="py-24 text-center bg-white rounded-[3rem] border border-zinc-100">
          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Filter className="h-8 w-8 text-zinc-300" />
          </div>
          <h3 className="text-2xl font-heading font-bold text-zinc-950 mb-2 uppercase">Aucun résultat</h3>
          <p className="text-zinc-500 mb-8">Essayez de modifier vos critères de recherche ou vos filtres.</p>
          <Button onClick={resetFilters} className="bg-accent text-white rounded-xl px-8 h-12">
            Voir tout le catalogue
          </Button>
        </div>
      )}
    </div>
  );
}
