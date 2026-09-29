import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError, photoUrl } from "@/lib/api";
import { cedis } from "@/lib/format";
import { humanAmenity } from "@/components/amenity-list";
import { RoomList } from "@/components/room-list";
import { Icon, SectionHeading } from "@/components/graphics";
import { PROPERTY_TYPE_LABELS } from "@/lib/types";
import { HERO_IMAGE, stockRoomImage } from "@/lib/stock";

export default async function HostelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let hostel;
  try {
    hostel = await api.getHostel(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const photos = hostel.photos.map(photoUrl).filter(Boolean) as string[];
  // Real photo first, committed stock second — never a grey box.
  const hero = photos[0] ?? HERO_IMAGE;
  const plate = photos[1] ?? stockRoomImage(hostel.id);
  const available = hostel.rooms.filter(
    (r) => r.status === "available" && r.availableBeds > 0,
  );

  return (
    <>
      {/* Banner: the listing's own photo when there is one, dusk when not. */}
      <section className="relative isolate">
        {hero ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero}
              alt=""
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
            <div className="hero-scrim absolute inset-0 -z-10" />
          </>
        ) : (
          <div className="hero-dusk absolute inset-0 -z-10" />
        )}

        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <h1 className="display-lg text-white">
            {hostel.name}
          </h1>
          <nav className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/60">
            <Link href="/" className="hover:text-gold-300">
              Home
            </Link>
            <span className="mx-2 text-white/30">›</span>
            <span className="text-white/80">{hostel.campus}</span>
          </nav>
        </div>
      </section>

      {/* Facts bar overlapping the banner, as in the reference layout. */}
      <div className="mx-auto -mt-8 max-w-4xl px-4 sm:-mt-10">
        <dl className="grid grid-cols-2 gap-px bg-ink-100 shadow-xl sm:grid-cols-4">
          <Fact label="From" value={cedis(hostel.minPrice)} accent />
          <Fact
            label="Property"
            value={PROPERTY_TYPE_LABELS[hostel.propertyType] ?? hostel.propertyType}
          />
          <Fact label="Rooms free" value={String(available.length)} />
          <Fact label="Status" value={hostel.isVerified ? "Verified" : "Unverified"} />
        </dl>
      </div>

      <div className="section-y mx-auto max-w-6xl px-4">
        {/* Framed photo beside the description. */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="plate">
            <div className="aspect-[4/5] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={plate}
                alt={hostel.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div>
            <SectionHeading eyebrow="The property" title="A place to settle in">
              {hostel.description ? (
                <p className="whitespace-pre-line">{hostel.description}</p>
              ) : (
                <p>
                  {hostel.name} is on {hostel.address}, close to the{" "}
                  {hostel.campus} campus. Rooms are priced per bed for the
                  semester, so you pay for your own space rather than the whole
                  room.
                </p>
              )}
            </SectionHeading>

            <p className="mt-6 flex items-center gap-2 text-sm text-ink-700">
              <Icon name="pin" className="h-4 w-4 text-gold-500" />
              {hostel.address} · {hostel.campus}
            </p>

            {hostel.contactPhone && (
              <div className="mt-6">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
                  Call directly
                </span>
                <a
                  href={`tel:${hostel.contactPhone}`}
                  className="display mt-1 block text-2xl text-ink-900 hover:text-gold-600"
                >
                  {hostel.contactPhone}
                </a>
              </div>
            )}
          </div>
        </section>

        {hostel.amenities.length > 0 && (
          <section className="paper mt-16 px-5 py-12 sm:mt-20 sm:px-12 sm:py-14">
            <SectionHeading eyebrow="Facilities" title="Amenities" align="center" />
            <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-3">
              {hostel.amenities.map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-2.5 text-sm text-ink-700"
                >
                  <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-gold-500" />
                  {humanAmenity(key)}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-16 sm:mt-20">
          <SectionHeading eyebrow="Availability" title="Our rooms" align="center">
            {available.length > 0
              ? `${available.length} of ${hostel.rooms.length} rooms have beds free.`
              : "Nothing free at the moment — check back before the semester starts."}
          </SectionHeading>

          <div className="mt-14">
            <RoomList
              rooms={hostel.rooms}
              hostelId={hostel.id}
              photos={hostel.photos}
            />
          </div>
        </section>
      </div>
    </>
  );
}

function Fact({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface px-5 py-5 text-center">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
        {label}
      </dt>
      <dd
        className={`display mt-1.5 text-xl ${accent ? "text-gold-600" : "text-ink-900"}`}
      >
        {value}
      </dd>
    </div>
  );
}
