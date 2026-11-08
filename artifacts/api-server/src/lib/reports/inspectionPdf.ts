import { PDFDocument, StandardFonts, rgb, type RGB } from "pdf-lib";
import logoVemat from "../../assets/reports/pdf-logo-vemat.png";
import logoTerex from "../../assets/reports/pdf-logo-terex.png";
import logoJlg from "../../assets/reports/pdf-logo-jlg.png";
import logoWestchase from "../../assets/reports/pdf-logo-westchase.png";
import {
  BOTTOM, CW, GREY_BG, GREY_LINE, GREY_TXT, INK, MX, ORANGE, ORANGE_SOFT, TOP, WHITE, H, W,
  brandHeader, clean, contain, embedData, ensure, fieldRow, footers, newPage, rrect, section, textCard, txt, wrap,
  type Kit,
} from "./pdfKit";
import { CHECKLIST, type ChecklistSection } from "./inspectionChecklist";
import { KIND_LABEL, type InspectionReport, type Score } from "./inspectionTypes";
import { fmtDate } from "./time";

type Ctx = Kit & { report: InspectionReport };

const SCORE_COLOR: Record<number, RGB> = {
  1: rgb(0.09, 0.55, 0.32),
  2: rgb(0.93, 0.6, 0.05),
  3: rgb(0.84, 0.17, 0.17),
  4: rgb(0.45, 0.48, 0.53),
};
const SCORE_NAME: Record<number, string> = { 1: "Bonne condition", 2: "Moyenne condition", 3: "Erreur / défaut", 4: "Non contrôlable" };
const PAGE_NAME: Record<string, string> = { porteur: "Porteur (châssis)", superstructure: "Superstructure (tourelle)" };

function titleBand(c: Ctx) {
  const r = c.report;
  const h = 54;
  rrect(c, MX, c.y, CW, h, 8, { fill: INK });
  c.page.drawRectangle({ x: MX, y: c.y - h, width: 6, height: h, color: ORANGE });
  txt(c, "INSPECTION GRUE", MX + 20, c.y - 27, { size: 18, bold: true, color: WHITE });
  txt(c, "FICHE N°", MX, c.y - 16, { size: 7, bold: true, color: rgb(0.8, 0.82, 0.85), w: CW - 16, align: "r" });
  txt(c, r.reportNo, MX, c.y - 33, { size: 17, bold: true, color: ORANGE, w: CW - 16, align: "r" });
  const sub = [KIND_LABEL[r.kind], r.date ? `du ${fmtDate(r.date)}` : ""].filter(Boolean).join(" ");
  txt(c, sub, MX + 20, c.y - 44, { size: 8, color: rgb(0.8, 0.82, 0.85) });
  c.y -= h + 14;
}

/** Pastilles de la légende 1 à 4. */
function legend(c: Ctx) {
  ensure(c, 24);
  let x = MX;
  for (const s of [1, 2, 3, 4]) {
    rrect(c, x, c.y, 13, 13, 3, { fill: SCORE_COLOR[s] });
    txt(c, String(s), x, c.y - 9.6, { size: 8, bold: true, color: WHITE, w: 13, align: "c" });
    txt(c, SCORE_NAME[s], x + 18, c.y - 9.6, { size: 8, color: GREY_TXT });
    x += 18 + c.reg.widthOfTextAtSize(clean(c.reg, SCORE_NAME[s]), 8) + 16;
  }
  c.y -= 22;
}

function stats(c: Ctx) {
  const r = c.report;
  const counts = [0, 0, 0, 0];
  for (const v of Object.values(r.scores)) counts[v - 1]++;
  const total = CHECKLIST.reduce((n, p) => n + p.sections.reduce((m, s) => m + s.rows.length, 0), 0);
  const done = counts.reduce((a, b) => a + b, 0);
  const gap = 8;
  const w = (CW - gap * 3) / 4;
  const h = 52;
  ensure(c, h + 30);
  counts.forEach((n, i) => {
    const x = MX + i * (w + gap);
    rrect(c, x, c.y, w, h, 7, { fill: GREY_BG });
    c.page.drawRectangle({ x, y: c.y - h + 8, width: 3.5, height: h - 16, color: SCORE_COLOR[i + 1] });
    txt(c, SCORE_NAME[i + 1].toUpperCase(), x + 12, c.y - 14, { size: 6.5, bold: true, color: GREY_TXT });
    txt(c, String(n), x + 12, c.y - 40, { size: 22, bold: true, color: SCORE_COLOR[i + 1] });
    txt(c, done ? `${Math.round((n / done) * 100)} %` : "", x, c.y - 38, { size: 9, bold: true, color: GREY_TXT, w: w - 12, align: "r" });
  });
  c.y -= h + 8;
  txt(c, `${done} point(s) contrôlé(s) sur ${total} dans le modèle.${done < total ? " Les points non cochés n'ont pas été renseignés." : ""}`, MX, c.y - 8, { size: 8, color: GREY_TXT });
  c.y -= 20;
}

