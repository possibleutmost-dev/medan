"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/session";

/**
 * Centred wordmark with navigation split either side of it — the hotel-site
 * convention, and the reason the brand reads as the anchor of the page rather
 * than a logo parked in a corner.
 *
 * On the home page the header floats over the dark hero; everywhere else it
 * sits on white, because the sub-page banners are shorter and a transparent
 * bar would collide with their titles.
 */
export function SiteHeader() {
  const { user, loading, signOut } = useSession();
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [open, setOpen] = useState(false);

  // One stray tap shouldn't end the session — confirm first.
  function confirmSignOut() {
    if (confirm("Sign out of your MeDan account?")) {
      signOut();
      setOpen(false);
    }
  }

  const link = `text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
    overHero ? "text-white/75 hover:text-gold-300" : "text-ink-700 hover:text-gold-600"
  }`;

  return (
    <header
      className={
        overHero
          ? "absolute inset-x-0 top-0 z-30"
          : "sticky top-0 z-30 border-b border-ink-100 bg-surface"
      }
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-5 sm:grid sm:grid-cols-[1fr_auto_1fr]">
          {/* Left nav */}
          <nav className="hidden items-center gap-7 sm:flex">
            <Link href="/" className={link}>
              Browse
            </Link>
            {user && (
              <Link href="/bookings" className={link}>
                My bookings
              </Link>
            )}
          </nav>

          {/* Wordmark */}
          <Link href="/" className="text-center">
            <span
              className={`display block text-2xl leading-none ${
                overHero ? "text-white" : "text-ink-900"
              }`}
            >
              MeDan
            </span>
            <span
              className={`mt-1 block text-[9px] font-semibold uppercase tracking-[0.34em] ${
                overHero ? "text-gold-300" : "text-gold-600"
              }`}
            >
              Student Stays
            </span>
          </Link>

          {/* Right nav */}
          <div className="hidden items-center justify-end gap-7 sm:flex">
            {loading ? (
              <span className="h-4 w-20 shimmer" />
            ) : user ? (
              <button onClick={confirmSignOut} className={link}>
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className={`px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  overHero
                    ? "bg-white text-ink-900 hover:bg-gold-100"
                    : "bg-ink-900 text-white hover:bg-gold-600"
                }`}
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className={`sm:hidden ${overHero ? "text-white" : "text-ink-900"}`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 border-t border-ink-100/20 pb-4 pt-3 sm:hidden">
            <Link href="/" onClick={() => setOpen(false)} className={`${link} py-2`}>
              Browse
            </Link>
            {user ? (
              <>
                <Link href="/bookings" onClick={() => setOpen(false)} className={`${link} py-2`}>
                  My bookings
                </Link>
                <button onClick={confirmSignOut} className={`${link} py-2 text-left`}>
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className={`${link} py-2`}>
                Sign in
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
