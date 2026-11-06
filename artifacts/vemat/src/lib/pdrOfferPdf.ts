/**
 * PDF generation / preview for PDR documents (English labels, PO not BC).
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import letterheadUrl from "@/assets/pdr/letterhead.png";
import { WC_FOOTER_TEXT } from "@/lib/westchaseBrand";
import {
  computeTotals, lineDiscountedUnit, lineTotal, DOC_LABEL,
  type PdrDocument, type Currency,
} from "@/lib/pdrDocuments";
import { buildCasablancaPdf, pdrToCb } from "@/lib/casablancaDoc";
import { docxFileName } from "@/lib/pdrOfferDocx";

const TITLE: Record<PdrDocument["type"], string> = {
  devis: "OFFER No",
  bon_commande: "PURCHASE ORDER No",
  commande_fournisseur: "SUPPLIER ORDER No",
  bon_reception: "GOODS RECEIPT No",
  bon_livraison: "DELIVERY NOTE No",
  facture: "INVOICE No",
  avoir: "CREDIT NOTE No",
};

function num(n: number, currency?: Currency): string {
  const v = Number(n) || 0;
  if (currency === "EUR") {
    return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,/g, " ");
}
function sym(c: Currency): string { return c === "EUR" ? "€" : c === "MAD" ? "MAD" : "$"; }
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function pdfFileName(doc: PdrDocument): string {
  return docxFileName(doc).replace(/\.docx$/i, ".pdf");
}

async function loadLetterheadDataUrl(): Promise<string | null> {
  try {
    const buf = await (await fetch(letterheadUrl)).arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return `data:image/png;base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

export async function buildPdrPdf(doc: PdrDocument): Promise<jsPDF> {
  if (doc.letterhead === "casablanca") return buildCasablancaPdf(pdrToCb(doc));
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const marginL = 14;
  const marginR = 14;
  let y = 12;

  // En-tête Vemat Westchase : logo rond centré + filet rouge pleine largeur (comme les modèles DE26xxx)
  const logo = await loadLetterheadDataUrl();
  if (logo) {
    pdf.addImage(logo, "PNG", (pageW - 38) / 2, 3, 38, 38);
  }
  pdf.setDrawColor(255, 3, 19);
  pdf.setLineWidth(0.7);
  pdf.line(0, 42, pageW, 42);
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.2);
  y = 52;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text(`${TITLE[doc.type]} : ${doc.reference ?? ""}`, marginL, y);

  const clientBlockY = y;
  pdf.setFontSize(10);
  let clientY = clientBlockY;
  if (doc.client_company) {
    pdf.text(doc.client_company, pageW - marginR, clientY, { align: "right" });
    clientY += 5;
  }
  if (doc.client_address) {
    pdf.setFont("helvetica", "normal");
    for (const line of doc.client_address.split("\n")) {
      if (!line.trim()) continue;
      pdf.text(line, pageW - marginR, clientY, { align: "right" });
      clientY += 4.5;
    }
  }
  y = Math.max(y + 8, clientY + 2);

  pdf.setFont("helvetica", "bold");
  pdf.text(`Lagos, ${fmtDate(doc.created_at)}`, marginL, y);
  y += 8;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  if (doc.attention) { pdf.text(`To the attention of : ${doc.attention}`, marginL, y); y += 5; }
  pdf.text(`Machine : ${doc.machine || ""}`, marginL, y); y += 5;
  pdf.text(`Client Code : ${doc.client_code || ""}`, marginL, y); y += 5;

  const L = doc.logistics ?? {};
  if (L.supplier_name) { pdf.text(`Supplier : ${L.supplier_name}`, marginL, y); y += 5; }
  if (L.factory_ref) { pdf.text(`Factory ref : ${L.factory_ref}`, marginL, y); y += 5; }
  if (L.eta) { pdf.text(`ETA : ${L.eta}`, marginL, y); y += 5; }
  if (L.warehouse) { pdf.text(`Warehouse : ${L.warehouse}`, marginL, y); y += 5; }
  if (L.delivery_date) { pdf.text(`Delivery date : ${L.delivery_date}`, marginL, y); y += 5; }
  if (L.carrier) { pdf.text(`Carrier : ${L.carrier}`, marginL, y); y += 5; }
  if (L.received_date) { pdf.text(`Received : ${L.received_date}`, marginL, y); y += 5; }
  y += 2;

  const bodyRows = doc.items.map((it) => [
    it.reference || "",
    it.designation || "",
    String(it.quantity ?? ""),
    it.avail || "",
    num(it.unit_price, doc.currency),
    it.discount_pct ? `${it.discount_pct}%` : "0%",
    num(lineDiscountedUnit(it), doc.currency),
    num(lineTotal(it), doc.currency),
  ]);

  autoTable(pdf, {
    startY: y,
    head: [["Reference", "Designation", "Qty", "Avail", "Unit Price", "Discount", "Disc. Unit", "Total"]],
    body: bodyRows,
    styles: { fontSize: 7.5, cellPadding: 1.2, lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold", lineWidth: 0.25 },
    theme: "grid",
    margin: { left: marginL, right: marginR },
  });

  // @ts-expect-error jspdf-autotable attaches lastAutoTable
  y = (pdf.lastAutoTable?.finalY ?? y) + 8;
  const t = computeTotals(doc);
  const s = sym(doc.currency);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  if (doc.incoterms_note) {
    pdf.text(doc.incoterms_note, marginL, y, { maxWidth: pageW - marginL - marginR });
    y += 8;
  }

  if (doc.type === "devis" || doc.type === "facture" || doc.type === "bon_commande" || doc.type === "commande_fournisseur") {
    pdf.setFont("helvetica", "bold");
    pdf.text(`Payment Terms : ${doc.payment_terms || ""}`, marginL, y); y += 5;
    if (doc.type === "devis") { pdf.text(`Validity of Offer : ${doc.validity || ""}`, marginL, y); y += 5; }
    pdf.text(`Delivery Terms : ${doc.delivery_terms || ""}`, marginL, y); y += 5;
    pdf.text(`Currency : ${doc.currency}${t.hasCustoms ? " / NAIRA" : ""}`, marginL, y); y += 8;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  const right = pageW - marginR;
  pdf.text(`TOTAL  ${num(t.mainSubtotal, doc.currency)} ${s}`, right, y, { align: "right" }); y += 5;
  if (doc.apply_vat) {
    pdf.text(`VAT ${doc.vat_rate}%  ${num(t.mainVat, doc.currency)} ${s}`, right, y, { align: "right" }); y += 5;
    pdf.text(`TOTAL w/ VAT  ${num(t.mainTotal, doc.currency)} ${s}`, right, y, { align: "right" }); y += 5;
  }
  if (t.hasCustoms) {
    y += 2;
    pdf.text(`TOTAL  ${num(t.nairaSubtotal)} NGN`, right, y, { align: "right" }); y += 5;
    if (doc.apply_vat) {
      pdf.text(`VAT ${doc.vat_rate}%  ${num(t.nairaVat)} NGN`, right, y, { align: "right" }); y += 5;
      pdf.text(`TOTAL w/ VAT  ${num(t.nairaTotal)} NGN`, right, y, { align: "right" }); y += 5;
    }
  }

  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  if (doc.type === "devis" || doc.type === "facture") {
    pdf.setFont("helvetica", "bold");
    pdf.text("Contractual Document:", marginL, y); y += 4;
    pdf.setFont("helvetica", "normal");
    pdf.text("The availability date is indicative and will be confirmed upon ordering.", marginL, y); y += 4;
    pdf.text("Please refer to the attached terms and conditions of sale.", marginL, y); y += 4;
    pdf.text("Sincerely,", marginL, y);
  } else if (doc.type === "bon_livraison" || doc.type === "bon_reception") {
    pdf.text("Goods received in good order and condition.", marginL, y); y += 5;
    pdf.text("Signature / Stamp : ____________________", marginL, y);
  }

  const footerY = pdf.internal.pageSize.getHeight() - 14;
  pdf.setTextColor(0);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  const l1b = WC_FOOTER_TEXT[0].slice(0, "VEMAT WESTCHASE LTD".length);
  const l1n = WC_FOOTER_TEXT[0].slice(l1b.length);
  const wB = pdf.getTextWidth(l1b);
  pdf.setFont("helvetica", "normal");
  const wN = pdf.getTextWidth(l1n);
  const gap = 1;
  const x0 = (pageW - wB - wN - gap) / 2;
  pdf.setFont("helvetica", "bold");
  pdf.text(l1b, x0, footerY);
  pdf.setFont("helvetica", "normal");
  pdf.text(l1n, x0 + wB + gap, footerY);
  pdf.text(WC_FOOTER_TEXT[1], pageW / 2, footerY + 3.6, { align: "center" });
  pdf.setFontSize(6.5);
  pdf.text(WC_FOOTER_TEXT[2], pageW / 2, footerY + 7, { align: "center" });

  return pdf;
}

/** Open PDF in a new browser tab (view). */
export async function viewPdrPdf(doc: PdrDocument): Promise<void> {
  const pdf = await buildPdrPdf(doc);
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  // Revoke later so the tab can load
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Download PDF file. */
export async function downloadPdrPdf(doc: PdrDocument): Promise<void> {
  const pdf = await buildPdrPdf(doc);
  const blob = pdf.output("blob");
  saveAs(blob, pdfFileName(doc));
}

export { pdfFileName, DOC_LABEL };
