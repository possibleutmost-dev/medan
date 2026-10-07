import Link from "next/link";

/**
 * Dark footer with link columns and a newsletter field.
 *
 * The newsletter input is presentational for now — there is no subscribe
 * endpoint on the API, and a field that silently discards an address is worse
 * than none, so it is disabled with an honest note rather than faked.
 */
export function SiteFooter() {
  const columns: { heading: string; links: { label: string; href: string }[] }[] = [
    {
      heading: "Browse",
      links: [
        { label: "All hostels", href: "/" },
        { label: "UENR campus", href: "/?campus=UENR" },
        { label: "USTED campus", href: "/?campus=USTED" },
        { label: "Verified only", href: "/?verified=true" },
      ],
    },
    {
      heading: "Rooms",
      links: [
        { label: "Single", href: "/?roomType=single" },
        { label: "2 in a room", href: "/?roomType=doublyShared" },
        { label: "4 in a room", href: "/?roomType=quadShared" },
        { label: "Self-contained", href: "/?type=selfContained" },
      ],
    },
    {
      heading: "Your account",
      links: [
        { label: "Sign in", href: "/login" },
        { label: "My bookings", href: "/bookings" },
      ],
    },
  ];

  return (
    <footer className="mt-24 bg-ink-900 text-white/70">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="display text-2xl text-white">MeDan</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.34em] text-gold-400">
              Student Stays
            </p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              Student accommodation for Ghanaian campuses. Your payment is held
              in escrow and released to the hostel only after you check in.
            </p>
            <p className="mt-4 text-sm">
              Need help with anything? Call{" "}
              <a
                href="tel:0533688612"
                className="font-semibold text-gold-300 hover:text-gold-200"
              >
                0533688612
              </a>
              {", "}
              <a
                href="tel:0557732115"
                className="font-semibold text-gold-300 hover:text-gold-200"
              >
                0557732115
              </a>{" "}
              or{" "}
              <a
                href="tel:0552859150"
                className="font-semibold text-gold-300 hover:text-gold-200"
              >
                0552859150
              </a>
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition hover:text-gold-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MeDan. All rights reserved.</p>
          <p className="text-white/40">
            Pay by MoMo transfer · Held in escrow until check-in
          </p>
        </div>
      </div>
    </footer>
  );
}
