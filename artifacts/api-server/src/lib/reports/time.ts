import type { TimeRow } from "./types";

/** Minutes entre deux heures "HH:MM" (0 si incomplet ou si fin <= début). */
export function spanMinutes(from: string, to: string): number {
  const a = parse(from);
  const b = parse(to);
  if (a === null || b === null) return 0;
  return b > a ? b - a : 0;
}

function parse(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((v ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

export function rowTravelMinutes(r: TimeRow): number {
  return spanMinutes(r.voyMatinDeb, r.voyMatinFin) + spanMinutes(r.voySoirDeb, r.voySoirFin);
}

export function rowWorkMinutes(r: TimeRow): number {
  return spanMinutes(r.travMatinDeb, r.travMatinFin) + spanMinutes(r.travSoirDeb, r.travSoirFin);
}

/** 150 -> "2h30" ; 0 -> "" */
export function fmtMinutes(total: number): string {
  if (!total) return "";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

/** yyyy-mm-dd -> "dd / mm / yyyy" ("" si invalide) */
export function fmtDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? "").trim());
  return m ? `${m[3]} / ${m[2]} / ${m[1]}` : "";
}

export function totals(rows: TimeRow[]): { travel: number; work: number } {
  return {
    travel: rows.reduce((s, r) => s + rowTravelMinutes(r), 0),
    work: rows.reduce((s, r) => s + rowWorkMinutes(r), 0),
  };
}
