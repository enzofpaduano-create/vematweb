/**
 * En-tête « Vemat Casablanca » : modèle français (devis DE25340) — Word et PDF.
 *
 * - Libellés français, montants au format français, devise MAD par défaut
 * - TVA : taux modifiable sur chaque document (20 % par défaut au Maroc)
 * - Pas de bloc bancaire
 * - Pied de page société (capital, siège, RC / patente / IF / CNSS)
 *
 * Un « modèle » neutre (CbModel) est construit à partir d'un document PDR ou SAV,
 * puis rendu en Word ou en PDF.
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, ImageRun,
  AlignmentType, WidthType, BorderStyle, VerticalAlign,
} from "docx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "@/assets/vemat-logo.png";
import { computeTotals, lineDiscountedUnit, lineTotal, type PdrDocument } from "@/lib/pdrDocuments";
import { computeSavTotals, labourTotal, travelTotal, partLineTotal, type SavDocument } from "@/lib/savDocuments";

export type CbCurrency = "EUR" | "USD" | "MAD";

export interface CbLine {
  ref: string;
  designation: string;
  qty: string;
  unit: number;
  discountPct: number;
  discountedUnit: number;
  total: number;
}

export interface CbModel {
  title: string;                 // « DEVIS », « FACTURE »…
  reference: string;
  dateISO: string;
  clientCompany: string;
  clientAddress: string[];
  clientPhone: string;
  attention: string;
  machine: string;
  clientCode: string;
  extra: string[];               // logistique / site / intervention
  lines: CbLine[];
  currency: CbCurrency;
  applyVat: boolean;
  vatRate: number;
  subtotal: number;
  vat: number;
  total: number;
  payment: string;
  validity: string | null;       // null = non affiché (hors devis)
  delivery: string;
  note: string;
  showTerms: boolean;
  closing: "contract" | "receipt";
}

// ── Société ─────────────────────────────────────────────────────────────────

/** Pied de page (texte du modèle Word 2026). */
export const CB_FOOTER_LINES = [
  "VEMAT – Capital : 9.938.000,00 Dh – Siège Social et Atelier – Km 13, Route d'El Jadida, Oulad Azzouz, RS 1028,",
  "Province de Nouaceur. BP 5309  Casablanca - Tél. :+212-522-651213 - Fax : +212-522-651064 vemat@vematgroup.com",
  "VEMAT S.A.R.L. is an authorized distributor of TEREX, TADANO, JLG, MECALAC, and MAGNI products , R.C.: 180945 – PATENTE: 91350111 - I.F.: 40166219 – CNSS : 7799341",
] as const;

const TITLE_FR: Record<string, string> = {
  devis: "DEVIS",
  bon_commande: "BON DE COMMANDE",
  commande_fournisseur: "COMMANDE FOURNISSEUR",
  bon_reception: "BON DE RÉCEPTION",
  bon_livraison: "BON DE LIVRAISON",
  facture: "FACTURE",
  avoir: "AVOIR",
};

const CLOSING = {
  contract: [
    { bold: true, text: "Document contractuel :" },
    { bold: false, text: "Délai de disponibilité est indicatif sera confirmé lors de la commande, sauf vente entre temps." },
    { bold: false, text: "Nous sommes à votre disposition pour tout complément d'information." },
    { bold: false, text: "Nous vous prions d'agréer, cher client, nos sincères salutations." },
    { bold: false, text: "Veuillez vous référer aux termes et condition générales de vente en pièce jointe." },
  ],
  receipt: [
    { bold: false, text: "Marchandise reçue en bon état." },
    { bold: false, text: "Signature / Cachet : ____________________" },
  ],
} as const;

// ── Formats ─────────────────────────────────────────────────────────────────

const CUR_LABEL: Record<CbCurrency, string> = { MAD: "MAD", EUR: "€", USD: "$" };

/** « 1 234,50 » (format français, espace insécable). */
export function frNum(n: number): string {
  return (Number(n) || 0)
    .toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/[  ]/g, " ");
}
function frDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function pct(n: number): string {
  return `${Number(n) || 0}`.replace(".", ",");
}

// ── Adaptateurs PDR / SAV → modèle ──────────────────────────────────────────

