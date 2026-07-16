/**
 * Génération Word SAV — même style que le PDR (grille noire, logo Westchase),
 * avec 3 blocs de facturation : Labour / Travel / Spare parts.
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, ImageRun, AlignmentType, WidthType, BorderStyle, VerticalAlign,
} from "docx";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import letterheadUrl from "@/assets/pdr/letterhead.png";
import {
  computeSavTotals, labourTotal, travelTotal, partLineTotal,
  DOC_LABEL_SHORT, DOC_FOLDER,
  type SavDocument, type SavDocType, type Currency,
} from "@/lib/savDocuments";

const FONT = "Arial";
const BORDER_SZ = 18;
const gb = { style: BorderStyle.SINGLE, size: BORDER_SZ, color: "000000" };
const GRID = { top: gb, bottom: gb, left: gb, right: gb, insideHorizontal: gb, insideVertical: gb };
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

const TITLE: Record<SavDocType, string> = {
  devis: "SERVICE OFFER No",
  bon_commande: "PURCHASE ORDER No",
  bon_livraison: "DELIVERY NOTE No",
  facture: "INVOICE No",
};

const BANK: Record<Currency, string[]> = {
  EUR: [
    "Account Name: WESTCHASE OIL AND GAS LTD - VEMAT",
    "Number:  EUR ACCOUNT NO : 1309288049",
    "BENEFICIARY BANK: PROVIDUS BANK PLC",
  ],
  USD: [
    "Account Name: WESTCHASE OIL AND GAS LTD",
    "Number:  USD ACCOUNT NO : 5250152975",
    "BENEFICIARY BANK: FIDELITY BANK PLC",
    "SWIFT CODE: CITIUS33",
    "SORT CODE: FIDTNGLA",
  ],
};
const BANK_NAIRA = [
  "Account Name: WESTCHASE OIL AND GAS LTD",
  "Number:  NAIRA ACCOUNT NO : 5601036918",
  "BENEFICIARY BANK: FIDELITY BANK PLC",
];
const FOOTER_LINES = [
  "WESTCHASE OIL & GAS – 11, Sumbo Jibowu Ikoyi, Lagos, Lagos, Nigeria",
  "Tél. : +234 814 315 5517 -  vematwestchase @vematgroup.com",
  "Vemat Westchase LTD  is an authorized distributor of TEREX RT CRANES, TADANO, JLG, MAGNI, INGERSOLL RAND, and MECALAC  products",
];

function num(n: number, currency?: Currency): string {
  const v = Number(n) || 0;
  if (currency === "EUR") return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, " ");
}
function sym(c: Currency): string { return c === "EUR" ? "€" : "$"; }
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function safeName(raw: string): string {
  return raw.normalize("NFKD").replace(/[^\w\s\-./]/gi, "").replace(/\s+/g, " ").trim().slice(0, 80) || "Document";
}
export function savDocxFileName(doc: SavDocument): string {
  return `${safeName(doc.reference ?? DOC_LABEL_SHORT[doc.type])} - ${safeName(doc.client_company || doc.client_name || "Client")}.docx`;
}
export function savDocxZipPath(doc: SavDocument): string {
  return `${DOC_FOLDER[doc.type]}/${savDocxFileName(doc)}`;
}

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];
function run(text: string, o: { bold?: boolean; size?: number } = {}) {
  return new TextRun({ text, font: FONT, bold: o.bold, size: o.size ?? 20 });
}
function p(text: string, o: { bold?: boolean; size?: number; align?: Align; after?: number } = {}) {
  return new Paragraph({ alignment: o.align, spacing: { after: o.after ?? 0 }, children: [run(text, { bold: o.bold, size: o.size })] });
}
function tcell(text: string, width: number, o: { bold?: boolean; align?: Align } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 20, bottom: 20, left: 40, right: 40 },
    children: [new Paragraph({ alignment: o.align ?? AlignmentType.LEFT, children: [run(text, { bold: o.bold, size: 16 })] })],
  });
}

/** Tableau générique Description | Détails | Amount (Labour + Travel). */
function serviceTable(rows: Array<[string, string, number]>, currency: Currency): Table {
  const COLS = [3800, 4200, 2003];
  const head = new TableRow({ tableHeader: true, children: [
    tcell("Item", COLS[0], { bold: true }),
    tcell("Details", COLS[1], { bold: true }),
    tcell("Amount", COLS[2], { bold: true, align: AlignmentType.RIGHT }),
  ] });
  const body = rows.map(([a, b, amt]) => new TableRow({ children: [
    tcell(a, COLS[0]), tcell(b, COLS[1]), tcell(num(amt, currency), COLS[2], { align: AlignmentType.RIGHT }),
  ] }));
  return new Table({ width: { size: COLS.reduce((x, y) => x + y, 0), type: WidthType.DXA }, columnWidths: COLS, borders: GRID, rows: [head, ...body] });
}