/** Points notés 3 ou 4 : ce que la direction doit voir en premier. */
function attention(c: Ctx) {
  const r = c.report;
  const items: { zone: string; rub: string; label: string; code: string; score: number }[] = [];
  for (const p of CHECKLIST) for (const s of p.sections) for (const row of s.rows) {
    const sc = r.scores[row.id];
    if (sc === 3 || sc === 4) items.push({ zone: p.id === "porteur" ? "Porteur" : "Tourelle", rub: s.title.split("›").pop()!.trim(), label: row.label, code: row.code, score: sc });
  }
  section(c, "Points à traiter (notes 3 et 4)");
  if (!items.length) {
    textCard(c, "Aucun point noté 3 (erreur / défaut) ou 4 (non contrôlable).", 1);
    return;
  }
  const cols = [58, 158, CW - 58 - 158 - 96, 96];
  const rh = 17;
  const head = () => {
    rrect(c, MX, c.y, CW, 18, 5, { fill: INK });
    let x = MX;
    ["Zone", "Rubrique", "Point de contrôle", "Note"].forEach((t, i) => {
      txt(c, t, x + 8, c.y - 12.5, { size: 7.5, bold: true, color: WHITE });
      x += cols[i];
    });
    c.y -= 18;
  };
  ensure(c, 18 + rh * 2 + 6);
  head();
  items.forEach((it, i) => {
    if (c.y - rh < BOTTOM) { newPage(c); head(); }
    if (i % 2 === 0) c.page.drawRectangle({ x: MX, y: c.y - rh, width: CW, height: rh, color: GREY_BG });
    let x = MX;
    const fit = (t: string, w: number, bold = false) => {
      let s = 8;
      const f = bold ? c.bold : c.reg;
      const cl = clean(f, t);
      while (s > 6 && f.widthOfTextAtSize(cl, s) > w - 12) s -= 0.5;
      return s;
    };
    const cells = [it.zone, it.rub, `${/^[a-z]$/.test(it.code) ? "" : it.code + "  "}${it.label}`];
    cells.forEach((t, k) => {
      txt(c, t, x + 8, c.y - 11.5, { size: fit(t, cols[k]), bold: k === 0 });
      x += cols[k];
    });
    rrect(c, x + 8, c.y - 3, 80, 11.5, 5.75, { fill: SCORE_COLOR[it.score] });
    txt(c, it.score === 3 ? "3 · Défaut" : "4 · Non contrôlable", x + 8, c.y - 11.2, { size: 7, bold: true, color: WHITE, w: 80, align: "c" });
    c.y -= rh;
  });
  c.y -= 12;
}

function engineBlock(c: Ctx, title: string, e: InspectionReport["moteurPorteur"]) {
  if (!Object.values(e).some(Boolean)) return;
  section(c, title);
  fieldRow(c, [{ label: "Produit", value: e.produit }, { label: "Type", value: e.type }, { label: "N° de série", value: e.serie }], 3);
  fieldRow(c, [{ label: "CV / kW", value: e.cv }, { label: "Tours / min", value: e.rpm }, { label: "US EPA", value: e.epa }], 3);
}

/* ───────── Liste de contrôle en deux colonnes ───────── */
const ROW_H = 11.5;
const SEC_H = 14.5;
const GAP_COL = 14;

function sectionHeight(s: ChecklistSection): number {
  return SEC_H + s.rows.length * ROW_H + 6;
}