export function pdrToCb(doc: PdrDocument): CbModel {
  const t = computeTotals(doc);
  const L = doc.logistics ?? {};
  const extra: string[] = [];
  if (L.supplier_name) extra.push(`Fournisseur : ${L.supplier_name}`);
  if (L.factory_ref) extra.push(`Réf. usine : ${L.factory_ref}`);
  if (L.eta) extra.push(`ETA : ${L.eta}`);
  if (L.warehouse) extra.push(`Entrepôt : ${L.warehouse}`);
  if (L.delivery_date) extra.push(`Date de livraison : ${L.delivery_date}`);
  if (L.carrier) extra.push(`Transporteur : ${L.carrier}`);
  if (L.received_date) extra.push(`Reçu le : ${L.received_date}`);
  const commercial = ["devis", "facture", "bon_commande", "commande_fournisseur"].includes(doc.type);
  return {
    title: TITLE_FR[doc.type] ?? "DOCUMENT",
    reference: doc.reference ?? "",
    dateISO: doc.created_at,
    clientCompany: doc.client_company ?? "",
    clientAddress: (doc.client_address ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    clientPhone: doc.client_phone ?? "",
    attention: doc.attention ?? "",
    machine: doc.machine ?? "",
    clientCode: doc.client_code ?? "",
    extra,
    lines: doc.items.map((it) => ({
      ref: it.reference || "",
      designation: it.designation || "",
      qty: String(it.quantity ?? ""),
      unit: Number(it.unit_price) || 0,
      discountPct: Number(it.discount_pct) || 0,
      discountedUnit: lineDiscountedUnit(it),
      total: lineTotal(it),
    })),
    currency: doc.currency,
    applyVat: doc.apply_vat,
    vatRate: Number(doc.vat_rate) || 0,
    subtotal: t.mainSubtotal,
    vat: t.mainVat,
    total: t.mainTotal,
    payment: doc.payment_terms ?? "",
    validity: doc.type === "devis" ? (doc.validity ?? "") : null,
    delivery: doc.delivery_terms ?? "",
    note: doc.incoterms_note ?? "",
    showTerms: commercial,
    closing: doc.type === "devis" || doc.type === "facture" ? "contract" : "receipt",
  };
}

export function savToCb(doc: SavDocument): CbModel {
  const t = computeSavTotals(doc);
  const lines: CbLine[] = [];
  const lab = labourTotal(doc);
  if (lab > 0 || doc.labour_days > 0 || doc.labour_fixed_amount > 0) {
    const isFixed = doc.labour_mode === "fixed";
    lines.push({
      ref: "MO",
      designation: `Main d'œuvre${doc.labour_description ? ` — ${doc.labour_description}` : ""}${isFixed ? " (forfait)" : ""}`,
      qty: isFixed ? "1" : String(doc.labour_days),
      unit: isFixed ? lab : Number(doc.labour_daily_rate) || 0,
      discountPct: 0,
      discountedUnit: isFixed ? lab : Number(doc.labour_daily_rate) || 0,
      total: lab,
    });
  }
  const trav = travelTotal(doc);
  if (trav > 0) {
    const bits: string[] = [];
    if (doc.travel_km) bits.push(`${doc.travel_km} km`);
    if (doc.travel_hours) bits.push(`${doc.travel_hours} h`);
    if (doc.travel_meals) bits.push("repas");
    if (doc.travel_hotel) bits.push("hôtel");
    if (doc.travel_other) bits.push("divers");
    lines.push({
      ref: "DEP",
      designation: `Déplacement${bits.length ? ` (${bits.join(", ")})` : ""}`,
      qty: "1", unit: trav, discountPct: 0, discountedUnit: trav, total: trav,
    });
  }
  for (const it of doc.parts) {
    const du = (Number(it.unit_price) || 0) * (1 - (Number(it.discount_pct) || 0) / 100);
    lines.push({
      ref: it.reference || "",
      designation: it.designation || "",
      qty: String(it.quantity ?? ""),
      unit: Number(it.unit_price) || 0,
      discountPct: Number(it.discount_pct) || 0,
      discountedUnit: du,
      total: partLineTotal(it),
    });
  }
  const extra: string[] = [];
  if (doc.location) extra.push(`Site : ${doc.location}`);
  if (doc.intervention_description) extra.push(`Intervention : ${doc.intervention_description}`);
  const commercial = ["devis", "facture", "bon_commande"].includes(doc.type);
  return {
    title: TITLE_FR[doc.type] ?? "DOCUMENT",
    reference: doc.reference ?? "",
    dateISO: doc.created_at,
    clientCompany: doc.client_company ?? "",
    clientAddress: (doc.client_address ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    clientPhone: doc.client_phone ?? "",
    attention: doc.attention ?? "",
    machine: doc.machine ?? "",
    clientCode: doc.client_code ?? "",
    extra,
    lines,
    currency: doc.currency,
    applyVat: doc.apply_vat,
    vatRate: Number(doc.vat_rate) || 0,
    subtotal: t.subtotal,
    vat: t.vat,
    total: t.total,
    payment: doc.payment_terms ?? "",
    validity: doc.type === "devis" ? (doc.validity ?? "") : null,
    delivery: doc.delivery_terms ?? "",
    note: doc.incoterms_note ?? "",
    showTerms: commercial,
    closing: doc.type === "devis" || doc.type === "facture" ? "contract" : "receipt",
  };
}

// ── Word ────────────────────────────────────────────────────────────────────

const FONT = "Arial";
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const line = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
const GRID = { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line };
const BOX = { top: line, bottom: line, left: line, right: line };

/** Largeur utile A4 (marges 709 / 424). */
const PAGE_W = 10773;
const COLS = [1500, 3900, 650, 1300, 900, 1300, 1223] as const;
const HEADS = ["Code Article", "Désignation", "Qté", "P.U.", "Remise", "P.U Remisé", "Montant"] as const;

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

function run(text: string, o: { bold?: boolean; size?: number } = {}) {
  return new TextRun({ text, font: FONT, bold: o.bold, size: o.size ?? 20 });
}
function para(text: string, o: { bold?: boolean; size?: number; align?: Align; after?: number } = {}) {
  return new Paragraph({
    alignment: o.align,
    spacing: { before: 0, after: o.after ?? 0 },
    children: [run(text, { bold: o.bold, size: o.size })],
  });
}
function cellOf(text: string, width: number, o: { bold?: boolean; align?: Align } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 30, bottom: 30, left: 60, right: 60 },
    children: [new Paragraph({ alignment: o.align ?? AlignmentType.LEFT, children: [run(text, { bold: o.bold, size: 17 })] })],
  });
}

