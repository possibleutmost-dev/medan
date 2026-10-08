"use client";

import { useState } from "react";
import { HostelPlaceholder } from "./graphics";

/**
 * An <img> that hides itself when its source fails to load.
 *
 * Callers layer it over a designed backdrop (the hero gradients), so a dead
 * URL degrades to that backdrop instead of the browser's broken-image icon.
 */
export function SafeImage({
  src,
  alt,
  className,
  loading,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  // Photos come from the API origin and arbitrary CDNs; next/image would need
  // each domain configured, and the onError handling is the point here.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * A listing or room photo. When the listing has no photo — or its URL is dead —
 * this shows the generated building graphic for that listing instead of a
 * stock photograph: showing a student a room that isn't the one they're
 * booking is misleading.
 */
export function ListingPhoto({
  src,
  seed,
  alt,
  className,
  loading,
}: {
  src?: string | null;
  /** Keys the placeholder graphic, so a listing always gets the same building. */
  seed: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <HostelPlaceholder seed={seed} className="h-full w-full" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
