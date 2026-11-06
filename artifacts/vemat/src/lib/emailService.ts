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

type Recipient = "machines" | "pdr" | "sav" | "validation";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function buildApiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

async function sendNotification(
  recipient: Recipient,
  subject: string,
  body: string,
  replyTo?: string,
  toOverride?: string,
) {
  try {
    await fetch(buildApiUrl("/api/notify"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ type: recipient, subject, body, replyTo, toOverride }),
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

// ─── Validation workflow (Hassan Phase 3) ────────────────────────────────────

export async function sendValidationRequestEmail(params: {
  portal: "PDR" | "SAV";
  reference: string | null;
  clientName: string;
  totalAmount: number;
  currency: "EUR" | "USD" | "MAD";
  reasons: string[];
  requestedBy?: string;      // agent / user email who submitted
  managerEmail: string;      // recipient
  docUrl?: string;           // direct link to the doc detail page
  note?: string;
}) {
  const cur = params.currency === "EUR" ? "€" : params.currency === "MAD" ? "MAD" : "$";
  const subject = `[VALIDATION ${params.portal}] ${params.reference ?? ""} — ${params.clientName} (${params.totalAmount.toLocaleString("en-GB")} ${cur})`;
  const body = `
Validation request — ${params.portal} portal

Client        : ${params.clientName}
Reference     : ${params.reference ?? "—"}
Total amount  : ${params.totalAmount.toLocaleString("en-GB")} ${cur}
Requested by  : ${params.requestedBy ?? "—"}

Why this document needs approval:
${params.reasons.map((r) => `  • ${r}`).join("\n") || "  • (business rule not specified)"}

${params.note ? `Note from requester:\n${params.note}\n` : ""}
Please review and approve or reject in the portal:
${params.docUrl ?? "(open the portal → Documents → search the reference)"}
  `.trim();

  await sendNotification("validation", subject, body, undefined, params.managerEmail);
}

export async function sendValidationDecisionEmail(params: {
  portal: "PDR" | "SAV";
  reference: string | null;
  clientName: string;
  decision: "approved" | "rejected";
  decidedBy: string;
  note?: string;
  requesterEmail?: string;   // if we know who to notify back
  docUrl?: string;
}) {
  const tag = params.decision === "approved" ? "APPROVED" : "REJECTED";
  const subject = `[VALIDATION ${tag}] ${params.reference ?? ""} — ${params.clientName}`;
  const body = `
Validation ${params.decision.toUpperCase()} — ${params.portal} portal

Client       : ${params.clientName}
Reference    : ${params.reference ?? "—"}
Decided by   : ${params.decidedBy}

${params.note ? `Note:\n${params.note}\n\n` : ""}${params.decision === "approved"
    ? "You can now mark this document as Sent to the client."
    : "Please revise the document, then request validation again."}

${params.docUrl ?? ""}
  `.trim();

  // Send to master vemat@ + requester if known (via toOverride slot).
  await sendNotification("validation", subject, body, undefined, params.requesterEmail);
}

// ─── Credit note (avoir) workflow — Hassan Phase 4 ──────────────────────────

export type AvoirApprovalStage = "manager" | "finance";

export async function sendAvoirApprovalRequestEmail(params: {
  portal: "PDR" | "SAV";
  stage: AvoirApprovalStage;   // who receives the request
  reference: string | null;
  clientName: string;
  totalAmount: number;
  currency: "EUR" | "USD" | "MAD";
  reason: string;              // required — motif de l'avoir
  requestedBy?: string;
  approverEmail: string;       // manager_email or finance_email depending on stage
  docUrl?: string;
}) {
  const cur = params.currency === "EUR" ? "€" : params.currency === "MAD" ? "MAD" : "$";
  const stageLabel = params.stage === "manager" ? "Manager SAV" : "Direction Financière";
  const subject = `[CREDIT NOTE — ${stageLabel}] ${params.reference ?? ""} — ${params.clientName} (${params.totalAmount.toLocaleString("en-GB")} ${cur})`;
  const body = `
Credit note approval request — ${params.portal} portal

Approval stage : ${stageLabel} (${params.stage === "manager" ? "1st of 2" : "2nd of 2"})
Reference     : ${params.reference ?? "—"}
Client        : ${params.clientName}
Amount        : ${params.totalAmount.toLocaleString("en-GB")} ${cur}
Reason (motif) : ${params.reason}
Requested by  : ${params.requestedBy ?? "—"}

${params.stage === "manager"
  ? "Please review as Manager. If you approve, the request will be forwarded to Direction Financière."
  : "Manager SAV has already approved. Please review as Direction Financière — this is the final step."}

Approve or reject in the portal:
${params.docUrl ?? "(open the portal → Documents → search the reference)"}
  `.trim();

  await sendNotification("validation", subject, body, undefined, params.approverEmail);
}

export async function sendAvoirDecisionEmail(params: {
  portal: "PDR" | "SAV";
  stage: AvoirApprovalStage;   // who just decided
  reference: string | null;
  clientName: string;
  decision: "approved" | "rejected";
  decidedBy: string;
  note?: string;
  requesterEmail?: string;     // notify back the person who created the avoir
  docUrl?: string;
}) {
  const tag = params.decision === "approved" ? "APPROVED" : "REJECTED";
  const stageLabel = params.stage === "manager" ? "Manager SAV" : "Direction Financière";
  const subject = `[CREDIT NOTE ${tag} · ${stageLabel}] ${params.reference ?? ""} — ${params.clientName}`;

  const nextStep =
    params.decision === "approved" && params.stage === "manager"
      ? "The request has been forwarded to Direction Financière for final approval."
      : params.decision === "approved" && params.stage === "finance"
      ? "The credit note is now fully approved and can be issued to the client."
      : "The credit note has been rejected. Please revise or discard.";

  const body = `
Credit note ${params.decision.toUpperCase()} at ${stageLabel} — ${params.portal} portal

Reference   : ${params.reference ?? "—"}
Client      : ${params.clientName}
Decided by  : ${params.decidedBy}
${params.note ? `Note:\n${params.note}\n` : ""}
${nextStep}

${params.docUrl ?? ""}
  `.trim();

  await sendNotification("validation", subject, body, undefined, params.requesterEmail);
}
