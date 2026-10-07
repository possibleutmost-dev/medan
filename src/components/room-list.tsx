import Link from "next/link";
import { cedis } from "@/lib/format";
import { ROOM_TYPE_LABELS, type RoomSummary } from "@/lib/types";
import { SafeImage } from "./safe-image";
import { stockRoomImage } from "@/lib/stock";
import { photoUrl } from "@/lib/api";

const GENDER_LABELS: Record<string, string> = {
  male: "Men only",
  female: "Women only",
  mixed: "Mixed",
};

/**
 * Rooms as full-width editorial rows that alternate sides, each opened by a
 * bordered box holding the room type set vertically and its index.
 *
 * A dense table would fit more rooms on screen, but a room is the thing being
 * sold — this gives each one the space of a listing rather than a line item.
 */
export function RoomList({
  rooms,
  hostelId,
  photos = [],
}: {
  rooms: RoomSummary[];
  hostelId: string;
  /** Hostel photos, cycled as room imagery until rooms carry their own. */
  photos?: string[];
}) {
  if (rooms.length === 0) {
    return (
      <p className="border border-dashed border-ink-100 bg-surface p-10 text-center text-sm text-ink-500">
        No rooms have been listed for this property yet.
      </p>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      {rooms.map((room, index) => {
        // A room can be flagged "available" yet have no free beds — the status
        // is the manager's flag, availableBeds is the live count. Both gate it.
        const bookable = room.status === "available" && room.availableBeds > 0;
        const flipped = index % 2 === 1;
        const image =
          photoUrl(photos[index % Math.max(photos.length, 1)]) ??
          stockRoomImage(room.id);

        return (
          <article
            key={room.id}
            className="grid items-center gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-[auto_1fr_1.1fr]"
          >
            {/* Vertical label plate */}
            <div
              className={`hidden h-56 w-16 flex-col items-center justify-between border border-ink-100 py-5 lg:flex ${
                flipped ? "lg:order-3" : ""
              }`}
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.3em] text-ink-500"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {ROOM_TYPE_LABELS[room.type] ?? room.type}
              </span>
              <span className="display text-lg text-ink-300">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            {/* Copy */}
            <div className={flipped ? "lg:order-2" : ""}>
              <h3 className="display-md">{room.label}</h3>

              <p className="mt-3 text-sm">
                <span className="text-ink-500">From </span>
                <span className="display text-2xl text-gold-600">
                  {cedis(room.pricePerSemester)}
                </span>
                <span className="text-ink-500"> / semester</span>
              </p>

              <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-500">
                {ROOM_TYPE_LABELS[room.type] ?? room.type} sleeping{" "}
                {room.capacity}. {GENDER_LABELS[room.gender] ?? room.gender}.
                Price is per bed, so you pay for your space — not the whole room.
              </p>

              <dl className="mt-5 space-y-1.5 text-xs">
                <Detail
                  label="Status"
                  value={
                    bookable
                      ? "Available"
                      : room.status === "maintenance"
                        ? "Under maintenance"
                        : "Full"
                  }
                  tone={bookable ? "good" : "muted"}
                />
                <Detail label="Beds free" value={`${room.availableBeds} of ${room.capacity}`} />
                <Detail label="Sharing" value={GENDER_LABELS[room.gender] ?? room.gender} />
              </dl>

              <div className="mt-6">
                {bookable ? (
                  <Link
                    href={`/book/${room.id}?hostel=${hostelId}`}
                    className="group inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-900 hover:text-gold-600"
                  >
                    Reserve a bed
                    <span className="transition group-hover:translate-x-1">→</span>
                  </Link>
                ) : (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-300">
                    Not available
                  </span>
                )}
              </div>
            </div>

            {/* Imagery */}
            <div className={`aspect-[4/3] overflow-hidden ${flipped ? "md:order-first lg:order-1" : ""}`}>
              <SafeImage
                src={image}
                fallback={stockRoomImage(room.id)}
                alt={room.label}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Detail({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "muted";
}) {
  return (
    <div className="flex gap-2">
      <dt className="text-ink-500">{label}:</dt>
      <dd
        className={
          tone === "good"
            ? "font-semibold text-gold-600"
            : tone === "muted"
              ? "text-ink-300"
              : "font-medium text-ink-800"
        }
      >
        {value}
      </dd>
    </div>
  );
}
