import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

/**
 * Envoi des notifications de formulaire via le SMTP cPanel (InMotion).
 *
 * Le destinataire est choisi par le serveur à partir du `type` de demande —
 * jamais par le client — pour éviter que l'endpoint serve de relais ouvert.
 *
 * Politique de routage :
 *   machines → vemat@                          (devis machines et fallback générique)
 *   pdr      → commercial.pdr@ + vemat@        (pièces de rechange, copie master)
 *   sav      → vemat.sav@      + vemat@        (SAV / interventions, copie master)
 *
 * `vemat@vematgroup.com` reçoit systématiquement une copie pour supervision.
 *
 * Variables d'env attendues (Cloud Run) :
 *   SMTP_HOST   ex: mail.vematgroup.com
 *   SMTP_PORT   465 (SSL) ou 587 (STARTTLS)
 *   SMTP_SECURE "true" pour le port 465
 *   SMTP_USER   boîte authentifiée, ex: vemat@vematgroup.com
 *   SMTP_PASS   mot de passe de la boîte
 *   MAIL_FROM   (optionnel) ex: "Site Vemat <vemat@vematgroup.com>" (défaut: SMTP_USER)
 *   MAIL_MASTER      (optionnel, défaut vemat@vematgroup.com) — boîte qui reçoit tout
 *   MAIL_TO_PDR      (optionnel, défaut commercial.pdr@vematgroup.com)
 *   MAIL_TO_SAV      (optionnel, défaut vemat.sav@vematgroup.com)
 */

export type NotifyType = "machines" | "pdr" | "sav";

const MASTER = process.env.MAIL_MASTER || "vemat@vematgroup.com";

const RECIPIENTS: Record<NotifyType, string[]> = {
  machines: [MASTER],
  pdr: [process.env.MAIL_TO_PDR || "commercial.pdr@vematgroup.com", MASTER],
  sav: [process.env.MAIL_TO_SAV || "vemat.sav@vematgroup.com", MASTER],
};

export function isNotifyType(value: unknown): value is NotifyType {
  return value === "machines" || value === "pdr" || value === "sav";
}

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn("SMTP non configuré (SMTP_HOST/SMTP_USER/SMTP_PASS manquants) — email ignoré.");
    return null;
  }

  if (cachedTransport) return cachedTransport;

  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465;

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return cachedTransport;
}

export async function sendFormNotification(params: {
  type: NotifyType;
  subject: string;
  body: string;
  replyTo?: string;
}): Promise<{ sent: boolean }> {
  const transport = getTransport();
  if (!transport) return { sent: false };

  const from = process.env.MAIL_FROM || process.env.SMTP_USER!;
  const to = RECIPIENTS[params.type];

  await transport.sendMail({
    from,
    to: to.join(", "),
    replyTo: params.replyTo || undefined,
    subject: params.subject,
    text: params.body,
  });

  logger.info({ to, type: params.type }, "Notification email envoyée");
  return { sent: true };
}
