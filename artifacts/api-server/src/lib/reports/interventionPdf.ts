import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import logoVemat from "../../assets/reports/logo-vemat.png";
import logoTerex from "../../assets/reports/logo-terex.png";
import { decodeDataUrl, fit } from "./image";
import { MAX_ROWS, type InterventionReport } from "./types";
import { fmtDate, fmtMinutes, rowTravelMinutes, rowWorkMinutes, totals } from "./time";

const PAGE_W = 842;
const PAGE_H = 595;
const M = 18;
const GREY = rgb(0.75, 0.75, 0.75);
const BLACK = rgb(0, 0, 0);
const DARK = rgb(0.07, 0.07, 0.07);
const WHITE = rgb(1, 1, 1);
const LW = 0.7;

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  reg: PDFFont;
  bold: PDFFont;
}

/** Remplace les caractères que la police standard (WinAnsi) ne sait pas écrire. */
function clean(font: PDFFont, text: string): string {
  const set = new Set(font.getCharacterSet());
  let out = "";
  for (const ch of (text ?? "").replace(/\r/g, "").replace(/\t/g, " ")) {
    const cp = ch.codePointAt(0)!;
    if (ch === "\n" || set.has(cp)) out += ch;
    else if (ch === "’" || ch === "‘") out += "'";
    else if (ch === "“" || ch === "”") out += '"';
    else out += "?";
  }
  return out;
}

function wrap(font: PDFFont, text: string, size: number, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of clean(font, text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxW) {
        line = test;
        continue;
      }
      if (line) lines.push(line);
      // mot plus long que la ligne : coupe dure
      let w = word;
      while (font.widthOfTextAtSize(w, size) > maxW && w.length > 1) {
        let n = w.length - 1;
        while (n > 1 && font.widthOfTextAtSize(w.slice(0, n), size) > maxW) n--;
        lines.push(w.slice(0, n));
        w = w.slice(n);
      }
      line = w;
    }
    lines.push(line);
  }
  return lines;
}

/** y = bord haut du rectangle (repère PDF : origine en bas). */
function box(c: Ctx, x: number, top: number, w: number, h: number, fill?: ReturnType<typeof rgb>) {
  c.page.drawRectangle({ x, y: top - h, width: w, height: h, borderColor: BLACK, borderWidth: LW, color: fill });
}

function text(c: Ctx, s: string, x: number, top: number, w: number, h: number, o?: { size?: number; bold?: boolean; align?: "l" | "c"; color?: ReturnType<typeof rgb> }) {
  const font = o?.bold ? c.bold : c.reg;
  const size = o?.size ?? 8;
  const t = clean(font, s);
  if (!t) return;
  const tw = font.widthOfTextAtSize(t, size);
  const tx = o?.align === "l" ? x + 3 : x + (w - tw) / 2;
  c.page.drawText(t, { x: Math.max(x + 1, tx), y: top - h / 2 - size * 0.35, size, font, color: o?.color ?? BLACK });
}

function cell(c: Ctx, s: string, x: number, top: number, w: number, h: number, o?: { size?: number; bold?: boolean; grey?: boolean; align?: "l" | "c" }) {
  box(c, x, top, w, h, o?.grey ? GREY : undefined);
  text(c, s, x, top, w, h, { size: o?.size, bold: o?.bold ?? !!o?.grey, align: o?.align });
}

/** Cellule de valeur : réduit la police puis passe à la ligne si le texte est trop long. */
function valueCell(c: Ctx, s: string, x: number, top: number, w: number, h: number, size = 9) {
  box(c, x, top, w, h);
  const t = clean(c.reg, s);
  let sz = size;
  while (sz > 6 && c.reg.widthOfTextAtSize(t, sz) > w - 6) sz -= 0.5;
  if (c.reg.widthOfTextAtSize(t, sz) <= w - 6 || h < 2 * sz + 2) {
    text(c, t, x, top, w, h, { size: sz });
    return;
  }
  const lines = wrap(c.reg, t, sz, w - 6).slice(0, Math.max(1, Math.floor((h - 2) / (sz + 1))));
  const total = lines.length * (sz + 1);
  lines.forEach((ln, i) => {
    const lw = c.reg.widthOfTextAtSize(ln, sz);
    c.page.drawText(ln, { x: x + (w - lw) / 2, y: top - (h - total) / 2 - sz * (i + 1) - i + 1.5, size: sz, font: c.reg, color: BLACK });
  });
}

