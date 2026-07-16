import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SavGuard } from "./SavGuard";
import { SavLayout } from "./SavLayout";
import { SavDocumentForm, defaultFormValues, formToPayload, type SavFormValues } from "./SavDocumentForm";
import { getSavDocument, updateSavDocument, getSavChildrenByType, canEditSavDocument, type SavDocument } from "@/lib/savDocuments";

function valuesFromDoc(d: SavDocument): SavFormValues {
  const b = defaultFormValues();
  return {
    ...b,
    company: d.client_company ?? "", name: d.client_name ?? "", email: d.client_email ?? "",
    phone: d.client_phone ?? "", address: d.client_address ?? "", attention: d.attention ?? "",
    machine: d.machine ?? "", clientCode: d.client_code ?? "", location: d.location ?? "",
    interventionDescription: d.intervention_description ?? "", interventionDate: d.intervention_date ?? "",
    labourMode: d.labour_mode, labourDays: d.labour_days, labourDailyRate: d.labour_daily_rate,
    labourFixed: d.labour_fixed_amount, labourDescription: d.labour_description ?? "",
    travelKm: d.travel_km, travelKmRate: d.travel_km_rate, travelHours: d.travel_hours, travelHourRate: d.travel_hour_rate,
    travelMeals: d.travel_meals, travelHotel: d.travel_hotel, travelOther: d.travel_other,
    parts: d.parts ?? [],
    currency: d.currency, applyVat: d.apply_vat, vatRate: d.vat_rate,
    customsNaira: d.customs_naira, customsLabel: d.customs_label ?? "CUSTOMS CLEARING and DELIVERY",
    paymentMode: d.payment_mode,
    paymentTerms: d.payment_terms ?? "", validity: d.validity ?? "", deliveryTerms: d.delivery_terms ?? "",
    incotermsNote: d.incoterms_note ?? "", notes: d.notes ?? "",
  };
}

export default function SavDocumentEdit() {
  const [, params] = useRoute<{ id: string }>("/espace-sav/document/:id/edit");
  const [, navigate] = useLocation();
  const id = params?.id;

  const [initial, setInitial] = useState<SavFormValues | null>(null);
  const [syncKey, setSyncKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const d = await getSavDocument(id);
      if (!d) { setError("Document not found."); return; }
      const kids = await getSavChildrenByType(d.id);
      if (!canEditSavDocument(d, Object.keys(kids).length > 0)) {
        navigate(`/espace-sav/document/${d.id}`);
        return;
      }
      setInitial(valuesFromDoc(d));
      setSyncKey(`edit-${d.id}`);
    })();
  }, [id]);

  async function handleSubmit(values: SavFormValues) {
    if (!id) return;
    setSaving(true); setError(null);
    try {
      await updateSavDocument(id, formToPayload(values));
      navigate(`/espace-sav/document/${id}`);
    } catch (e) { setError((e as Error).message); setSaving(false); }
  }

  return (
    <SavGuard>
      <SavLayout>
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <button onClick={() => navigate(`/espace-sav/document/${id}`)} className="text-xs text-zinc-500 hover:text-emerald-600 inline-flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">{error}</p>}
          {initial && (
            <SavDocumentForm initial={initial} syncKey={syncKey} title="Edit offer" submitLabel="Save changes" saving={saving} error={null} onSubmit={handleSubmit} />
          )}
        </div>
      </SavLayout>
    </SavGuard>
  );
}
