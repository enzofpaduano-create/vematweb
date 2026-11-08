import { supabaseTech } from "@/lib/supabase";
import type { AnyDraft, InterventionDraft } from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export type SendResult =
  | { ok: true; reportNo: string }
  | { ok: false; retry: boolean; message: string };

/**
 * Envoie le rapport au serveur, qui génère le PDF + l'Excel et les expédie par e-mail.
 * retry = true : le rapport est conservé sur le téléphone pour un nouvel essai (réseau, serveur).
 */
export async function sendDraft(draft: AnyDraft): Promise<SendResult> {
  return post(draft.kind === "inspection" ? "inspection" : "intervention", draft);
}

export async function sendIntervention(draft: InterventionDraft): Promise<SendResult> {
  return post("intervention", draft);
}

async function post(route: "intervention" | "inspection", draft: AnyDraft): Promise<SendResult> {
  const { data: sess } = await supabaseTech.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) return { ok: false, retry: true, message: "Session expirée : reconnectez-vous puis renvoyez." };

  const d = draft.data;
  const body = {
    id: draft.id,
    ...d,
    photos: d.photos.map((p) => ({ dataUrl: p.dataUrl, caption: p.caption })),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/reports/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const j = (await res.json()) as { reportNo?: string };
      return { ok: true, reportNo: j.reportNo ?? "" };
    }
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    // 400 : données refusées → à corriger, inutile de réessayer tel quel.
    return { ok: false, retry: res.status !== 400, message: j.error ?? `Erreur ${res.status}` };
  } catch {
    return { ok: false, retry: true, message: "Pas de connexion : le rapport est gardé sur le téléphone." };
  }
}
