import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/lib/types";

/** Colour carries meaning here: green = money safe, amber = action needed. */
const TONE: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  paymentHeld: "bg-brand-100 text-brand-900",
  checkedIn: "bg-brand-600 text-white",
  completed: "bg-ink-100 text-ink-700",
  disputed: "bg-red-100 text-red-900",
  refunded: "bg-ink-100 text-ink-700",
  cancelled: "bg-ink-100 text-ink-500",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
        TONE[status] ?? "bg-ink-100 text-ink-700"
      }`}
    >
      {BOOKING_STATUS_LABELS[status] ?? status}
    </span>
  );
}
