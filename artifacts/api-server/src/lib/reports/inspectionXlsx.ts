import ExcelJS from "exceljs";
// Chargé en base64 par esbuild (voir build.mjs).
import templateBase64 from "../../assets/reports/inspection-template.xlsx";
import { decodeDataUrl, fit } from "./image";
import { resultCell } from "./inspectionChecklist";
import { KIND_LABEL, type EngineInfo, type InspectionReport } from "./inspectionTypes";
import { fmtDate } from "./time";

const SCORE_FILL: Record<number, string> = { 1: "FFC6EFCE", 2: "FFFFEB9C", 3: "FFFFC7CE", 4: "FFD9D9D9" };

/** exceljs partage des objets de style entre cellules : on réaffecte toujours un style complet. */
function restyle(cell: ExcelJS.Cell, patch: Partial<ExcelJS.Style>) {
  cell.style = { ...cell.style, ...patch };
}

function put(ws: ExcelJS.Worksheet, addr: string, value: string | number, opts: { size?: number; top?: boolean; bold?: boolean; left?: boolean } = {}) {
  const c = ws.getCell(addr);
  c.value = value;
  restyle(c, {
    font: { ...c.font, size: opts.size ?? 10, bold: opts.bold ?? false, italic: false },
    alignment: {
      wrapText: true,
      vertical: opts.top ? "top" : "middle",
      horizontal: opts.top || opts.left ? "left" : "center",
    },
  });
}

/** Coche X (colorée) dans la case de la case « Rapport d'inspection / Condition / Contrôle final ». */
function tick(ws: ExcelJS.Worksheet, addr: string) {
  put(ws, addr, "X", { bold: true, size: 11 });
}

function engine(ws: ExcelJS.Worksheet, first: number, e: EngineInfo) {
  [e.produit, e.type, e.serie, e.cv, e.rpm, e.epa].forEach((v, i) => put(ws, `N${first + i}`, v, { size: 10, left: true }));
}

function commentBox(ws: ExcelJS.Worksheet, addr: string, text: string) {
  if (!text) return; // on conserve le texte par défaut du modèle
  const size = text.length > 700 ? 7 : text.length > 350 ? 8.5 : 10;
  put(ws, addr, text, { top: true, size });
  restyle(ws.getCell(addr), { font: { name: "Arial", size, color: { argb: "FF000000" } } });
}

function header(ws: ExcelJS.Worksheet, r: InspectionReport) {
  put(ws, "H1", r.date ? fmtDate(r.date) : "");
  put(ws, "H2", r.technicien);
  put(ws, "H3", r.reportNo);
  put(ws, "C4", r.serie);
  put(ws, "G4", r.type);
  for (const a of ["H1", "H2", "H3", "C4", "G4"]) {
    restyle(ws.getCell(a), { alignment: { horizontal: "center", vertical: "middle", shrinkToFit: true } });
  }
  const cell = r.kind === "inspection" ? "F1" : r.kind === "condition" ? "F2" : "F3";
  tick(ws, cell);
}

