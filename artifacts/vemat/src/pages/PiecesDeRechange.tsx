import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  X,
  Check,
  Package,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Layers,
  ExternalLink,
} from "lucide-react";
import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { useLang } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import jlgLogo from "@/assets/brands/jlg.png";
import terexLogo from "@/assets/brands/terex.png";
import vematLogo from "@/assets/vemat-logo.png";

// ─── Types — supplier catalogs ────────────────────────────────────────────────

interface CatalogProduct {
  sku: string;
  title: string;
  image: string | null;
  url: string;
}

interface CatalogSubcategory {
  name: string;
  slug: string;
  url: string;
}

interface CatalogCategory {
  name: string;
  slug: string;
  url: string;
  productCount: number;
  icon?: string;
  subcategories: CatalogSubcategory[];
  products: CatalogProduct[];
}

interface PartsCatalog {
  supplier: string;
  totalProducts: number;
  totalCategories: number;
  categories: CatalogCategory[];
}

// ─── Types — Vemat stock ──────────────────────────────────────────────────────

interface VematProduct {
  sku: string;
  title: string;
  image: string | null;
  quantity: number;
  unite: string;
  model: string;
}

interface VematFamily {
  code: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
  models: string[];
  products: VematProduct[];
}

interface VematCatalog {
  supplier: string;
  totalProducts: number;
  totalFamilies: number;
  families: VematFamily[];
}

// ─── Cart item ────────────────────────────────────────────────────────────────

interface CartItem {
  sku: string;
  title: string;
  brand: string;
  quantity: number;
}

// ─── Brand config ─────────────────────────────────────────────────────────────

const BRANDS = [
  {
    id: "JLG",
    label: "JLG Parts",
    logo: jlgLogo,
    darkLogo: false,
    catalogUrl: "/jlg-parts-catalog.json",
    description: { fr: "12 092 pièces d'origine · 723 catégories", en: "12,092 original parts · 723 categories" },
    siteLabel: "JLG.com",
  },
  {
    id: "Terex",
    label: "Terex Parts",
    logo: terexLogo,
    darkLogo: false,
    catalogUrl: "/terex-parts-catalog.json",
    description: { fr: "326 pièces d'origine · 17 catégories", en: "326 original parts · 17 categories" },
    siteLabel: "myparts.terex.com",
  },
];

const COMING_SOON = ["Tadano", "Magni", "Mecalac"];

// ─── Category icons fallback ──────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  filters: "🔧",
  "engine-parts": "⚙️",
  "accessories-options": "🔩",
  batteries: "🔋",
  "telehandler-attachments": "🏗️",
  "aftermarket-attachments": "🔗",
  "aftermarket-engine-parts": "🛠️",
  clearsky: "✨",
  "terex-utilities-auger-tooling": "🔩",
  "terex-utilities-bodies-cabs-running-gear": "🚛",
  "terex-utilities-booms-jibs-buckets": "🏗️",
  "terex-utilities-covers": "🛡️",
  "tu-deals": "🏷️",
  "terex-utilities-decals": "🎨",
  "terex-utilities-electrical-electronics": "⚡",
  "terex-utilities-engine-components": "⚙️",
  "terex-utilities-fabricated-components": "🔧",
  "terex-utilities-filters-fluids": "🧰",
  "terex-utilities-hardware": "🔩",
  "terex-utilities-hoses-tubes": "🔗",
  "terex-utilities-hydraulics": "💧",
  "terex-utilities-jacks-outriggers-ground-protection": "🦾",
  "terex-utilities-power-train": "⚙️",
  "terex-utilities-preventative-maintenance-parts": "🛠️",
  "terex-utilities-ropes-winches-hooks": "⚓",
};

// ─── Supplier ProductCard ─────────────────────────────────────────────────────

