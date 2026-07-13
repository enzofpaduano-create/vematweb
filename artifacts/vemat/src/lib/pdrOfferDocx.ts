/**
 * Génération Word PDR — calée sur les modèles Nigeria (DE264xx / DE265xx).
 *
 * Spec extraite des DOCX :
 * - Arial 10pt corps / 8pt tableau, gras sur en-têtes
 * - Tableau pièces : grille noire complète (sz=18), colonnes fixes, header « Avail »
 * - PAS de fond gris sur l'en-tête (contrairement à une 1ère version)
 * - Bloc banque sous le tableau (+ douane NAIRA si besoin)
 * - 2e tableau : Payment Terms | valeurs | TOTAL | VAT | TOTAL w/ VAT
 * - Marges page : top 2966 / right 424 / bottom 510 / left 709
 * - Nommage : « DE26501 - Client.docx »
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, ImageRun, AlignmentType, WidthType, BorderStyle, VerticalAlign,
} from "docx";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import letterheadUrl from "@/assets/pdr/letterhead.png";
import {
  computeTotals, lineDiscountedUnit, lineTotal, DOC_LABEL_SHORT,
  type PdrDocument, type PdrDocType, type Currency,
} from "@/lib/pdrDocuments";

const FONT = "Arial";

/** OOXML border size = eighths of a point (18 = comme les modèles). */
const BORDER_SZ = 18;
const BLACK = "000000";
const gridBorder = { style: BorderStyle.SINGLE, size: BORDER_SZ, color: BLACK };
const GRID = {
  top: gridBorder, bottom: gridBorder, left: gridBorder, right: gridBorder,
  insideHorizontal: gridBorder, insideVertical: gridBorder,
};
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
  insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
};

const TITLE: Record<PdrDocType, string> = {
  devis: "OFFER No",
  bon_commande: "PURCHASE ORDER No",
  commande_fournisseur: "SUPPLIER ORDER No",
  bon_reception: "GOODS RECEIPT No",
  bon_livraison: "DELIVERY NOTE No",
  facture: "INVOICE No",
};

export const DOC_FOLDER: Record<PdrDocType, string> = {
  devis: "01-Offers",
  bon_commande: "02-Purchase-Orders",
  commande_fournisseur: "03-Supplier-Orders",
  bon_reception: "04-Goods-Receipts",
  bon_livraison: "05-Delivery-Notes",
  facture: "06-Invoices",
};

/** Largeurs colonnes modèle DE26499 (dxa). */
const ITEM_COLS = [1254, 3402, 708, 803, 1361, 952, 1350, 1275] as const;
const ITEM_HEADERS = [
  "Reference", "Designation", "Qty", "Avail",
  "Unit Price", "Discount", "Discounted Unit Price", "Total",
] as const;
const ITEM_TABLE_W = ITEM_COLS.reduce((a, b) => a + b, 0);

/** 2e tableau totaux (modèle). */
const TOT_COLS = [2263, 3408, 1843, 1649, 1894] as const;
const TOT_TABLE_W = TOT_COLS.reduce((a, b) => a + b, 0);

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

function showBank(type: PdrDocType): boolean {
  return type === "devis" || type === "facture";
}
function showCommercial(type: PdrDocType): boolean {
  return type === "devis" || type === "bon_commande" || type === "commande_fournisseur" || type === "facture";
}
function showValidity(type: PdrDocType): boolean {
  return type === "devis";
}

/** EUR → « 1 082,90 » ; USD → « 1 103.20 » (comme les modèles). */
function num(n: number, currency?: Currency): string {
  const v = Number(n) || 0;
  if (currency === "EUR") {
    return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // en-US puis espaces comme séparateur de milliers (modèle USD Nigeria)
  return v
    .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/,/g, " ");
}
function sym(c: Currency): string { return c === "EUR" ? "€" : "$"; }
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function safeName(raw: string): string {
  return raw.normalize("NFKD").replace(/[^\w\s\-./]/gi, "").replace(/\s+/g, " ").trim().slice(0, 80) || "Document";
}

export function docxFileName(doc: PdrDocument): string {
  const ref = safeName(doc.reference ?? DOC_LABEL_SHORT[doc.type]);
  const client = safeName(doc.client_company || doc.client_name || "Client");
  return `${ref} - ${client}.docx`;
}
export function docxZipPath(doc: PdrDocument): string {
  return `${DOC_FOLDER[doc.type]}/${docxFileName(doc)}`;
}

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

