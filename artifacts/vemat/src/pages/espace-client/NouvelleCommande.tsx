import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { PortalLayout } from "@/components/espace-client/PortalLayout";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/lib/supabase";
import type { Chantier, OrderItem } from "@/lib/database.types";

interface CartItem { sku: string; title: string; brand: string; quantity: number; }

const emptyItem = (): OrderItem => ({ part_number: "", description: "", quantity: 1 });

export default function EspaceClientNouvelleCommande() {
  const [, navigate] = useLocation();
  const { company, user } = useClientAuth();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [chantierId, setChantierId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartBanner, setCartBanner] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("vemat_devis_cart");
    if (saved) {
      try {
        const cart: CartItem[] = JSON.parse(saved);
        if (cart.length > 0) {
          setItems(cart.map((c) => ({ part_number: c.sku, description: `${c.brand} · ${c.title}`, quantity: c.quantity })));
          setCartBanner(cart.reduce((s, c) => s + c.quantity, 0));
          localStorage.removeItem("vemat_devis_cart");
        }
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!company) return;
    supabase.from("chantiers").select("*").eq("company_id", company.id).eq("active", true)
      .then(({ data }) => setChantiers(data ?? []));
  }, [company]);

  const updateItem = (i: number, field: keyof OrderItem, value: string | number) => {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;
    const validItems = items.filter((it) => it.part_number || it.description);
    if (validItems.length === 0) { setError("Ajoutez au moins un article"); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("devis_requests").insert({
      company_id: company.id,
      created_by: user.id,
      chantier_id: chantierId || null,
      notes: notes || null,
      items: validItems as unknown as import("@/lib/database.types").Json,
      status: "en_traitement",
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate("/espace-client/commandes");
  };

  return (
    <PortalLayout>
      <div className="p-8 max-w-3xl">
        <button onClick={() => navigate("/espace-client/commandes")} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h1 className="text-2xl font-black text-zinc-900 mb-1">Nouvelle demande de devis</h1>
        <p className="text-sm text-zinc-500 mb-4">Renseignez les pièces dont vous avez besoin. Notre équipe vous enverra un devis sous 24–48h.</p>
        {cartBanner > 0 && (
          <div className="mb-6 flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-xl px-4 py-3">
            <span className="text-accent text-lg">🛒</span>
            <p className="text-sm font-semibold text-accent">{cartBanner} article{cartBanner > 1 ? "s" : ""} ajouté{cartBanner > 1 ? "s" : ""} depuis le catalogue pièces de rechange</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chantier */}
          {chantiers.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-100 p-5">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Chantier concerné (optionnel)</label>
              <select value={chantierId} onChange={(e) => setChantierId(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent">
                <option value="">— Aucun chantier sélectionné —</option>
                {chantiers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
              </select>
            </div>
          )}

          {/* Articles */}
          <div className="bg-white rounded-xl border border-zinc-100 p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4">Articles demandés</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_2fr_80px_40px] gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wide px-1">
                <span>Référence pièce</span><span>Description</span><span className="text-center">Qté</span><span />
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_80px_40px] gap-2 items-center">
                  <input value={item.part_number} onChange={(e) => updateItem(i, "part_number", e.target.value)}
                    placeholder="REF-001" className="border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
                  <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)}
                    placeholder="Filtre hydraulique..." className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                    className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-accent" />
                  <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} disabled={items.length === 1}
                    className="text-zinc-300 hover:text-red-400 disabled:opacity-30 transition-colors flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setItems((prev) => [...prev, emptyItem()])}
              className="mt-3 flex items-center gap-2 text-sm text-accent font-semibold hover:underline">
              <Plus className="w-4 h-4" /> Ajouter un article
            </button>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-zinc-100 p-5">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">Notes / Informations complémentaires</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Urgence, marque de l'équipement, numéro de série..."
              className="w-full border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent resize-none" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate("/espace-client/commandes")}
              className="flex-1 border border-zinc-200 text-zinc-600 font-bold py-2.5 rounded-lg hover:bg-zinc-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-accent text-accent-foreground font-bold py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60">
              {loading ? "Envoi..." : "Envoyer la demande"}
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
