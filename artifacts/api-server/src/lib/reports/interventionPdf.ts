import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage, type RGB } from "pdf-lib";
import logoVemat from "../../assets/reports/pdf-logo-vemat.png";
import logoTerex from "../../assets/reports/pdf-logo-terex.png";
import { decodeDataUrl, fit } from "./image";
import { MAX_ROWS, type InterventionReport } from "./types";
import { fmtDate, fmtMinutes, rowTravelMinutes, rowWorkMinutes, totals } from "./time";

/* ───────── Charte ───────── */
const W = 595.28; // A4 portrait
const H = 841.89;
const MX = 30;
const CW = W - 2 * MX;
const TOP = H - 28;
const BOTTOM = 46;

const ORANGE = rgb(0.976, 0.451, 0.086); // #F97316 (orange du site)
const ORANGE_SOFT = rgb(1, 0.949, 0.902);
const INK = rgb(0.075, 0.09, 0.11); // #13171C
const GREY_TXT = rgb(0.42, 0.45, 0.5);
const GREY_LINE = rgb(0.86, 0.87, 0.89);
const GREY_BG = rgb(0.955, 0.96, 0.968);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.09, 0.55, 0.32);

interface Ctx {
  doc: PDFDocument;
  reg: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number; // curseur (haut du prochain élément)
  logos: { vemat: PDFImage | null; terex: PDFImage | null };
  report: InterventionReport;
}

