"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { cedis, currentAcademicYear } from "@/lib/format";
import { ROOM_TYPE_LABELS, type HostelDetail, type RoomSummary } from "@/lib/types";

/**
 * Reserve a bed. Creating the booking holds the bed in `pending` — payment is
 * a separate step, which is why this page hands off to /bookings/[id] rather
 * than trying to do both at once.
 */
export default function BookPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const hostelId = search.get("hostel");
  const { token, user, loading: sessionLoading } = useSession();

  const [hostel, setHostel] = useState<HostelDetail | null>(null);
  const [room, setRoom] = useState<RoomSummary | null>(null);
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bounce to sign-in, remembering where we were.
  useEffect(() => {
    if (!sessionLoading && !token) {
      router.replace(
        `/login?next=${encodeURIComponent(`/book/${roomId}?hostel=${hostelId ?? ""}`)}`,
      );
    }
  }, [sessionLoading, token, router, roomId, hostelId]);

  useEffect(() => {
    if (!hostelId) return;
    api
      .getHostel(hostelId)
      .then((h) => {
        setHostel(h);
        setRoom(h.rooms.find((r) => r.id === roomId) ?? null);
      })
      .catch(() => setError("Couldn't load this room. Go back and try again."));
  }, [hostelId, roomId]);

  async function reserve() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const booking = await api.createBooking(token, {
        roomId,
        academicYear: academicYear.trim(),
      });
      // `new=1` makes the booking page greet them with a success banner.
      router.push(`/bookings/${booking.id}?new=1`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't reserve that bed. It may have just been taken.",
      );
      setBusy(false);
    }
  }

  if (sessionLoading || !token) {
    return <p className="p-12 text-center text-ink-500">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {hostelId && (
        <Link
          href={`/hostels/${hostelId}`}
          className="text-sm text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline"
        >
          ← Back to {hostel?.name ?? "the hostel"}
        </Link>
      )}

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Reserve a bed</h1>

      {/* Occupancy on the ground can move faster than the listing. */}
      <div className="mt-5 rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm">
        <p className="font-semibold text-ink-900">Please call before you book</p>
        <p className="mt-1 text-ink-700">
          Confirm the bed is still available by phoning us on{" "}
          <a
            href="tel:0533688612"
            className="font-semibold text-gold-600 hover:text-gold-700"
          >
            0533688612
          </a>{" "}
          before you pay.
        </p>
      </div>

      <div className="mt-5 card p-5">
        {room ? (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Hostel</dt>
              <dd className="text-right font-medium">{hostel?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Room</dt>
              <dd className="text-right font-medium">
                {room.label} ·{" "}
                {ROOM_TYPE_LABELS[room.type] ?? room.type}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Beds free</dt>
              <dd className="text-right font-medium">{room.availableBeds}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-ink-100 pt-3">
              <dt className="text-ink-500">Price</dt>
              <dd className="text-right text-lg font-bold text-brand-700">
                {cedis(room.pricePerSemester)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-ink-500">Loading room details…</p>
        )}

        <div className="mt-5">
          <label
            htmlFor="year"
            className="mb-1 block text-sm font-medium text-ink-700"
          >
            Academic year
          </label>
          <input
            id="year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-full rounded-lg border border-ink-100 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          onClick={reserve}
          disabled={busy || !room}
          className="tap mt-5 w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Reserving…" : "Reserve this bed"}
        </button>

        <p className="mt-3 text-xs text-ink-500">
          Reserving holds the bed for you. You pay on the next screen, and the
          money is held in escrow until you check in.
          {user?.name ? ` Booking as ${user.name}.` : ""}
        </p>
      </div>
    </div>
  );
}