let logoCache: Uint8Array | null = null;
async function loadLogo(): Promise<Uint8Array> {
  if (!logoCache) logoCache = new Uint8Array(await (await fetch(logoUrl)).arrayBuffer());
  return logoCache;
}

function itemsTable(m: CbModel): Table {
  const head = new TableRow({
    tableHeader: true,
    children: HEADS.map((h, i) => cellOf(h, COLS[i], { bold: true, align: i >= 2 ? AlignmentType.CENTER : AlignmentType.LEFT })),
  });
  const rows = m.lines.map((l) => new TableRow({
    children: [
      cellOf(l.ref, COLS[0]),
      cellOf(l.designation, COLS[1]),
      cellOf(l.qty, COLS[2], { align: AlignmentType.CENTER }),
      cellOf(frNum(l.unit), COLS[3], { align: AlignmentType.RIGHT }),
      cellOf(l.discountPct ? `${pct(l.discountPct)} %` : "", COLS[4], { align: AlignmentType.CENTER }),
      cellOf(frNum(l.discountedUnit), COLS[5], { align: AlignmentType.RIGHT }),
      cellOf(frNum(l.total), COLS[6], { align: AlignmentType.RIGHT }),
    ],
  }));
  return new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: [...COLS],
    borders: GRID,
    rows: [head, ...rows],
  });
}

function headerBlock(m: CbModel): Table {
  const leftW = 6200;
  const rightW = PAGE_W - leftW;
  const left: Paragraph[] = [
    para(`Casablanca le, ${frDate(m.dateISO)}`, { bold: true, after: 120 }),
    para(`A L'ATTENTION DE : ${m.attention}`, { bold: true, after: 40 }),
    para(`ENGIN : ${m.machine}`, { bold: true, after: 40 }),
    para(`CODE CLIENT : ${m.clientCode}`, { bold: true, after: 40 }),
    para(`${m.title} : ${m.reference}`, { bold: true, after: 40 }),
    ...m.extra.map((e) => para(e, { bold: true, after: 40 })),
  ];
  const box: Paragraph[] = [];
  if (m.clientCompany) box.push(para(m.clientCompany, { bold: true, after: 40 }));
  for (const a of m.clientAddress) box.push(para(a));
  if (m.clientPhone) box.push(para(`Tél. : ${m.clientPhone}`));
  if (box.length === 0) box.push(para(""));
  return new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: [leftW, rightW],
    borders: NO_BORDERS,
    rows: [new TableRow({
      children: [
        new TableCell({ width: { size: leftW, type: WidthType.DXA }, borders: NO_BORDERS, children: left }),
        new TableCell({
          width: { size: rightW, type: WidthType.DXA },
          borders: BOX,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: box,
        }),
      ],
    })],
  });
}

