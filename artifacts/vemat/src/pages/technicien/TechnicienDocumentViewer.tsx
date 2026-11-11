import { useEffect, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { TechnicienLayout } from "./TechnicienLayout";
import { supabaseTech } from "@/lib/supabase";
import { useLang } from "@/i18n/I18nProvider";
import { fetchDocumentBlob, getSharedDocument, viewKind, type SharedDocument } from "@/lib/sharedDocuments";

/**
 * Lecture seule : le document est affiché dans l'application (PDF dessiné page par page, image), sans bouton
 * de téléchargement, sans lien direct et sans impression. Un utilisateur très technique peut toujours capturer
 * l'écran : l'objectif est d'empêcher le téléchargement courant, pas de garantir l'impossible.
 */
export default function TechnicienDocumentViewer() {
  const { lang } = useLang();
  const fr = lang === "fr";
  const [, params] = useRoute<{ id: string }>("/espace-technicien/documents-techniques/:id");
  const id = params?.id ?? "";
  const [doc, setDoc] = useState<SharedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<{ done: number; total: number } | null>(null);
  const [text, setText] = useState<string | null>(null);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        const d = await getSharedDocument(supabaseTech, id);
        if (cancelled) return;
        setDoc(d);
        const kind = viewKind(d.mime, d.file_name);
        if (kind === "none") {
          setError(fr ? "Ce format ne peut pas être consulté dans l'application." : "This format cannot be viewed in the app.");
          return;
        }
        const blob = await fetchDocumentBlob(supabaseTech, d);
        if (cancelled) return;
        if (kind === "text") {
          setText((await blob.text()).slice(0, 500_000));
          return;
        }
        if (kind === "tiff") {
          const UTIF = (await import("utif2")).default;
          const buf = await blob.arrayBuffer();
          const ifds = UTIF.decode(buf);
          if (!ifds.length || !host.current) throw new Error(fr ? "TIFF illisible." : "Unreadable TIFF.");
          setPages({ done: 0, total: ifds.length });
          let n = 0;
          for (const ifd of ifds) {
            if (cancelled || !host.current) return;
            UTIF.decodeImage(buf, ifd);
            const rgba = UTIF.toRGBA8(ifd);
            const canvas = document.createElement("canvas");
            canvas.width = ifd.width;
            canvas.height = ifd.height;
            canvas.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(rgba), ifd.width, ifd.height), 0, 0);
            canvas.style.width = "100%";
            canvas.className = "block bg-white shadow rounded mb-3";
            canvas.oncontextmenu = (e) => e.preventDefault();
            host.current.appendChild(canvas);
            setPages({ done: ++n, total: ifds.length });
            await new Promise((r) => setTimeout(r, 0));
          }
          return;
        }
        if (kind === "image") {
          objectUrl = URL.createObjectURL(blob);
          setImgUrl(objectUrl);
          return;
        }
        const pdfjs = await import("pdfjs-dist");
        const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        if (cancelled || !host.current) return;
        setPages({ done: 0, total: pdf.numPages });
        const width = host.current.clientWidth;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          if (cancelled || !host.current) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.className = "block bg-white shadow rounded mb-3";
          canvas.oncontextmenu = (e) => e.preventDefault();
          host.current.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          setPages({ done: n, total: pdf.numPages });
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, fr]);

  return (
    <TechnicienLayout>
      <style>{`@media print { .no-print-doc { display: none !important; } }`}</style>
      <div className="p-4 lg:p-8 max-w-[900px] mx-auto bg-zinc-50 min-h-screen select-none no-print-doc" onContextMenu={(e) => e.preventDefault()}>
        <Link href="/espace-technicien/documents-techniques" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-4">
          <ArrowLeft className="h-4 w-4" /> {fr ? "Retour aux documents" : "Back to documents"}
        </Link>
        {doc && <h1 className="text-xl font-black text-zinc-950 mb-1">{doc.title}</h1>}
        <p className="text-xs text-zinc-500 mb-4">{fr ? "Consultation seule : ce document ne peut pas être téléchargé." : "View only: this document cannot be downloaded."}</p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}
        {!error && !imgUrl && text === null && (!pages || pages.done < pages.total) && (
          <p className="text-xs text-zinc-400 flex items-center gap-2 mb-3"><Loader2 className="h-4 w-4 animate-spin" /> {pages ? `${fr ? "Page" : "Page"} ${pages.done}/${pages.total}` : fr ? "Chargement…" : "Loading…"}</p>
        )}
        {text !== null && <pre className="whitespace-pre-wrap break-words text-xs bg-white rounded-xl border border-zinc-200 p-4 text-zinc-800">{text}</pre>}
        {imgUrl && <img src={imgUrl} alt={doc?.title ?? ""} draggable={false} className="w-full rounded bg-white shadow pointer-events-none" />}
        <div ref={host} />
      </div>
    </TechnicienLayout>
  );
}