function run(text: string, o: { bold?: boolean; size?: number } = {}) {
  return new TextRun({ text, font: FONT, bold: o.bold, size: o.size ?? 20 });
}
function p(text: string, o: { bold?: boolean; size?: number; align?: Align; after?: number; before?: number } = {}) {
  return new Paragraph({
    alignment: o.align,
    spacing: { after: o.after ?? 0, before: o.before ?? 0 },
    children: [run(text, { bold: o.bold, size: o.size })],
  });
}

function cell(
  text: string,
  width: number,
  opts: { bold?: boolean; size?: number; align?: Align; margins?: boolean } = {},
) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: opts.margins === false ? undefined : { top: 20, bottom: 20, left: 40, right: 40 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [run(text, { bold: opts.bold, size: opts.size ?? 16 })],
      }),
    ],
  });
}

function multiParaCell(lines: string[], width: number, opts: { bold?: boolean; size?: number } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 20, bottom: 20, left: 40, right: 40 },
    children: (lines.length ? lines : [""]).map((t) =>
      new Paragraph({ children: [run(t, { bold: opts.bold, size: opts.size ?? 16 })] }),
    ),
  });
}

function itemsTable(doc: PdrDocument): Table {
  const head = new TableRow({
    tableHeader: true,
    children: ITEM_HEADERS.map((h, i) =>
      cell(h, ITEM_COLS[i], {
        bold: true,
        size: 16,
        align: i >= 2 ? AlignmentType.CENTER : AlignmentType.LEFT,
      }),
    ),
  });

  const rows = [head];
  for (const it of doc.items) {
    rows.push(new TableRow({
      children: [
        cell(it.reference || "", ITEM_COLS[0], { size: 16 }),
        cell(it.designation || "", ITEM_COLS[1], { size: 16 }),
        cell(String(it.quantity ?? ""), ITEM_COLS[2], { size: 16, align: AlignmentType.CENTER }),
        cell(it.avail || "", ITEM_COLS[3], { size: 16, align: AlignmentType.CENTER }),
        cell(num(it.unit_price, doc.currency), ITEM_COLS[4], { size: 16, align: AlignmentType.RIGHT }),
        cell(it.discount_pct ? `${it.discount_pct}%` : "0%", ITEM_COLS[5], { size: 16, align: AlignmentType.CENTER }),
        cell(num(lineDiscountedUnit(it), doc.currency), ITEM_COLS[6], { size: 16, align: AlignmentType.RIGHT }),
        cell(num(lineTotal(it), doc.currency), ITEM_COLS[7], { size: 16, align: AlignmentType.RIGHT }),
      ],
    }));
  }

  return new Table({
    width: { size: ITEM_TABLE_W, type: WidthType.DXA },
    columnWidths: [...ITEM_COLS],
    borders: GRID,
    rows,
  });
}

function totalsTable(doc: PdrDocument): Table {
  const t = computeTotals(doc);
  const s = sym(doc.currency);
  const currencyLabel = doc.currency + (t.hasCustoms ? " / NAIRA" : "");

  const labels = ["Payment Terms\u00a0:", ...(showValidity(doc.type) ? ["Validity of Offer\u00a0:"] : []), "Delivery Terms\u00a0:", "Currency\u00a0:"];
  const values = [
    doc.payment_terms || "",
    ...(showValidity(doc.type) ? [doc.validity || ""] : []),
    doc.delivery_terms || "",
    currencyLabel,
  ];

  const headerRow = new TableRow({
    children: [
      multiParaCell(labels, TOT_COLS[0], { bold: true, size: 16 }),
      multiParaCell(values, TOT_COLS[1], { bold: true, size: 16 }),
      cell("TOTAL", TOT_COLS[2], { bold: true, size: 16, align: AlignmentType.CENTER }),
      cell("VAT", TOT_COLS[3], { bold: true, size: 16, align: AlignmentType.CENTER }),
      cell("TOTAL w/ VAT", TOT_COLS[4], { bold: true, size: 16, align: AlignmentType.CENTER }),
    ],
  });

  const moneyRow = (total: number, vat: number, grand: number, currency: Currency | "NGN") => {
    const suffix = currency === "NGN" ? "₦" : sym(currency);
    const fmt = (n: number) => (currency === "NGN" ? num(n) : num(n, currency));
    const vatText = doc.apply_vat ? `${fmt(vat)} ${suffix}` : "";
    return new TableRow({
      children: [
        cell("", TOT_COLS[0], { size: 16 }),
        cell("", TOT_COLS[1], { size: 16 }),
        cell(`${fmt(total)} ${suffix}`, TOT_COLS[2], { bold: true, size: 20, align: AlignmentType.RIGHT }),
        cell(vatText, TOT_COLS[3], { bold: true, size: 20, align: AlignmentType.RIGHT }),
        cell(`${fmt(grand)} ${suffix}`, TOT_COLS[4], { bold: true, size: 20, align: AlignmentType.RIGHT }),
      ],
    });
  };

  const rows = [
    headerRow,
    moneyRow(t.mainSubtotal, t.mainVat, doc.apply_vat ? t.mainTotal : t.mainSubtotal, doc.currency),
  ];
  if (t.hasCustoms) {
    rows.push(moneyRow(t.nairaSubtotal, t.nairaVat, doc.apply_vat ? t.nairaTotal : t.nairaSubtotal, "NGN"));
  }

  return new Table({
    width: { size: TOT_TABLE_W, type: WidthType.DXA },
    columnWidths: [...TOT_COLS],
    // Modèles DE26xxx : 2e tableau sans bordures explicites (style Word), pas de grille
    borders: NO_BORDERS,
    rows,
  });
}

