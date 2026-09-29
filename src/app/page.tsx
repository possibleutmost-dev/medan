import { Suspense } from "react";
import { api, ApiError, photoUrl } from "@/lib/api";
import { HERO_IMAGE } from "@/lib/stock";
import type { HostelQuery, HostelSummary } from "@/lib/types";
import { HostelCard } from "@/components/hostel-card";
import { HeroSearch } from "@/components/hero-search";
import { FilterChips } from "@/components/filter-chips";
import {
  CampusStrip,
  OwnerCta,
  StatsBand,
} from "@/components/home-sections";
import {
  CircularBadge,
  EmptyIllustration,
  Icon,
  SectionHeading,
} from "@/components/graphics";

/**
 * Browse and search hostels.
 *
 * Server-rendered so listings are in the first paint and crawlable. Filters
 * live in URL search params, which keeps every result set shareable and makes
 * the back button undo a filter the way people expect.
 */
export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const maxPriceRaw = first("maxPrice");
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;

  const query: HostelQuery = {
    q: first("q"),
    campus: first("campus"),
    type: first("type") as HostelQuery["type"],
    roomType: first("roomType") as HostelQuery["roomType"],
    // Guard against ?maxPrice=abc — NaN would otherwise be sent as "NaN".
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    verified: first("verified") === "true" ? true : undefined,
  };

  let hostels: HostelSummary[] = [];
  let error: string | null = null;
  try {
    hostels = await api.listHostels(query);
  } catch (err) {
    // The API sleeps on Render's free tier and a cold start can exceed the
    // request timeout. Say so, rather than render an empty state that reads
    // as "no hostels exist".
    error =
      err instanceof ApiError
        ? err.message
        : "Could not reach the booking service. It may be waking up — try again in a moment.";
  }

  const hasFilters = Object.values(query).some((v) => v !== undefined);
  // Use a real listing photo behind the hero when the catalogue has one.
  // A real listing photo wins; otherwise the committed stock hero.
  const heroImage =
    photoUrl(hostels.find((h) => h.photos[0])?.photos[0]) ?? HERO_IMAGE;

  return (
    <>
      {/* useSearchParams needs a Suspense boundary in the app router. */}
      <Suspense fallback={<div className="hero-mesh h-[420px]" />}>
        <HeroSearch
          resultCount={error ? undefined : hostels.length}
          backgroundImage={heroImage}
        />
      </Suspense>

      <CampusStrip hostels={hostels} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Suspense fallback={<div className="h-9" />}>
          <FilterChips />
        </Suspense>

        <div className="mt-6">
          {error ? (
            <div className="card flex items-start gap-4 border-amber-200 bg-amber-50 p-6">
              <Icon name="spark" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">
                  Couldn&apos;t load hostels
                </p>
                <p className="mt-1 text-sm text-amber-800">{error}</p>
              </div>
            </div>
          ) : hostels.length === 0 ? (
            <div className="card flex flex-col items-center px-6 py-14 text-center">
              <EmptyIllustration className="h-32 w-44" />
              <p className="mt-4 text-lg font-semibold">
                No hostels match that search
              </p>
              <p className="mt-1 max-w-sm text-sm text-ink-500">
                {hasFilters
                  ? "Try a higher budget, a different campus, or clear a filter or two."
                  : "There are no listings yet — check back soon."}
              </p>
            </div>
          ) : (
            <>
              <SectionHeading
                eyebrow="Available now"
                title="Places to stay"
                align="center"
              />
              <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {hostels.map((hostel) => (
                <HostelCard key={hostel.id} hostel={hostel} />
                ))}
              </div>
            </>
          )}
        </div>

        <StatsBand hostels={hostels} />
        <HowItWorks />
      </div>

      <OwnerCta />
    </>
  );
}

/** Explains escrow, which is the reason to book here rather than pay cash. */
function HowItWorks() {
  const steps = [
    {
      icon: "bed" as const,
      title: "Choose your bed",
      body: "Not just a hostel — the exact room and space, so you know what you are paying for before you commit.",
    },
    {
      icon: "wallet" as const,
      title: "Pay by MoMo or card",
      body: "Your money goes into escrow, not into a stranger's pocket. Nothing is released yet.",
    },
    {
      icon: "key" as const,
      title: "Check in, then it clears",
      body: "Show your code on arrival. The hostel is paid only once you are actually in the room.",
    },
  ];

  return (
    <section className="paper mt-16 px-5 py-12 sm:mt-24 sm:px-12 sm:py-16">
      <div className="relative mx-auto max-w-4xl">
        {/* Rotating wordmark, echoing the seal on hotel stationery. */}
        <CircularBadge className="pointer-events-none absolute -top-6 right-0 hidden h-28 w-28 opacity-70 lg:block" />

        <SectionHeading
          eyebrow="How it works"
          title="Booked in three steps"
          align="center"
        >
          Your money is protected at every one of them.
        </SectionHeading>

        <ol className="mt-12 grid gap-10 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center border border-gold-200 text-gold-600">
                <Icon name={step.icon} className="h-5 w-5" />
              </span>
              <p className="display mt-5 text-sm text-ink-300">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 text-xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
