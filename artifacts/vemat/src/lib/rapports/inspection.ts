import raw from "./inspectionChecklist.json";
import type { Score } from "./types";

export interface ChecklistRow { id: string; code: string; label: string }
export interface ChecklistSection { id: string; title: string; rows: ChecklistRow[] }
export interface ChecklistPage { id: "porteur" | "superstructure"; title: string; sections: ChecklistSection[] }

export const CHECKLIST: ChecklistPage[] = (raw as { pages: ChecklistPage[] }).pages;
export const TOTAL_ROWS = CHECKLIST.reduce((n, p) => n + p.sections.reduce((m, s) => m + s.rows.length, 0), 0);

export const SCORE_LABEL: Record<Score, string> = { 1: "Bonne condition", 2: "Moyenne condition", 3: "Erreur / défaut", 4: "Non contrôlable" };
/** Classes Tailwind complètes (pas de concaténation dynamique, pour que Tailwind les génère). */
export const SCORE_ON: Record<Score, string> = {
  1: "bg-emerald-600 border-emerald-500 text-white",
  2: "bg-amber-500 border-amber-400 text-zinc-900",
  3: "bg-red-600 border-red-500 text-white",
  4: "bg-zinc-500 border-zinc-400 text-white",
};

export function sectionCounts(s: ChecklistSection, scores: Record<string, Score>) {
  const c = { done: 0, total: s.rows.length, bad: 0 };
  for (const r of s.rows) {
    const v = scores[r.id];
    if (v) c.done++;
    if (v === 3 || v === 4) c.bad++;
  }
  return c;
}
