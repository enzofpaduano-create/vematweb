import { Check, Clock } from "lucide-react";
import { ORDER_STATUSES, REPAIR_STATUSES } from "@/lib/database.types";
import type { OrderStatus, RepairStatus } from "@/lib/database.types";

const ORDER_FLOW: OrderStatus[] = ["en_traitement", "devis_envoye", "commande_payee", "en_livraison", "livree"];
const REPAIR_FLOW: RepairStatus[] = ["en_attente", "planifiee", "en_cours", "terminee"];

function Timeline({ steps, currentStatus, statuses }: {
  steps: string[];
  currentStatus: string;
  statuses: { value: string; label: string }[];
}) {
  const currentIdx = steps.indexOf(currentStatus);
  const isCancelled = currentStatus === "annulee";

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx && !isCancelled;
        const label = statuses.find((s) => s.value === step)?.label ?? step;
        return (
          <div key={step} className="flex items-center min-w-0">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? "bg-emerald-500 border-emerald-500 text-white"
                  : active ? "bg-accent border-accent text-white"
                  : "bg-white border-zinc-200 text-zinc-400"
              }`}>
                {done ? <Check className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
              </div>
              <p className={`text-[10px] font-semibold mt-1.5 text-center max-w-[72px] leading-tight ${
                done || active ? "text-zinc-800" : "text-zinc-400"
              }`}>{label}</p>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 mx-1 mt-[-18px] ${done ? "bg-emerald-400" : "bg-zinc-200"}`} />
            )}
          </div>
        );
      })}
      {isCancelled && (
        <span className="ml-4 mt-1 text-xs font-semibold text-red-500 self-start">Annulée</span>
      )}
    </div>
  );
}

export function OrderTimeline({ status }: { status: OrderStatus }) {
  return <Timeline steps={ORDER_FLOW} currentStatus={status} statuses={ORDER_STATUSES} />;
}

export function RepairTimeline({ status }: { status: RepairStatus }) {
  return <Timeline steps={REPAIR_FLOW} currentStatus={status} statuses={REPAIR_STATUSES} />;
}
