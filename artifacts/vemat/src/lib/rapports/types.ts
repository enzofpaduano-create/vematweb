export interface TimeRow {
  date: string;
  voyMatinDeb: string;
  voyMatinFin: string;
  voySoirDeb: string;
  voySoirFin: string;
  travMatinDeb: string;
  travMatinFin: string;
  travSoirDeb: string;
  travSoirFin: string;
}

export interface ReportPhoto {
  id: string;
  dataUrl: string;
  caption: string;
}

export interface InterventionData {
  /** N° de fiche du carnet du technicien (numérote le rapport). */
  ficheNo: string;
  otNo: string;
  client: string;
  chantier: string;
  contact: string;
  tel: string;
  modele: string;
  serie: string;
  comptHr: string;
  technicien: string;
  vehicule: string;
  nature: string;
  detail: string;
  rows: TimeRow[];
  repas: string;
  nuits: string;
  km: string;
  garantie: boolean | null;
  fournitures: boolean | null;
  travauxRestant: boolean | null;
  travauxRestantDetail: string;
  signatureTech: string | null;
  signatureClient: string | null;
  photos: ReportPhoto[];
}

/** draft = en cours de saisie · queued = terminé, en attente d'envoi (hors-ligne / échec) · sent = envoyé */
export type DraftStatus = "draft" | "queued" | "sent";

/** Note d'un point de contrôle : 1 bonne condition · 2 moyenne · 3 erreur/défaut · 4 non contrôlable. */
export type Score = 1 | 2 | 3 | 4;
export type InspectionKind = "inspection" | "condition" | "final";

export interface EngineInfo { produit: string; type: string; serie: string; cv: string; rpm: string; epa: string }
export interface DefectRow { id: string; zone: "porteur" | "tourelle"; description: string; commentaire: string }
export interface TyreAxle { gMarque: string; gDim: string; gUsure: string; dMarque: string; dDim: string; dUsure: string }

export interface InspectionData {
  /** N° de fiche du carnet du technicien (numérote le rapport). */
  ficheNo: string;
  kind: InspectionKind;
  ot: string;
  client: string;
  date: string;
  type: string;
  serie: string;
  technicien: string;
  km: string;
  hrs: string;
  lieu: string;
  /** identifiant du point de contrôle → note */
  scores: Record<string, Score>;
  moteurPorteur: EngineInfo;
  moteurTourelle: EngineInfo;
  commentairePorteur: string;
  commentaireTourelle: string;
  defauts: DefectRow[];
  couronne: { t1: string; t2: string; t3: string }[];
  pneus: TyreAxle[];
  pneusCommentaire: string;
  photos: ReportPhoto[];
}

export interface InspectionDraft {
  id: string;
  kind: "inspection";
  status: DraftStatus;
  updatedAt: number;
  sentAt?: number;
  reportNo?: string;
  lastError?: string;
  data: InspectionData;
}

export type AnyDraft = InterventionDraft | InspectionDraft;

export const MAX_DEFECTS = 60;
export const MAX_AXLES = 9;

export const emptyEngine = (): EngineInfo => ({ produit: "", type: "", serie: "", cv: "", rpm: "", epa: "" });

export function emptyInspection(technicien: string): InspectionData {
  return {
    ficheNo: "", kind: "inspection", ot: "", client: "", date: todayIso(), type: "", serie: "", technicien,
    km: "", hrs: "", lieu: "",
    scores: {},
    moteurPorteur: emptyEngine(), moteurTourelle: emptyEngine(),
    commentairePorteur: "", commentaireTourelle: "",
    defauts: [],
    couronne: [0, 1, 2, 3].map(() => ({ t1: "", t2: "", t3: "" })),
    pneus: [], pneusCommentaire: "",
    photos: [],
  };
}

export interface InterventionDraft {
  id: string;
  kind: "intervention";
  status: DraftStatus;
  updatedAt: number;
  sentAt?: number;
  reportNo?: string;
  lastError?: string;
  data: InterventionData;
}

export const MAX_ROWS = 7;
export const MAX_PHOTOS = 24;

export const emptyRow = (date = ""): TimeRow => ({
  date,
  voyMatinDeb: "", voyMatinFin: "", voySoirDeb: "", voySoirFin: "",
  travMatinDeb: "", travMatinFin: "", travSoirDeb: "", travSoirFin: "",
});

export const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function emptyIntervention(technicien: string, vehicule: string): InterventionData {
  return {
    ficheNo: "", otNo: "", client: "", chantier: "", contact: "", tel: "",
    modele: "", serie: "", comptHr: "", technicien, vehicule,
    nature: "", detail: "",
    rows: [emptyRow(todayIso())],
    repas: "", nuits: "", km: "",
    garantie: null, fournitures: null, travauxRestant: null, travauxRestantDetail: "",
    signatureTech: null, signatureClient: null,
    photos: [],
  };
}
