import raw from "../../assets/reports/inspection-checklist.json";

export interface ChecklistRow { id: string; code: string; label: string }
export interface ChecklistSection { id: string; title: string; rows: ChecklistRow[] }
export interface ChecklistPage { id: "porteur" | "superstructure"; title: string; sections: ChecklistSection[] }

export const CHECKLIST: ChecklistPage[] = (raw as { pages: ChecklistPage[] }).pages;

/** Tous les identifiants de points de contrôle valides (cellule d'étiquette du modèle Excel). */
export const ROW_IDS: Set<string> = new Set(CHECKLIST.flatMap((p) => p.sections.flatMap((s) => s.rows.map((r) => r.id))));

export const TOTAL_ROWS = ROW_IDS.size;

/** Colonnes de résultat (notes 1 à 4) selon la colonne d'étiquette du modèle : B → C-F, H → I-L, N → O-R. */
const RESULT_COLS: Record<string, string[]> = {
  B: ["C", "D", "E", "F"],
  H: ["I", "J", "K", "L"],
  N: ["O", "P", "Q", "R"],
};

export function resultCell(rowId: string, score: number): string | null {
  const m = /^([BHN])(\d+)$/.exec(rowId);
  if (!m) return null;
  return `${RESULT_COLS[m[1]][score - 1]}${m[2]}`;
}

export function pageOf(rowId: string): "porteur" | "superstructure" {
  return Number(rowId.replace(/^\D+/, "")) >= 50 ? "superstructure" : "porteur";
}
