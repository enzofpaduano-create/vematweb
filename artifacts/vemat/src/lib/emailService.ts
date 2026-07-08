/**
 * Notifications email des demandes du site.
 *
 * L'envoi passe par le backend (Cloud Run → SMTP cPanel InMotion), via
 * `POST /api/notify`. Le backend choisit la boîte destinataire selon le
 * `type` envoyé (le client ne choisit jamais l'adresse) :
 *
 *   machines → vemat@vematgroup.com                        (devis machines, fallback générique)
 *   pdr      → commercial.pdr@vematgroup.com + vemat@      (pièces de rechange)
 *   sav      → vemat.sav@vematgroup.com      + vemat@      (SAV / interventions)
 *
 * `vemat@vematgroup.com` est en copie sur pdr et sav pour supervision.
 *
 * Si le backend ou le SMTP n'est pas configuré, l'enregistrement en base reste
 * la source de vérité — l'email échoue silencieusement.
 */

type Recipient = "machines" | "pdr" | "sav";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function buildApiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

async function sendNotification(
  recipient: Recipient,
  subject: string,
  body: string,
  replyTo?: string,
) {
  try {
    await fetch(buildApiUrl("/api/notify"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ type: recipient, subject, body, replyTo }),
    });
  } catch {
    // Fail silently — the DB insert is the source of truth
  }
}

export async function sendDevisEmail(params: {
  reference: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  product_category?: string;
  product_brand?: string;
  product_model?: string;
  quantity: number;
  location?: string;
  desired_date?: string;
  notes?: string;
  /** true = demande de pièces de rechange (→ PDR), false/absent = machine (→ machines) */
  isSpareParts?: boolean;
}) {
  const recipient: Recipient = params.isSpareParts ? "pdr" : "machines";
  const tag = params.isSpareParts ? "DEVIS PIÈCES" : "DEVIS MACHINE";
  const subject = `[${tag}] ${params.reference} — ${params.company_name}`;
  const body = `
Nouvelle demande de devis reçue via le site Vemat Group.

Référence : ${params.reference}
Date       : ${new Date().toLocaleDateString("fr-FR")}

── COORDONNÉES ──────────────────────────────
Société    : ${params.company_name}
Contact    : ${params.contact_name}
Téléphone  : ${params.contact_phone}
Email      : ${params.contact_email}

── MACHINE SOUHAITÉE ────────────────────────
Catégorie  : ${params.product_category ?? "Non précisée"}
Type       : ${params.product_brand ?? "Non précisé"}
Modèle     : ${params.product_model ?? "Non précisé"}
Quantité   : ${params.quantity}

── DÉTAILS ──────────────────────────────────
Localisation    : ${params.location ?? "Non précisée"}
Date souhaitée  : ${params.desired_date ?? "Non précisée"}
Notes           : ${params.notes ?? "—"}

─────────────────────────────────────────────
Retrouvez cette demande dans l'Espace Manager → Demandes entrantes.
  `.trim();

  await sendNotification(recipient, subject, body, params.contact_email);
}

export async function sendInterventionEmail(params: {
  reference: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  machine_type: string;
  machine_brand?: string;
  machine_model?: string;
  machine_serial?: string;
  problem_description: string;
  urgency: string;
  location: string;
  attachments?: string[];
}) {
  const urgencyLabel: Record<string, string> = {
    normale: "Normale",
    urgente: "⚠️ URGENTE",
    tres_urgente: "🚨 TRÈS URGENTE",
  };
  const urg = urgencyLabel[params.urgency] ?? params.urgency;

  const attachmentSection = params.attachments && params.attachments.length > 0
    ? `\n── PIÈCES JOINTES ───────────────────────────\n${params.attachments.map((url, i) => `Fichier ${i + 1} : ${url}`).join("\n")}\n`
    : "";

  const subject = `[INTERVENTION ${urg}] ${params.reference} — ${params.company_name}`;
  const body = `
Nouvelle demande d'intervention reçue via le site Vemat Group.

Référence : ${params.reference}
Date      : ${new Date().toLocaleDateString("fr-FR")}
Urgence   : ${urg}

── COORDONNÉES ──────────────────────────────
Société   : ${params.company_name}
Contact   : ${params.contact_name}
Téléphone : ${params.contact_phone}
Email     : ${params.contact_email}

── MACHINE ──────────────────────────────────
Type      : ${params.machine_type}
Marque    : ${params.machine_brand ?? "Non précisée"}
Modèle    : ${params.machine_model ?? "Non précisé"}
N° série  : ${params.machine_serial ?? "Non précisé"}

── INTERVENTION ─────────────────────────────
Description : ${params.problem_description}
Adresse     : ${params.location}
${attachmentSection}
─────────────────────────────────────────────
Retrouvez cette demande dans l'Espace Manager → Demandes entrantes.
  `.trim();

  await sendNotification("sav", subject, body, params.contact_email);
}

// ─── Formulaire Contact (page /contact) ──────────────────────────────────────
// Route selon le type de demande sélectionné dans le dropdown :
//   devis / autre → machines (vemat@)
//   sav           → sav      (vemat.sav@ + vemat@)
//   pieces        → pdr      (commercial.pdr@ + vemat@)

export type ContactTypeDemande = "devis" | "sav" | "pieces" | "autre";

function contactRecipientFor(type: ContactTypeDemande): Recipient {
  switch (type) {
    case "sav":
      return "sav";
    case "pieces":
      return "pdr";
    case "devis":
    case "autre":
    default:
      return "machines";
  }
}

const CONTACT_TYPE_LABEL: Record<ContactTypeDemande, string> = {
  devis: "Devis machine",
  sav: "SAV",
  pieces: "Pièces de rechange",
  autre: "Autre",
};

export async function sendContactEmail(params: {
  reference: string;
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  typeDemande: ContactTypeDemande;
  message: string;
}) {
  const recipient = contactRecipientFor(params.typeDemande);
  const typeLabel = CONTACT_TYPE_LABEL[params.typeDemande] ?? params.typeDemande;
  const subject = `[CONTACT — ${typeLabel}] ${params.reference} — ${params.entreprise || params.nom}`;
  const body = `
Nouveau message reçu via le formulaire Contact du site Vemat Group.

Référence : ${params.reference}
Date      : ${new Date().toLocaleDateString("fr-FR")}
Type      : ${typeLabel}

── COORDONNÉES ──────────────────────────────
Nom       : ${params.nom}
Société   : ${params.entreprise || "—"}
Email     : ${params.email}
Téléphone : ${params.telephone}

── MESSAGE ──────────────────────────────────
${params.message}

─────────────────────────────────────────────
Répondre directement à ${params.email}.
  `.trim();

  await sendNotification(recipient, subject, body, params.email);
}
