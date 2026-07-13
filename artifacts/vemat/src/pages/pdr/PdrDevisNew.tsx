import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft } from "lucide-react";
import { PdrGuard } from "./PdrGuard";
import { PdrLayout } from "./PdrLayout";
import {
  PdrDocumentForm, defaultFormValues, emptyItem, formToPayload,
  type PdrFormValues,
} from "./PdrDocumentForm";
import { supabasePdr } from "@/lib/supabase";
import { usePdrAuth } from "@/contexts/PdrAuthContext";
import { createDocument, rememberParts, type PdrItem } from "@/lib/pdrDocuments";

type CartLine = { sku?: string; title?: string; brand?: string; quantity?: number; unit_price?: number };

function itemsFromCart(cart: CartLine[] | null | undefined): PdrItem[] | null {
  if (!Array.isArray(cart) || cart.length === 0) return null;
  return cart.map((c) => ({
    reference: String(c.sku ?? "").trim(),
    designation: String(c.title ?? "").trim() || String(c.brand ?? "").trim() || "Part",
    quantity: Number(c.quantity) || 1,
    avail: "Imm",
    unit_price: Number(c.unit_price) || 0,
    discount_pct: 0,
  }));
}

export default function PdrDevisNew() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user } = usePdrAuth();
  const fromId = useMemo(() => new URLSearchParams(search).get("from"), [search]);

  const [initial, setInitial] = useState<PdrFormValues>(defaultFormValues);
  const [syncKey, setSyncKey] = useState("new");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromId) {
      setInitial(defaultFormValues());
      setSourceId(null);
      setSyncKey("new");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabasePdr
        .from("form_devis")
        .select("id, company_name, contact_name, contact_email, contact_phone, product_category, quantity, notes, cart_items")
        .eq("id", fromId)
        .maybeSingle();
      if (cancelled || !data) return;

      const base = defaultFormValues();
      const fromCart = itemsFromCart(data.cart_items as CartLine[] | null);
      const items = fromCart ?? (
        data.product_category
          ? [{ ...emptyItem(), designation: data.product_category, quantity: data.quantity ?? 1 }]
          : [emptyItem()]
      );

      setSourceId(data.id);
      setInitial({
        ...base,
        company: data.company_name ?? "",
        name: data.contact_name ?? "",
        email: data.contact_email ?? "",
        phone: data.contact_phone ?? "",
        notes: data.notes ?? "",
        items,
      });
      setSyncKey(`from-${data.id}`);
    })();
    return () => { cancelled = true; };
  }, [fromId]);

  async function handleSubmit(values: PdrFormValues) {
    setSaving(true);
    setError(null);
    try {
      const payload = formToPayload(values);
      const doc = await createDocument({
        type: "devis",
        parent_id: null,
        source_form_devis_id: sourceId,
        ...payload,
        logistics: {},
        status: "brouillon",
        created_by: user?.id ?? null,
      });
      if (sourceId) await supabasePdr.from("form_devis").update({ status: "traite" }).eq("id", sourceId);
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
          <button onClick={() => navigate("/espace-pdr/tableau")} className="text-xs text-zinc-500 hover:text-sky-600 inline-flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          <PdrDocumentForm
            initial={initial}
            syncKey={syncKey}
            title="New offer"
            submitLabel="Create offer"
            saving={saving}
            error={error}
            onSubmit={handleSubmit}
          />
        </div>
      </PdrLayout>
    </PdrGuard>
  );
}
