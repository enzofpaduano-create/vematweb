import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SavGuard } from "./SavGuard";
import { SavLayout } from "./SavLayout";
import { SavDocumentForm, defaultFormValues, formToPayload, type SavFormValues } from "./SavDocumentForm";
import { supabaseSav } from "@/lib/supabase";
import { useSavAuth } from "@/contexts/SavAuthContext";
import { createSavDocument } from "@/lib/savDocuments";

export default function SavOfferNew() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user } = useSavAuth();
  const fromId = useMemo(() => new URLSearchParams(search).get("from"), [search]);

  const [initial, setInitial] = useState<SavFormValues>(defaultFormValues);
  const [syncKey, setSyncKey] = useState("new");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromId) { setInitial(defaultFormValues()); setSourceId(null); setSyncKey("new"); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabaseSav
        .from("form_interventions")
        .select("id, company_name, contact_name, contact_email, contact_phone, machine_type, machine_brand, machine_model, machine_serial, problem_description, location")
        .eq("id", fromId).maybeSingle();
      if (cancelled || !data) return;
      const base = defaultFormValues();
      const machine = [data.machine_brand, data.machine_model, data.machine_type].filter(Boolean).join(" ")
        + (data.machine_serial ? ` s/n ${data.machine_serial}` : "");
      setSourceId(data.id);
      setInitial({
        ...base,
        company: data.company_name ?? "", name: data.contact_name ?? "",
        email: data.contact_email ?? "", phone: data.contact_phone ?? "",
        machine: machine.trim(), location: data.location ?? "",
        interventionDescription: data.problem_description ?? "",
      });
      setSyncKey(`from-${data.id}`);
    })();
    return () => { cancelled = true; };
  }, [fromId]);

  async function handleSubmit(values: SavFormValues) {
    setSaving(true);
    setError(null);
    try {
      const payload = formToPayload(values);
      const doc = await createSavDocument({
        type: "devis",
        parent_id: null,
        source_form_intervention_id: sourceId,
        pdr_request_id: null,
        ...payload,
        status: "brouillon",
        created_by: user?.id ?? null,
      });
      if (sourceId) await supabaseSav.from("form_interventions").update({ status: "traite" }).eq("id", sourceId);
      navigate(`/espace-sav/document/${doc.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <SavGuard>
      <SavLayout>
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
          <button onClick={() => navigate("/espace-sav/tableau")} className="text-xs text-zinc-500 hover:text-emerald-600 inline-flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          <SavDocumentForm
            initial={initial}
            syncKey={syncKey}
            title="New service offer"
            submitLabel="Create offer"
            saving={saving}
            error={error}
            onSubmit={handleSubmit}
            applySettingsRates
          />
        </div>
      </SavLayout>
    </SavGuard>
  );
}