/* ───────── Texte ───────── */
function clean(font: PDFFont, text: string): string {
  const set = new Set(font.getCharacterSet());
  let out = "";
  for (const ch of (text ?? "").replace(/\r/g, "").replace(/\t/g, " ")) {
    const cp = ch.codePointAt(0)!;
    if (ch === "\n" || set.has(cp)) out += ch;
    else if (ch === "’" || ch === "‘") out += "'";
    else if (ch === "“" || ch === "”") out += '"';
    else if (ch === "–" || ch === "—") out += "-";
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
      if (font.widthOfTextAtSize(test, size) <= maxW) { line = test; continue; }
      if (line) lines.push(line);
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

function txt(c: Ctx, s: string, x: number, baseline: number, o: { size?: number; bold?: boolean; color?: RGB; align?: "l" | "c" | "r"; w?: number } = {}) {
  const font = o.bold ? c.bold : c.reg;
  const size = o.size ?? 9;
  const t = clean(font, s);
  if (!t) return;
  const tw = font.widthOfTextAtSize(t, size);
  let px = x;
  if (o.w !== undefined && o.align === "c") px = x + (o.w - tw) / 2;
  if (o.w !== undefined && o.align === "r") px = x + o.w - tw;
  c.page.drawText(t, { x: px, y: baseline, size, font, color: o.color ?? INK });
}

/* ───────── Formes ───────── */
function rrect(c: Ctx, x: number, top: number, w: number, h: number, r: number, o: { fill?: RGB; stroke?: RGB; sw?: number }) {
  const rr = Math.min(r, w / 2, h / 2);
  const path = `M ${rr} 0 H ${w - rr} A ${rr} ${rr} 0 0 1 ${w} ${rr} V ${h - rr} A ${rr} ${rr} 0 0 1 ${w - rr} ${h} H ${rr} A ${rr} ${rr} 0 0 1 0 ${h - rr} V ${rr} A ${rr} ${rr} 0 0 1 ${rr} 0 Z`;
  c.page.drawSvgPath(path, { x, y: top, color: o.fill, borderColor: o.stroke, borderWidth: o.stroke ? (o.sw ?? 0.8) : 0 });
}

function contain(c: Ctx, img: PDFImage, iw: number, ih: number, x: number, top: number, w: number, h: number, align: "l" | "c" | "r" = "c") {
  const s = fit(iw, ih, w, h);
  const px = align === "l" ? x : align === "r" ? x + w - s.width : x + (w - s.width) / 2;
  c.page.drawImage(img, { x: px, y: top - h + (h - s.height) / 2, width: s.width, height: s.height });
}

async function embedData(doc: PDFDocument, dataUrl: string | null) {
  const d = decodeDataUrl(dataUrl);
  if (!d) return null;
  try {
    const img = d.ext === "png" ? await doc.embedPng(d.buf) : await doc.embedJpg(d.buf);
    return { img, w: d.width, h: d.height };
  } catch {
    return null;
  }
}

/* ───────── Pages ───────── */
function brandHeader(c: Ctx, big: boolean) {
  const lv = c.logos.vemat;
  const lt = c.logos.terex;
  const hh = big ? 46 : 26;
  if (lv) c.page.drawImage(lv, { x: MX, y: TOP - hh, width: hh * (984 / 389), height: hh });
  if (lt) {
    const th = big ? 22 : 13;
    const tw = th * (716 / 121);
    c.page.drawImage(lt, { x: W - MX - tw, y: TOP - hh / 2 - th / 2 + (big ? -4 : 0), width: tw, height: th });
    if (big) txt(c, "DISTRIBUTEUR OFFICIEL", W - MX - tw, TOP - hh / 2 + th / 2 + 1, { size: 6.5, bold: true, color: GREY_TXT });
  }
  c.page.drawRectangle({ x: MX, y: TOP - hh - 8, width: CW, height: 2.5, color: ORANGE });
  c.y = TOP - hh - 8 - 2.5 - 10;
}

function titleBand(c: Ctx) {
  const h = 50;
  rrect(c, MX, c.y, CW, h, 8, { fill: INK });
  c.page.drawRectangle({ x: MX, y: c.y - h, width: 6, height: h, color: ORANGE });
  txt(c, "RAPPORT D'INTERVENTION", MX + 20, c.y - 31, { size: 18, bold: true, color: WHITE });
  txt(c, `N° ${c.report.reportNo}`, MX, c.y - 22, { size: 12, bold: true, color: ORANGE, w: CW - 16, align: "r" });
  const first = c.report.rows.find((r) => r.date)?.date;
  if (first) txt(c, fmtDate(first), MX, c.y - 38, { size: 8.5, color: rgb(0.8, 0.82, 0.85), w: CW - 16, align: "r" });
  c.y -= h + 14;
}

function newPage(c: Ctx) {
  c.page = c.doc.addPage([W, H]);
  brandHeader(c, false);
  txt(c, `Rapport d'intervention N° ${c.report.reportNo}  (suite)`, MX, c.y - 8, { size: 8.5, bold: true, color: GREY_TXT });
  c.y -= 22;
}

function ensure(c: Ctx, h: number) {
  if (c.y - h < BOTTOM) newPage(c);
}

function section(c: Ctx, title: string) {
  ensure(c, 90);
  c.page.drawRectangle({ x: MX, y: c.y - 11, width: 3.5, height: 12, color: ORANGE });
  txt(c, title.toUpperCase(), MX + 10, c.y - 8.5, { size: 9, bold: true });
  c.page.drawLine({ start: { x: MX + 10 + c.bold.widthOfTextAtSize(clean(c.bold, title.toUpperCase()), 9) + 8, y: c.y - 5 }, end: { x: MX + CW, y: c.y - 5 }, thickness: 0.6, color: GREY_LINE });
  c.y -= 20;
}

/** Cartes « étiquette / valeur » alignées sur une grille de colonnes. */
function fieldRow(c: Ctx, cells: { label: string; value: string; span?: number }[], cols: number) {
  const gap = 8;
  const unit = (CW - gap * (cols - 1)) / cols;
  const h = 36;
  ensure(c, h + 6);
  let x = MX;
  for (const cell of cells) {
    const span = cell.span ?? 1;
    const w = unit * span + gap * (span - 1);
    rrect(c, x, c.y, w, h, 6, { fill: GREY_BG });
    txt(c, cell.label.toUpperCase(), x + 9, c.y - 12, { size: 6.5, bold: true, color: GREY_TXT });
    let size = 10.5;
    const v = clean(c.bold, cell.value || "—");
    while (size > 6.5 && c.bold.widthOfTextAtSize(v, size) > w - 18) size -= 0.5;
    const lines = c.bold.widthOfTextAtSize(v, size) > w - 18 ? wrap(c.bold, v, size, w - 18).slice(0, 2) : [v];
    lines.forEach((ln, i) => txt(c, ln, x + 9, c.y - 26 - i * (size + 0.5), { size, bold: true, color: cell.value ? INK : rgb(0.65, 0.67, 0.7) }));
    x += w + gap;
  }
  c.y -= h + 8;
}

/** Bloc de texte libre qui peut couvrir plusieurs pages. */
function textCard(c: Ctx, content: string, minLines = 3) {
  const size = 10;
  const lead = 14;
  const lines = wrap(c.reg, content || "—", size, CW - 24);
  let i = 0;
  while (i < Math.max(lines.length, 1)) {
    ensure(c, 4 * lead + 16);
    const room = Math.floor((c.y - BOTTOM - 16) / lead);
    const take = Math.max(1, Math.min(lines.length - i, room));
    const shown = Math.max(take, i === 0 && lines.length - i <= room ? minLines : 0);
    const h = shown * lead + 16;
    rrect(c, MX, c.y, CW, h, 7, { stroke: GREY_LINE, sw: 0.9, fill: WHITE });
    lines.slice(i, i + take).forEach((ln, k) => txt(c, ln, MX + 12, c.y - 18 - k * lead, { size, color: content ? INK : rgb(0.65, 0.67, 0.7) }));
    c.y -= h + 8;
    i += take;
    if (i >= lines.length) break;
  }
}

function slot(a: string, b: string): string {
  return a && b ? `${a} - ${b}` : "";
}

function timeTable(c: Ctx) {
  const rows = c.report.rows.slice(0, MAX_ROWS);
  const cols = [
    { h: "Date", w: 76 },
    { h: "Voyage matin", w: 72 },
    { h: "Voyage soir", w: 72 },
    { h: "Travail matin", w: 72 },
    { h: "Travail soir", w: 72 },
    { h: "Voy./Prép.", w: 58 },
    { h: "Travail", w: 0 },
  ];
  cols[6].w = CW - cols.slice(0, 6).reduce((s, k) => s + k.w, 0);
  const hh = 22;
  const rh = 21;
  const need = hh + rh * (rows.length + 1) + 6;
  ensure(c, need);
  rrect(c, MX, c.y, CW, hh, 6, { fill: INK });
  let x = MX;
  cols.forEach((k) => {
    txt(c, k.h, x, c.y - 14.5, { size: 7.5, bold: true, color: WHITE, w: k.w, align: "c" });
    x += k.w;
  });
  let y = c.y - hh;
  rows.forEach((r, i) => {
    if (i % 2 === 0) c.page.drawRectangle({ x: MX, y: y - rh, width: CW, height: rh, color: GREY_BG });
    const vals = [
      fmtDate(r.date) || "-",
      slot(r.voyMatinDeb, r.voyMatinFin),
      slot(r.voySoirDeb, r.voySoirFin),
      slot(r.travMatinDeb, r.travMatinFin),
      slot(r.travSoirDeb, r.travSoirFin),
      fmtMinutes(rowTravelMinutes(r)),
      fmtMinutes(rowWorkMinutes(r)),
    ];
    let cx = MX;
    cols.forEach((k, n) => {
      const strong = n >= 5;
      txt(c, vals[n] || "-", cx, y - 14, { size: n === 0 ? 8.5 : 8, bold: strong || n === 0, color: n === 6 ? ORANGE : vals[n] ? INK : rgb(0.7, 0.72, 0.75), w: k.w, align: "c" });
      cx += k.w;
    });
    y -= rh;
  });
  const t = totals(rows);
  rrect(c, MX, y - 2, CW, rh, 6, { fill: ORANGE_SOFT });
  const labelW = cols.slice(0, 5).reduce((s, k) => s + k.w, 0);
  txt(c, "CUMUL TEMPS", MX + 12, y - 16, { size: 8, bold: true });
  txt(c, fmtMinutes(t.travel), MX + labelW, y - 16, { size: 9.5, bold: true, w: cols[5].w, align: "c" });
  txt(c, fmtMinutes(t.work), MX + labelW + cols[5].w, y - 16, { size: 9.5, bold: true, color: ORANGE, w: cols[6].w, align: "c" });
  c.y = y - rh - 14;
}

function chip(c: Ctx, label: string, value: boolean | null, x: number, w: number) {
  const h = 36;
  rrect(c, x, c.y, w, h, 6, { fill: GREY_BG });
  txt(c, label.toUpperCase(), x + 9, c.y - 12, { size: 6.5, bold: true, color: GREY_TXT });
  const text = value === true ? "OUI" : value === false ? "NON" : "—";
  const pillW = 40;
  const fill = value === true ? ORANGE : value === false ? INK : GREY_LINE;
  rrect(c, x + 9, c.y - 17, pillW, 15, 7.5, { fill });
  txt(c, text, x + 9, c.y - 26.3, { size: 8, bold: true, color: value === null ? GREY_TXT : WHITE, w: pillW, align: "c" });
}

function signatures(c: Ctx, sigT: { img: PDFImage; w: number; h: number } | null, sigC: { img: PDFImage; w: number; h: number } | null) {
  const h = 112;
  ensure(c, h + 6);
  const gap = 10;
  const w = (CW - gap * 2) / 3;
  const items: [string, typeof sigT, string][] = [
    ["Technicien", sigT, c.report.technicien],
    ["Client", sigC, c.report.contact],
    ["Administration", null, ""],
  ];
  items.forEach(([label, sig, name], i) => {
    const x = MX + i * (w + gap);
    rrect(c, x, c.y, w, h, 7, { stroke: GREY_LINE, sw: 0.9, fill: WHITE });
    c.page.drawRectangle({ x: x + 0.5, y: c.y - 20, width: w - 1, height: 19.5, color: GREY_BG });
    txt(c, label.toUpperCase(), x + 10, c.y - 13.5, { size: 7.5, bold: true, color: GREY_TXT });
    if (sig) contain(c, sig.img, sig.w, sig.h, x + 8, c.y - 24, w - 16, h - 24 - 22);
    if (name) txt(c, name, x + 10, c.y - h + 8, { size: 7.5, color: GREY_TXT });
  });
  c.y -= h + 8;
}

function footers(c: Ctx) {
  const pages = c.doc.getPages();
  const date = new Date().toLocaleDateString("fr-FR", { timeZone: "Africa/Casablanca" });
  pages.forEach((p, i) => {
    c.page = p;
    p.drawLine({ start: { x: MX, y: 34 }, end: { x: W - MX, y: 34 }, thickness: 0.6, color: GREY_LINE });
    txt(c, `VEMAT  ·  Rapport d'intervention N° ${c.report.reportNo}  ·  Édité le ${date}`, MX, 21, { size: 7.5, color: GREY_TXT });
    txt(c, `Page ${i + 1} / ${pages.length}`, MX, 21, { size: 7.5, bold: true, color: GREY_TXT, w: CW, align: "r" });
  });
}

export async function buildInterventionPdf(r: InterventionReport): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Rapport d'intervention ${r.reportNo}`);
  doc.setAuthor("VEMAT");
  doc.setCreator("VEMAT - Rapports techniciens");
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const vemat = await doc.embedPng(Buffer.from(logoVemat, "base64"));
  const terex = await doc.embedPng(Buffer.from(logoTerex, "base64"));
  const c: Ctx = { doc, reg, bold, page: doc.addPage([W, H]), y: TOP, logos: { vemat, terex }, report: r };

  brandHeader(c, true);
  titleBand(c);

  section(c, "Identification");
  fieldRow(c, [{ label: "Client", value: r.client, span: 2 }, { label: "N° OT", value: r.otNo }], 3);
  fieldRow(c, [{ label: "Chantier", value: r.chantier, span: 2 }, { label: "Technicien", value: r.technicien }], 3);
  fieldRow(c, [{ label: "Contact", value: r.contact }, { label: "Téléphone", value: r.tel }, { label: "Véhicule", value: r.vehicule }], 3);
  fieldRow(c, [{ label: "Modèle", value: r.modele }, { label: "N° de série", value: r.serie }, { label: "Compteur horaire", value: r.comptHr }], 3);

  section(c, "Nature de l'intervention");
  textCard(c, r.nature, 2);

  section(c, "Détail du travail");
  textCard(c, r.detail, 5);

  section(c, "Horaires");
  timeTable(c);

  section(c, "Séjour et suivi");
  ensure(c, 50);
  {
    const gap = 8;
    const w = (CW - gap * 5) / 6;
    const items: [string, string | boolean | null][] = [
      ["Repas", r.repas], ["Nuits", r.nuits], ["Kilomètres", r.km],
      ["Garantie", r.garantie], ["Fournitures", r.fournitures], ["Travaux restants", r.travauxRestant],
    ];
    items.forEach(([label, v], i) => {
      const x = MX + i * (w + gap);
      if (typeof v === "string") {
        rrect(c, x, c.y, w, 36, 6, { fill: GREY_BG });
        txt(c, label.toUpperCase(), x + 9, c.y - 12, { size: 6.5, bold: true, color: GREY_TXT });
        txt(c, v || "—", x + 9, c.y - 29, { size: 13, bold: true, color: v ? INK : rgb(0.65, 0.67, 0.7) });
      } else chip(c, label, v, x, w);
    });
    c.y -= 36 + 10;
  }
  if (r.travauxRestant === true || r.travauxRestantDetail) {
    section(c, "Travaux restant à effectuer");
    textCard(c, r.travauxRestantDetail, 2);
  }

  ensure(c, 160); // titre + cadres de signature toujours ensemble
  section(c, "Signatures");
  signatures(c, await embedData(doc, r.signatureTech), await embedData(doc, r.signatureClient));

  /* ───────── Photos ───────── */
  if (r.photos.length) {
    const perPage = 6;
    const cols = 2;
    const gap = 12;
    const cw = (CW - gap) / cols;
    for (let i = 0; i < r.photos.length; i += perPage) {
      c.page = doc.addPage([W, H]);
      brandHeader(c, false);
      txt(c, `Photos — Rapport d'intervention N° ${r.reportNo}`, MX, c.y - 10, { size: 11, bold: true });
      c.y -= 26;
      const ch = (c.y - BOTTOM - gap * 2) / 3;
      for (let k = 0; k < perPage && i + k < r.photos.length; k++) {
        const col = k % cols;
        const row = Math.floor(k / cols);
        const x = MX + col * (cw + gap);
        const top = c.y - row * (ch + gap);
        const p = r.photos[i + k];
        rrect(c, x, top, cw, ch, 8, { stroke: GREY_LINE, sw: 0.9, fill: WHITE });
        const capH = 36;
        const im = await embedData(doc, p.dataUrl);
        if (im) contain(c, im.img, im.w, im.h, x + 6, top - 6, cw - 12, ch - capH - 12);
        const base = top - ch;
        rrect(c, x + 9, base + capH - 6, 17, 17, 8.5, { fill: ORANGE });
        txt(c, String(i + k + 1), x + 9, base + capH - 6 - 11.8, { size: 8.5, bold: true, color: WHITE, w: 17, align: "c" });
        wrap(reg, p.caption || "", 8.5, cw - 48).slice(0, 2).forEach((ln, n) => txt(c, ln, x + 33, base + capH - 6 - 11.8 + 3 - n * 11, { size: 8.5, color: INK }));
      }
    }
  }

  footers(c);
  return Buffer.from(await doc.save());
}