export async function buildInspectionXlsx(r: InspectionReport): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(templateBase64, "base64") as never);
  // exceljs perd l'attribut baseColWidth du modèle : sans cette largeur par défaut, l'image du « Jeu couronne » déborde.
  wb.worksheets.forEach((s) => { s.properties.defaultColWidth = 10.83; });

  /* ───────── Feuille « Inspection » (porteur + superstructure) ───────── */
  const ws = wb.getWorksheet("Inspection")!;
  const date = r.date ? fmtDate(r.date) : "";
  put(ws, "B3", r.ot);
  put(ws, "H3", r.client);
  put(ws, "N3", date);
  put(ws, "B4", r.type);
  put(ws, "H4", r.serie);
  put(ws, "N4", r.technicien);
  put(ws, "B5", r.km);
  put(ws, "H5", r.hrs);
  put(ws, "N5", r.lieu);
  // Page 2 : rappel du type, de la série et des heures
  put(ws, "B54", r.type);
  put(ws, "H54", r.serie);
  put(ws, "N54", r.hrs);

  for (const [id, score] of Object.entries(r.scores)) {
    const addr = resultCell(id, score);
    if (!addr) continue;
    const c = ws.getCell(addr);
    c.value = "X";
    restyle(c, {
      font: { name: c.font?.name, size: 10, bold: true, color: { argb: "FF000000" } },
      alignment: { horizontal: "center", vertical: "middle" },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: SCORE_FILL[score] } },
    });
  }

  engine(ws, 35, r.moteurPorteur);
  engine(ws, 88, r.moteurTourelle);
  commentBox(ws, "M43", r.commentairePorteur);
  commentBox(ws, "M96", r.commentaireTourelle);

  /* ───────── Liste des défauts ───────── */
  const wd = wb.getWorksheet("Liste defaut")!;
  put(wd, "J1", r.date ? fmtDate(r.date) : "");
  put(wd, "J2", r.technicien);
  put(wd, "J3", r.reportNo);
  put(wd, "D4", r.serie);
  put(wd, "H4", r.type, { left: true });
  tick(wd, "G1");

  // Le modèle ne prévoit que quelques lignes par zone : on reconstruit le tableau à partir de la ligne 6.
  const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const styleOf = (row: number) => cols.map((c) => ({ ...wd.getCell(`${c}${row}`).style }));
  const headStyle = styleOf(6);
  const lineStyle = styleOf(8);
  for (let row = 6; row <= 267; row++) {
    try { wd.unMergeCells(`C${row}:F${row}`); } catch { /* pas fusionnée */ }
    for (const c of cols) {
      const cell = wd.getCell(`${c}${row}`);
      cell.value = null;
      cell.style = {};
    }
  }
  let row = 6;
  const writeHead = (title: string) => {
    cols.forEach((c, i) => (wd.getCell(`${c}${row}`).style = { ...headStyle[i] }));
    wd.mergeCells(`C${row}:F${row}`);
    wd.getCell(`C${row}`).value = title;
    wd.getRow(row).height = 16;
    row++;
  };
  const writeLine = (n: number, desc: string, comment: string) => {
    cols.forEach((c, i) => (wd.getCell(`${c}${row}`).style = { ...lineStyle[i] }));
    wd.mergeCells(`C${row}:F${row}`);
    wd.getCell(`A${row}`).value = r.reportNo;
    wd.getCell(`B${row}`).value = n;
    wd.getCell(`C${row}`).value = desc;
    wd.getCell(`H${row}`).value = r.technicien;
    wd.getCell(`I${row}`).value = r.date ? fmtDate(r.date) : "";
    wd.getCell(`J${row}`).value = comment;
    for (const c of ["A", "B", "H", "I"]) restyle(wd.getCell(`${c}${row}`), { alignment: { horizontal: "center", vertical: "middle", wrapText: true }, font: { name: "Arial", size: 9 } });
    restyle(wd.getCell(`C${row}`), { alignment: { horizontal: "left", vertical: "middle", wrapText: true }, font: { name: "Arial", size: 9 } });
    restyle(wd.getCell(`J${row}`), { alignment: { horizontal: "left", vertical: "middle", wrapText: true }, font: { name: "Arial", size: 9 } });
    const lines = Math.max(Math.ceil(desc.length / 70), Math.ceil(comment.length / 26), 1);
    wd.getRow(row).height = Math.max(16, lines * 12);
    row++;
  };
  for (const [zone, title] of [["porteur", "Porteur"], ["tourelle", "Tourelle"]] as const) {
    writeHead(title);
    const list = r.defauts.filter((d) => d.zone === zone);
    if (!list.length) writeLine(0, "Aucun défaut signalé", "");
    list.forEach((d, i) => writeLine(i + 1, d.description, d.commentaire));
    if (!list.length) {
      wd.getCell(`B${row - 1}`).value = null;
      wd.getCell(`A${row - 1}`).value = null;
      wd.getCell(`H${row - 1}`).value = null;
      wd.getCell(`I${row - 1}`).value = null;
    }
  }

  /* ───────── Jeu couronne ───────── */
  const wc = wb.getWorksheet("Jeu couronne")!;
  header(wc, r);
  r.couronne.forEach((m, i) => {
    put(wc, `F${11 + i}`, m.t1);
    put(wc, `G${11 + i}`, m.t2);
    put(wc, `H${11 + i}`, m.t3);
  });

  /* ───────── Pneus ───────── */
  const wp = wb.getWorksheet("Pneus")!;
  header(wp, r);
  r.pneus.forEach((a, i) => {
    const base = 7 + 4 * i;
    put(wp, `B${base}`, a.gMarque);
    put(wp, `B${base + 1}`, a.gDim);
    put(wp, `B${base + 2}`, a.gUsure);
    put(wp, `G${base}`, a.dMarque);
    put(wp, `G${base + 1}`, a.dDim);
    put(wp, `G${base + 2}`, a.dUsure);
  });
  if (r.pneusCommentaire) put(wp, "A46", r.pneusCommentaire, { top: true, size: r.pneusCommentaire.length > 500 ? 8 : 10 });

  /* ───────── Photos ───────── */
  if (r.photos.length) {
    const ps = wb.addWorksheet("Photos", { pageSetup: { orientation: "portrait", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    ps.columns = [{ width: 50 }, { width: 50 }];
    ps.getCell("A1").value = `Rapport d'inspection ${KIND_LABEL[r.kind] === "Rapport d'inspection" ? "" : "(" + KIND_LABEL[r.kind] + ") "}No ${r.reportNo} — Photos`;
    ps.getCell("A1").font = { bold: true, size: 12 };
    const BOX_W = 340;
    const BOX_H = 250;
    let rowIdx = 3;
    for (let i = 0; i < r.photos.length; i += 2) {
      ps.getRow(rowIdx).height = BOX_H * 0.75 + 6;
      ps.getRow(rowIdx + 1).height = 30;
      for (let k = 0; k < 2 && i + k < r.photos.length; k++) {
        const p = r.photos[i + k];
        const img = decodeDataUrl(p.dataUrl);
        if (img) {
          const id = wb.addImage({ buffer: img.buf as never, extension: img.ext });
          const sz = fit(img.width, img.height, BOX_W, BOX_H);
          ps.addImage(id, { tl: { col: k + 0.02, row: rowIdx - 1 + 0.02 }, ext: sz, editAs: "oneCell" } as never);
        }
        const cap = ps.getCell(rowIdx + 1, k + 1);
        cap.value = `${i + k + 1}. ${p.caption || ""}`.trim();
        cap.alignment = { wrapText: true, vertical: "top" };
      }
      rowIdx += 3;
    }
  }

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}
