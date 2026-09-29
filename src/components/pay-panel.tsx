"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { cedis } from "@/lib/format";
import type {
  BookingResponse,
  PaymentChannel,
  PaymentResponse,
} from "@/lib/types";

const CHANNELS: { value: PaymentChannel; label: string; needsPhone: boolean }[] =
  [
    { value: "momoMtn", label: "MTN Mobile Money", needsPhone: true },
    { value: "momoTelecel", label: "Telecel Cash", needsPhone: true },
    { value: "card", label: "Card", needsPhone: false },
  ];

/**
 * Paystack payment for a pending booking.
 *
 * Three outcomes the API can hand back, and all three need handling:
 *  - `checkoutUrl` — card payments; send the browser to Paystack.
 *  - `requiresOtp` — Mobile Money held pending the customer's code. The API
 *    is explicit that polling will never resolve this; the code must be
 *    submitted to /submit-otp.
 *  - `simulated` — no Paystack key configured (dev). Already succeeded.
 */
export function PayPanel({
  booking,
  token,
  onPaid,
}: {
  booking: BookingResponse;
  token: string;
  onPaid: (booking: BookingResponse) => void;
}) {
  const [channel, setChannel] = useState<PaymentChannel>("momoMtn");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsPhone = CHANNELS.find((c) => c.value === channel)?.needsPhone;

  async function refreshBooking() {
    onPaid(await api.getBooking(token, booking.id));
  }

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.initializePayment(token, {
        bookingId: booking.id,
        channel,
        phone: needsPhone ? phone.trim() || undefined : undefined,
      });
      setPayment(result);

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      // Simulation mode settles immediately; OTP charges wait for the code.
      if (!result.requiresOtp) await verify(result.reference);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't start the payment.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verify(reference: string) {
    setBusy(true);
    setError(null);
    try {
      const result = await api.verifyPayment(token, reference);
      setPayment(result);
      if (result.bookingStatus === "paymentHeld") await refreshBooking();
      else setError("Payment hasn't settled yet. Try verifying again shortly.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't verify the payment.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp() {
    if (!payment) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.submitOtp(token, payment.reference, otp.trim());
      setPayment(result);
      if (result.bookingStatus === "paymentHeld") await refreshBooking();
      else await verify(result.reference);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "That code wasn't accepted.",
      );
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-ink-100 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

  return (
    <section className="mt-5 card p-5">
      <h2 className="font-semibold">Pay {cedis(booking.amount)}</h2>
      <p className="mt-1 text-sm text-ink-700">
        Held in escrow and released to the hostel only after you check in.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {payment?.requiresOtp ? (
        <div className="mt-4 space-y-3">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {payment.displayText ??
              "Approve the charge on your phone, then enter the code you were sent."}
          </p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter the code"
            inputMode="numeric"
            className={field}
          />
          <button
            onClick={sendOtp}
            disabled={busy || !otp.trim()}
            className="tap w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit code"}
          </button>
          <button
            onClick={() => verify(payment.reference)}
            disabled={busy}
            className="w-full text-sm text-ink-500 hover:text-ink-900 hover:underline"
          >
            Already approved? Check payment status
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c.value}
                onClick={() => setChannel(c.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  channel === c.value
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-ink-100 text-ink-700 hover:bg-ink-50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {needsPhone && (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mobile Money number (e.g. 0241234567)"
              inputMode="tel"
              className={field}
            />
          )}

          <button
            onClick={start}
            disabled={busy}
            className="tap w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? "Starting payment…" : `Pay ${cedis(booking.amount)}`}
          </button>

          {payment?.simulated && (
            <p className="text-xs text-ink-500">
              Simulation mode — the API has no Paystack key configured, so no
              real money moved.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
