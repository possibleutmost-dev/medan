import Link from "next/link";
import { photoUrl } from "@/lib/api";
import { PROPERTY_TYPE_LABELS, type HostelSummary } from "@/lib/types";
import { AmenityList } from "./amenity-list";
import { cedis } from "@/lib/format";
import { Icon } from "./graphics";
import { stockRoomImage } from "@/lib/stock";

export function HostelCard({ hostel }: { hostel: HostelSummary }) {
  const cover = photoUrl(hostel.photos[0]) ?? stockRoomImage(hostel.id);

  return (
    <Link
      href={`/hostels/${hostel.id}`}
      className="card card-interactive group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Plain <img>: photos come from the API origin and arbitrary
            CDNs, which next/image would need every domain configured for. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={hostel.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Scrim so white chips stay legible over any photo. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent" />

        <div className="absolute left-3 top-3 flex gap-1.5">
          {hostel.isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
              <Icon name="shield" className="h-3 w-3" />
              Verified
            </span>
          )}
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink-700 backdrop-blur">
            {PROPERTY_TYPE_LABELS[hostel.propertyType] ?? hostel.propertyType}
          </span>
        </div>

        {hostel.reviewCount > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink-900 backdrop-blur">
            ★ {hostel.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <h3 className="font-semibold leading-tight text-ink-900 group-hover:text-brand-700">
            {hostel.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
            <Icon name="pin" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {hostel.address} · {hostel.campus}
            </span>
          </p>
        </div>

        {hostel.amenities.length > 0 && (
          <AmenityList keys={hostel.amenities} limit={3} />
        )}

        <div className="mt-auto flex items-end justify-between border-t border-ink-100 pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-500">
              per bed · semester
            </p>
            <p className="text-lg font-bold text-brand-700">
              {hostel.minPrice === hostel.maxPrice
                ? cedis(hostel.minPrice)
                : `${cedis(hostel.minPrice)}+`}
            </p>
          </div>
          <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}
