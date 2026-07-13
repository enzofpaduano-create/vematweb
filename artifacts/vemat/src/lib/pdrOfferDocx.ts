/**
 * Génération du document Word (.docx) d'une offre PDR.
 *
 * Reproduit le design SIMPLE des offres Vemat Nigeria (fichiers DE26xxx) :
 * en-tête logo, bloc client, tableau des lignes (8 colonnes), note incoterms,
 * coordonnées bancaires selon la devise, douane facturée en NAIRA, conditions,
 * totaux (TVA optionnelle), mentions légales.
 *
 * Le portail RECONSTRUIT le document (les fichiers d'origine sont mis en page à
 * la main pour un nombre fixe d'articles — impossible à « remplir » tel quel).
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, ImageRun, AlignmentType, WidthType, BorderStyle, VerticalAlign,
} from "docx";
import { saveAs } from "file-saver";
import letterheadUrl from "@/assets/pdr/letterhead.png";
import {
  computeTotals, lineDiscountedUnit, lineTotal,
  type PdrDocument, type PdrDocType, type Currency,
} from "@/lib/pdrDocuments";

const FONT = "Arial";
const TITLE: Record<PdrDocType, string> = {
  devis: "OFFER No",
  bon_commande: "PURCHASE ORDER No",
  commande_fournisseur: "SUPPLIER ORDER No",
  bon_reception: "GOODS RECEIPT No",
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
  "WESTCHASE OIL & GAS – 11, Sumbo Jibowu Ikoyi, Lagos, Nigeria",
  "Tél. : +234 814 315 5517  -  vematwestchase@vematgroup.com",
  "Vemat Westchase LTD is an authorized distributor of TEREX RT CRANES, TADANO, JLG, MAGNI, INGERSOLL RAND, and MECALAC products",
];

function num(n: number): string {
  return (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, " ");
}
function sym(c: Currency): string { return c === "EUR" ? "€" : "$"; }
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];
function run(text: string, o: { bold?: boolean; size?: number; color?: string } = {}) {
  return new TextRun({ text, font: FONT, bold: o.bold, size: o.size ?? 18, color: o.color });
}
function line(text: string, o: { bold?: boolean; size?: number; align?: Align; after?: number } = {}) {
  return new Paragraph({ alignment: o.align, spacing: { after: o.after ?? 0 }, children: [run(text, { bold: o.bold, size: o.size })] });
}
function multiline(text: string, o: { size?: number; align?: Align } = {}) {
  const parts = (text || "").split("\n");
  return new Paragraph({
    alignment: o.align,
    children: parts.flatMap((t, i) => (i === 0 ? [run(t, { size: o.size })] : [new TextRun({ text: t, font: FONT, size: o.size ?? 18, break: 1 })])),
  });
}

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const COLS = [1300, 3100, 640, 1500, 1200, 760, 1300, 1300]; // ≈ 11100 dxa
const HEADERS = ["Reference", "Designation", "Qty", "Availability", "Unit Price", "Discount", "Discounted Unit Price", "Total"];

function cell(paras: Paragraph[], width: number, opts: { header?: boolean } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.header ? { fill: "E7E6E6" } : undefined,
    margins: { top: 30, bottom: 30, left: 60, right: 60 },
    children: paras,
  });
}
function tc(text: string, width: number, align: Align, o: { bold?: boolean } = {}) {
  return cell([new Paragraph({ alignment: align, children: [run(text, { size: 16, bold: o.bold })] })], width);
}

function itemsTable(doc: PdrDocument): Table {
  const head = new TableRow({
    tableHeader: true,
    children: HEADERS.map((h, i) => cell([new Paragraph({ alignment: i >= 2 ? AlignmentType.CENTER : AlignmentType.LEFT, children: [run(h, { bold: true, size: 16 })] })], COLS[i], { header: true })),
  });
  const rows = [head];
  for (const it of doc.items) {
    rows.push(new TableRow({ children: [
      tc(it.reference || "", COLS[0], AlignmentType.LEFT),
      cell([new Paragraph({ children: [run(it.designation || "", { size: 16 })] })], COLS[1]),
      tc(String(it.quantity ?? ""), COLS[2], AlignmentType.CENTER),
      cell([new Paragraph({ children: [run(it.avail || "", { size: 16 })] })], COLS[3]),
      tc(num(it.unit_price), COLS[4], AlignmentType.RIGHT),
      tc(it.discount_pct ? `${it.discount_pct}%` : "0%", COLS[5], AlignmentType.CENTER),
      tc(num(lineDiscountedUnit(it)), COLS[6], AlignmentType.RIGHT),
      tc(num(lineTotal(it)), COLS[7], AlignmentType.RIGHT),
    ] }));
  }
  return new Table({
    width: { size: COLS.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" },
      insideVertical: NB,
    },
    rows,
  });
}

function bankBlock(lines: string[]): Paragraph[] {
  return [line("-".repeat(55), { size: 16 }), ...lines.map((l) => line(l, { size: 16 })), line("", { size: 10 })];
}

export async function generateOfferDocx(doc: PdrDocument): Promise<void> {
  const imgBytes = new Uint8Array(await (await fetch(letterheadUrl)).arrayBuffer());
  const t = computeTotals(doc);
  const s = sym(doc.currency);
  const body: (Paragraph | Table)[] = [];

  body.push(line(`${TITLE[doc.type]} : ${doc.reference ?? ""}`, { bold: true, size: 24, after: 120 }));
  if (doc.client_company) body.push(line(doc.client_company, { bold: true, size: 20 }));
  if (doc.client_address) body.push(multiline(doc.client_address, { size: 18 }));
  body.push(line(`Lagos, ${fmtDate(doc.created_at)}`, { size: 18, align: AlignmentType.RIGHT, after: 120 }));
  if (doc.attention) body.push(line(`To the attention of :  ${doc.attention}`, { size: 18, after: 30 }));
  if (doc.machine) body.push(line(`Machine :  ${doc.machine}`, { size: 18, after: 30 }));
  if (doc.client_code) body.push(line(`Client Code :  ${doc.client_code}`, { size: 18, after: 140 }));

  body.push(itemsTable(doc));
  body.push(line("", { size: 12 }));
  if (doc.incoterms_note) body.push(line(doc.incoterms_note, { size: 16, after: 80 }));

  for (const pr of bankBlock(BANK[doc.currency])) body.push(pr);
  if (t.hasCustoms) {
    body.push(line(`${doc.customs_label || "CUSTOMS CLEARING and DELIVERY"} :  ${num(doc.customs_naira)} ₦`, { bold: true, size: 18, after: 60 }));
    for (const pr of bankBlock(BANK_NAIRA)) body.push(pr);
  }

  const cond = (a: string, b: string) => new Paragraph({ spacing: { after: 20 }, children: [run(`${a} :  `, { bold: true, size: 18 }), run(b, { size: 18 })] });
  body.push(line("", { size: 8 }));
  body.push(cond("Payment Terms", doc.payment_terms || ""));
  body.push(cond("Validity of Offer", doc.validity || ""));
  body.push(cond("Delivery Terms", doc.delivery_terms || ""));
  body.push(cond("Currency", doc.currency + (t.hasCustoms ? " / NAIRA" : "")));

  const totRow = (label: string, val: string) => new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 20 }, children: [run(`${label}   `, { bold: true }), run(val, { bold: true })] });
  body.push(line("", { size: 10 }));
  body.push(totRow("TOTAL", `${num(t.mainSubtotal)} ${s}`));
  if (doc.apply_vat) {
    body.push(totRow(`VAT ${doc.vat_rate}%`, `${num(t.mainVat)} ${s}`));
    body.push(totRow("TOTAL w/ VAT", `${num(t.mainTotal)} ${s}`));
  }
  if (t.hasCustoms) {
    body.push(totRow("TOTAL", `${num(t.nairaSubtotal)} ₦`));
    if (doc.apply_vat) {
      body.push(totRow(`VAT ${doc.vat_rate}%`, `${num(t.nairaVat)} ₦`));
      body.push(totRow("TOTAL w/ VAT", `${num(t.nairaTotal)} ₦`));
    }
  }

  body.push(line("", { size: 12 }));
  body.push(line("Contractual Document:", { bold: true, size: 16, after: 40 }));
  body.push(line("The availability date is indicative and will be confirmed upon ordering, unless the item is sold in the meantime.", { size: 16, after: 40 }));
  body.push(line("Please refer to the attached terms and conditions of sale.", { size: 16, after: 40 }));
  body.push(line("We are at your disposal for any further information", { size: 18, after: 40 }));
  body.push(line("Sincerely,", { size: 18 }));

  const document = new Document({
    styles: { default: { document: { run: { font: FONT, size: 18 } } } },
    sections: [{
      properties: { page: { margin: { top: 2400, right: 500, bottom: 900, left: 700 } } },
      headers: { default: new Header({ children: [new Paragraph({ children: [new ImageRun({ type: "png", data: imgBytes, transformation: { width: 216, height: 162 } })] })] }) },
      footers: { default: new Footer({ children: FOOTER_LINES.map((l, i) => new Paragraph({ alignment: AlignmentType.CENTER, children: [run(l, { size: i === 2 ? 12 : 14, color: "444444" })] })) }) },
      children: body,
    }],
  });

  const blob = await Packer.toBlob(document);
  saveAs(blob, `${doc.reference ?? "offre"}.docx`);
}
