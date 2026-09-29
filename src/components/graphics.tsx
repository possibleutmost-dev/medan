/**
 * Inline SVG graphics.
 *
 * Deliberately inline rather than image files: they inherit `currentColor`,
 * scale without a second request, and can't 404 on a slow Ghanaian connection
 * the way a hosted asset can.
 */

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "search"
    | "shield"
    | "bed"
    | "pin"
    | "check"
    | "spark"
    | "wallet"
    | "key";
  className?: string;
}) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    shield: <path d="M12 3l7 3v6c0 4.4-3 8.2-7 9-4-.8-7-4.6-7-9V6l7-3Z" />,
    bed: (
      <>
        <path d="M3 18v-9" />
        <path d="M3 13h18v5" />
        <path d="M21 18v-4a3 3 0 0 0-3-3h-7v2" />
        <circle cx="7" cy="11" r="2" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    check: <path d="m5 13 4 4L19 7" />,
    spark: (
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
    ),
    wallet: (
      <>
        <path d="M3 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
        <path d="M16 12h5v3h-5a1.5 1.5 0 0 1 0-3Z" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="12" r="4" />
        <path d="M12 12h9l-2 2.5M17 12v3" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

/**
 * Stands in for a hostel photo when a listing has none — which is most of them
 * today. A generated building keyed to the hostel's name looks deliberate and
 * stays stable per listing, where a grey box reads as a broken image.
 */
export function HostelPlaceholder({
  seed,
  className = "",
}: {
  seed: string;
  className?: string;
}) {
  // Cheap deterministic hash → the same hostel always gets the same building.
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const abs = Math.abs(hash);
  const hue = 150 + (abs % 40); // teal→green band, stays on-brand
  const floors = 3 + (abs % 3);
  const windowsPerFloor = 3 + ((abs >> 3) % 2);

  return (
    <div
      className={`relative flex items-end justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(170deg, hsl(${hue} 42% 94%), hsl(${hue} 34% 86%))`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 80" className="h-full w-full" preserveAspectRatio="xMidYMax meet">
        {/* horizon */}
        <rect y="66" width="120" height="14" fill={`hsl(${hue} 28% 78%)`} />
        {/* building */}
        <rect
          x="34"
          y={66 - floors * 11}
          width="52"
          height={floors * 11}
          rx="2"
          fill={`hsl(${hue} 30% 62%)`}
        />
        {/* roof band */}
        <rect
          x="31"
          y={66 - floors * 11 - 4}
          width="58"
          height="5"
          rx="1.5"
          fill={`hsl(${hue} 34% 52%)`}
        />
        {/* windows */}
        {Array.from({ length: floors }).map((_, f) =>
          Array.from({ length: windowsPerFloor }).map((__, w) => (
            <rect
              key={`${f}-${w}`}
              x={42 + w * (36 / windowsPerFloor)}
              y={66 - (f + 1) * 11 + 3}
              width="8"
              height="6"
              rx="1"
              fill={
                (f + w) % 3 === 0
                  ? `hsl(45 85% 74%)` // a few lit windows
                  : `hsl(${hue} 38% 82%)`
              }
            />
          )),
        )}
        {/* door */}
        <rect x="55" y="57" width="10" height="9" rx="1" fill={`hsl(${hue} 38% 44%)`} />
      </svg>
    </div>
  );
}

/** Shown when a search returns nothing. */
export function EmptyIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true" fill="none">
      <ellipse cx="80" cy="104" rx="52" ry="7" fill="var(--ink-100)" />
      <rect x="44" y="40" width="72" height="56" rx="6" fill="var(--ink-50)" stroke="var(--ink-100)" strokeWidth="2" />
      <rect x="56" y="54" width="20" height="14" rx="2" fill="var(--brand-100)" />
      <rect x="84" y="54" width="20" height="14" rx="2" fill="var(--ink-100)" />
      <rect x="56" y="76" width="20" height="14" rx="2" fill="var(--ink-100)" />
      <rect x="84" y="76" width="20" height="14" rx="2" fill="var(--brand-100)" />
      <circle cx="104" cy="36" r="20" fill="var(--surface)" stroke="var(--brand-400)" strokeWidth="3" />
      <path d="m118 50 10 10" stroke="var(--brand-400)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Circular rotating wordmark, as in the reference layout.
 *
 * Text is laid on an SVG path so it curves properly rather than being faked
 * with per-letter rotation. Purely decorative, so it is hidden from
 * assistive tech and stops animating under prefers-reduced-motion.
 */
export function CircularBadge({
  text = "MEDAN · STUDENT STAYS · GHANA · ",
  className = "h-36 w-36",
}: {
  text?: string;
  className?: string;
}) {
  const id = "circular-badge-path";
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full [animation:spin-slow_28s_linear_infinite]"
      >
        <defs>
          <path
            id={id}
            d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
            fill="none"
          />
        </defs>
        <text
          className="fill-gold-600"
          style={{
            fontSize: "11px",
            letterSpacing: "0.22em",
            fontWeight: 600,
          }}
        >
          <textPath href={`#${id}`}>{text.repeat(2)}</textPath>
        </text>
      </svg>
    </div>
  );
}

/** Eyebrow + serif heading + optional gold rule, the section opener. */
export function SectionHeading({
  eyebrow,
  title,
  align = "left",
  children,
}: {
  eyebrow?: string;
  title: string;
  align?: "left" | "center";
  children?: React.ReactNode;
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "text-center" : ""}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <span className={`rule mt-4 ${centered ? "mx-auto" : ""}`} />
      <h2 className="display-lg mt-4">{title}</h2>
      {children && (
        <div
          className={`mt-3 text-sm leading-relaxed text-ink-500 ${
            centered ? "mx-auto max-w-md" : "max-w-prose"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