function totalsBlock(m: CbModel): Table {
  const cur = CUR_LABEL[m.currency];
  const termsW = 6000;
  const totW = PAGE_W - termsW;
  const terms: Paragraph[] = [];
  if (m.showTerms) {
    terms.push(
      new Paragraph({ spacing: { after: 60 }, children: [run("Mode de règlement : ", { bold: true, size: 18 }), run(m.payment, { size: 18 })] }),
    );
    if (m.validity !== null) {
      terms.push(new Paragraph({ spacing: { after: 60 }, children: [run("Validité de l'offre : ", { bold: true, size: 18 }), run(m.validity, { size: 18 })] }));
    }
    terms.push(new Paragraph({ spacing: { after: 60 }, children: [run("Condition de livraison : ", { bold: true, size: 18 }), run(m.delivery, { size: 18 })] }));
  } else {
    terms.push(para(""));
  }

  const labW = 2100;
  const valW = totW - labW - 100;
  const vatLabel = `TOTAL T.V.A. (${pct(m.applyVat ? m.vatRate : 0)}%)`;
  const totRow = (label: string, value: string) => new TableRow({
    children: [
      cellOf(label, labW, { bold: true }),
      cellOf(`${value} ${cur}`, valW, { bold: true, align: AlignmentType.RIGHT }),
    ],
  });
  const totals = new Table({
    width: { size: labW + valW, type: WidthType.DXA },
    columnWidths: [labW, valW],
    borders: GRID,
    rows: [
      totRow("TOTAL H.T.", frNum(m.subtotal)),
      totRow(vatLabel, frNum(m.applyVat ? m.vat : 0)),
      totRow("TOTAL T.T.C.", frNum(m.applyVat ? m.total : m.subtotal)),
    ],
  });

  return new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: [termsW, totW],
    borders: NO_BORDERS,
    rows: [new TableRow({
      children: [
        new TableCell({ width: { size: termsW, type: WidthType.DXA }, borders: NO_BORDERS, children: terms }),
        new TableCell({
          width: { size: totW, type: WidthType.DXA },
          borders: NO_BORDERS,
          children: [totals, new Paragraph({ children: [] })],
        }),
      ],
    })],
  });
}

export async function buildCasablancaDocxBlob(m: CbModel): Promise<Blob> {
  const logo = await loadLogo();
  const body: (Paragraph | Table)[] = [];
  body.push(headerBlock(m));
  body.push(para("", { after: 120 }));
  body.push(itemsTable(m));
  body.push(para("", { after: 80 }));
  if (m.note) body.push(para(m.note, { size: 16, after: 80 }));
  body.push(totalsBlock(m));
  body.push(para("", { after: 120 }));
  for (const c of CLOSING[m.closing]) body.push(para(c.text, { bold: c.bold, after: 60 }));

  const footer = new Footer({
    children: [
      ...CB_FOOTER_LINES.map((t, i) => new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: t, font: FONT, size: i === 2 ? 13 : 14, bold: false })],
      })),
    ],
  });
  const header = new Header({
    children: [
      new Paragraph({
        children: [new ImageRun({ type: "png", data: logo, transformation: { width: 150, height: 85 } })],
      }),
    ],
  });

  const document = new Document({
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1900, right: 424, bottom: 1100, left: 709, header: 400, footer: 300 } } },
      headers: { default: header },
      footers: { default: footer },
      children: body,
    }],
  });
  return Packer.toBlob(document);
}

// ── PDF ─────────────────────────────────────────────────────────────────────

async function logoDataUrl(): Promise<string | null> {
  try {
    const bytes = await loadLogo();
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return `data:image/png;base64,${btoa(bin)}`;
  } catch { return null; }
}

/** jsPDF (Helvetica) ne sait pas afficher l'espace insécable fine : on la remplace. */
const pdfTxt = (s: string) => s.replace(/[  ]/g, " ");

