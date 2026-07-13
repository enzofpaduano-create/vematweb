/**
 * Fill Westchase Excel offer template (FORMULAIRE → OFFRE).
 * Source: Westchase_Offer_Template_Formulaire_v2_similaire.xlsx
 */

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import templateUrl from "@/assets/pdr/westchase-offer-template.xlsx?url";
import {
  computeTotals, lineDiscountedUnit, lineTotal,
  type PdrDocument, type Currency,
} from "@/lib/pdrDocuments";
import { docxFileName } from "@/lib/pdrOfferDocx";

const TITLE: Record<PdrDocument["type"], string> = {
  devis: "OFFER N°",
  bon_commande: "PURCHASE ORDER N°",
  commande_fournisseur: "SUPPLIER ORDER N°",
  bon_reception: "GOODS RECEIPT N°",
  bon_livraison: "DELIVERY NOTE N°",
  facture: "INVOICE N°",
};

const MAX_ITEM_ROWS = 8;
const ITEM_START = 21; // FORMULAIRE A21…

const BANK: Record<Currency, { account: string; number: string; bank: string; swift: string; sort: string }> = {
  USD: {
    account: "WESTCHASE OIL AND GAS LTD",
    number: "USD ACCOUNT NO : 5250152975",
    bank: "FIDELITY BANK PLC",
    swift: "CITIUS33",
    sort: "FIDTNGLA",
  },
  EUR: {
    account: "WESTCHASE OIL AND GAS LTD - VEMAT",
    number: "EUR ACCOUNT NO : 1309288049",
    bank: "PROVIDUS BANK PLC",
    swift: "",
    sort: "",
  },
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function clientLines(doc: PdrDocument): [string, string, string, string] {
  const addr = (doc.client_address ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return [
    doc.client_company || doc.client_name || "",
    addr[0] ?? "",
    addr[1] ?? "",
    addr[2] ?? (addr.length === 0 && doc.client_name && doc.client_company ? doc.client_name : ""),
  ];
}

function xlsxFileName(doc: PdrDocument): string {
  return docxFileName(doc).replace(/\.docx$/i, ".xlsx");
}

async function loadTemplate(): Promise<ExcelJS.Workbook> {
  const buf = await (await fetch(templateUrl)).arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  return wb;
}

function fillFormulaire(ws: ExcelJS.Worksheet, doc: PdrDocument): void {
  const [c1, c2, c3, c4] = clientLines(doc);
  const bank = BANK[doc.currency];
  const vatFraction = doc.apply_vat ? (Number(doc.vat_rate) || 0) / 100 : 0;

  ws.getCell("B2").value = doc.reference ?? "";
  ws.getCell("B3").value = "Lagos";
  ws.getCell("B4").value = new Date(doc.created_at);
  ws.getCell("B4").numFmt = "dd/mm/yyyy";
  ws.getCell("B5").value = doc.attention ?? "";
  ws.getCell("B6").value = doc.machine ?? "";
  ws.getCell("B7").value = doc.client_code ?? "";
  ws.getCell("B9").value = c1;
  ws.getCell("B10").value = c2;
  ws.getCell("B11").value = c3;
  ws.getCell("B12").value = c4;
  ws.getCell("B14").value = doc.payment_terms ?? "";
  ws.getCell("B15").value = doc.validity ?? "";
  ws.getCell("B16").value = doc.delivery_terms ?? "";
  ws.getCell("B17").value = doc.currency;
  ws.getCell("B18").value = vatFraction;

  for (let i = 0; i < MAX_ITEM_ROWS; i++) {
    const row = ITEM_START + i;
    const it = doc.items[i];
    if (!it) {
      ws.getCell(`A${row}`).value = "";
      ws.getCell(`B${row}`).value = "";
      ws.getCell(`C${row}`).value = "";
      ws.getCell(`D${row}`).value = "";
      ws.getCell(`E${row}`).value = "";
      ws.getCell(`F${row}`).value = "";
      ws.getCell(`G${row}`).value = null;
      ws.getCell(`H${row}`).value = null;
      continue;
    }
    const disc = (Number(it.discount_pct) || 0) / 100;
    ws.getCell(`A${row}`).value = it.reference || "";
    ws.getCell(`B${row}`).value = it.designation || "";
    ws.getCell(`C${row}`).value = Number(it.quantity) || 0;
    ws.getCell(`D${row}`).value = it.avail || "";
    ws.getCell(`E${row}`).value = Number(it.unit_price) || 0;
    ws.getCell(`F${row}`).value = disc;
    ws.getCell(`G${row}`).value = { formula: `IF(A${row}="","",E${row}*(1-F${row}))` };
    ws.getCell(`H${row}`).value = { formula: `IF(A${row}="","",C${row}*G${row})` };
  }

  ws.getCell("B31").value = bank.account;
  ws.getCell("B32").value = bank.number;
  ws.getCell("B33").value = bank.bank;
  ws.getCell("B34").value = bank.swift;
  ws.getCell("B35").value = bank.sort;

  // Keep footer defaults from template (editable if needed later)
}

function fillOffreDisplay(ws: ExcelJS.Worksheet, doc: PdrDocument): void {
  // Ensure print sheet shows correct title even before Excel recalculates
  ws.getCell("B10").value = `${TITLE[doc.type]} : ${doc.reference ?? ""}`;
  const [c1, c2, c3, c4] = clientLines(doc);
  ws.getCell("J10").value = [c1, "", c2, c3, c4].filter((l, i) => i === 1 || l).join("\n");
  ws.getCell("B13").value = `Lagos, ${fmtDate(doc.created_at)}`;
  ws.getCell("D15").value = doc.attention ?? "";
  ws.getCell("E15").value = doc.attention ?? "";
  ws.getCell("D16").value = doc.machine ?? "";
  ws.getCell("E16").value = doc.machine ?? "";
  ws.getCell("D17").value = doc.client_code ?? "";
  ws.getCell("E17").value = doc.client_code ?? "";

  // Write item values so OFFRE is correct with >0 lines without relying on open-calc only
  for (let i = 0; i < MAX_ITEM_ROWS; i++) {
    const offreRow = 20 + i;
    const it = doc.items[i];
    if (!it) {
      for (const col of ["B", "D", "I", "J", "K", "M", "N", "P"]) {
        ws.getCell(`${col}${offreRow}`).value = null;
      }
      continue;
    }
    ws.getCell(`B${offreRow}`).value = it.reference || "";
    ws.getCell(`D${offreRow}`).value = it.designation || "";
    ws.getCell(`I${offreRow}`).value = Number(it.quantity) || 0;
    ws.getCell(`J${offreRow}`).value = it.avail || "";
    ws.getCell(`K${offreRow}`).value = Number(it.unit_price) || 0;
    ws.getCell(`M${offreRow}`).value = (Number(it.discount_pct) || 0) / 100;
    ws.getCell(`N${offreRow}`).value = lineDiscountedUnit(it);
    ws.getCell(`P${offreRow}`).value = lineTotal(it);
  }

  const t = computeTotals(doc);
  ws.getCell("D36").value = doc.payment_terms ?? "";
  ws.getCell("F36").value = doc.payment_terms ?? "";
  ws.getCell("D37").value = doc.validity ?? "";
  ws.getCell("F37").value = doc.validity ?? "";
  ws.getCell("D38").value = doc.delivery_terms ?? "";
  ws.getCell("F38").value = doc.delivery_terms ?? "";
  ws.getCell("D39").value = doc.currency;
  ws.getCell("F39").value = doc.currency;
  ws.getCell("K36").value = t.mainSubtotal;
  ws.getCell("N36").value = doc.apply_vat ? t.mainVat : "";
  ws.getCell("P36").value = doc.apply_vat ? t.mainTotal : t.mainSubtotal;
}

export async function buildPdrXlsxBlob(doc: PdrDocument): Promise<Blob> {
  if (doc.items.length > MAX_ITEM_ROWS) {
    throw new Error(
      `Excel template supports max ${MAX_ITEM_ROWS} lines (found ${doc.items.length}). Use Word/PDF, or split the offer.`,
    );
  }
  const wb = await loadTemplate();
  const form = wb.getWorksheet("FORMULAIRE");
  const offre = wb.getWorksheet("OFFRE");
  if (!form || !offre) throw new Error("Excel template sheets FORMULAIRE / OFFRE not found.");

  fillFormulaire(form, doc);
  fillOffreDisplay(offre, doc);

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function downloadPdrXlsx(doc: PdrDocument): Promise<void> {
  const blob = await buildPdrXlsxBlob(doc);
  saveAs(blob, xlsxFileName(doc));
}