function drawSection(c: Ctx, s: ChecklistSection, x: number, top: number, w: number) {
  rrect(c, x, top, w, SEC_H - 1, 3, { fill: INK });
  let size = 8;
  while (size > 6 && c.bold.widthOfTextAtSize(clean(c.bold, s.title), size) > w - 12) size -= 0.5;
  txt(c, s.title, x + 6, top - 9.8, { size, bold: true, color: WHITE });
  let y = top - SEC_H;
  const bw = 11;
  const bgap = 2;
  const boxesW = 4 * bw + 3 * bgap;
  const bx = x + w - boxesW;
  s.rows.forEach((row, i) => {
    if (i % 2 === 0) c.page.drawRectangle({ x, y: y - ROW_H, width: w, height: ROW_H, color: GREY_BG });
    const letter = /^[a-z]$/.test(row.code);
    txt(c, row.code, x + (letter ? 12 : 3), y - 8.2, { size: 6.5, color: GREY_TXT });
    const labelX = x + 27;
    const labelW = bx - labelX - 4;
    let ls = 7.6;
    while (ls > 5.8 && c.reg.widthOfTextAtSize(clean(c.reg, row.label), ls) > labelW) ls -= 0.3;
    txt(c, row.label, labelX, y - 8.2, { size: ls });
    const score = c.report.scores[row.id] as Score | undefined;
    for (let k = 1; k <= 4; k++) {
      const bxk = bx + (k - 1) * (bw + bgap);
      if (score === k) {
        rrect(c, bxk, y - 0.7, bw, ROW_H - 1.4, 2.2, { fill: SCORE_COLOR[k] });
        txt(c, String(k), bxk, y - 8.2, { size: 7.5, bold: true, color: WHITE, w: bw, align: "c" });
      } else {
        rrect(c, bxk, y - 0.7, bw, ROW_H - 1.4, 2.2, { stroke: rgb(0.8, 0.82, 0.85), sw: 0.5, fill: WHITE });
      }
    }
    y -= ROW_H;
  });
}

function checklist(c: Ctx, pageId: "porteur" | "superstructure") {
  const page = CHECKLIST.find((p) => p.id === pageId)!;
  if (c.y - BOTTOM < 330) newPage(c); // sinon on poursuit sur la page en cours
  else c.y -= 6;
  txt(c, `Contrôle visuel et fonctionnel — ${PAGE_NAME[pageId]}`, MX, c.y - 11, { size: 12, bold: true });
  c.y -= 24;
  legend(c);
  const colW = (CW - GAP_COL) / 2;
  let top0 = c.y;
  const ys = [top0, top0];
  let col = 0;
  for (const s of page.sections) {
    const h = sectionHeight(s);
    if (ys[col] - h < BOTTOM) {
      col++;
      if (col === 2) {
        newPage(c);
        txt(c, `Contrôle visuel et fonctionnel — ${PAGE_NAME[pageId]} (suite)`, MX, c.y - 11, { size: 10.5, bold: true });
        c.y -= 22;
        top0 = c.y;
        ys[0] = ys[1] = top0;
        col = 0;
      }
    }
    drawSection(c, s, MX + col * (colW + GAP_COL), ys[col], colW);
    ys[col] -= h;
  }
  c.y = Math.min(ys[0], ys[1]) - 6;
}

function simpleTable(c: Ctx, head: string[], widths: number[], rows: string[][], opts: { aligns?: ("l" | "c")[]; rowH?: number } = {}) {
  const rh = opts.rowH ?? 18;
  const draw = () => {
    rrect(c, MX, c.y, CW, 18, 5, { fill: INK });
    let x = MX;
    head.forEach((t, i) => {
      txt(c, t, x, c.y - 12.5, { size: 7.5, bold: true, color: WHITE, w: widths[i], align: "c" });
      x += widths[i];
    });
    c.y -= 18;
  };
  ensure(c, 18 + rh * 2 + 6);
  draw();
  rows.forEach((r, i) => {
    const lines = r.map((t, k) => wrap(c.reg, t, 8.5, widths[k] - 12).slice(0, 4));
    const h = Math.max(rh, Math.max(...lines.map((l) => l.length)) * 11 + 7);
    if (c.y - h < BOTTOM) { newPage(c); draw(); }
    if (i % 2 === 0) c.page.drawRectangle({ x: MX, y: c.y - h, width: CW, height: h, color: GREY_BG });
    let x = MX;
    lines.forEach((ls, k) => {
      const center = (opts.aligns?.[k] ?? "c") === "c";
      ls.forEach((ln, n) => txt(c, ln, x + (center ? 0 : 6), c.y - 12 - n * 11, { size: 8.5, w: widths[k], align: center ? "c" : "l", color: ln ? INK : GREY_TXT }));
      x += widths[k];
    });
    c.y -= h;
  });
  c.y -= 12;
}

