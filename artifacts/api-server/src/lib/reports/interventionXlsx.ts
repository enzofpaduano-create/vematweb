import ExcelJS from "exceljs";
// Chargés en base64 par esbuild (voir build.mjs).
import templateBase64 from "../../assets/reports/intervention-template.xlsx";
import logoVemat from "../../assets/reports/logo-vemat.png";
import logoTerex from "../../assets/reports/logo-terex.png";
import type { InterventionReport } from "./types";
import { MAX_ROWS } from "./types";
import { decodeDataUrl, fit } from "./image";
import { fmtDate, fmtMinutes, rowTravelMinutes, rowWorkMinutes, totals } from "./time";

const DARK = "FF111111";

/** exceljs partage certains objets de style entre cellules : on réaffecte toujours un style complet neuf. */
function restyle(cell: ExcelJS.Cell, patch: Partial<ExcelJS.Style>) {
  cell.style = { ...cell.style, ...patch };
}

function mark(ws: ExcelJS.Worksheet, yes: string, no: string, value: boolean | null) {
  const chosen = value === true ? yes : value === false ? no : null;
  if (!chosen) return;
  const cell = ws.getCell(chosen);
  restyle(cell, {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: DARK } },
    font: { ...cell.font, bold: true, color: { argb: "FFFFFFFF" } },
  });
}

function setText(ws: ExcelJS.Worksheet, addr: string, value: string, opts?: { size?: number; top?: boolean }) {
  const c = ws.getCell(addr);
  c.value = value;
  restyle(c, {
    font: { ...c.font, size: opts?.size ?? 10, italic: false, bold: false },
    alignment: {
      wrapText: true,
      vertical: opts?.top ? "top" : "middle",
      horizontal: opts?.top ? "left" : "center",
    },
  });
}

function bodySize(text: string, big = 600): number {
  return text.length > big * 1.6 ? 6.5 : text.length > big ? 8 : 10;
}

export async function buildInterventionXlsx(r: InterventionReport): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(templateBase64, "base64") as never);
  const ws = wb.worksheets[0];

  // Les logos du modèle sont rognés (non conservés par exceljs) : on les remplace par des versions déjà découpées.
  (ws as unknown as { _media: unknown[] })._media = [];
  const idVemat = wb.addImage({ buffer: Buffer.from(logoVemat, "base64") as never, extension: "png" });
  const idTerex = wb.addImage({ buffer: Buffer.from(logoTerex, "base64") as never, extension: "png" });
  ws.addImage(idVemat, { tl: { col: 0, row: 0 }, br: { col: 5, row: 4 }, editAs: "oneCell" } as never);
  ws.addImage(idTerex, { tl: { col: 5.2, row: 0.05 }, br: { col: 10.3, row: 3.9 }, editAs: "oneCell" } as never);

  ws.pageSetup = { ...ws.pageSetup, orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 1 };
  ws.getCell("L1").value = `  RAPPORT D'INTERVENTION\n       No ${r.reportNo}`;
  setText(ws, "T2", r.otNo, { size: 12 });

  setText(ws, "D6", r.client);
  setText(ws, "D10", r.chantier);
  setText(ws, "D12", r.contact);
  setText(ws, "D14", r.tel);
  setText(ws, "M6", r.modele);
  setText(ws, "M8", r.serie);
  setText(ws, "M10", r.comptHr);
  setText(ws, "M12", r.technicien);
  setText(ws, "M14", r.vehicule);

  setText(ws, "S7", r.nature, { top: true, size: bodySize(r.nature, 250) });
  setText(ws, "S15", r.detail, { top: true, size: bodySize(r.detail) });

  const rows = r.rows.slice(0, MAX_ROWS);
  rows.forEach((row, i) => {
    const n = 19 + i;
    const put = (addr: string, v: string) => setText(ws, addr, v, { size: 8 });
    put(`A${n}`, fmtDate(row.date) || "-     -");
    put(`D${n}`, row.voyMatinDeb);
    put(`E${n}`, row.voyMatinFin);
    put(`F${n}`, row.voySoirDeb);
    put(`H${n}`, row.voySoirFin);
    put(`J${n}`, row.travMatinDeb);
    put(`K${n}`, row.travMatinFin);
    put(`L${n}`, row.travSoirDeb);
    put(`M${n}`, row.travSoirFin);
    ws.mergeCells(`N${n}:O${n}`);
    ws.mergeCells(`P${n}:Q${n}`);
    put(`N${n}`, fmtMinutes(rowTravelMinutes(row)));
    put(`P${n}`, fmtMinutes(rowWorkMinutes(row)));
  });

  const t = totals(rows);
  setText(ws, "N26", fmtMinutes(t.travel), { size: 11 });
  setText(ws, "P26", fmtMinutes(t.work), { size: 11 });

  setText(ws, "A30", r.repas, { size: 11 });
  setText(ws, "D30", r.nuits, { size: 11 });
  setText(ws, "F30", r.km, { size: 11 });

  mark(ws, "N29", "P29", r.garantie);
  mark(ws, "N31", "P31", r.fournitures);
  mark(ws, "W27", "Y27", r.travauxRestant);
  setText(ws, "S28", r.travauxRestantDetail, { top: true, size: bodySize(r.travauxRestantDetail, 700) });

  const sig = (data: string | null, tl: { col: number; row: number }, br: { col: number; row: number }) => {
    const img = decodeDataUrl(data);
    if (!img) return;
    const id = wb.addImage({ buffer: img.buf as never, extension: img.ext });
    ws.addImage(id, { tl, br, editAs: "oneCell" } as never);
  };
  // D34:I35 (technicien), J34:M35 (client) — indices exceljs à base 0.
  sig(r.signatureTech, { col: 3.05, row: 33.05 }, { col: 9, row: 35 });
  sig(r.signatureClient, { col: 9.05, row: 33.05 }, { col: 13, row: 35 });

  // Feuille photos (2 par ligne, proportions conservées)
  if (r.photos.length) {
    const ps = wb.addWorksheet("Photos", { pageSetup: { orientation: "portrait", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    ps.columns = [{ width: 50 }, { width: 50 }];
    ps.getCell("A1").value = `Rapport d'intervention No ${r.reportNo} — Photos`;
    ps.getCell("A1").font = { bold: true, size: 12 };
    const BOX_W = 340;
    const BOX_H = 250;
    let rowIdx = 3;
    for (let i = 0; i < r.photos.length; i += 2) {
      ps.getRow(rowIdx).height = BOX_H * 0.75 + 6; // points
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
