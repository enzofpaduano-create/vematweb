/** Rapport d'inspection grue — données saisies par le technicien sur téléphone. */
import type { ReportPhoto } from "./types";

export type InspectionKind = "inspection" | "condition" | "final";
export type Score = 1 | 2 | 3 | 4;

export interface EngineInfo {
  produit: string;
  type: string;
  serie: string;
  cv: string;
  rpm: string;
  epa: string;
}

export interface DefectRow {
  zone: "porteur" | "tourelle";
  description: string;
  commentaire: string;
}

export interface TyreAxle {
  gMarque: string;
  gDim: string;
  gUsure: string;
  dMarque: string;
  dDim: string;
  dUsure: string;
}

export interface InspectionReport {
  reportNo: string;
  kind: InspectionKind;
  ot: string;
  client: string;
  /** yyyy-mm-dd */
  date: string;
  type: string;
  serie: string;
  technicien: string;
  km: string;
  hrs: string;
  lieu: string;
  /** identifiant de ligne (cellule du modèle, ex. "B9") → note 1 à 4 */
  scores: Record<string, Score>;
  moteurPorteur: EngineInfo;
  moteurTourelle: EngineInfo;
  commentairePorteur: string;
  commentaireTourelle: string;
  defauts: DefectRow[];
  /** 4 points de mesure × 3 essais (texte libre, en 0,01 mm) */
  couronne: { t1: string; t2: string; t3: string }[];
  pneus: TyreAxle[];
  pneusCommentaire: string;
  photos: ReportPhoto[];
}

export const MAX_DEFECTS = 60;
export const MAX_AXLES = 9;
export const KIND_LABEL: Record<InspectionKind, string> = {
  inspection: "Rapport d'inspection",
  condition: "Condition",
  final: "Contrôle final",
};
