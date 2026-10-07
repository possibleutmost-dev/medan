"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError, photoUrl } from "@/lib/api";
import { useSession } from "@/lib/session";
import { cedis, shortDate } from "@/lib/format";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { SafeImage } from "@/components/safe-image";
import { stockRoomImage } from "@/lib/stock";
import type { BookingResponse } from "@/lib/types";

export default function BookingsPage() {
  const router = useRouter();
  const { token, loading: sessionLoading } = useSession();
  const [bookings, setBookings] = useState<BookingResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !token) router.replace("/login?next=/bookings");
  }, [sessionLoading, token, router]);

  useEffect(() => {
    if (!token) return;
    api
      .myBookings(token)
      .then(setBookings)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't load your bookings.",
        ),
      );
  }, [token]);

  if (sessionLoading || !token) {
    return <p className="p-12 text-center text-ink-500">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">My bookings</h1>

      {error && (
        <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {bookings === null && !error && (
        <p className="mt-6 text-ink-500">Loading…</p>
      )}

      {bookings?.length === 0 && (
        <div className="mt-6 card p-10 text-center">
          <p className="font-medium">You haven&apos;t booked anything yet</p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Browse hostels
          </Link>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {bookings?.map((b) => {
          const cover = photoUrl(b.hostelPhotoUrl);
          return (
            <li key={b.id}>
              <Link
                href={`/bookings/${b.id}`}
                className="flex gap-4 card p-4 transition hover:border-brand-200 hover:shadow"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-50 sm:h-20 sm:w-20">
                  <SafeImage
                    src={cover ?? stockRoomImage(b.hostelId)}
                    fallback={stockRoomImage(b.hostelId)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                    <p className="font-semibold">{b.hostelName}</p>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-ink-500">
                    {b.roomLabel} · bed {b.bedLabel} · {b.academicYear}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="font-semibold text-brand-700">
                      {cedis(b.amount)}
                    </span>{" "}
                    <span className="text-ink-300">
                      booked {shortDate(b.createdAt)}
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