function partsTable(doc: SavDocument): Table {
  const COLS = [1600, 3600, 900, 1600, 1100, 1203];
  const head = new TableRow({ tableHeader: true, children: [
    tcell("Reference", COLS[0], { bold: true }),
    tcell("Designation", COLS[1], { bold: true }),
    tcell("Qty", COLS[2], { bold: true, align: AlignmentType.CENTER }),
    tcell("Unit Price", COLS[3], { bold: true, align: AlignmentType.RIGHT }),
    tcell("Disc.", COLS[4], { bold: true, align: AlignmentType.CENTER }),
    tcell("Total", COLS[5], { bold: true, align: AlignmentType.RIGHT }),
  ] });
  const rows = doc.parts.map((it) => new TableRow({ children: [
    tcell(it.reference || "", COLS[0]),
    tcell(it.designation || "", COLS[1]),
    tcell(String(it.quantity ?? ""), COLS[2], { align: AlignmentType.CENTER }),
    tcell(num(it.unit_price, doc.currency), COLS[3], { align: AlignmentType.RIGHT }),
    tcell(it.discount_pct ? `${it.discount_pct}%` : "0%", COLS[4], { align: AlignmentType.CENTER }),
    tcell(num(partLineTotal(it), doc.currency), COLS[5], { align: AlignmentType.RIGHT }),
  ] }));
  return new Table({ width: { size: COLS.reduce((x, y) => x + y, 0), type: WidthType.DXA }, columnWidths: COLS, borders: GRID, rows: [head, ...rows] });
}

function titleBlock(doc: SavDocument): Table {
  const W = 10003; const leftW = Math.round(W * 0.48); const rightW = W - leftW;
  const left = [p(`${TITLE[doc.type]}: ${doc.reference ?? ""}`, { bold: true, size: 22, after: 60 })];
  const right: Paragraph[] = [];
  if (doc.client_company) right.push(p(doc.client_company, { bold: true, size: 20, after: 40 }));
  if (doc.client_address) for (const l of doc.client_address.split("\n")) if (l.trim()) right.push(p(l, { size: 18 }));
  if (right.length === 0) right.push(p(""));
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [leftW, rightW], borders: NO_BORDERS, rows: [
    new TableRow({ children: [
      new TableCell({ width: { size: leftW, type: WidthType.DXA }, borders: NO_BORDERS, children: left }),
      new TableCell({ width: { size: rightW, type: WidthType.DXA }, borders: NO_BORDERS, children: right }),
    ] }),
  ] });
}

async function loadLetterhead(): Promise<Uint8Array> {
  return new Uint8Array(await (await fetch(letterheadUrl)).arrayBuffer());
}

const isCommercial = (t: SavDocType) => t === "devis" || t === "bon_commande" || t === "facture";
const showBank = (t: SavDocType) => t === "devis" || t === "facture";