export async function buildInspectionPdf(r: InspectionReport): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Rapport d'inspection grue ${r.reportNo}`);
  doc.setAuthor("VEMAT");
  doc.setCreator("VEMAT - Rapports techniciens");
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logos = {
    vemat: await doc.embedPng(Buffer.from(logoVemat, "base64")),
    west: await doc.embedPng(Buffer.from(logoWestchase, "base64")),
    terex: await doc.embedPng(Buffer.from(logoTerex, "base64")),
    jlg: await doc.embedPng(Buffer.from(logoJlg, "base64")),
  };
  const c: Ctx = {
    doc, reg, bold, page: doc.addPage([W, H]), y: TOP, logos, report: r,
    runningTitle: `Inspection grue - fiche N° ${r.reportNo}`,
    footerLabel: `Inspection grue N° ${r.reportNo}`,
  };

  brandHeader(c, true);
  titleBand(c);

  section(c, "Identification");
  fieldRow(c, [{ label: "Client", value: r.client, span: 2 }, { label: "N° OT", value: r.ot }], 3);
  fieldRow(c, [{ label: "Type de machine", value: r.type }, { label: "N° de série", value: r.serie }, { label: "Technicien", value: r.technicien }], 3);
  fieldRow(c, [{ label: "Date", value: r.date ? fmtDate(r.date) : "" }, { label: "Lieu", value: r.lieu }, { label: "Kilométrage (porteur)", value: r.km }], 3);
  fieldRow(c, [{ label: "Heures (tourelle)", value: r.hrs }], 3);

  section(c, "Synthèse");
  stats(c);
  attention(c);

  engineBlock(c, "Moteur porteur", r.moteurPorteur);
  engineBlock(c, "Moteur tourelle", r.moteurTourelle);
  if (r.commentairePorteur) { section(c, "Commentaire porteur"); textCard(c, r.commentairePorteur, 2); }
  if (r.commentaireTourelle) { section(c, "Commentaire tourelle"); textCard(c, r.commentaireTourelle, 2); }

  /* Listes de contrôle */
  checklist(c, "porteur");
  checklist(c, "superstructure");

  /* Défauts */
  newPage(c);
  section(c, "Liste des défauts");
  if (!r.defauts.length) textCard(c, "Aucun défaut saisi.", 1);
  else {
    simpleTable(
      c,
      ["N°", "Zone", "Description", "Commentaire"],
      [30, 62, 270, CW - 362],
      r.defauts.map((d, i) => [String(i + 1), d.zone === "porteur" ? "Porteur" : "Tourelle", d.description, d.commentaire]),
      { aligns: ["c", "c", "l", "l"] },
    );
  }

  /* Jeu couronne */
  if (r.couronne.some((m) => m.t1 || m.t2 || m.t3)) {
    section(c, "Jeu de couronne d'orientation (en 0,01 mm)");
    simpleTable(c, ["Point de mesure", "Essai 1", "Essai 2", "Essai 3"], [150, 120, 120, CW - 390], r.couronne.map((m, i) => [`Point ${i + 1}`, m.t1, m.t2, m.t3]));
  }

  /* Pneus */
  if (r.pneus.length) {
    section(c, "Usure des pneus");
    simpleTable(
      c,
      ["Essieu", "Gauche : marque", "Dimensions", "Usure %", "Droite : marque", "Dimensions", "Usure %"],
      [42, 92, 86, 52, 92, 86, CW - 450],
      r.pneus.map((a, i) => [String(i + 1), a.gMarque, a.gDim, a.gUsure, a.dMarque, a.dDim, a.dUsure]),
    );
    if (r.pneusCommentaire) { ensure(c, 70); txt(c, "Commentaire pneus", MX, c.y - 8, { size: 8, bold: true, color: GREY_TXT }); c.y -= 14; textCard(c, r.pneusCommentaire, 2); }
  }

  /* Photos */
  if (r.photos.length) {
    const perPage = 6;
    const cols = 2;
    const gap = 12;
    const cw = (CW - gap) / cols;
    for (let i = 0; i < r.photos.length; i += perPage) {
      c.page = doc.addPage([W, H]);
      brandHeader(c, false);
      txt(c, `Photos — Inspection grue - fiche N° ${r.reportNo}`, MX, c.y - 10, { size: 11, bold: true });
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

  void ORANGE_SOFT;
  footers(c);
  return Buffer.from(await doc.save());
}
