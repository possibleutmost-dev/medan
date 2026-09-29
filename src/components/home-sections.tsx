import Link from "next/link";
import { Icon, SectionHeading } from "./graphics";
import type { HostelSummary } from "@/lib/types";

/**
 * Campuses we cover.
 *
 * Derived from the listings actually in the catalogue rather than hard-coded,
 * so this can never advertise a campus with nothing on it. The API seeds UENR
 * and USTED; more appear here automatically as hostels are added.
 */
export function CampusStrip({ hostels }: { hostels: HostelSummary[] }) {
  const campuses = [...new Set(hostels.map((h) => h.campus))].filter(Boolean);
  if (campuses.length === 0) return null;

  return (
    <section className="border-b border-ink-100 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:justify-center sm:gap-12">
        <p className="eyebrow shrink-0">Campuses covered</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {campuses.map((campus) => (
            <li key={campus}>
              <Link
                href={`/?campus=${campus}`}
                className="display text-xl text-ink-300 transition hover:text-gold-600"
              >
                {campus}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Figures from the live catalogue — counted, never claimed. A hostel-booking
 * site quoting invented numbers is exactly the thing students are right to
 * distrust, so every stat here is computed from what the API returned.
 */
export function StatsBand({ hostels }: { hostels: HostelSummary[] }) {
  if (hostels.length === 0) return null;

  const campuses = new Set(hostels.map((h) => h.campus)).size;
  const verified = hostels.filter((h) => h.isVerified).length;
  const lowest = Math.min(...hostels.map((h) => h.minPrice));

  const stats = [
    { value: String(hostels.length), label: "Hostels listed" },
    { value: String(campuses), label: campuses === 1 ? "Campus" : "Campuses" },
    { value: String(verified), label: "Verified" },
    { value: `GH₵${lowest.toLocaleString()}`, label: "From, per semester" },
  ];

  return (
    <section className="section-y mx-auto max-w-5xl px-4">
      <dl className="grid grid-cols-2 gap-y-10 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <dd className="display display-md text-ink-900">{s.value}</dd>
            <dt className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
              {s.label}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Route for hostel owners — the other half of the marketplace. */
export function OwnerCta() {
  return (
    <section className="mt-16 bg-ink-900 sm:mt-24">
      <div className="section-y mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
        <div>
          <p className="eyebrow text-gold-400">For hostel owners</p>
          <span className="rule mt-4" />
          <h2 className="display-lg mt-4 text-white">
            List your hostel on MeDan
          </h2>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-white/60">
            Put your rooms in front of students searching for a bed this
            semester. Manage listings, beds and check-ins from the manager
            portal, and get paid once each student arrives.
          </p>
        </div>

        <div className="lg:justify-self-end">
          <ul className="space-y-3 text-sm text-white/70">
            {[
              "Per-bed inventory, not just room counts",
              "Booking requests and check-in in one place",
              "Payment released after the student checks in",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3">
                <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" />
                {point}
              </li>
            ))}
          </ul>

          <a
            href="https://medanadmin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="tap mt-7 inline-block bg-white px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-900 transition hover:bg-gold-100"
          >
            Open the manager portal
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * Student testimonials.
 *
 * Renders nothing until real quotes exist. Inventing student names and
 * endorsements would be fabricated trust signals on a page that handles
 * people's money — pass real ones in when you have them.
 */
export function Testimonials({
  quotes = [],
}: {
  quotes?: { name: string; level: string; body: string }[];
}) {
  if (quotes.length === 0) return null;

  return (
    <section className="paper mt-16 px-5 py-12 sm:mt-24 sm:px-12 sm:py-16">
      <SectionHeading eyebrow="Testimonial" title="What students say" align="center" />
      <ul className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
        {quotes.map((quote) => (
          <li key={quote.name} className="card p-6 text-center">
            <p className="text-sm italic leading-relaxed text-ink-700">
              “{quote.body}”
            </p>
            <p className="mt-5 text-sm font-semibold text-ink-900">{quote.name}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
              {quote.level}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
