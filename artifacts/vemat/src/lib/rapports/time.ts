/** Calcul des heures du rapport d'intervention (miroir du calcul serveur). */
import type { TimeRow } from "./types";

function parse(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((v ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  return h > 23 || mi > 59 ? null : h * 60 + mi;
}

export function spanMinutes(from: string, to: string): number {
  const a = parse(from);
  const b = parse(to);
  return a === null || b === null || b <= a ? 0 : b - a;
}

export const travelMinutes = (r: TimeRow) => spanMinutes(r.voyMatinDeb, r.voyMatinFin) + spanMinutes(r.voySoirDeb, r.voySoirFin);
export const workMinutes = (r: TimeRow) => spanMinutes(r.travMatinDeb, r.travMatinFin) + spanMinutes(r.travSoirDeb, r.travSoirFin);

export function fmtMinutes(total: number): string {
  if (!total) return "0h00";
  return `${Math.floor(total / 60)}h${String(total % 60).padStart(2, "0")}`;
}

/** true si le créneau est incohérent (fin avant début, ou une seule des deux heures saisie). */
export function slotError(from: string, to: string): boolean {
  if (!from && !to) return false;
  if (!from || !to) return true;
  return spanMinutes(from, to) === 0;
}
