/** Formatting helpers shared across the app. */

/** Whole cedis — the API stores prices as integers, no pesewas. */
export function cedis(amount: number): string {
  return `GH₵${amount.toLocaleString("en-GH")}`;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * The academic year the API expects on a booking, e.g. "2026/2027".
 * Ghanaian academic years start around August, so anything from August
 * onwards belongs to the year that is just beginning.
 */
export function currentAcademicYear(now: Date = new Date()): string {
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${year + 1}`;
}
