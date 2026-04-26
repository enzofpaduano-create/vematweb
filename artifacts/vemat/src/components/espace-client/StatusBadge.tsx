import { ORDER_STATUSES, REPAIR_STATUSES } from "@/lib/database.types";
import type { OrderStatus, RepairStatus } from "@/lib/database.types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUSES.find((x) => x.value === status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s?.color ?? "bg-zinc-100 text-zinc-600"}`}>
      {s?.label ?? status}
    </span>
  );
}

export function RepairStatusBadge({ status }: { status: RepairStatus }) {
  const s = REPAIR_STATUSES.find((x) => x.value === status);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s?.color ?? "bg-zinc-100 text-zinc-600"}`}>
      {s?.label ?? status}
    </span>
  );
}
