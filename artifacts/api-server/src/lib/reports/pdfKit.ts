import { PDFDocument, rgb, type PDFFont, type PDFPage, type PDFImage, type RGB } from "pdf-lib";
import { decodeDataUrl, fit } from "./image";

/* ───────── Charte ───────── */
export const W = 595.28; // A4 portrait
export const H = 841.89;
export const MX = 30;
export const CW = W - 2 * MX;
export const TOP = H - 28;
export const BOTTOM = 46;

export const ORANGE = rgb(0.976, 0.451, 0.086); // #F97316 (orange du site)
export const ORANGE_SOFT = rgb(1, 0.949, 0.902);
export const INK = rgb(0.075, 0.09, 0.11); // #13171C
export const GREY_TXT = rgb(0.42, 0.45, 0.5);
export const GREY_LINE = rgb(0.86, 0.87, 0.89);
export const GREY_BG = rgb(0.955, 0.96, 0.968);
export const WHITE = rgb(1, 1, 1);
export const GREEN = rgb(0.09, 0.55, 0.32);


/** Contexte de dessin commun à tous les rapports. */
export interface Kit {
  doc: PDFDocument;
  reg: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number; // curseur (haut du prochain élément)
  logos: { vemat: PDFImage; west: PDFImage; terex: PDFImage; jlg: PDFImage };
  /** Titre de rappel en haut des pages de suite. */
  runningTitle: string;
  /** Texte de pied de page (avant « Édité le … »). */
  footerLabel: string;
}

/* ───────── Texte ───────── */
export function clean(font: PDFFont, text: string): string {
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

export function wrap(font: PDFFont, text: string, size: number, maxW: number): string[] {
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

export function txt(c: Kit, s: string, x: number, baseline: number, o: { size?: number; bold?: boolean; color?: RGB; align?: "l" | "c" | "r"; w?: number } = {}) {
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
export function rrect(c: Kit, x: number, top: number, w: number, h: number, r: number, o: { fill?: RGB; stroke?: RGB; sw?: number }) {
  const rr = Math.min(r, w / 2, h / 2);
  const path = `M ${rr} 0 H ${w - rr} A ${rr} ${rr} 0 0 1 ${w} ${rr} V ${h - rr} A ${rr} ${rr} 0 0 1 ${w - rr} ${h} H ${rr} A ${rr} ${rr} 0 0 1 0 ${h - rr} V ${rr} A ${rr} ${rr} 0 0 1 ${rr} 0 Z`;
  c.page.drawSvgPath(path, { x, y: top, color: o.fill, borderColor: o.stroke, borderWidth: o.stroke ? (o.sw ?? 0.8) : 0 });
}

export function contain(c: Kit, img: PDFImage, iw: number, ih: number, x: number, top: number, w: number, h: number, align: "l" | "c" | "r" = "c") {
  const s = fit(iw, ih, w, h);
  const px = align === "l" ? x : align === "r" ? x + w - s.width : x + (w - s.width) / 2;
  c.page.drawImage(img, { x: px, y: top - h + (h - s.height) / 2, width: s.width, height: s.height });
}

export async function embedData(doc: PDFDocument, dataUrl: string | null) {
  const d = decodeDataUrl(dataUrl);
  if (!d) return null;
  try {
    const img = d.ext === "png" ? await doc.embedPng(d.buf) : await doc.embedJpg(d.buf);
    return { img, w: d.width, h: d.height };
  } catch {
    return null;
  }
}

export function brandHeader(c: Kit, big: boolean) {
  const { vemat, west, terex, jlg } = c.logos;
  const hh = big ? 46 : 24; // hauteur de la bande d'en-tête
  const vh = big ? 40 : 21;
  const vw = vh * (984 / 389);
  const ww = big ? 46 : 24;

  // Gauche : Vemat × Vemat Westchase
  c.page.drawImage(vemat, { x: MX, y: TOP - hh / 2 - vh / 2, width: vw, height: vh });
  txt(c, "×", MX + vw + 8, TOP - hh / 2 - (big ? 6 : 3.5), { size: big ? 17 : 10, bold: true, color: GREY_TXT });
  c.page.drawImage(west, { x: MX + vw + (big ? 28 : 18), y: TOP - hh / 2 - ww / 2, width: ww, height: ww });

  // Droite : distributeur officiel Terex et JLG
  const th = big ? 17 : 9.5;
  const tw = th * (716 / 121);
  const jh = big ? 17 : 9.5;
  const jw = jh * (700 / 234);
  const gap = big ? 16 : 10;
  const rowY = TOP - hh / 2 - th / 2 - (big ? 5 : 0);
  c.page.drawImage(terex, { x: W - MX - tw, y: rowY, width: tw, height: th });
  c.page.drawImage(jlg, { x: W - MX - tw - gap - jw, y: rowY - (jh - th) / 2, width: jw, height: jh });
  if (big) txt(c, "DISTRIBUTEUR OFFICIEL", W - MX - 150, TOP - 7, { size: 6.5, bold: true, color: GREY_TXT, w: 150, align: "r" });

  c.page.drawRectangle({ x: MX, y: TOP - hh - 8, width: CW, height: 2.5, color: ORANGE });
  c.y = TOP - hh - 8 - 2.5 - 10;
}

export function newPage(c: Kit) {
  c.page = c.doc.addPage([W, H]);
  brandHeader(c, false);
  txt(c, `${c.runningTitle}  (suite)`, MX, c.y - 8, { size: 8.5, bold: true, color: GREY_TXT });
  c.y -= 22;
}

export function ensure(c: Kit, h: number) {
  if (c.y - h < BOTTOM) newPage(c);
}

export function section(c: Kit, title: string) {
  ensure(c, 90);
  c.page.drawRectangle({ x: MX, y: c.y - 11, width: 3.5, height: 12, color: ORANGE });
  txt(c, title.toUpperCase(), MX + 10, c.y - 8.5, { size: 9, bold: true });
  c.page.drawLine({ start: { x: MX + 10 + c.bold.widthOfTextAtSize(clean(c.bold, title.toUpperCase()), 9) + 8, y: c.y - 5 }, end: { x: MX + CW, y: c.y - 5 }, thickness: 0.6, color: GREY_LINE });
  c.y -= 20;
}

/** Cartes « étiquette / valeur » alignées sur une grille de colonnes. */
export function fieldRow(c: Kit, cells: { label: string; value: string; span?: number }[], cols: number) {
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
export function textCard(c: Kit, content: string, minLines = 3) {
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

export function footers(c: Kit) {
  const pages = c.doc.getPages();
  const date = new Date().toLocaleDateString("fr-FR", { timeZone: "Africa/Casablanca" });
  pages.forEach((p, i) => {
    c.page = p;
    p.drawLine({ start: { x: MX, y: 34 }, end: { x: W - MX, y: 34 }, thickness: 0.6, color: GREY_LINE });
    txt(c, `VEMAT  ·  ${c.footerLabel}  ·  Édité le ${date}`, MX, 21, { size: 7.5, color: GREY_TXT });
    txt(c, `Page ${i + 1} / ${pages.length}`, MX, 21, { size: 7.5, bold: true, color: GREY_TXT, w: CW, align: "r" });
  });
}

