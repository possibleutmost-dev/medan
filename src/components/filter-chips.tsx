"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROPERTY_TYPE_LABELS, ROOM_TYPE_LABELS } from "@/lib/types";
import { Icon } from "./graphics";

/**
 * Secondary filters as toggle chips.
 *
 * Chips over dropdowns because the active filters stay visible — a student who
 * has narrowed to "verified, 4 in a room" can see why the list is short
 * without opening anything.
 */
export function FilterChips() {
  const router = useRouter();
  const params = useSearchParams();

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
  }

  /** Clicking an active chip clears it — chips are toggles, not radios. */
  function toggle(key: string, value: string) {
    set(key, params.get(key) === value ? null : value);
  }

  const activeKeys = ["q", "campus", "type", "roomType", "maxPrice", "verified"]
    .filter((k) => params.get(k));

  const chip = (active: boolean) =>
    `inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
      active
        ? "border-brand-600 bg-brand-600 text-white"
        : "border-ink-100 bg-surface text-ink-700 hover:border-brand-200 hover:bg-brand-50"
    }`;

  return (
    <div className="-mx-4 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
      <button
        onClick={() => toggle("verified", "true")}
        className={chip(params.get("verified") === "true")}
      >
        <Icon name="shield" className="h-4 w-4" />
        Verified
      </button>

      {(["single", "doublyShared", "quadShared"] as const).map((rt) => (
        <button
          key={rt}
          onClick={() => toggle("roomType", rt)}
          className={chip(params.get("roomType") === rt)}
        >
          <Icon name="bed" className="h-4 w-4" />
          {ROOM_TYPE_LABELS[rt]}
        </button>
      ))}

      {(["hostel", "apartment", "selfContained"] as const).map((pt) => (
        <button
          key={pt}
          onClick={() => toggle("type", pt)}
          className={chip(params.get("type") === pt)}
        >
          {PROPERTY_TYPE_LABELS[pt]}
        </button>
      ))}

      {activeKeys.length > 0 && (
        <button
          onClick={() => router.push("/", { scroll: false })}
          className="ml-1 text-sm font-medium text-ink-500 underline-offset-4 hover:text-ink-900 hover:underline"
        >
          Clear ({activeKeys.length})
        </button>
      )}
    </div>
  );
}