/** Bandeau titre (gauche) + client (droite) — comme le template Excel OFFRE. */
function titleBlock(doc: PdrDocument): Table {
  const leftW = Math.round(ITEM_TABLE_W * 0.48);
  const rightW = ITEM_TABLE_W - leftW;
  const left: Paragraph[] = [
    p(`${TITLE[doc.type]}\u00a0: ${doc.reference ?? ""}`, { bold: true, size: 20, after: 60 }),
  ];
  const right: Paragraph[] = [];
  if (doc.client_company) right.push(p(doc.client_company, { bold: true, size: 20, after: 60 }));
  if (doc.client_address) {
    for (const line of doc.client_address.split("\n")) {
      if (line.trim()) right.push(p(line, { size: 20 }));
    }
  }
  if (right.length === 0) right.push(p(""));
  return new Table({
    width: { size: ITEM_TABLE_W, type: WidthType.DXA },
    columnWidths: [leftW, rightW],
    borders: NO_BORDERS,
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: leftW, type: WidthType.DXA },
        borders: NO_BORDERS,
        children: left,
      }),
      new TableCell({
        width: { size: rightW, type: WidthType.DXA },
        borders: NO_BORDERS,
        children: right,
      }),
    ] })],
  });
}

async function loadLetterhead(): Promise<Uint8Array> {
  return new Uint8Array(await (await fetch(letterheadUrl)).arrayBuffer());
}

