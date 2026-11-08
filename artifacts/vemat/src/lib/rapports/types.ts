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
