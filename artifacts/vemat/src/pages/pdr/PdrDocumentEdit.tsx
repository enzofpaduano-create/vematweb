import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import {
  PdrDocumentForm, formToPayload, valuesFromDocument,
  type PdrFormValues,
} from "./PdrDocumentForm";
import {
  getDocument, hasChildDocuments, canEditDocument, updateDocument, rememberParts,
  DOC_LABEL, type PdrDocument,
} from "@/lib/pdrDocuments";

export default function PdrDocumentEdit() {
  const [, params] = useRoute<{ id: string }>("/espace-pdr/document/:id/edit");
  const [, navigate] = useLocation();
  const id = params?.id;

  const [doc, setDoc] = useState<PdrDocument | null>(null);
  const [initial, setInitial] = useState<PdrFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await getDocument(id);
        if (!d) {
          if (!cancelled) { setBlocked("Document not found."); setLoading(false); }
          return;
        }
        const children = await hasChildDocuments(d.id);
        if (!canEditDocument(d, children)) {
          if (!cancelled) {
            setBlocked(
              children
                ? "This document already has a follow-on document in the chain — editing is not allowed."
                : "Only draft documents with no conversion can be edited.",
            );
            setDoc(d);
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          setDoc(d);
          setInitial(valuesFromDocument(d));
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) { setBlocked((e as Error).message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function handleSubmit(values: PdrFormValues) {
    if (!doc) return;
    setSaving(true);
    setError(null);
    try {
      const payload = formToPayload(values);
      await updateDocument(doc.id, payload);
      await rememberParts(payload.items, values.currency);
      navigate(`/espace-pdr/document/${doc.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <PdrGuard>
      <PdrLayout>
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <button
            onClick={() => navigate(id ? `/espace-pdr/document/${id}` : "/espace-pdr/documents")}
            className="text-xs text-zinc-500 hover:text-sky-600 inline-flex items-center gap-1 mb-4 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Back to document
          </button>

          {loading && <p className="text-zinc-400 text-sm py-20 text-center animate-pulse">Loading…</p>}

          {blocked && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800">Editing unavailable</p>
                <p className="text-sm text-amber-700 mt-1">{blocked}</p>
                {id && (
                  <button
                    onClick={() => navigate(`/espace-pdr/document/${id}`)}
                    className="mt-3 text-sm font-bold text-sky-600 hover:underline"
                  >
                    View document
                  </button>
                )}
              </div>
            </div>
          )}

          {doc && initial && !blocked && (
            <PdrDocumentForm
              initial={initial}
              syncKey={doc.id}
              title={`Edit — ${doc.reference ?? DOC_LABEL[doc.type]}`}
              subtitle={`${DOC_LABEL[doc.type]} · ${doc.reference}`}
              submitLabel="Save"
              saving={saving}
              error={error}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
