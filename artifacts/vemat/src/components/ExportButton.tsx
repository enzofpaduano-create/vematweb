import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
import { toCsv, toXlsx, downloadCsv, downloadXlsx, exportFilename, type ExportColumn } from "@/lib/exports";

interface ExportButtonProps<T> {
  rows: T[];
  columns: ExportColumn<T>[];
  /** Short entity name used in the filename, e.g. "clients". */
  entity: string;
  /** Optional portal prefix in the filename, e.g. "pdr". */
  portal?: string;
  /** Optional sheet name (defaults to entity). */
  sheetName?: string;
  /** Tailwind accent color: "sky" (PDR default) | "emerald" (SAV). */
  accent?: "sky" | "emerald";
  /** Optional label override, defaults to "Export". */
  label?: string;
  /** Disable when the underlying list is still loading. */
  disabled?: boolean;
}

export function ExportButton<T>({
  rows, columns, entity, portal, sheetName, accent = "sky", label = "Export", disabled,
}: ExportButtonProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const base = exportFilename(entity, portal);
  const isEmpty = rows.length === 0;
  const btnBg = accent === "emerald"
    ? "bg-emerald-600 hover:bg-emerald-500"
    : "bg-sky-600 hover:bg-sky-500";
  const focusRing = accent === "emerald" ? "focus:ring-emerald-100" : "focus:ring-sky-100";

  function handleXlsx() {
    const wb = toXlsx(rows, columns, sheetName ?? entity);
    downloadXlsx(base, wb);
    setOpen(false);
  }
  function handleCsv() {
    const csv = toCsv(rows, columns);
    downloadCsv(base, csv);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled || isEmpty}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 ${btnBg} text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${focusRing}`}
        title={isEmpty ? "Nothing to export" : `Export ${rows.length} row${rows.length > 1 ? "s" : ""}`}
      >
        <Download className="w-4 h-4" /> {label}
        {!isEmpty && <span className="text-white/70 text-xs">({rows.length})</span>}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && !isEmpty && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-30">
          <button
            type="button"
            onClick={handleXlsx}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-zinc-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-zinc-900">Excel (.xlsx)</p>
              <p className="text-[11px] text-zinc-500 truncate">{base}.xlsx</p>
            </div>
          </button>
          <button
            type="button"
            onClick={handleCsv}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-zinc-50 transition-colors border-t border-zinc-100"
          >
            <FileText className="w-4 h-4 text-sky-600 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-zinc-900">CSV (.csv)</p>
              <p className="text-[11px] text-zinc-500 truncate">{base}.csv</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
