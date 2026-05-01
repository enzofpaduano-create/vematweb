/**
 * Email notifications via Web3Forms (https://web3forms.com)
 *
 * Setup (2 min):
 *  1. Go to https://web3forms.com
 *  2. Enter your Vemat email address → get an Access Key
 *  3. Add to Netlify environment variables:
 *       VITE_WEB3FORMS_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *
 * Without the key, the DB insert still works — emails are just skipped silently.
 */

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;

async function submitToWeb3Forms(subject: string, body: string, fromName: string) {
  if (!WEB3FORMS_KEY) return;
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject,
        message: body,
        from_name: fromName,
        botcheck: "",
      }),
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
}) {
  const subject = `[DEVIS] ${params.reference} — ${params.company_name}`;
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

  await submitToWeb3Forms(subject, body, "Formulaire Devis Vemat");
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

  await submitToWeb3Forms(subject, body, "Formulaire Intervention Vemat");
}
