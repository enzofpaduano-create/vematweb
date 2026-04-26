import { useState, useMemo } from "react";
import { Link } from "wouter";
import { CheckCircle2, ChevronDown, Loader2, ArrowLeft, FileText } from "lucide-react";
import vematLogo from "@/assets/vemat-logo.png";
import { supabasePublic } from "@/lib/supabase";
import { sendDevisEmail } from "@/lib/emailService";
import { catalog, type CategorySlug } from "@/data/products";

const CATEGORY_LABELS: Record<CategorySlug, string> = {
  grues: "Grues",
  nacelles: "Nacelles & plateformes élévatrices",
  elevateurs: "Élévateurs télescopiques",
  construction: "Matériaux de construction",
};

function genRef() {
  return `DEV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

type Step = "form" | "success";

function SelectField({
  label,
  value,
  onChange,
  children,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-zinc-300">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent pr-10"
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
      </div>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-zinc-300">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
      />
    </div>
  );
}

export default function DemandeDevis() {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");

  // Contact
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Machine
  const [category, setCategory] = useState<CategorySlug | "">("");
  const [subCatSlug, setSubCatSlug] = useState("");
  const [modelName, setModelName] = useState("");
  const [quantity, setQuantity] = useState("1");

  // Details
  const [location, setLocation] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [notes, setNotes] = useState("");

  const subCategories = useMemo(
    () => (category ? catalog[category] ?? [] : []),
    [category]
  );

  const models = useMemo(() => {
    if (!subCatSlug) return [];
    const sub = subCategories.find((s) => s.slug === subCatSlug);
    return sub?.models ?? [];
  }, [subCatSlug, subCategories]);

  const selectedSub = subCategories.find((s) => s.slug === subCatSlug);

  function handleCategoryChange(v: string) {
    setCategory(v as CategorySlug | "");
    setSubCatSlug("");
    setModelName("");
  }

  function handleSubCatChange(v: string) {
    setSubCatSlug(v);
    setModelName("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const ref = genRef();

    const payload = {
      reference: ref,
      company_name: companyName.trim(),
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      product_category: category ? CATEGORY_LABELS[category] : null,
      product_brand: selectedSub?.title.fr ?? null,
      product_model: modelName || null,
      quantity: parseInt(quantity) || 1,
      location: location.trim() || null,
      desired_date: desiredDate || null,
      notes: notes.trim() || null,
      status: "nouveau",
    };

    const { error: dbError } = await supabasePublic
      .from("form_devis")
      .insert(payload);

    if (dbError) {
      setError("Une erreur est survenue. Veuillez réessayer ou nous contacter directement.");
      setLoading(false);
      return;
    }

    // Send email notification (non-blocking)
    await sendDevisEmail({
      ...payload,
      product_category: payload.product_category ?? undefined,
      product_brand: payload.product_brand ?? undefined,
      product_model: payload.product_model ?? undefined,
      location: payload.location ?? undefined,
      desired_date: payload.desired_date ?? undefined,
      notes: payload.notes ?? undefined,
    });

    setReference(ref);
    setStep("success");
    setLoading(false);
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center">
          <img src={vematLogo} alt="Vemat" className="h-7 brightness-0 invert mx-auto mb-10" />
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">Demande envoyée !</h1>
            <p className="text-zinc-400 text-sm mb-6">
              Nous avons bien reçu votre demande de devis. Notre équipe vous contactera dans les plus brefs délais.
            </p>
            <div className="bg-zinc-800 rounded-xl px-6 py-4 mb-8">
              <p className="text-xs text-zinc-500 mb-1">Référence de votre demande</p>
              <p className="text-2xl font-black text-white font-mono tracking-wider">{reference}</p>
              <p className="text-xs text-zinc-600 mt-1">Conservez cette référence pour tout suivi</p>
            </div>
            <div className="space-y-3">
              <Link href="/">
                <div className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/15 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />
                  Retour au site Vemat
                </div>
              </Link>
              <button
                onClick={() => {
                  setStep("form");
                  setCompanyName(""); setContactName(""); setContactPhone(""); setContactEmail("");
                  setCategory(""); setSubCatSlug(""); setModelName(""); setQuantity("1");
                  setLocation(""); setDesiredDate(""); setNotes("");
                }}
                className="w-full text-zinc-500 hover:text-white text-sm py-2 transition-colors"
              >
                Soumettre une autre demande
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/">
            <img src={vematLogo} alt="Vemat" className="h-7 brightness-0 invert mx-auto mb-6 cursor-pointer" />
          </Link>
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 mb-4">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Demande de devis</span>
          </div>
          <h1 className="text-2xl font-black text-white">Obtenez un devis personnalisé</h1>
          <p className="text-zinc-500 text-sm mt-2">Remplissez le formulaire ci-dessous. Notre équipe vous répond sous 24h.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Coordonnées */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-5">01 — Vos coordonnées</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <InputField label="Société" value={companyName} onChange={setCompanyName} placeholder="Nom de votre entreprise" required />
              </div>
              <InputField label="Nom & Prénom" value={contactName} onChange={setContactName} placeholder="Mohamed El Fassi" required />
              <InputField label="Téléphone" type="tel" value={contactPhone} onChange={setContactPhone} placeholder="+212 6 XX XX XX XX" required />
              <div className="sm:col-span-2">
                <InputField label="Adresse email" type="email" value={contactEmail} onChange={setContactEmail} placeholder="contact@votre-societe.ma" required />
              </div>
            </div>
          </div>

          {/* Section 2: Machine */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-5">02 — Machine souhaitée</h2>
            <div className="space-y-4">
              <SelectField label="Catégorie" value={category} onChange={handleCategoryChange}>
                <option value="">— Sélectionnez une catégorie —</option>
                {(Object.keys(CATEGORY_LABELS) as CategorySlug[]).map((k) => (
                  <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
                ))}
              </SelectField>

              {category && (
                <SelectField label="Type / Gamme" value={subCatSlug} onChange={handleSubCatChange}>
                  <option value="">— Sélectionnez un type —</option>
                  {subCategories.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.title.fr}</option>
                  ))}
                </SelectField>
              )}

              {subCatSlug && models.length > 0 && (
                <SelectField label="Modèle" value={modelName} onChange={setModelName}>
                  <option value="">— Sélectionnez un modèle (optionnel) —</option>
                  {models.map((m) => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </SelectField>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-300">
                  Quantité <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent w-32"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Détails */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-5">03 — Informations complémentaires</h2>
            <div className="space-y-4">
              <InputField label="Localisation / Chantier" value={location} onChange={setLocation} placeholder="Casablanca, Maroc" />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-300">Date souhaitée</label>
                <input
                  type="date"
                  value={desiredDate}
                  onChange={(e) => setDesiredDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-300">Notes / Précisions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Durée de location souhaitée, contraintes de chantier, spécifications particulières…"
                  rows={4}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-black text-sm px-6 py-4 rounded-xl transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours…</>
            ) : (
              "Envoyer ma demande de devis"
            )}
          </button>

          <p className="text-center text-xs text-zinc-600 pb-4">
            En soumettant ce formulaire, vous acceptez d'être contacté par l'équipe Vemat Group.
          </p>
        </form>
      </div>
    </div>
  );
}
