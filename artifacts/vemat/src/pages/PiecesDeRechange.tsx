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

// ─── Types ──────────────────────────────────────────────────────────────────

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
  subcategories: CatalogSubcategory[];
  products: CatalogProduct[];
}

interface JLGCatalog {
  supplier: string;
  totalProducts: number;
  totalCategories: number;
  categories: CatalogCategory[];
}

interface CartItem {
  sku: string;
  title: string;
  brand: string;
  quantity: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  filters: "🔧",
  "engine-parts": "⚙️",
  "accessories-options": "🔩",
  batteries: "🔋",
  "telehandler-attachments": "🏗️",
  "aftermarket-attachments": "🔗",
  "aftermarket-engine-parts": "🛠️",
  clearsky: "✨",
};

function ProductCard({
  product,
  inCart,
  onAdd,
}: {
  product: CatalogProduct;
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
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-1">JLG</p>
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
              inCart
                ? "bg-zinc-100 text-zinc-400"
                : "bg-zinc-950 text-white hover:bg-accent"
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
            title="Voir sur JLG"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PiecesDeRechange() {
  const { lang } = useLang();
  const { t } = useLang();
  useSEO(t("nav.pdr"), "Catalogue de pièces de rechange JLG d'origine — Vemat Group.");
  useScrollTop();

  const [catalog, setCatalog] = useState<JLGCatalog | null>(null);
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState<"brands" | "categories" | "products">("brands");
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CatalogCategory | null>(null);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vemat_cart_v2");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("vemat_cart_v2", JSON.stringify(cart));
  }, [cart]);

  // Fetch JLG catalog on demand
  const loadJLGCatalog = async () => {
    if (catalog) return;
    setLoading(true);
    try {
      const res = await fetch("/jlg-parts-catalog.json");
      const data: JLGCatalog = await res.json();
      setCatalog(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBrand = async (brand: string) => {
    setActiveBrand(brand);
    setView("categories");
    setSearch("");
    if (brand === "JLG") await loadJLGCatalog();
  };

  const handleSelectCategory = (cat: CatalogCategory) => {
    setActiveCategory(cat);
    setView("products");
    setSearch("");
  };

  const handleBack = () => {
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

  const addToCart = (product: CatalogProduct) => {
    const existing = cart.find((i) => i.sku === product.sku);
    if (existing) {
      setCart(cart.map((i) => (i.sku === product.sku ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { sku: product.sku, title: product.title, brand: "JLG", quantity: 1 }]);
    }
  };

  const updateQty = (sku: string, delta: number) => {
    setCart(
      cart.map((i) => (i.sku === sku ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)),
    );
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

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return [];
    const q = search.toLowerCase();
    if (!q) return activeCategory.products;
    return activeCategory.products.filter(
      (p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [activeCategory, search]);

  const filteredCategories = useMemo(() => {
    if (!catalog) return [];
    const q = search.toLowerCase();
    if (!q) return catalog.categories;
    return catalog.categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [catalog, search]);

  const copy = {
    title: lang === "fr" ? "Pièces de Rechange" : "Spare Parts",
    subtitle:
      lang === "fr"
        ? "Catalogue officiel de pièces d'origine. Sélectionnez une marque pour explorer les catégories."
        : "Official original parts catalog. Select a brand to browse categories.",
    searchCat: lang === "fr" ? "Rechercher une catégorie..." : "Search a category...",
    searchPart: lang === "fr" ? "Rechercher par référence ou nom..." : "Search by reference or name...",
    backToBrands: lang === "fr" ? "Retour aux marques" : "Back to brands",
    backToCats: lang === "fr" ? "Retour aux catégories" : "Back to categories",
    parts: lang === "fr" ? "pièces" : "parts",
    categories: lang === "fr" ? "catégories" : "categories",
    browseCategory: lang === "fr" ? "Explorer" : "Browse",
    requestQuote: lang === "fr" ? "Demander un devis" : "Request a quote",
    cartTitle: lang === "fr" ? "Votre Panier" : "Your Cart",
    emptyCart: lang === "fr" ? "Le panier est vide" : "Your cart is empty",
    orderBtn: lang === "fr" ? "Commander un devis" : "Request a quote",
    loading: lang === "fr" ? "Chargement du catalogue..." : "Loading catalog...",
    comingSoon: lang === "fr" ? "Bientôt disponible" : "Coming soon",
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 md:pt-32 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            {/* Breadcrumb */}
            {view !== "brands" && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors mb-4"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {view === "products" ? copy.backToCats : copy.backToBrands}
              </button>
            )}

            <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-zinc-950 tracking-tighter uppercase">
              {view === "brands" && copy.title}
              {view === "categories" && (
                <span className="flex items-center gap-3">
                  <img src={jlgLogo} alt="JLG" className="h-10 object-contain" />
                  <span className="text-2xl md:text-4xl">Pièces JLG</span>
                </span>
              )}
              {view === "products" && activeCategory?.name}
            </h1>

            {view === "brands" && (
              <p className="text-zinc-500 font-medium text-base mt-2 max-w-xl">{copy.subtitle}</p>
            )}
            {view === "categories" && catalog && (
              <p className="text-zinc-500 font-medium text-sm mt-1">
                {catalog.totalProducts.toLocaleString()} {copy.parts} · {catalog.totalCategories}{" "}
                {copy.categories}
              </p>
            )}
            {view === "products" && activeCategory && (
              <p className="text-zinc-500 font-medium text-sm mt-1">
                {activeCategory.productCount.toLocaleString()} {copy.parts}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {(view === "categories" || view === "products") && (
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder={view === "categories" ? copy.searchCat : copy.searchPart}
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
                        <div
                          key={item.sku}
                          className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100"
                        >
                          <p className="text-[10px] font-black uppercase text-accent tracking-widest mb-1">
                            {item.brand} · {item.sku}
                          </p>
                          <p className="font-bold text-zinc-950 text-sm leading-snug mb-3">
                            {item.title}
                          </p>
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

        {/* ── BRAND VIEW ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {view === "brands" && (
            <motion.div
              key="brands"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* JLG card */}
              <button
                onClick={() => handleSelectBrand("JLG")}
                className="group relative bg-white rounded-[2.5rem] border border-zinc-100 p-8 flex flex-col items-start gap-6 hover:border-accent/30 hover:shadow-soft transition-all duration-300 text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full -translate-y-10 translate-x-10 group-hover:bg-accent/10 transition-colors duration-500" />

                <div className="h-14 flex items-center">
                  <img src={jlgLogo} alt="JLG" className="h-full object-contain" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-heading font-extrabold text-zinc-950 tracking-tight">
                      JLG Parts
                    </span>
                    <span className="px-2.5 py-0.5 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-full border border-accent/20">
                      Official
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm font-medium">
                    12 092 pièces d'origine · 723 catégories
                  </p>
                </div>

                <div className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-widest mt-auto group-hover:gap-3 transition-all">
                  {copy.browseCategory}
                  <ChevronRight className="h-4 w-4" />
                </div>
              </button>

              {/* Future brand placeholders */}
              {["Tadano", "Terex", "Magni", "Mecalac"].map((brand) => (
                <div
                  key={brand}
                  className="bg-white/50 rounded-[2.5rem] border border-dashed border-zinc-200 p-8 flex flex-col items-start gap-6 opacity-50"
                >
                  <div className="h-14 flex items-center">
                    <span className="text-2xl font-heading font-extrabold text-zinc-300 tracking-tight">
                      {brand}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm font-medium">{copy.comingSoon}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* ── CATEGORY VIEW ────────────────────────────────────────────── */}
          {view === "categories" && (
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
                        {CATEGORY_ICONS[cat.slug] || "🔧"}
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

          {/* ── PRODUCT VIEW ─────────────────────────────────────────────── */}
          {view === "products" && activeCategory && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              {/* Subcategory chips */}
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
                        inCart={cart.some((i) => i.sku === product.sku)}
                        onAdd={addToCart}
                      />
                    ))}
                  </div>

                  {/* View all on JLG */}
                  {activeCategory.productCount > 48 && (
                    <div className="mt-10 flex justify-center">
                      <a
                        href={activeCategory.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 hover:border-accent/40 hover:text-zinc-950 transition-colors"
                      >
                        Voir les {activeCategory.productCount.toLocaleString()} pièces sur JLG.com
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
                          Nom complet
                        </label>
                        <Input required className="h-12 bg-zinc-50 border-zinc-100 rounded-2xl" placeholder="John Doe" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          Société
                        </label>
                        <Input required className="h-12 bg-zinc-50 border-zinc-100 rounded-2xl" placeholder="Votre société" />
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
                          Téléphone
                        </label>
                        <Input required className="h-12 bg-zinc-50 border-zinc-100 rounded-2xl" placeholder="+212 ..." />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-14 bg-zinc-950 text-white hover:bg-accent rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all mt-2"
                    >
                      Envoyer ma demande
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