export async function buildCasablancaPdf(m: CbModel): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const mL = 14, mR = 14;
  const right = pageW - mR;
  const cur = CUR_LABEL[m.currency];
  const logo = await logoDataUrl();
  if (logo) pdf.addImage(logo, "PNG", mL, 8, 36, 20.5);

  let y = 36;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  const leftLines = [
    `Casablanca le, ${frDate(m.dateISO)}`,
    `A L'ATTENTION DE : ${m.attention}`,
    `ENGIN : ${m.machine}`,
    `CODE CLIENT : ${m.clientCode}`,
    `${m.title} : ${m.reference}`,
    ...m.extra,
  ];
  // Encadré client (droite)
  const boxLines = [m.clientCompany, ...m.clientAddress, ...(m.clientPhone ? [`Tél. : ${m.clientPhone}`] : [])].filter(Boolean);
  const boxW = 80;
  const boxH = Math.max(14, boxLines.length * 4.6 + 6);
  pdf.setLineWidth(0.25);
  pdf.rect(right - boxW, y - 4, boxW, boxH);
  let by = y + 1;
  boxLines.forEach((t, i) => {
    pdf.setFont("helvetica", i === 0 ? "bold" : "normal");
    pdf.text(pdfTxt(t), right - boxW + 3, by, { maxWidth: boxW - 6 });
    by += 4.6;
  });
  pdf.setFont("helvetica", "bold");
  let ly = y;
  leftLines.forEach((t, i) => {
    pdf.text(pdfTxt(t), mL, ly, { maxWidth: pageW - mL - mR - boxW - 6 });
    ly += i === 0 ? 7 : 5;
  });
  y = Math.max(ly, y - 4 + boxH) + 6;

  autoTable(pdf, {
    startY: y,
    head: [[...HEADS]],
    body: m.lines.map((l) => [
      l.ref, l.designation, l.qty, pdfTxt(frNum(l.unit)),
      l.discountPct ? `${pct(l.discountPct)} %` : "", pdfTxt(frNum(l.discountedUnit)), pdfTxt(frNum(l.total)),
    ]),
    styles: { fontSize: 8, cellPadding: 1.3, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: 0 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold", lineWidth: 0.25 },
    columnStyles: {
      2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "center" }, 5: { halign: "right" }, 6: { halign: "right" },
    },
    theme: "grid",
    margin: { left: mL, right: mR, bottom: 28 },
  });
  // @ts-expect-error jspdf-autotable attaches lastAutoTable
  y = (pdf.lastAutoTable?.finalY ?? y) + 8;

  const ensure = (h: number) => {
    if (y + h > pageH - 28) { pdf.addPage(); y = 20; }
  };

  ensure(40);
  if (m.note) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(pdfTxt(m.note), mL, y, { maxWidth: pageW - mL - mR });
    y += 8;
  }

  // Modalités (gauche) + totaux (droite)
  const blockTop = y;
  pdf.setFontSize(9);
  let ty = blockTop;
  if (m.showTerms) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Mode de règlement :", mL, ty);
    pdf.setFont("helvetica", "normal");
    pdf.text(pdfTxt(m.payment), mL + 36, ty, { maxWidth: 80 });
    ty += 5;
    if (m.validity !== null) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Validité de l'offre :", mL, ty);
      pdf.setFont("helvetica", "normal");
      pdf.text(pdfTxt(m.validity), mL + 36, ty, { maxWidth: 80 });
      ty += 5;
    }
    pdf.setFont("helvetica", "bold");
    pdf.text("Condition de livraison :", mL, ty);
    pdf.setFont("helvetica", "normal");
    pdf.text(pdfTxt(m.delivery), mL + 42, ty, { maxWidth: 74 });
  }

  const rows: Array<[string, string]> = [
    ["TOTAL H.T.", `${pdfTxt(frNum(m.subtotal))} ${cur}`],
    [`TOTAL T.V.A. (${pct(m.applyVat ? m.vatRate : 0)}%)`, `${pdfTxt(frNum(m.applyVat ? m.vat : 0))} ${cur}`],
    ["TOTAL T.T.C.", `${pdfTxt(frNum(m.applyVat ? m.total : m.subtotal))} ${cur}`],
  ];
  const tW = 72, rowH = 7;
  const tX = right - tW;
  rows.forEach(([a, b], i) => {
    const ry = blockTop - 4.5 + i * rowH;
    pdf.rect(tX, ry, tW, rowH);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(a, tX + 2, ry + 4.8);
    pdf.text(b, right - 2, ry + 4.8, { align: "right" });
  });
  y = blockTop - 4.5 + rows.length * rowH + 10;

  ensure(30);
  pdf.setFontSize(8.5);
  for (const c of CLOSING[m.closing]) {
    pdf.setFont("helvetica", c.bold ? "bold" : "normal");
    pdf.text(pdfTxt(c.text), mL, y, { maxWidth: pageW - mL - mR });
    y += 4.6;
  }

  // Pied de page sur chaque page
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setFont("helvetica", "normal");
    CB_FOOTER_LINES.forEach((t, i) => {
      pdf.setFontSize(i === 2 ? 6.2 : 6.6);
      pdf.text(pdfTxt(t), pageW / 2, pageH - 15 + i * 3.4, { align: "center", maxWidth: pageW - 16 });
    });
  }
  return pdf;
}
