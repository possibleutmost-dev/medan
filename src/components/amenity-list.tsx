/**
 * Amenity icon keys come from the API as short strings ("wifi", "ac").
 * Unknown keys are shown humanised rather than dropped — a new amenity added
 * on the backend should still appear, just without a glyph.
 */
const AMENITY_LABELS: Record<string, string> = {
  wifi: "Wi-Fi",
  ac: "Air conditioning",
  fan: "Fan",
  water: "Running water",
  generator: "Generator",
  security: "Security",
  parking: "Parking",
  kitchen: "Kitchen",
  laundry: "Laundry",
  studyRoom: "Study room",
  study: "Study room",
  tv: "TV",
  ensuite: "En-suite bathroom",
};

const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶",
  ac: "❄️",
  fan: "🌀",
  water: "🚿",
  generator: "🔌",
  security: "🛡️",
  parking: "🅿️",
  kitchen: "🍳",
  laundry: "🧺",
  studyRoom: "📚",
  study: "📚",
  tv: "📺",
  ensuite: "🛁",
};

export function humanAmenity(key: string): string {
  if (AMENITY_LABELS[key]) return AMENITY_LABELS[key];
  // camelCase / snake_case → "Study room"
  const spaced = key.replace(/[_-]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function AmenityList({
  keys,
  limit,
}: {
  keys: string[];
  limit?: number;
}) {
  const shown = limit ? keys.slice(0, limit) : keys;
  const hidden = limit ? keys.length - shown.length : 0;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((key) => (
        <li
          key={key}
          className="rounded-md bg-ink-50 px-2 py-0.5 text-xs text-ink-700"
        >
          <span aria-hidden="true">{AMENITY_ICONS[key] ?? "•"}</span>{" "}
          {humanAmenity(key)}
        </li>
      ))}
      {hidden > 0 && (
        <li className="rounded-md px-2 py-0.5 text-xs text-ink-500">
          +{hidden} more
        </li>
      )}
    </ul>
  );
}