function ProductCard({
  product,
  brand,
  inCart,
  onAdd,
}: {
  product: CatalogProduct;
  brand: string;
  inCart: boolean;
  onAdd: (p: CatalogProduct) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] border border-zinc-100 overflow-hidden group hover:border-accent/30 hover:shadow-soft transition-all duration-300 flex flex-col"
    >
      <div className="h-40 bg-zinc-50 flex items-center justify-center overflow-hidden">
        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-300">
            <Package className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-1">{brand}</p>
        <h3 className="text-sm font-bold text-zinc-950 leading-snug mb-2 line-clamp-2 flex-1">
          {product.title}
        </h3>
        <p className="text-[10px] font-mono text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg inline-block mb-4">
          REF: {product.sku}
        </p>

        <div className="flex gap-2">
          <Button
            onClick={() => onAdd(product)}
            disabled={inCart}
            size="sm"
            className={`flex-1 h-10 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${
              inCart ? "bg-zinc-100 text-zinc-400" : "bg-zinc-950 text-white hover:bg-accent"
            }`}
          >
            {inCart ? (
              <span className="flex items-center gap-1.5">
                <Check className="h-3 w-3" /> Ajouté
              </span>
            ) : (
              "Devis"
            )}
          </Button>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:border-zinc-400 transition-colors"
            title={`Voir sur ${brand}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Vemat StockCard ──────────────────────────────────────────────────────────

function VematProductCard({
  product,
  inCart,
  onAdd,
  lang,
}: {
  product: VematProduct;
  inCart: boolean;
  onAdd: (p: VematProduct) => void;
  lang: "fr" | "en";
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] border border-zinc-100 overflow-hidden group hover:border-amber-400/40 hover:shadow-soft transition-all duration-300 flex flex-col"
    >
      <div className="h-40 bg-zinc-50 flex items-center justify-center overflow-hidden relative">
        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <img
            src={vematLogo}
            alt="Vemat"
            className="h-12 w-auto object-contain opacity-20"
          />
        )}
        {product.model && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-zinc-950/80 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
            {product.model}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-1">
          Stock Vemat
        </p>
        <h3 className="text-sm font-bold text-zinc-950 leading-snug mb-2 line-clamp-2 flex-1">
          {product.title}
        </h3>
        <p className="text-[10px] font-mono text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg inline-block mb-1">
          REF: {product.sku}
        </p>
        <p className="text-[10px] font-semibold text-green-600 mb-4">
          {lang === "fr" ? "En stock" : "In stock"} · {product.quantity} {product.unite}
        </p>

        <Button
          onClick={() => onAdd(product)}
          disabled={inCart}
          size="sm"
          className={`h-10 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${
            inCart ? "bg-zinc-100 text-zinc-400" : "bg-zinc-950 text-white hover:bg-amber-600"
          }`}
        >
          {inCart ? (
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3" /> Ajouté
            </span>
          ) : (
            lang === "fr" ? "Demander un devis" : "Request quote"
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PiecesDeRechange() {
  const { lang } = useLang();
  const { t } = useLang();
  useSEO(t("nav.pdr"), "Catalogue de pièces de rechange d'origine — Vemat Group.");
  useScrollTop();

  // ── Supplier catalog state ──
  const [catalogs, setCatalogs] = useState<Record<string, PartsCatalog>>({});
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"brands" | "categories" | "products">("brands");
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CatalogCategory | null>(null);

  // ── Vemat stock state ──
  const [vematCatalog, setVematCatalog] = useState<VematCatalog | null>(null);
  const [vematLoading, setVematLoading] = useState(false);
  const [vematView, setVematView] = useState<"off" | "families" | "products">("off");
  const [activeFamily, setActiveFamily] = useState<VematFamily | null>(null);
  const [activeModel, setActiveModel] = useState<string>("all");

  // ── Shared state ──
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ── Global search state ──
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalOpen, setGlobalOpen] = useState(false);
  const [allCatalogsLoading, setAllCatalogsLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vemat_cart_v2");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("vemat_cart_v2", JSON.stringify(cart));
  }, [cart]);

  // Load all catalogs silently when global search starts
  useEffect(() => {
    if (!globalQuery.trim()) return;
    const loadAll = async () => {
      setAllCatalogsLoading(true);
      await Promise.all([
        loadVematCatalog(),
        ...BRANDS.map((b) => loadCatalog(b.id)),
      ]);
      setAllCatalogsLoading(false);
    };
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalQuery]);

  // ── Supplier catalog loader ──
  const loadCatalog = async (brandId: string) => {
    if (catalogs[brandId]) return;
    const brand = BRANDS.find((b) => b.id === brandId);
    if (!brand) return;
    setLoading(true);
    try {
      const res = await fetch(brand.catalogUrl);
      const data: PartsCatalog = await res.json();
      setCatalogs((prev) => ({ ...prev, [brandId]: data }));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // ── Vemat stock loader ──
  const loadVematCatalog = async () => {
    if (vematCatalog) return;
    setVematLoading(true);
    try {
      const res = await fetch("/vemat-stock-catalog.json");
      const data: VematCatalog = await res.json();
      setVematCatalog(data);
    } catch {
      // silent
    } finally {
      setVematLoading(false);
    }
  };

  // ── Navigation handlers ──
  const handleSelectBrand = async (brandId: string) => {
    setActiveBrand(brandId);
    setView("categories");
    setSearch("");
    await loadCatalog(brandId);
  };

  const handleSelectCategory = (cat: CatalogCategory) => {
    setActiveCategory(cat);
    setView("products");
    setSearch("");
  };

  const handleOpenVemat = async () => {
    setVematView("families");
    setSearch("");
    await loadVematCatalog();
  };

  const handleSelectFamily = (family: VematFamily) => {
    setActiveFamily(family);
    setActiveModel("all");
    setVematView("products");
    setSearch("");
  };

  const handleBack = () => {
    // Vemat stock navigation
    if (vematView === "products") {
      setVematView("families");
      setActiveFamily(null);
      setActiveModel("all");
      setSearch("");
      return;
    }
    if (vematView === "families") {
      setVematView("off");
      setSearch("");
      return;
    }
    // Supplier navigation
    if (view === "products") {
      setView("categories");
      setActiveCategory(null);
      setSearch("");
    } else {
      setView("brands");
      setActiveBrand(null);
      setActiveCategory(null);
      setSearch("");
    }
  };

  // ── Cart handlers ──
  const addToCart = (product: CatalogProduct | VematProduct) => {
    const brand = vematView !== "off" ? "Vemat Stock" : (activeBrand ?? "Unknown");
    const existing = cart.find((i) => i.sku === product.sku);
    if (existing) {
      setCart(cart.map((i) => (i.sku === product.sku ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { sku: product.sku, title: product.title, brand, quantity: 1 }]);
    }
  };

  const updateQty = (sku: string, delta: number) => {
    setCart(cart.map((i) => (i.sku === sku ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)));
  };

  const removeFromCart = (sku: string) => setCart(cart.filter((i) => i.sku !== sku));

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsOrderOpen(false);
      setCart([]);
    }, 3000);
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const activeCatalog = activeBrand ? catalogs[activeBrand] : null;
  const activeBrandConfig = BRANDS.find((b) => b.id === activeBrand);

  // ── Filtered supplier data ──
  const filteredProducts = useMemo(() => {
    if (!activeCategory) return [];
    const q = search.toLowerCase();
    if (!q) return activeCategory.products;
    return activeCategory.products.filter(
      (p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [activeCategory, search]);

  const filteredCategories = useMemo(() => {
    if (!activeCatalog) return [];
    const q = search.toLowerCase();
    if (!q) return activeCatalog.categories;
    return activeCatalog.categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [activeCatalog, search]);

  // ── Filtered Vemat data ──
  const filteredFamilies = useMemo(() => {
    if (!vematCatalog) return [];
    const q = search.toLowerCase();
    if (!q) return vematCatalog.families;
    return vematCatalog.families.filter((f) => f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q));
  }, [vematCatalog, search]);

  const filteredVematProducts = useMemo(() => {
    if (!activeFamily) return [];
    let prods = activeFamily.products;
    if (activeModel !== "all") {
      prods = prods.filter((p) => p.model === activeModel);
    }
    const q = search.toLowerCase();
    if (!q) return prods;
    return prods.filter((p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [activeFamily, activeModel, search]);

  const isVemat = vematView !== "off";

  // ── Global search results ──────────────────────────────────────────────────
  interface GlobalResult {
    source: "vemat" | "JLG" | "Terex";
    sku: string;
    title: string;
    subtitle: string;
    family?: VematFamily;
    category?: CatalogCategory;
  }

  const globalResults = useMemo((): GlobalResult[] => {
    const q = globalQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: GlobalResult[] = [];

    // Vemat stock
    if (vematCatalog) {
      for (const family of vematCatalog.families) {
        for (const prod of family.products) {
          if (
            prod.title.toLowerCase().includes(q) ||
            prod.sku.toLowerCase().includes(q) ||
            (prod.model ?? "").toLowerCase().includes(q)
          ) {
            results.push({ source: "vemat", sku: prod.sku, title: prod.title, subtitle: family.name, family });
            if (results.filter((r) => r.source === "vemat").length >= 5) break;
          }
        }
        if (results.filter((r) => r.source === "vemat").length >= 5) break;
      }
    }

    // Supplier catalogs
    for (const brandId of ["JLG", "Terex"] as const) {
      const catalog = catalogs[brandId];
      if (!catalog) continue;
      let count = 0;
      outer: for (const cat of catalog.categories) {
        for (const prod of cat.products) {
          if (prod.title.toLowerCase().includes(q) || prod.sku.toLowerCase().includes(q)) {
            results.push({ source: brandId, sku: prod.sku, title: prod.title, subtitle: cat.name, category: cat });
            count++;
            if (count >= 5) break outer;
          }
        }
      }
    }

    return results;
  }, [globalQuery, vematCatalog, catalogs]);

  const handleGlobalResult = async (result: GlobalResult) => {
    setGlobalQuery("");
    setGlobalOpen(false);
    if (result.source === "vemat") {
      await loadVematCatalog();
      setVematView("products");
      setActiveFamily(result.family!);
      setActiveModel("all");
      setSearch(result.sku);
    } else {
      await loadCatalog(result.source);
      setActiveBrand(result.source);
      setView("products");
      setActiveCategory(result.category!);
      setSearch(result.sku);
    }
  };

  const copy = {
    title: lang === "fr" ? "Pièces de Rechange" : "Spare Parts",
    subtitle:
      lang === "fr"
        ? "Catalogue officiel de pièces d'origine. Sélectionnez une marque pour explorer les catégories."
        : "Official original parts catalog. Select a brand to browse categories.",
    searchCat: lang === "fr" ? "Rechercher une catégorie..." : "Search a category...",
    searchFam: lang === "fr" ? "Rechercher une famille..." : "Search a family...",
    searchPart: lang === "fr" ? "Rechercher par référence ou nom..." : "Search by reference or name...",
    backToBrands: lang === "fr" ? "Retour aux marques" : "Back to brands",
    backToCats: lang === "fr" ? "Retour aux catégories" : "Back to categories",
    backToFamilies: lang === "fr" ? "Retour aux familles" : "Back to families",
    backToStock: lang === "fr" ? "Retour au stock" : "Back to stock",
    parts: lang === "fr" ? "pièces" : "parts",
    categories: lang === "fr" ? "catégories" : "categories",
    families: lang === "fr" ? "familles" : "families",
    browseCategory: lang === "fr" ? "Explorer" : "Browse",
    requestQuote: lang === "fr" ? "Demander un devis" : "Request a quote",
    cartTitle: lang === "fr" ? "Votre Panier" : "Your Cart",
    emptyCart: lang === "fr" ? "Le panier est vide" : "Your cart is empty",
    orderBtn: lang === "fr" ? "Commander un devis" : "Request a quote",
    loading: lang === "fr" ? "Chargement du catalogue..." : "Loading catalog...",
    comingSoon: lang === "fr" ? "Bientôt disponible" : "Coming soon",
    allModels: lang === "fr" ? "Tous les modèles" : "All models",
    inStock: lang === "fr" ? "en stock" : "in stock",
  };

  // ── Back label ──
  const backLabel = isVemat
    ? vematView === "products"
      ? copy.backToFamilies
      : copy.backToStock
    : view === "products"
    ? copy.backToCats
    : copy.backToBrands;

  const showBack = isVemat ? true : view !== "brands";

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 md:pt-32 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            {showBack && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors mb-4"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {backLabel}
              </button>
            )}

            <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-zinc-950 tracking-tighter uppercase">
              {/* Supplier views */}
              {!isVemat && view === "brands" && copy.title}
              {!isVemat && view === "categories" && activeBrandConfig && (
                <span className="flex items-center gap-4">
                  <img src={activeBrandConfig.logo} alt={activeBrandConfig.id} className="h-10 object-contain" />
                  <span className="text-2xl md:text-4xl">
                    {lang === "fr" ? "Pièces" : "Parts"} {activeBrandConfig.id}
                  </span>
                </span>
              )}
              {!isVemat && view === "products" && activeCategory?.name}

              {/* Vemat stock views */}
              {isVemat && vematView === "families" && (
                <span className="flex items-center gap-3">
                  <img src={vematLogo} alt="Vemat" className="h-9 w-auto object-contain" />
                  <span>Stock Vemat</span>
                </span>
              )}
              {isVemat && vematView === "products" && activeFamily && (
                <span className="flex items-center gap-3">
                  <span className="text-2xl">{activeFamily.icon}</span>
                  <span className="text-2xl md:text-4xl">{activeFamily.name}</span>
                </span>
              )}
            </h1>

            {!isVemat && view === "brands" && (
              <p className="text-zinc-500 font-medium text-base mt-2 max-w-xl">{copy.subtitle}</p>
            )}
            {!isVemat && view === "categories" && activeCatalog && (
              <p className="text-zinc-500 font-medium text-sm mt-1">
                {activeCatalog.totalProducts.toLocaleString()} {copy.parts} · {activeCatalog.totalCategories}{" "}
                {copy.categories}
              </p>
            )}
            {!isVemat && view === "products" && activeCategory && (
              <p className="text-zinc-500 font-medium text-sm mt-1">
                {activeCategory.productCount.toLocaleString()} {copy.parts}
              </p>
            )}
            {isVemat && vematView === "families" && vematCatalog && (
              <p className="text-zinc-500 font-medium text-sm mt-1">
                {vematCatalog.totalProducts.toLocaleString()} {copy.parts} · {vematCatalog.totalFamilies}{" "}
                {copy.families}
              </p>
            )}
            {isVemat && vematView === "products" && activeFamily && (
              <p className="text-zinc-500 font-medium text-sm mt-1">
                {activeFamily.productCount.toLocaleString()} {copy.parts}
                {activeFamily.models.length > 0 && ` · ${activeFamily.models.length} modèles`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {(view === "categories" || view === "products" || isVemat) && (
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder={
                    vematView === "families"
                      ? copy.searchFam
                      : view === "categories"
                      ? copy.searchCat
                      : copy.searchPart
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 bg-white border-zinc-200 rounded-2xl focus:ring-accent text-sm"
                />
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button className="h-12 w-12 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 relative shrink-0">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-accent text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-zinc-50">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white border-l border-zinc-100">
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-2xl font-heading font-extrabold tracking-tight uppercase">
                    {copy.cartTitle}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-zinc-300 gap-3">
                        <Package className="h-10 w-10" />
                        <p className="text-xs font-black uppercase tracking-widest">{copy.emptyCart}</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.sku} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <p className="text-[10px] font-black uppercase text-accent tracking-widest mb-1">
                            {item.brand} · {item.sku}
                          </p>
                          <p className="font-bold text-zinc-950 text-sm leading-snug mb-3">{item.title}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl p-0.5">
                              <button
                                onClick={() => updateQty(item.sku, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-50 text-zinc-500"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-black text-xs">{item.quantity}</span>
                              <button
                                onClick={() => updateQty(item.sku, 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-50 text-zinc-500"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.sku)}
                              className="text-[10px] font-black uppercase text-red-400 hover:text-red-600 transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-auto pt-6 pb-12 border-t border-zinc-100">
                    <Button
                      disabled={cart.length === 0}
                      onClick={() => setIsOrderOpen(true)}
                      className="w-full h-14 bg-accent text-white hover:bg-accent/90 rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-gold"
                    >
                      {copy.orderBtn} ({totalItems})
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            VEMAT STOCK VIEWS
        ══════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">

          {/* ── VEMAT: FAMILIES ─────────────────────────────────────────────── */}
          {isVemat && vematView === "families" && (
            <motion.div
              key="vemat-families"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {vematLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-zinc-400 gap-4">
                  <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold">{copy.loading}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredFamilies.map((family) => (
                    <button
                      key={family.code}
                      onClick={() => handleSelectFamily(family)}
                      className="group bg-white rounded-[2rem] border border-zinc-100 p-5 flex flex-col items-start gap-3 hover:border-amber-400/40 hover:shadow-soft transition-all duration-300 text-left"
                    >
                      <span className="text-3xl">{family.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-black text-zinc-950 text-sm leading-snug mb-0.5 group-hover:text-amber-600 transition-colors">
                          {family.name}
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {family.productCount.toLocaleString()} {copy.parts}
                          {family.models.length > 0 && ` · ${family.models.length} modèles`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 text-[10px] font-black uppercase tracking-widest group-hover:gap-2 transition-all">
                        {copy.browseCategory} <ChevronRight className="h-3 w-3" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── VEMAT: PRODUCTS ─────────────────────────────────────────────── */}
          {isVemat && vematView === "products" && activeFamily && (
            <motion.div
              key="vemat-products"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {/* Model filter chips */}
              {activeFamily.models.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  <div className="flex items-center gap-1.5 text-zinc-400 mr-2">
                    <Layers className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {lang === "fr" ? "Modèle machine" : "Machine model"}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveModel("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                      activeModel === "all"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white border-zinc-200 text-zinc-600 hover:border-amber-400/60 hover:text-zinc-950"
                    }`}
                  >
                    {copy.allModels}
                  </button>
                  {activeFamily.models.map((model) => (
                    <button
                      key={model}
                      onClick={() => setActiveModel(model)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                        activeModel === model
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-amber-400/60 hover:text-zinc-950"
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}

              {filteredVematProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-400 gap-4">
                  <Package className="h-12 w-12 opacity-20" />
                  <p className="text-sm font-bold">
                    {search
                      ? `Aucun résultat pour "${search}"`
                      : lang === "fr"
                      ? "Aucune pièce pour ce modèle"
                      : "No parts for this model"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredVematProducts.map((product) => (
                    <VematProductCard
                      key={product.sku}
                      product={product}
                      inCart={cart.some((i) => i.sku === product.sku)}
                      onAdd={addToCart}
                      lang={lang}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SUPPLIER VIEWS
          ══════════════════════════════════════════════════════════════════ */}

          {/* ── BRAND VIEW ──────────────────────────────────────────────────── */}
          {!isVemat && view === "brands" && (
            <motion.div
              key="brands"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-8"
            >
              {/* ── Global search bar ─────────────────────────────────────────── */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={globalQuery}
                    onChange={(e) => { setGlobalQuery(e.target.value); setGlobalOpen(true); }}
                    onFocus={() => setGlobalOpen(true)}
                    onBlur={() => setTimeout(() => setGlobalOpen(false), 150)}
                    placeholder={lang === "fr" ? "Rechercher une pièce, une référence, un modèle..." : "Search a part, reference, or model..."}
                    className="w-full h-14 pl-14 pr-6 bg-white border border-zinc-200 rounded-2xl text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-sm"
                  />
                  {allCatalogsLoading && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {/* Results dropdown */}
                {globalOpen && globalQuery.trim().length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
                    {globalResults.length === 0 ? (
                      <div className="flex items-center gap-3 p-5 text-zinc-400">
                        <Package className="h-4 w-4 shrink-0" />
                        <p className="text-sm font-medium">
                          {allCatalogsLoading
                            ? (lang === "fr" ? "Recherche en cours..." : "Searching...")
                            : (lang === "fr" ? "Aucun résultat" : "No results")}
                        </p>
                      </div>
                    ) : (
                      <>
                        {(["vemat", "JLG", "Terex"] as const).map((src) => {
                          const group = globalResults.filter((r) => r.source === src);
                          if (!group.length) return null;
                          const label = src === "vemat" ? "Stock Vemat" : `${src} Parts`;
                          const color = src === "vemat" ? "text-amber-600" : "text-accent";
                          return (
                            <div key={src}>
                              <p className={`px-5 pt-4 pb-1 text-[10px] font-black uppercase tracking-widest ${color}`}>
                                {label}
                              </p>
                              {group.map((r) => (
                                <button
                                  key={r.sku}
                                  onMouseDown={() => handleGlobalResult(r)}
                                  className="w-full flex items-start gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors text-left"
                                >
                                  <Package className="h-4 w-4 text-zinc-300 shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900 truncate">{r.title}</p>
                                    <p className="text-[10px] text-zinc-400 font-mono">{r.sku} · {r.subtitle}</p>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 text-zinc-300 shrink-0 mt-0.5" />
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* STOCK VEMAT — featured card */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4 flex items-center gap-2">
                  <span className="block w-6 h-px bg-zinc-300" />
                  {lang === "fr" ? "Notre stock" : "Our stock"}
                </p>
                <button
                  onClick={handleOpenVemat}
                  className="group w-full relative bg-gradient-to-br from-zinc-950 to-zinc-800 rounded-[2.5rem] border border-zinc-700 p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
                >
                  {/* glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -translate-y-20 translate-x-20 group-hover:bg-amber-500/20 transition-colors duration-500 pointer-events-none" />

                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors p-2">
                      <img src={vematLogo} alt="Vemat" className="h-full w-full object-contain" style={{ filter: "brightness(0) invert(1)" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-heading font-extrabold text-white tracking-tight">
                          Stock Vemat
                        </span>
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/30">
                          {lang === "fr" ? "En stock" : "Available"}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm font-medium">
                        {lang === "fr"
                          ? "2 724 pièces disponibles · 25 familles · Stock Vemat Maroc"
                          : "2,724 parts available · 25 families · Vemat Morocco stock"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest group-hover:gap-3 transition-all shrink-0">
                    {copy.browseCategory}
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>
              </div>

              {/* Supplier catalogs */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4 flex items-center gap-2">
                  <span className="block w-6 h-px bg-zinc-300" />
                  {lang === "fr" ? "Catalogues fournisseurs" : "Supplier catalogs"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {BRANDS.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => handleSelectBrand(brand.id)}
                      className="group relative bg-white rounded-[2.5rem] border border-zinc-100 p-8 flex flex-col items-start gap-6 hover:border-accent/30 hover:shadow-soft transition-all duration-300 text-left overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full -translate-y-10 translate-x-10 group-hover:bg-accent/10 transition-colors duration-500" />
                      <div className="h-14 flex items-center">
                        <img
                          src={brand.logo}
                          alt={brand.id}
                          className={`h-full object-contain ${brand.darkLogo ? "bg-zinc-900 p-2 rounded-lg" : ""}`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-heading font-extrabold text-zinc-950 tracking-tight">
                            {brand.label}
                          </span>
                          <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-full border border-accent/20">
                            Official
                          </span>
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">{brand.description[lang]}</p>
                      </div>
                      <div className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-widest mt-auto group-hover:gap-3 transition-all">
                        {copy.browseCategory}
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  ))}

                  {COMING_SOON.map((brand) => (
                    <div
                      key={brand}
                      className="bg-white/50 rounded-[2.5rem] border border-dashed border-zinc-200 p-8 flex flex-col items-start gap-6 opacity-50"
                    >
                      <div className="h-14 flex items-center">
                        <span className="text-2xl font-heading font-extrabold text-zinc-300 tracking-tight">{brand}</span>
                      </div>
                      <p className="text-zinc-300 text-sm font-medium">{copy.comingSoon}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── CATEGORY VIEW ────────────────────────────────────────────────── */}
          {!isVemat && view === "categories" && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 text-zinc-400 gap-4">
                  <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold">{copy.loading}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => handleSelectCategory(cat)}
                      className="group bg-white rounded-[2rem] border border-zinc-100 p-6 flex flex-col items-start gap-4 hover:border-accent/30 hover:shadow-soft transition-all duration-300 text-left"
                    >
                      <span className="text-3xl">
                        {cat.icon || CATEGORY_ICONS[cat.slug] || "🔧"}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-black text-zinc-950 text-base leading-snug mb-1 group-hover:text-accent transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium">
                          {cat.productCount.toLocaleString()} {copy.parts}
                          {cat.subcategories.length > 0 && ` · ${cat.subcategories.length} sous-catégories`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-accent text-[10px] font-black uppercase tracking-widest group-hover:gap-2 transition-all">
                        {copy.browseCategory} <ChevronRight className="h-3 w-3" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── PRODUCT VIEW ──────────────────────────────────────────────────── */}
          {!isVemat && view === "products" && activeCategory && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {activeCategory.subcategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  <div className="flex items-center gap-1.5 text-zinc-400 mr-2">
                    <Layers className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sous-catégories</span>
                  </div>
                  {activeCategory.subcategories.map((sub) => (
                    <a
                      key={sub.slug}
                      href={sub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-xs font-bold text-zinc-600 hover:border-accent/40 hover:text-zinc-950 transition-colors"
                    >
                      {sub.name}
                    </a>
                  ))}
                </div>
              )}

              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-400 gap-4">
                  <Package className="h-12 w-12 opacity-20" />
                  <p className="text-sm font-bold">Aucun résultat pour &quot;{search}&quot;</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.sku}
                        product={product}
                        brand={activeBrand ?? ""}
                        inCart={cart.some((i) => i.sku === product.sku)}
                        onAdd={addToCart}
                      />
                    ))}
                  </div>

                  {activeCategory.productCount > 48 && activeBrandConfig && (
                    <div className="mt-10 flex justify-center">
                      <a
                        href={activeCategory.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 hover:border-accent/40 hover:text-zinc-950 transition-colors"
                      >
                        {lang === "fr" ? "Voir les" : "See all"}{" "}
                        {activeCategory.productCount.toLocaleString()}{" "}
                        {lang === "fr" ? "pièces sur" : "parts on"} {activeBrandConfig.siteLabel}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CHECKOUT MODAL ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOrderOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
              onClick={() => setIsOrderOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl overflow-hidden"
            >
              {isSuccess ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-green-500/20">
                    <Check className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl font-heading font-extrabold text-zinc-950 mb-3 tracking-tighter uppercase">
                    Demande Envoyée !
                  </h2>
                  <p className="text-zinc-500 font-medium">
                    Notre équipe PDR va analyser votre panier et vous envoyer un devis officiel rapidement.
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setIsOrderOpen(false)}
                    className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-950 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h2 className="text-2xl font-heading font-extrabold text-zinc-950 mb-1 tracking-tighter uppercase">
                    Finaliser la demande
                  </h2>
                  <p className="text-zinc-500 mb-8 font-medium text-sm">
                    {cart.length} référence{cart.length > 1 ? "s" : ""} sélectionnée
                    {cart.length > 1 ? "s" : ""}. Nous vous envoyons le devis officiel.
                  </p>
                  <form onSubmit={handleOrderSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          {lang === "fr" ? "Nom complet" : "Full name"}
                        </label>
                        <Input required className="h-12 bg-zinc-50 border-zinc-100 rounded-2xl" placeholder="John Doe" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          {lang === "fr" ? "Société" : "Company"}
                        </label>
                        <Input required className="h-12 bg-zinc-50 border-zinc-100 rounded-2xl" placeholder={lang === "fr" ? "Votre société" : "Your company"} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          Email
                        </label>
                        <Input required type="email" className="h-12 bg-zinc-50 border-zinc-100 rounded-2xl" placeholder="john@company.com" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          {lang === "fr" ? "Téléphone" : "Phone"}
                        </label>
                        <Input required className="h-12 bg-zinc-50 border-zinc-100 rounded-2xl" placeholder="+212 ..." />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-14 bg-zinc-950 text-white hover:bg-accent rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all mt-2"
                    >
                      {lang === "fr" ? "Envoyer ma demande" : "Send my request"}
                      <ArrowRight className="ml-3 h-4 w-4" />
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
