import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Loader2, ArrowLeft, Wrench, AlertTriangle, AlertOctagon, Minus } from "lucide-react";
import vematLogo from "@/assets/vemat-logo.png";
import { supabasePublic } from "@/lib/supabase";
import { sendInterventionEmail } from "@/lib/emailService";
import type { InterventionUrgency } from "@/lib/database.types";

function genRef() {
  return `INT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
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
        className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
    </div>
  );
}

const URGENCY_OPTIONS: {
  value: InterventionUrgency;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  border: string;
  bg: string;
}[] = [
  {
    value: "normale",
    label: "Normale",
    desc: "Intervention à planifier sous quelques jours",
    icon: Minus,
    color: "text-zinc-300",
    border: "border-zinc-700",
    bg: "bg-zinc-800",
  },
  {
    value: "urgente",
    label: "Urgente",
    desc: "Intervention requise dans les 24–48h",
    icon: AlertTriangle,
    color: "text-amber-400",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
  },
  {
    value: "tres_urgente",
    label: "Très urgente",
    desc: "Arrêt de chantier / sécurité immédiate requise",
    icon: AlertOctagon,
    color: "text-red-400",
    border: "border-red-500/40",
    bg: "bg-red-500/10",
  },
];

export default function DemandeIntervention() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");

  // Contact
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Machine
  const [machineType, setMachineType] = useState("");
  const [machineBrand, setMachineBrand] = useState("");
  const [machineModel, setMachineModel] = useState("");
  const [machineSerial, setMachineSerial] = useState("");

  // Intervention
  const [problemDescription, setProblemDescription] = useState("");
  const [urgency, setUrgency] = useState<InterventionUrgency>("normale");
  const [location, setLocation] = useState("");

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
      machine_type: machineType.trim(),
      machine_brand: machineBrand.trim() || null,
      machine_model: machineModel.trim() || null,
      machine_serial: machineSerial.trim() || null,
      problem_description: problemDescription.trim(),
      urgency,
      location: location.trim(),
      status: "nouveau",
    };

    const { error: dbError } = await supabasePublic
      .from("form_interventions")
      .insert(payload);

    if (dbError) {
      setError("Une erreur est survenue. Veuillez réessayer ou nous contacter directement.");
      setLoading(false);
      return;
    }

    // Send email notification (non-blocking)
    await sendInterventionEmail({
      ...payload,
      machine_brand: payload.machine_brand ?? undefined,
      machine_model: payload.machine_model ?? undefined,
      machine_serial: payload.machine_serial ?? undefined,
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
            <h1 className="text-2xl font-black text-white mb-2">Demande enregistrée !</h1>
            <p className="text-zinc-400 text-sm mb-6">
              Votre demande d'intervention a été transmise à notre équipe technique. Nous vous recontactons rapidement pour planifier l'intervention.
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
                  setMachineType(""); setMachineBrand(""); setMachineModel(""); setMachineSerial("");
                  setProblemDescription(""); setUrgency("normale"); setLocation("");
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
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4">
            <Wrench className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Demande d'intervention</span>
          </div>
          <h1 className="text-2xl font-black text-white">Signalez une panne ou un besoin d'entretien</h1>
          <p className="text-zinc-500 text-sm mt-2">Notre équipe SAV vous prend en charge rapidement.</p>
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
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-5">02 — Identification de la machine</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <InputField label="Type de machine" value={machineType} onChange={setMachineType} placeholder="Grue à tour, Nacelle, Élévateur…" required />
              </div>
              <InputField label="Marque" value={machineBrand} onChange={setMachineBrand} placeholder="Tadano, JLG, Terex…" />
              <InputField label="Modèle" value={machineModel} onChange={setMachineModel} placeholder="TRT 50, 600AJ…" />
              <div className="sm:col-span-2">
                <InputField label="N° de série" value={machineSerial} onChange={setMachineSerial} placeholder="Numéro de série ou référence interne" />
              </div>
            </div>
          </div>

          {/* Section 3: Urgence */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-5">03 — Niveau d'urgence <span className="text-red-400">*</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {URGENCY_OPTIONS.map(({ value, label, desc, icon: Icon, color, border, bg }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUrgency(value)}
                  className={`relative flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                    urgency === value
                      ? `${bg} ${border} ring-2 ring-offset-2 ring-offset-zinc-900 ring-current ${color}`
                      : "bg-zinc-800 border-zinc-700 hover:border-zinc-600"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${urgency === value ? color : "text-zinc-500"}`} />
                  <p className={`text-sm font-bold ${urgency === value ? color : "text-zinc-300"}`}>{label}</p>
                  <p className="text-xs text-zinc-500 leading-snug">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Description */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-5">04 — Description & localisation</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-300">
                  Description du problème <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Décrivez la panne, le dysfonctionnement ou les travaux d'entretien à réaliser…"
                  rows={5}
                  required
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>
              <InputField
                label="Adresse d'intervention"
                value={location}
                onChange={setLocation}
                placeholder="Rue, ville, région"
                required
              />
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
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white font-black text-sm px-6 py-4 rounded-xl transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours…</>
            ) : (
              "Envoyer ma demande d'intervention"
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
