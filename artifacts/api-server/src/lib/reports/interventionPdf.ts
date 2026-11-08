import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import logoVemat from "../../assets/reports/pdf-logo-vemat.png";
import logoTerex from "../../assets/reports/pdf-logo-terex.png";
import logoJlg from "../../assets/reports/pdf-logo-jlg.png";
import logoWestchase from "../../assets/reports/pdf-logo-westchase.png";
import {
  BOTTOM, CW, GREY_BG, GREY_LINE, GREY_TXT, INK, MX, ORANGE, ORANGE_SOFT, TOP, WHITE, H, W,
  brandHeader, contain, embedData, ensure, fieldRow, footers, rrect, section, textCard, txt, wrap,
  type Kit,
} from "./pdfKit";
import { MAX_ROWS, type InterventionReport } from "./types";
import { fmtDate, fmtMinutes, rowTravelMinutes, rowWorkMinutes, totals } from "./time";

type Ctx = Kit & { report: InterventionReport };

function titleBand(c: Ctx) {
  const h = 54;
  rrect(c, MX, c.y, CW, h, 8, { fill: INK });
  c.page.drawRectangle({ x: MX, y: c.y - h, width: 6, height: h, color: ORANGE });
  txt(c, "RAPPORT D'INTERVENTION", MX + 20, c.y - 27, { size: 18, bold: true, color: WHITE });
  txt(c, "FICHE N°", MX, c.y - 16, { size: 7, bold: true, color: rgb(0.8, 0.82, 0.85), w: CW - 16, align: "r" });
  txt(c, c.report.reportNo, MX, c.y - 33, { size: 17, bold: true, color: ORANGE, w: CW - 16, align: "r" });
  const first = c.report.rows.find((r) => r.date)?.date;
  if (first) txt(c, `Intervention du ${fmtDate(first)}`, MX + 20, c.y - 44, { size: 8, color: rgb(0.8, 0.82, 0.85) });
  c.y -= h + 14;
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

export async function buildInterventionPdf(r: InterventionReport): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Rapport d'intervention ${r.reportNo}`);
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
  const c: Ctx = { doc, reg, bold, page: doc.addPage([W, H]), y: TOP, logos, report: r, runningTitle: `Rapport d'intervention - fiche N° ${r.reportNo}`, footerLabel: `Rapport d'intervention N° ${r.reportNo}` };

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
      txt(c, `Photos — Rapport d'intervention - fiche N° ${r.reportNo}`, MX, c.y - 10, { size: 11, bold: true });
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
