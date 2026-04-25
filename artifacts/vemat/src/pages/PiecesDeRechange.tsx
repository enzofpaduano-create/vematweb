import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, Trash2, X, Check, Package, ArrowRight, Phone, Mail } from "lucide-react";
import { useSEO, useScrollTop } from "@/hooks/use-seo";
import { useLang } from "@/i18n/I18nProvider";
import { parts, Part } from "@/data/parts";
import { jlgParts } from "@/data/jlgParts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function PiecesDeRechange() {
  const { t } = useLang();
  useSEO(t("nav.pdr"), "Marketplace de pièces de rechange Vemat Group.");
  useScrollTop();
  const displayedParts = [...jlgParts, ...parts];

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ part: Part; quantity: number }[]>([]);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("vemat_cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("vemat_cart", JSON.stringify(cart));
  }, [cart]);

  const filteredParts = displayedParts.filter(part => 
    part.name.toLowerCase().includes(search.toLowerCase()) ||
    part.reference.toLowerCase().includes(search.toLowerCase()) ||
    part.brand.toLowerCase().includes(search.toLowerCase()) ||
    part.category.toLowerCase().includes(search.toLowerCase()) ||
    (part.subFamily && part.subFamily.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (part: Part) => {
    const existing = cart.find(item => item.part.id === part.id);
    if (existing) {
      setCart(cart.map(item => item.part.id === part.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { part, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.part.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.part.id !== id));
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send an email/API call
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsOrderOpen(false);
      setCart([]);
    }, 3000);
  };

  return (    <div className="min-h-screen bg-zinc-50 pt-24 md:pt-32 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-6xl font-heading font-extrabold text-zinc-950 mb-3 md:mb-4 tracking-tighter uppercase">
              {t("nav.pdr")}
            </h1>
            <p className="text-zinc-500 font-medium text-base md:text-lg">
              Trouvez vos pièces d'origine certifiées et demandez votre devis en quelques clics.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <Input 
                placeholder="Référence, nom, marque..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 bg-white border-zinc-200 rounded-2xl focus:ring-accent"
              />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button className="h-14 w-14 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 relative shrink-0">
                  <ShoppingCart className="h-6 w-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 h-6 w-6 bg-accent text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-zinc-50">
                      {cart.reduce((acc, curr) => acc + curr.quantity, 0)}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white border-l border-zinc-100">
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-2xl font-heading font-extrabold tracking-tight uppercase">
                    Votre Panier
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto pr-2">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-zinc-400 gap-4">
                        <Package className="h-12 w-12 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-xs">Le panier est vide</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div key={item.part.id} className="flex flex-col gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 group">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-zinc-950 truncate mb-1">{item.part.name}</h4>
                              <p className="text-[10px] font-black uppercase text-accent tracking-widest mb-3">{item.part.brand} | {item.part.reference}</p>
                              
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200/50">
                                <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl p-1">
                                  <button 
                                    onClick={() => updateQuantity(item.part.id, -1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-50 text-zinc-500 transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-black text-xs text-zinc-950">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.part.id, 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-50 text-zinc-500 transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                                <button 
                                  onClick={() => removeFromCart(item.part.id)}
                                  className="text-[10px] font-black uppercase text-red-500/70 hover:text-red-500 transition-colors"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-8 pb-12 border-t border-zinc-100">
                    <Button 
                      disabled={cart.length === 0}
                      onClick={() => setIsOrderOpen(true)}
                      className="w-full h-16 bg-accent text-white hover:bg-accent/90 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-gold"
                    >
                      Commander un devis ({cart.reduce((acc, curr) => acc + curr.quantity, 0)} articles)
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Parts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredParts.map((part) => (
              <motion.div
                key={part.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden group hover:border-accent/20 transition-all duration-500 hover:shadow-soft"
              >
                <div className="p-8">
                  <div className="flex flex-wrap gap-2 mb-6">
                    <div className="px-4 py-1.5 bg-zinc-100 rounded-full">
                      <span className="text-zinc-900 text-[9px] font-black uppercase tracking-widest">{part.category}</span>
                    </div>
                    {part.subFamily && (
                      <div className="px-4 py-1.5 bg-accent/10 rounded-full border border-accent/20">
                        <span className="text-accent text-[9px] font-black uppercase tracking-widest">{part.subFamily}</span>
                      </div>
                    )}
                  </div>

                  <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">{part.brand}</span>
                  <h3 className="text-xl md:text-2xl font-heading font-extrabold text-zinc-950 mb-3 group-hover:text-accent transition-colors leading-tight">
                    {part.name}
                  </h3>
                  <p className="text-[11px] font-bold text-zinc-400 mb-8 font-mono bg-zinc-50 py-2 px-3 rounded-lg inline-block">REF: {part.reference}</p>
                  
                  <Button 
                    onClick={() => addToCart(part)}
                    disabled={cart.some(item => item.part.id === part.id)}
                    className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${
                      cart.some(item => item.part.id === part.id)
                      ? "bg-zinc-100 text-zinc-400 border-zinc-200"
                      : "bg-zinc-950 text-white hover:bg-accent shadow-lg"
                    }`}
                  >
                    {cart.some(item => item.part.id === part.id) ? (
                      <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Dans le panier</span>
                    ) : (
                      "Ajouter au panier"
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Checkout Modal */}
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 lg:p-16 shadow-2xl overflow-hidden"
            >
              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-green-500/20">
                    <Check className="h-12 w-12" />
                  </div>
                  <h2 className="text-3xl font-heading font-extrabold text-zinc-950 mb-4 tracking-tighter uppercase">Demande Envoyée !</h2>
                  <p className="text-zinc-500 font-medium">Notre équipe PDR va analyser votre panier et vous envoyer un devis officiel dans les plus brefs délais.</p>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setIsOrderOpen(false)}
                    className="absolute top-8 right-8 p-2 text-zinc-400 hover:text-zinc-950 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>

                  <h2 className="text-3xl font-heading font-extrabold text-zinc-950 mb-2 tracking-tighter uppercase">Finaliser la demande</h2>
                  <p className="text-zinc-500 mb-10 font-medium">Laissez-nous vos coordonnées, nous vous enverrons le devis pour les {cart.length} pièces sélectionnées.</p>

                  <form onSubmit={handleOrderSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nom complet</label>
                        <Input required className="h-14 bg-zinc-50 border-zinc-100 rounded-2xl" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Société</label>
                        <Input required className="h-14 bg-zinc-50 border-zinc-100 rounded-2xl" placeholder="Vemat S.A." />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email</label>
                        <Input required type="email" className="h-14 bg-zinc-50 border-zinc-100 rounded-2xl" placeholder="john@company.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Téléphone</label>
                        <Input required className="h-14 bg-zinc-50 border-zinc-100 rounded-2xl" placeholder="+212 ..." />
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full h-16 bg-zinc-950 text-white hover:bg-accent rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-500 mt-4">
                      Envoyer ma demande de devis
                      <ArrowRight className="ml-4 h-4 w-4" />
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
