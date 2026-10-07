"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "./graphics";
import { SafeImage } from "./safe-image";
import { HERO_IMAGE } from "@/lib/stock";

/**
 * Full-bleed hero with the search built into it.
 *
 * Centred, serif, generous vertical rhythm — the hotel-brochure register. The
 * three questions students actually decide on (where, what room, what budget)
 * sit in one bar; anything narrower lives in the chips below.
 *
 * `backgroundImage` is the first photo of a featured listing when one exists.
 * Most listings have none, so the dusk gradient is the designed default, not a
 * fallback that looks broken.
 */
export function HeroSearch({
  resultCount,
  backgroundImage,
}: {
  resultCount?: number;
  backgroundImage?: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [campus, setCampus] = useState(params.get("campus") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries({ q: q.trim(), campus, maxPrice })) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <section className="relative isolate overflow-hidden">
      {backgroundImage ? (
        <>
          <SafeImage
            src={backgroundImage}
            fallback={HERO_IMAGE}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="hero-scrim absolute inset-0 -z-10" />
        </>
      ) : (
        <div className="hero-dusk absolute inset-0 -z-10" />
      )}

      <div className="mx-auto max-w-6xl px-4 pb-12 pt-24 text-center sm:pb-20 sm:pt-36">
        <p className="eyebrow text-gold-300">Student stays · Ghana</p>

        <h1 className="display-xl mt-6 text-white">
          MeDan
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
          Verified hostels near your campus. Choose the exact bed you want and
          pay without handing cash to a stranger — your money is held until you
          check in.
        </p>

        <span className="mx-auto mt-8 block h-px w-16 bg-gold-400/70" />

        {/* Search. Stacks on mobile; one continuous plate on desktop. */}
        <form
          onSubmit={submit}
          className="mx-auto mt-8 grid max-w-3xl gap-1 bg-white/95 p-2 shadow-2xl backdrop-blur sm:flex sm:items-center sm:gap-0"
        >
          <div className="tap flex flex-1 items-center gap-2.5 px-3 py-2.5">
            <Icon name="search" className="h-4 w-4 shrink-0 text-ink-300" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Hostel name or area…"
              aria-label="Search hostels"
              className="w-full bg-transparent text-left text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none"
            />
          </div>

          <span className="hidden h-7 w-px bg-ink-100 sm:block" />

          <label className="tap flex items-center gap-2.5 border-t border-ink-100 px-3 py-2.5 sm:w-40 sm:border-t-0">
            <Icon name="pin" className="h-4 w-4 shrink-0 text-ink-300" />
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              aria-label="Campus"
              className="w-full cursor-pointer bg-transparent text-sm text-ink-700 focus:outline-none"
            >
              <option value="">Any campus</option>
              <option value="UENR">UENR</option>
              <option value="USTED">USTED</option>
            </select>
          </label>

          <span className="hidden h-7 w-px bg-ink-100 sm:block" />

          <label className="tap flex items-center gap-2.5 border-t border-ink-100 px-3 py-2.5 sm:w-44 sm:border-t-0">
            <Icon name="wallet" className="h-4 w-4 shrink-0 text-ink-300" />
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              aria-label="Budget"
              className="w-full cursor-pointer bg-transparent text-sm text-ink-700 focus:outline-none"
            >
              <option value="">Any budget</option>
              {[2000, 3000, 4000, 5000, 7000, 10000].map((p) => (
                <option key={p} value={p}>
                  Up to GH₵{p.toLocaleString()}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="mt-2 w-full bg-ink-900 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gold-600 sm:mt-0 sm:w-auto"
          >
            Search
          </button>
        </form>

        {resultCount !== undefined && (
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-white/50">
            {resultCount === 0
              ? "No stays match yet"
              : `${resultCount} ${resultCount === 1 ? "stay" : "stays"} available`}
          </p>
        )}
      </div>
    </section>
  );
}