export async function buildSavDocxBlob(doc: SavDocument, letterhead?: Uint8Array): Promise<Blob> {
  const imgBytes = letterhead ?? await loadLetterhead();
  const t = computeSavTotals(doc);
  const s = sym(doc.currency);
  const body: (Paragraph | Table)[] = [];

  body.push(titleBlock(doc));
  body.push(p(""));
  body.push(p(`Lagos, ${fmtDate(doc.created_at)}`, { bold: true, size: 20, after: 120 }));
  if (doc.attention) body.push(p(`To the attention of: ${doc.attention}`, { bold: true, size: 20, after: 40 }));
  if (doc.machine) body.push(p(`Machine: ${doc.machine}`, { bold: true, size: 20, after: 40 }));
  if (doc.client_code) body.push(p(`Client Code: ${doc.client_code}`, { bold: true, size: 20, after: 40 }));
  if (doc.location) body.push(p(`Site: ${doc.location}`, { bold: true, size: 20, after: 40 }));
  if (doc.intervention_description) body.push(p(`Intervention: ${doc.intervention_description}`, { size: 18, after: 60 }));
  body.push(p("", { after: 60 }));

  // Service (Labour + Travel)
  const svcRows: Array<[string, string, number]> = [];
  const lab = labourTotal(doc);
  if (lab > 0 || doc.labour_days > 0 || doc.labour_fixed_amount > 0) {
    const details = doc.labour_mode === "fixed"
      ? (doc.labour_description || "Fixed price")
      : `${doc.labour_days} day(s) × ${num(doc.labour_daily_rate, doc.currency)} ${s}${doc.labour_description ? ` — ${doc.labour_description}` : ""}`;
    svcRows.push(["Labour", details, lab]);
  }
  const trav = travelTotal(doc);
  if (trav > 0) {
    const bits: string[] = [];
    if (doc.travel_km) bits.push(`${doc.travel_km} km × ${num(doc.travel_km_rate, doc.currency)}`);
    if (doc.travel_hours) bits.push(`${doc.travel_hours} h × ${num(doc.travel_hour_rate, doc.currency)}`);
    if (doc.travel_meals) bits.push(`meals ${num(doc.travel_meals, doc.currency)}`);
    if (doc.travel_hotel) bits.push(`hotel ${num(doc.travel_hotel, doc.currency)}`);
    if (doc.travel_other) bits.push(`other ${num(doc.travel_other, doc.currency)}`);
    svcRows.push(["Travel", bits.join(" · "), trav]);
  }
  if (svcRows.length > 0) {
    body.push(p("Service", { bold: true, size: 20, after: 40 }));
    body.push(serviceTable(svcRows, doc.currency));
    body.push(p(""));
  }

  // Parts
  if (doc.parts.length > 0) {
    body.push(p("Spare parts", { bold: true, size: 20, after: 40 }));
    body.push(partsTable(doc));
    body.push(p(""));
  }

  if (doc.incoterms_note && isCommercial(doc.type)) body.push(p(doc.incoterms_note, { size: 16, after: 60 }));

  if (showBank(doc.type)) {
    body.push(p("-----------------------------------------------------------", { size: 16 }));
    for (const l of BANK[doc.currency]) body.push(p(l, { size: 16 }));
    if (t.hasCustoms) {
      body.push(p(""));
      body.push(p(doc.customs_label || "CUSTOMS CLEARING and DELIVERY", { bold: true, size: 18, after: 40 }));
      body.push(p("-----------------------------------------------------------", { size: 16 }));
      for (const l of BANK_NAIRA) body.push(p(l, { size: 16 }));
    }
    body.push(p(""));
  }

  // Terms + totals
  const cond = (a: string, b: string) => new Paragraph({ spacing: { after: 20 }, children: [run(`${a}:  `, { bold: true, size: 18 }), run(b, { size: 18 })] });
  if (isCommercial(doc.type)) {
    body.push(cond("Payment Terms", doc.payment_terms || ""));
    if (doc.type === "devis") body.push(cond("Validity of Offer", doc.validity || ""));
    if (doc.delivery_terms) body.push(cond("Delivery Terms", doc.delivery_terms));
    body.push(cond("Currency", doc.currency + (t.hasCustoms ? " / NAIRA" : "")));
  }

  const totRow = (label: string, val: string) => new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 20 }, children: [run(`${label}   `, { bold: true, size: 20 }), run(val, { bold: true, size: 20 })] });
  body.push(p("", { after: 40 }));
  if (isCommercial(doc.type)) {
    body.push(totRow("Labour", `${num(t.labour, doc.currency)} ${s}`));
    body.push(totRow("Travel", `${num(t.travel, doc.currency)} ${s}`));
    body.push(totRow("Parts", `${num(t.parts, doc.currency)} ${s}`));
    body.push(totRow("SUBTOTAL", `${num(t.subtotal, doc.currency)} ${s}`));
    if (doc.apply_vat) {
      body.push(totRow(`VAT ${doc.vat_rate}%`, `${num(t.vat, doc.currency)} ${s}`));
      body.push(totRow("TOTAL w/ VAT", `${num(t.total, doc.currency)} ${s}`));
    } else {
      body.push(totRow("TOTAL", `${num(t.total, doc.currency)} ${s}`));
    }
    if (t.hasCustoms) {
      body.push(totRow("CUSTOMS TOTAL", `${num(t.nairaTotal, doc.currency)} ₦`.replace(` ${s}`, "")));
    }
  } else {
    body.push(totRow("TOTAL", `${num(t.total, doc.currency)} ${s}`));
  }

  if (doc.type === "devis" || doc.type === "facture") {
    body.push(p("", { after: 60 }));
    body.push(p("We are at your disposal for any further information", { size: 20, after: 40 }));
    body.push(p("Sincerely,", { bold: true, size: 20 }));
  } else {
    body.push(p("", { after: 80 }));
    body.push(p("Signature / Stamp : ____________________", { size: 20 }));
  }

  const document = new Document({
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 2966, right: 424, bottom: 510, left: 709 } } },
      headers: { default: new Header({ children: [new Paragraph({ children: [new ImageRun({ type: "png", data: imgBytes, transformation: { width: 216, height: 162 } })] })] }) },
      footers: { default: new Footer({ children: FOOTER_LINES.map((l, i) => new Paragraph({ alignment: AlignmentType.CENTER, children: [run(l, { size: i === 2 ? 12 : 14 })] })) }) },
      children: body,
    }],
  });

  return Packer.toBlob(document);
}

export async function generateSavDocx(doc: SavDocument): Promise<void> {
  saveAs(await buildSavDocxBlob(doc), savDocxFileName(doc));
}

export async function downloadSavChainZip(docs: SavDocument[], zipName?: string): Promise<void> {
  if (docs.length === 0) return;
  const letterhead = await loadLetterhead();
  const zip = new JSZip();
  for (const d of docs) zip.file(savDocxZipPath(d), await buildSavDocxBlob(d, letterhead));
  const root = docs.find((d) => d.type === "devis") ?? docs[0];
  const name = zipName ?? `${safeName(`${root.reference ?? "chain"} - ${root.client_company || root.client_name || "Client"}`)}.zip`;
  saveAs(await zip.generateAsync({ type: "blob" }), name);
}