function paragraph(c: Ctx, s: string, x: number, top: number, w: number, h: number, base = 9) {
  let sz = base;
  let lines = wrap(c.reg, s, sz, w - 8);
  while (sz > 5.5 && lines.length * (sz + 1.6) > h - 6) {
    sz -= 0.5;
    lines = wrap(c.reg, s, sz, w - 8);
  }
  const max = Math.floor((h - 6) / (sz + 1.6));
  lines.slice(0, max).forEach((ln, i) => {
    c.page.drawText(ln, { x: x + 4, y: top - 4 - sz - i * (sz + 1.6), size: sz, font: c.reg, color: BLACK });
  });
}

function yesNo(c: Ctx, x: number, top: number, w: number, h: number, value: boolean | null) {
  const half = w / 2;
  const yes = value === true;
  const no = value === false;
  box(c, x, top, half, h, yes ? DARK : undefined);
  text(c, "Oui", x, top, half, h, { bold: true, size: 8, color: yes ? WHITE : BLACK });
  box(c, x + half, top, half, h, no ? DARK : undefined);
  text(c, "Non", x + half, top, half, h, { bold: true, size: 8, color: no ? WHITE : BLACK });
}

async function embed(doc: PDFDocument, dataUrl: string | null): Promise<{ img: PDFImage; w: number; h: number } | null> {
  const d = decodeDataUrl(dataUrl);
  if (!d) return null;
  try {
    const img = d.ext === "png" ? await doc.embedPng(d.buf) : await doc.embedJpg(d.buf);
    return { img, w: d.width, h: d.height };
  } catch {
    return null;
  }
}

function drawContained(c: Ctx, im: { img: PDFImage; w: number; h: number }, x: number, top: number, w: number, h: number) {
  const s = fit(im.w, im.h, w, h);
  c.page.drawImage(im.img, { x: x + (w - s.width) / 2, y: top - h + (h - s.height) / 2, width: s.width, height: s.height });
}

