/** Rapport d'intervention — données saisies par le technicien sur téléphone. */

export interface TimeRow {
  /** yyyy-mm-dd */
  date: string;
  /** Heures au format HH:MM ("" si non renseigné). */
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
  /** data:image/jpeg;base64,… (déjà compressée par l'application) */
  dataUrl: string;
  caption: string;
}

export interface InterventionReport {
  reportNo: string;
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
  /** data:image/png;base64,… ou null */
  signatureTech: string | null;
  signatureClient: string | null;
  photos: ReportPhoto[];
}

export const MAX_ROWS = 7;
export const MAX_PHOTOS = 24;
