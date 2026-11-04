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
import { createDocument, rememberParts, type PdrItem, type PdrSource } from "@/lib/pdrDocuments";
import { getClient } from "@/lib/clients";
import { cleanQuoteNumber, usesAtlascomNumber } from "@/lib/vematEntities";
import { getEquipment } from "@/lib/equipments";
import { addEvent, linkQuote, REQUEST_TYPE_PORTAL, type RegisterRow } from "@/lib/quotationRegister";

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
  // Devis préparé depuis le registre des demandes (?request=<id>)
  const requestId = useMemo(() => new URLSearchParams(search).get("request"), [search]);
  const [request, setRequest] = useState<RegisterRow | null>(null);
  const [atlascomRef, setAtlascomRef] = useState("");

  const [initial, setInitial] = useState<PdrFormValues>(defaultFormValues);
  const [syncKey, setSyncKey] = useState("new");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) { setRequest(null); return; }
    let cancelled = false;
    (async () => {
      const { data: row } = await supabasePdr.from("quotation_register").select("*").eq("id", requestId).maybeSingle();
      if (cancelled) return;
      if (!row) { setError("Request not found in the register."); return; }
      const r = row as RegisterRow;
      if (REQUEST_TYPE_PORTAL[r.request_type] !== "pdr") { setError("This request is not a spare-parts request — prepare it in the SAV portal."); return; }
      if (r.pdr_document_id) { setError(`A quote (${r.quotation_ref}) already exists for ${r.request_id}.`); return; }
      const [client, equipment] = await Promise.all([
        getClient(supabasePdr, r.client_id).catch(() => null),
        r.equipment_id ? getEquipment(supabasePdr, r.equipment_id).catch(() => null) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      const machine = [equipment?.brand, equipment?.model].filter(Boolean).join(" ")
        + (equipment?.serial_number ? ` s/n ${equipment.serial_number}` : "");
      setRequest(r);
      setSourceId(null);
      setInitial({
        ...defaultFormValues(),
        company: client?.name ?? r.client_name,
        address: [client?.address, client?.city, client?.country].filter(Boolean).join("\n"),
        name: r.contact_name ?? client?.contact_name ?? "",
        email: r.contact_email ?? client?.contact_email ?? "",
        phone: client?.contact_phone ?? "",
        machine: machine.trim(),
        currency: "USD",
        notes: `Request ${r.request_id}${r.request_details ? ` — ${r.request_details}` : ""}`,
        source: (r.received_via as PdrSource | null) ?? "",
        clientId: r.client_id,
        equipmentId: r.equipment_id,
      });
      setSyncKey(`request-${r.id}`);
    })();
    return () => { cancelled = true; };
  }, [requestId]);

  useEffect(() => {
    if (requestId) return;
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
  }, [fromId, requestId]);

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
        ...(request ? { issuing_entity: request.entity } : {}),
        // Numéro officiel généré par Atlascom (saisi à la main) ; vide = à saisir plus tard sur le devis.
        ...(request && usesAtlascomNumber({ type: "devis", issuing_entity: request.entity }) && cleanQuoteNumber(atlascomRef)
          ? { reference: cleanQuoteNumber(atlascomRef)! } : {}),
        logistics: {},
        status: "brouillon",
        created_by: user?.id ?? null,
      });
      if (request) {
        // Le numéro officiel DE26… est attribué par la base : on le rattache à la demande.
        await linkQuote(supabasePdr, request, doc.id);
        await addEvent(supabasePdr, request.id, "status", `Quote ${doc.reference ?? "(Atlascom number to enter)"} created`, user?.email ?? null).catch(() => {});
      }
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
          {request && usesAtlascomNumber({ type: "devis", issuing_entity: request.entity }) && (
            <div className="mb-5 bg-white border border-zinc-200 rounded-2xl p-4">
              <label className="block text-xs font-bold text-zinc-500 mb-1.5">Quote number generated by Atlascom (optional now — can be added on the quote)</label>
              <input className="w-full sm:w-64 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                value={atlascomRef} onChange={(e) => setAtlascomRef(e.target.value)} placeholder="DE26…" />
            </div>
          )}
          <PdrDocumentForm
            initial={initial}
            syncKey={syncKey}
            title={request ? `New offer — ${request.request_id}` : "New offer"}
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
