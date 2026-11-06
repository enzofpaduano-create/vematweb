/** En-tête (papier à lettre) choisi pour un document. Défaut : Westchase (tous les documents existants). */
export type Letterhead = "westchase" | "casablanca";

export const LETTERHEADS: Array<{ id: Letterhead; label: string; hint: string }> = [
  { id: "westchase", label: "Vemat Westchase LTD", hint: "Nigeria · anglais · coordonnées bancaires Zenith" },
  { id: "casablanca", label: "Vemat Casablanca", hint: "Maroc · français · MAD · TVA modifiable · sans banque" },
];

export const DEFAULT_LETTERHEAD: Letterhead = "westchase";
/** TVA marocaine par défaut (modifiable sur chaque document). */
export const MA_DEFAULT_VAT = 20;

export function normalizeLetterhead(v: unknown): Letterhead {
  return v === "casablanca" ? "casablanca" : "westchase";
}