export async function buildPdrDocxBlob(doc: PdrDocument, letterhead?: Uint8Array): Promise<Blob> {
  const imgBytes = letterhead ?? await loadLetterhead();
  const t = computeTotals(doc);
  const commercial = showCommercial(doc.type);
  const body: (Paragraph | Table)[] = [];

  body.push(titleBlock(doc));
  body.push(p(""));
  body.push(p(`Lagos, ${fmtDate(doc.created_at)}`, { bold: true, size: 20, after: 120 }));
  if (doc.attention) body.push(p(`To the attention of\u00a0: ${doc.attention}`, { bold: true, size: 20, after: 60 }));
  body.push(p(`Machine\u00a0: ${doc.machine || ""}`, { bold: true, size: 20, after: 60 }));
  body.push(p(`Client Code\u00a0: ${doc.client_code || ""}`, { bold: true, size: 20, after: 60 }));

  const L = doc.logistics ?? {};
  if (L.supplier_name) body.push(p(`Supplier\u00a0: ${L.supplier_name}`, { bold: true, size: 20, after: 40 }));
  if (L.factory_ref) body.push(p(`Factory ref\u00a0: ${L.factory_ref}`, { bold: true, size: 20, after: 40 }));
  if (L.eta) body.push(p(`ETA\u00a0: ${L.eta}`, { bold: true, size: 20, after: 40 }));
  if (L.warehouse) body.push(p(`Warehouse\u00a0: ${L.warehouse}`, { bold: true, size: 20, after: 40 }));
  if (L.delivery_date) body.push(p(`Delivery date\u00a0: ${L.delivery_date}`, { bold: true, size: 20, after: 40 }));
  if (L.carrier) body.push(p(`Carrier\u00a0: ${L.carrier}`, { bold: true, size: 20, after: 40 }));
  if (L.received_date) body.push(p(`Received\u00a0: ${L.received_date}`, { bold: true, size: 20, after: 40 }));
  body.push(p("", { after: 80 }));

  body.push(itemsTable(doc));
  body.push(p(""));

  if (doc.incoterms_note && commercial) {
    body.push(p(doc.incoterms_note, { size: 16, after: 80 }));
  }

  if (showBank(doc.type)) {
    body.push(p("-----------------------------------------------------------", { size: 16 }));
    for (const line of BANK[doc.currency]) body.push(p(line, { size: 16 }));
    if (t.hasCustoms) {
      body.push(p(""));
      body.push(p(doc.customs_label || "CUSTOMS CLEARING and DELIVERY", { bold: true, size: 18, after: 40 }));
      body.push(p("-----------------------------------------------------------", { size: 16 }));
      for (const line of BANK_NAIRA) body.push(p(line, { size: 16 }));
    }
    body.push(p(""));
  } else if (t.hasCustoms && commercial) {
    body.push(p(`${doc.customs_label || "CUSTOMS CLEARING and DELIVERY"} :  ${num(doc.customs_naira)} ₦`, { bold: true, size: 18, after: 80 }));
  }

  if (commercial) {
    body.push(totalsTable(doc));
    body.push(p(""));
  } else {
    // BL / réception : total simple aligné droite
    const s = sym(doc.currency);
    body.push(p(`TOTAL   ${num(t.mainSubtotal, doc.currency)} ${s}`, { bold: true, size: 20, align: AlignmentType.RIGHT }));
    if (doc.apply_vat) {
      body.push(p(`VAT ${doc.vat_rate}%   ${num(t.mainVat, doc.currency)} ${s}`, { bold: true, size: 20, align: AlignmentType.RIGHT }));
      body.push(p(`TOTAL w/ VAT   ${num(t.mainTotal, doc.currency)} ${s}`, { bold: true, size: 20, align: AlignmentType.RIGHT }));
    }
    body.push(p(""));
  }

  if (doc.type === "devis" || doc.type === "facture") {
    body.push(p("Contractual Document:", { bold: true, size: 20, after: 60 }));
    body.push(p("The availability date is indicative and will be confirmed upon ordering, unless the item is sold in the meantime.", { size: 20, after: 60 }));
    body.push(p("Please refer to the attached terms and conditions of sale.", { size: 20, after: 60 }));
    body.push(p("We are at your disposal for any further information", { size: 20, after: 60 }));
    body.push(p("Sincerely,", { bold: true, size: 20 }));
  } else if (doc.type === "bon_livraison" || doc.type === "bon_reception") {
    body.push(p("Goods received in good order and condition.", { size: 20, after: 80 }));
    body.push(p("Signature / Stamp : ____________________", { size: 20 }));
  }

  const document = new Document({
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    sections: [{
      properties: {
        page: {
          // Exactement les marges des modèles DE26xxx
          size: { width: 11906, height: 16838 },
          margin: { top: 2966, right: 424, bottom: 510, left: 709 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  type: "png",
                  data: imgBytes,
                  // Taille affichée dans header1 des modèles (≈ 216×162 px)
                  transformation: { width: 216, height: 162 },
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: FOOTER_LINES.map((l, i) =>
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [run(l, { size: i === 2 ? 12 : 14 })],
            }),
          ),
        }),
      },
      children: body,
    }],
  });

  return Packer.toBlob(document);
}

export async function generateOfferDocx(doc: PdrDocument): Promise<void> {
  const blob = await buildPdrDocxBlob(doc);
  saveAs(blob, docxFileName(doc));
}
export const downloadPdrDocx = generateOfferDocx;

export async function downloadPdrChainZip(docs: PdrDocument[], zipName?: string): Promise<void> {
  if (docs.length === 0) return;
  const letterhead = await loadLetterhead();
  const zip = new JSZip();
  for (const d of docs) {
    zip.file(docxZipPath(d), await buildPdrDocxBlob(d, letterhead));
  }
  const root = docs.find((d) => d.type === "devis") ?? docs[0];
  const name = zipName
    ?? `${safeName(`${root.reference ?? "chaine"} - ${root.client_company || root.client_name || "Client"}`)}.zip`;
  saveAs(await zip.generateAsync({ type: "blob" }), name);
}