export async function buildInterventionPdf(r: InterventionReport): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Rapport d'intervention ${r.reportNo}`);
  doc.setAuthor("VEMAT");
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const c: Ctx = { doc, page, reg, bold };

  // ───────── En-tête ─────────
  const top0 = PAGE_H - M;
  const LX = M;
  const LWID = 442; // colonne gauche
  const RX = LX + LWID + 10;
  const RWID = PAGE_W - M - RX;
  const HEAD = 52;

  box(c, LX, top0, 140, HEAD, DARK);
  const lv = await embed(doc, `data:image/png;base64,${logoVemat}`);
  const lt = await embed(doc, `data:image/png;base64,${logoTerex}`);
  if (lv) drawContained(c, lv, LX + 2, top0 - 2, 136, HEAD - 4);
  if (lt) drawContained(c, lt, LX + 150, top0 - 4, 95, HEAD - 8);
  box(c, LX + 252, top0, LWID - 252, HEAD);
  text(c, "RAPPORT D'INTERVENTION", LX + 252, top0 - 6, LWID - 252, 24, { bold: true, size: 11 });
  text(c, `N° ${r.reportNo}`, LX + 252, top0 - 26, LWID - 252, 24, { bold: true, size: 11 });

  // OT + Code/Version (colonne droite)
  cell(c, "OT N°:", RX, top0 - 8, 60, 28, { grey: true, size: 8 });
  valueCell(c, r.otNo, RX + 60, top0 - 8, RWID - 60 - 100, 28, 11);
  const cx = RX + RWID - 92;
  box(c, cx, top0, 92, 40);
  text(c, "Code", cx, top0, 30, 40, { size: 6.5 });
  cell(c, "Version:", cx + 30, top0, 36, 20, { size: 6 });
  cell(c, "1", cx + 66, top0, 26, 20, { size: 6.5 });
  cell(c, "Page:", cx + 30, top0 - 20, 36, 20, { size: 6 });
  cell(c, "1/1", cx + 66, top0 - 20, 26, 20, { size: 6.5 });

  // ───────── Bloc identification ─────────
  let y = top0 - HEAD - 6;
  const rowH = 21;
  const lblW = 62;
  const leftW = 214;
  const rightX = LX + leftW + 10;
  const rightW = LWID - leftW - 10;
  const rlblW = 72;

  cell(c, "Client", LX, y, lblW, rowH * 2, { grey: true, size: 8 });
  valueCell(c, r.client, LX + lblW, y, leftW - lblW, rowH * 2, 9);
  cell(c, "Chantier", LX, y - rowH * 2, lblW, rowH, { grey: true, size: 8 });
  valueCell(c, r.chantier, LX + lblW, y - rowH * 2, leftW - lblW, rowH, 8);
  const y2 = y - rowH * 3 - 5;
  cell(c, "Contact", LX, y2, lblW, rowH, { grey: true, size: 8 });
  valueCell(c, r.contact, LX + lblW, y2, leftW - lblW, rowH, 9);
  cell(c, "Tel.", LX, y2 - rowH, lblW, rowH, { grey: true, size: 8 });
  valueCell(c, r.tel, LX + lblW, y2 - rowH, leftW - lblW, rowH, 9);

  const rr: [string, string][] = [["Modele", r.modele], ["Serie", r.serie], ["Compt. Hr.", r.comptHr]];
  rr.forEach(([l, v], i) => {
    cell(c, l, rightX, y - i * rowH, rlblW, rowH, { grey: true, size: 8 });
    valueCell(c, v, rightX + rlblW, y - i * rowH, rightW - rlblW, rowH, 9);
  });
  [["Technicien", r.technicien], ["Vehicule", r.vehicule]].forEach(([l, v], i) => {
    cell(c, l, rightX, y2 - i * rowH, rlblW, rowH, { grey: true, size: 8 });
    valueCell(c, v, rightX + rlblW, y2 - i * rowH, rightW - rlblW, rowH, 9);
  });

  // ───────── Tableau des heures ─────────
  const ty = y2 - rowH * 2 - 8;
  // Dates | Voy matin (2) | Voy soir (2) | Trav matin (2) | Trav soir (2) | Total voy (2) | Total trav (2)
  const wDate = 80;
  const wT = 33;
  const wTot = 49;
  const xs: number[] = [LX];
  xs.push(xs[0] + wDate);
  for (let i = 0; i < 8; i++) xs.push(xs[xs.length - 1] + wT);
  xs.push(xs[xs.length - 1] + wTot);
  xs.push(xs[xs.length - 1] + wTot);
  cell(c, "Dates", xs[0], ty, wDate, 14, { grey: true, size: 7.5 });
  cell(c, "J / M / A", xs[0], ty - 14, wDate, 22, { grey: true, size: 7.5 });
  cell(c, "Voyage / Preparation", xs[1], ty, wT * 4, 14, { grey: true, size: 7.5 });
  cell(c, "Travail", xs[5], ty, wT * 4, 14, { grey: true, size: 7.5 });
  cell(c, "Total", xs[9], ty, wTot * 2, 14, { grey: true, size: 7.5 });
  const sub = ["Matin\nDeb. / Fin", "Soir\nDeb / Fin", "Matin\nDeb. / Fin", "Soir\nDeb / Fin"];
  sub.forEach((s, i) => {
    const sx = xs[1 + i * 2];
    box(c, sx, ty - 14, wT * 2, 22, GREY);
    const [a, b] = s.split("\n");
    text(c, a, sx, ty - 14, wT * 2, 11, { bold: true, size: 6.5 });
    text(c, b, sx, ty - 14 - 9, wT * 2, 11, { bold: true, size: 6.5 });
  });
  cell(c, "Voy. / Prép", xs[9], ty - 14, wTot, 22, { grey: true, size: 7 });
  cell(c, "Travail", xs[10], ty - 14, wTot, 22, { grey: true, size: 7 });

  const dataTop = ty - 36 - 2;
  const dh = 19;
  const rows = r.rows.slice(0, MAX_ROWS);
  for (let i = 0; i < MAX_ROWS; i++) {
    const row = rows[i];
    const top = dataTop - i * dh;
    cell(c, row ? fmtDate(row.date) || "-   -" : "-     -", xs[0], top, wDate, dh, { size: 7 });
    const vals = row
      ? [row.voyMatinDeb, row.voyMatinFin, row.voySoirDeb, row.voySoirFin, row.travMatinDeb, row.travMatinFin, row.travSoirDeb, row.travSoirFin]
      : ["", "", "", "", "", "", "", ""];
    vals.forEach((v, k) => cell(c, v, xs[1 + k], top, wT, dh, { size: 7 }));
    cell(c, row ? fmtMinutes(rowTravelMinutes(row)) : "", xs[9], top, wTot, dh, { size: 8, bold: true });
    cell(c, row ? fmtMinutes(rowWorkMinutes(row)) : "", xs[10], top, wTot, dh, { size: 8, bold: true });
  }

  // ───────── Séjour / cumul / garantie / fournitures ─────────
  const by = dataTop - MAX_ROWS * dh - 5;
  const t = totals(rows);
  const sejW = 214;
  cell(c, "Sejour", LX, by, sejW, 22, { grey: true, size: 8 });
  const sw = sejW / 3;
  ["# Repas", "# Nuits", "Km."].forEach((l, i) => cell(c, l, LX + sw * i, by - 22, sw, 22, { grey: true, size: 8 }));
  [r.repas, r.nuits, r.km].forEach((v, i) => valueCell(c, v, LX + sw * i, by - 44, sw, 24, 10));

  const mx = LX + sejW + 10;
  const mw = LWID - sejW - 10;
  cell(c, "Cummul Temps", mx, by, 84, 28, { grey: true, size: 8 });
  cell(c, fmtMinutes(t.travel), mx + 84, by, (mw - 84) / 2, 28, { size: 10, bold: true });
  cell(c, fmtMinutes(t.work), mx + 84 + (mw - 84) / 2, by, (mw - 84) / 2, 28, { size: 10, bold: true });
  cell(c, "Garantie", mx, by - 33, 84, 24, { grey: true, size: 8 });
  yesNo(c, mx + 84, by - 33, mw - 84, 24, r.garantie);
  cell(c, "Fournitures", mx, by - 62, 84, 24, { grey: true, size: 8 });
  yesNo(c, mx + 84, by - 62, mw - 84, 24, r.fournitures);

  // ───────── Signatures ─────────
  const sy = by - 86 - 8;
  const sigTop = sy;
  const sigHeadH = 18;
  const sigBoxH = sigTop - M - sigHeadH;
  cell(c, "Signature", LX, sigTop, 62, sigHeadH + sigBoxH, { grey: true, size: 8 });
  const colW = (LWID - 62) / 3;
  ["Technicien", "Cleint", "Administration"].forEach((l, i) => {
    cell(c, l, LX + 62 + colW * i, sigTop, colW, sigHeadH, { grey: true, size: 8 });
    box(c, LX + 62 + colW * i, sigTop - sigHeadH, colW, sigBoxH);
  });
  const sigT = await embed(doc, r.signatureTech);
  const sigC = await embed(doc, r.signatureClient);
  if (sigT) drawContained(c, sigT, LX + 62 + 3, sigTop - sigHeadH - 2, colW - 6, sigBoxH - 4);
  if (sigC) drawContained(c, sigC, LX + 62 + colW + 3, sigTop - sigHeadH - 2, colW - 6, sigBoxH - 4);

  // ───────── Colonne droite ─────────
  const ry = top0 - 48; // sous OT / Code
  cell(c, "Nature D'Intervention", RX, ry, RWID, 16, { grey: true, size: 8 });
  box(c, RX, ry - 16, RWID, 70);
  paragraph(c, r.nature, RX, ry - 16, RWID, 70, 9);

  const dy = ry - 16 - 70 - 4;
  cell(c, "Detail de Travail", RX, dy, RWID, 16, { grey: true, size: 8 });
  const remainH = 112;
  const detH = dy - 16 - (M + remainH + 4 + 16);
  box(c, RX, dy - 16, RWID, detH);
  paragraph(c, r.detail, RX, dy - 16, RWID, detH, 9);

  const tr = dy - 16 - detH - 4;
  cell(c, "Travaux Restant", RX, tr, RWID - 120, 16, { grey: true, size: 8 });
  yesNo(c, RX + RWID - 120, tr, 120, 16, r.travauxRestant);
  box(c, RX, tr - 16, RWID, remainH + 0);
  paragraph(c, r.travauxRestantDetail, RX, tr - 16, RWID, remainH, 9);

  // ───────── Pages photos ─────────
  const photos = r.photos;
  if (photos.length) {
    const perRow = 3;
    const perPage = 6;
    const gap = 10;
    const cellW = (PAGE_W - 2 * M - gap * (perRow - 1)) / perRow;
    const capH = 30;
    const areaTop = PAGE_H - M - 26;
    const cellH = (areaTop - M - gap) / 2;
    for (let i = 0; i < photos.length; i += perPage) {
      const pg = doc.addPage([PAGE_W, PAGE_H]);
      const pc: Ctx = { doc, page: pg, reg, bold };
      pg.drawText(clean(bold, `Rapport d'intervention N° ${r.reportNo} — Photos`), { x: M, y: PAGE_H - M - 12, size: 12, font: bold, color: BLACK });
      for (let k = 0; k < perPage && i + k < photos.length; k++) {
        const col = k % perRow;
        const rowIdx = Math.floor(k / perRow);
        const x = M + col * (cellW + gap);
        const top = areaTop - rowIdx * (cellH + gap);
        const p = photos[i + k];
        box(pc, x, top, cellW, cellH);
        const im = await embed(doc, p.dataUrl);
        if (im) drawContained(pc, im, x + 3, top - 3, cellW - 6, cellH - capH - 6);
        const cap = wrap(reg, `${i + k + 1}. ${p.caption || ""}`.trim(), 8, cellW - 8).slice(0, 2);
        cap.forEach((ln, n) => pg.drawText(ln, { x: x + 4, y: top - cellH + capH - 12 - n * 10, size: 8, font: reg, color: BLACK }));
      }
    }
  }

  return Buffer.from(await doc.save());
}
