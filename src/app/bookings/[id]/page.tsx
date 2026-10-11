"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { cedis, shortDate } from "@/lib/format";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PayPanel } from "@/components/pay-panel";
import type { BookingResponse } from "@/lib/types";

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense
      fallback={<p className="p-12 text-center text-ink-500">Loading…</p>}
    >
      <BookingDetail id={id} />
    </Suspense>
  );
}

/**
 * Counts down an unpaid hold. Seeded from the API's secondsLeft rather than
 * computed from expiresAt, so a phone with a wrong clock still shows the
 * right figure.
 */
function HoldCountdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const timer = setInterval(
      () => setLeft((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  if (left <= 0) {
    return (
      <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Your hold has run out, so the bed may have been released to another
        student. Refresh to check — if the booking was cancelled, you can
        reserve again from the hostel page.
      </p>
    );
  }

  const m = Math.floor(left / 60);
  const s = String(left % 60).padStart(2, "0");
  return (
    <p className="mt-5 rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-ink-700">
      ⏳ This bed is held for you for{" "}
      <span className="font-mono font-bold text-ink-900">
        {m}:{s}
      </span>{" "}
      — complete the payment before the timer runs out or it goes back on the
      market.
    </p>
  );
}

function BookingDetail({ id }: { id: string }) {
  const router = useRouter();
  const search = useSearchParams();
  // Set by the reserve flow so the first thing seen is "it worked".
  const justCreated = search.get("new") === "1";
  const { token, loading: sessionLoading } = useSession();

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !token) {
      router.replace(`/login?next=${encodeURIComponent(`/bookings/${id}`)}`);
    }
  }, [sessionLoading, token, router, id]);

  // Fetched inside the effect with a cancellation flag so a booking that
  // resolves after the student has navigated away doesn't set state on an
  // unmounted page.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await api.getBooking(token, id);
        if (!cancelled) setBooking(result);
      } catch (err) {
        if (!cancelled) {
          // 403/404: this booking belongs to another account (a stale link,
          // or a different student signed in on this device). Nothing here
          // for them — send them to browse instead of a dead error page.
          if (
            err instanceof ApiError &&
            (err.status === 403 || err.status === 404)
          ) {
            router.replace("/");
            return;
          }
          setError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load this booking.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, id, router]);

  async function cancel() {
    if (!token || !booking) return;
    setCancelling(true);
    try {
      setBooking(await api.cancelBooking(token, booking.id));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't cancel the booking.",
      );
    } finally {
      setCancelling(false);
    }
  }

  if (sessionLoading || !token) {
    return <p className="p-12 text-center text-ink-500">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/bookings"
        className="text-sm text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline"
      >
        ← All bookings
      </Link>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!booking ? (
        <p className="mt-6 text-ink-500">Loading…</p>
      ) : (
        <>
          {justCreated && booking.status === "pending" && (
            <p className="mt-4 rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
              🎉 Your bed is reserved! Complete the payment below to secure
              it.
            </p>
          )}

          <header className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {booking.hostelName}
              </h1>
              <p className="mt-1 text-ink-700">
                {booking.roomLabel} · bed {booking.bedLabel} ·{" "}
                {booking.academicYear}
              </p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </header>

          <section className="mt-6 card p-5">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Amount</dt>
                <dd className="font-semibold text-brand-700">
                  {cedis(booking.amount)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Booked</dt>
                <dd>{shortDate(booking.createdAt)}</dd>
              </div>
              {booking.paidAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">Paid</dt>
                  <dd>{shortDate(booking.paidAt)}</dd>
                </div>
              )}
              {booking.checkedInAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-500">Checked in</dt>
                  <dd>{shortDate(booking.checkedInAt)}</dd>
                </div>
              )}
            </dl>

            {/* The check-in code is what the hostel scans on arrival, so it
                only exists once the money is actually held. */}
            {booking.checkInCode && booking.status === "paymentHeld" && (
              <div className="mt-5 rounded-xl bg-brand-50 p-4 text-center">
                <p className="text-sm text-brand-900">
                  Show this code at the hostel when you arrive
                </p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-brand-700">
                  {booking.checkInCode}
                </p>
              </div>
            )}
          </section>

          {booking.status === "pending" && booking.secondsLeft !== null && (
            <HoldCountdown seconds={booking.secondsLeft} />
          )}

          {booking.status === "pending" && (
            <PayPanel booking={booking} token={token} />
          )}

          {booking.status === "paymentHeld" && (
            <p className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
              Your payment is held in escrow. It is released to the hostel only
              after you check in, so you are covered if the room isn&apos;t as
              advertised.
            </p>
          )}

          {(booking.status === "pending" ||
            booking.status === "paymentHeld") && (
            <button
              onClick={() => setConfirmingCancel(true)}
              disabled={cancelling}
              className="mt-5 w-full rounded-lg border border-ink-300 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-60"
            >
              {cancelling ? "Cancelling…" : "Cancel booking"}
            </button>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel this booking?"
        message="Your bed will be released for someone else to take. This can't be undone."
        confirmLabel="Cancel booking"
        cancelLabel="Keep my bed"
        danger
        onConfirm={() => {
          setConfirmingCancel(false);
          void cancel();
        }}
        onClose={() => setConfirmingCancel(false)}
      />
    </div>
  );
}
