import { MAX_PHOTOS, type ReportPhoto } from "./types";
import { MAX_AXLES, MAX_DEFECTS, type DefectRow, type EngineInfo, type InspectionKind, type InspectionReport, type Score, type TyreAxle } from "./inspectionTypes";
import { ROW_IDS } from "./inspectionChecklist";

const MAX_PHOTO_CHARS = 3_500_000;
const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const photoUrl = (v: unknown): string | null =>
  typeof v === "string" && v.length <= MAX_PHOTO_CHARS && /^data:image\/(png|jpe?g);base64,/i.test(v) ? v : null;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function engine(v: unknown): EngineInfo {
  const o = (v ?? {}) as Record<string, unknown>;
  return { produit: str(o.produit, 80), type: str(o.type, 80), serie: str(o.serie, 80), cv: str(o.cv, 40), rpm: str(o.rpm, 40), epa: str(o.epa, 80) };
}

export type InspectionValidation = { ok: true; report: InspectionReport; id: string } | { ok: false; error: string };

export function validateInspectionBody(body: unknown): InspectionValidation {
  if (!body || typeof body !== "object") return { ok: false, error: "Corps de requête invalide" };
  const b = body as Record<string, unknown>;

  const id = typeof b.id === "string" ? b.id.toLowerCase() : "";
  if (!UUID.test(id)) return { ok: false, error: "Identifiant de rapport invalide" };

  const reportNo = str(b.ficheNo, 40).replace(/[^\p{L}\p{N} ._\/-]/gu, "");
  if (!reportNo) return { ok: false, error: "Le numéro de fiche (carnet) est obligatoire" };
  const client = str(b.client, 200);
  if (!client) return { ok: false, error: "Le client est obligatoire" };
  const serie = str(b.serie, 80);
  if (!serie) return { ok: false, error: "Le numéro de série de la machine est obligatoire" };

  const scores: Record<string, Score> = {};
  const rawScores = (b.scores && typeof b.scores === "object" ? b.scores : {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(rawScores)) {
    if (ROW_IDS.has(k) && (v === 1 || v === 2 || v === 3 || v === 4)) scores[k] = v;
  }
  if (!Object.keys(scores).length) return { ok: false, error: "Aucun point de contrôle n'est renseigné" };

  const kind: InspectionKind = b.kind === "condition" || b.kind === "final" ? b.kind : "inspection";
  const date = typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : "";

  const defauts: DefectRow[] = [];
  for (const d of (Array.isArray(b.defauts) ? b.defauts : []).slice(0, MAX_DEFECTS)) {
    const o = (d ?? {}) as Record<string, unknown>;
    const description = str(o.description, 300);
    if (!description) continue;
    defauts.push({ zone: o.zone === "tourelle" ? "tourelle" : "porteur", description, commentaire: str(o.commentaire, 300) });
  }

  const couronne = Array.from({ length: 4 }, (_, i) => {
    const o = ((Array.isArray(b.couronne) ? b.couronne[i] : null) ?? {}) as Record<string, unknown>;
    return { t1: str(o.t1, 20), t2: str(o.t2, 20), t3: str(o.t3, 20) };
  });

  const pneus: TyreAxle[] = [];
  for (const a of (Array.isArray(b.pneus) ? b.pneus : []).slice(0, MAX_AXLES)) {
    const o = (a ?? {}) as Record<string, unknown>;
    pneus.push({
      gMarque: str(o.gMarque, 40), gDim: str(o.gDim, 40), gUsure: str(o.gUsure, 10),
      dMarque: str(o.dMarque, 40), dDim: str(o.dDim, 40), dUsure: str(o.dUsure, 10),
    });
  }

  const photos: ReportPhoto[] = [];
  for (const p of (Array.isArray(b.photos) ? b.photos : []).slice(0, MAX_PHOTOS)) {
    const o = (p ?? {}) as Record<string, unknown>;
    const d = photoUrl(o.dataUrl);
    if (d) photos.push({ dataUrl: d, caption: str(o.caption, 160) });
  }

  const report: InspectionReport = {
    reportNo, kind,
    ot: str(b.ot, 60), client, date,
    type: str(b.type, 80), serie,
    technicien: str(b.technicien, 120),
    km: str(b.km, 20), hrs: str(b.hrs, 20), lieu: str(b.lieu, 120),
    scores,
    moteurPorteur: engine(b.moteurPorteur),
    moteurTourelle: engine(b.moteurTourelle),
    commentairePorteur: str(b.commentairePorteur, 1500),
    commentaireTourelle: str(b.commentaireTourelle, 1500),
    defauts, couronne, pneus,
    pneusCommentaire: str(b.pneusCommentaire, 1500),
    photos,
  };
  return { ok: true, report, id };
}
