/**
 * Shared CSV + XLSX export utilities — Hassan Phase 5.
 * Format both are 100 % client-side; downloads via a temporary <a>.
 */

import * as XLSX from "xlsx";

export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  /** Optional cell resolver — return the raw value to write. */
  resolve?: (row: T) => string | number | null | undefined;
  /** Optional hint for XLSX cell formatting. */
  format?: "money" | "date" | "datetime" | "int";
}

function toCell<T>(row: T, col: ExportColumn<T>): string | number | null {
  const raw = col.resolve
    ? col.resolve(row)
    : (row as Record<string, unknown>)[col.key as string];
  if (raw === null || raw === undefined || raw === "") return "";
  if (typeof raw === "number") return raw;
  if (raw instanceof Date) return raw.toISOString();
  return String(raw);
}

// ── CSV ────────────────────────────────────────────────────────────────────

/** RFC 4180 escape: wrap in quotes if contains ", , or newline. */
function csvEscape(value: string | number | null): string {
  if (value === null || value === "") return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const header = columns.map((c) => csvEscape(c.label)).join(",");
  const body = rows.map((r) =>
    columns.map((c) => csvEscape(toCell(r, c))).join(",")
  );
  // UTF-8 BOM so Excel opens accents correctly.
  return "﻿" + [header, ...body].join("\r\n");
}

// ── XLSX ───────────────────────────────────────────────────────────────────

export function toXlsx<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  sheetName = "Sheet1",
): XLSX.WorkBook {
  const aoa: (string | number | null)[][] = [
    columns.map((c) => c.label),
    ...rows.map((r) => columns.map((c) => toCell(r, c))),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths (auto-fit — best effort from header + first 200 rows).
  const widths = columns.map((_, colIdx) => {
    let max = String(aoa[0]?.[colIdx] ?? "").length;
    for (let i = 1; i < Math.min(aoa.length, 200); i++) {
      const v = aoa[i]?.[colIdx];
      if (v != null) max = Math.max(max, String(v).length);
    }
    return { wch: Math.min(60, Math.max(8, max + 2)) };
  });
  sheet["!cols"] = widths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, sheetName.slice(0, 31));
  return wb;
}

// ── Download triggers ──────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export function downloadXlsx(filename: string, wb: XLSX.WorkBook) {
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerDownload(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

// ── Filename builder ───────────────────────────────────────────────────────

export function exportFilename(entity: string, portal?: string): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const parts = ["vemat", portal, entity, `${yyyy}-${mm}-${dd}`].filter(Boolean);
  return parts.join("-");
}
