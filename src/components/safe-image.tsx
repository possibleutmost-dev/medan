"use client";

import { useState } from "react";

/**
 * An <img> that swaps to a fallback when its source fails to load.
 *
 * Listing photos live on the API server's own disk, which Render's free tier
 * wipes on every deploy — the database keeps the URL while the file is gone,
 * and a broken-image icon sells nothing. Until storage moves somewhere
 * durable, dead photos degrade to the committed stock shots instead.
 */
export function SafeImage({
  src,
  fallback,
  alt,
  className,
  loading,
}: {
  src: string;
  /** Shown when `src` 404s or fails to decode. */
  fallback?: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  const resolved = failed && fallback ? fallback : src;

  // Photos come from the API origin and arbitrary CDNs; next/image would need
  // each domain configured, and the onError fallback is the point here.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
