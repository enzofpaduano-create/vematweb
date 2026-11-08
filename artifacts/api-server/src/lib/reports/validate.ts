import { MAX_PHOTOS, MAX_ROWS, type InterventionReport, type ReportPhoto, type TimeRow } from "./types";

const MAX_PHOTO_CHARS = 3_500_000; // ≈ 2,6 Mo d'image par photo (après compression côté application)
const MAX_SIG_CHARS = 400_000;

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const time = (v: unknown): string => {
  const s = typeof v === "string" ? v.trim() : "";
  return /^\d{1,2}:\d{2}$/.test(s) ? s : "";
};
const tri = (v: unknown): boolean | null => (v === true ? true : v === false ? false : null);
const dataUrl = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.length <= max && /^data:image\/(png|jpe?g);base64,/i.test(v) ? v : null;

export type ValidationResult = { ok: true; report: InterventionReport; id: string } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Nettoie et borne les données reçues du téléphone. Le numéro du rapport est le N° de fiche du carnet du technicien. */
export function validateInterventionBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") return { ok: false, error: "Corps de requête invalide" };
  const b = body as Record<string, unknown>;

  const id = typeof b.id === "string" ? b.id.toLowerCase() : "";
  if (!UUID.test(id)) return { ok: false, error: "Identifiant de rapport invalide" };

  const ficheNo = str(b.ficheNo, 40).replace(/[^\p{L}\p{N} ._\/-]/gu, "");
  if (!ficheNo) return { ok: false, error: "Le numéro de fiche (carnet) est obligatoire" };
  const client = str(b.client, 200);
  const detail = str(b.detail, 6000);
  if (!client) return { ok: false, error: "Le client est obligatoire" };
  if (!detail) return { ok: false, error: "Le détail du travail est obligatoire" };

  const rows: TimeRow[] = (Array.isArray(b.rows) ? b.rows : []).slice(0, MAX_ROWS).map((r) => {
    const o = (r ?? {}) as Record<string, unknown>;
    const d = typeof o.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : "";
    return {
      date: d,
      voyMatinDeb: time(o.voyMatinDeb),
      voyMatinFin: time(o.voyMatinFin),
      voySoirDeb: time(o.voySoirDeb),
      voySoirFin: time(o.voySoirFin),
      travMatinDeb: time(o.travMatinDeb),
      travMatinFin: time(o.travMatinFin),
      travSoirDeb: time(o.travSoirDeb),
      travSoirFin: time(o.travSoirFin),
    };
  });

  const photos: ReportPhoto[] = [];
  for (const p of (Array.isArray(b.photos) ? b.photos : []).slice(0, MAX_PHOTOS)) {
    const o = (p ?? {}) as Record<string, unknown>;
    const d = dataUrl(o.dataUrl, MAX_PHOTO_CHARS);
    if (d) photos.push({ dataUrl: d, caption: str(o.caption, 160) });
  }

  const report: InterventionReport = {
    reportNo: ficheNo,
    otNo: str(b.otNo, 60),
    client,
    chantier: str(b.chantier, 200),
    contact: str(b.contact, 120),
    tel: str(b.tel, 60),
    modele: str(b.modele, 80),
    serie: str(b.serie, 80),
    comptHr: str(b.comptHr, 40),
    technicien: str(b.technicien, 120),
    vehicule: str(b.vehicule, 80),
    nature: str(b.nature, 1200),
    detail,
    rows,
    repas: str(b.repas, 10),
    nuits: str(b.nuits, 10),
    km: str(b.km, 10),
    garantie: tri(b.garantie),
    fournitures: tri(b.fournitures),
    travauxRestant: tri(b.travauxRestant),
    travauxRestantDetail: str(b.travauxRestantDetail, 2500),
    signatureTech: dataUrl(b.signatureTech, MAX_SIG_CHARS),
    signatureClient: dataUrl(b.signatureClient, MAX_SIG_CHARS),
    photos,
  };
  return { ok: true, report, id };
}
