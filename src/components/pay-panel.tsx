"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { cedis, shortDate } from "@/lib/format";
import type {
  BookingResponse,
  ManualPaymentInstructions,
  PaymentChannel,
  PaymentResponse,
} from "@/lib/types";

const CHANNELS: { value: PaymentChannel; label: string; needsPhone: boolean }[] =
  [
    { value: "momoMtn", label: "MTN Mobile Money", needsPhone: true },
    { value: "momoTelecel", label: "Telecel Cash", needsPhone: true },
    { value: "card", label: "Card", needsPhone: false },
  ];

/** Screenshot constraints mirrored from the API (JPG/PNG/WEBP, 5 MB). */
const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

const FIELD =
  "w-full rounded-lg border border-ink-100 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

/**
 * Payment for a pending booking, two routes:
 *
 *  - **Paystack** — charge in the app (MoMo prompt / OTP / card checkout).
 *  - **Manual MoMo** — the student sends to the platform wallet themselves and
 *    uploads the transfer screenshot. Nothing settles until staff review it,
 *    so after submission the panel shows a "we're confirming" state instead
 *    of the pay form; a rejection shows the staff note and lets them retry.
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
  const [method, setMethod] = useState<"paystack" | "manual">("paystack");
  const [channel, setChannel] = useState<PaymentChannel>("momoMtn");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A proof may already be with staff from an earlier visit — the booking is
  // still "pending" then, so the panel renders. Look the payment up rather
  // than show a pay form that would be refused with a 409.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const existing = await api.paymentForBooking(token, booking.id);
        if (cancelled) return;
        if (
          existing.status === "pendingReview" ||
          existing.status === "rejected"
        ) {
          setPayment(existing);
          if (existing.status === "rejected") setMethod("manual");
        }
      } catch {
        // 404 — no payment yet. Anything else surfaces when they try to pay.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, booking.id]);

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

  // Proof already with staff: no pay form, just where things stand.
  if (payment?.status === "pendingReview") {
    return (
      <section className="mt-5 card p-5">
        <h2 className="font-semibold">We&apos;re confirming your transfer</h2>
        <p className="mt-1 text-sm text-ink-700">
          Your payment proof of {cedis(payment.amount)} is with our team. Your
          bed stays held while we confirm — usually within a few hours.
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          {payment.providerTransactionId && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Transaction ID</dt>
              <dd className="font-mono">{payment.providerTransactionId}</dd>
            </div>
          )}
          {payment.senderPhone && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Sent from</dt>
              <dd>{payment.senderPhone}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-ink-500">Submitted</dt>
            <dd>{shortDate(payment.submittedAt)}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section className="mt-5 card p-5">
      <h2 className="font-semibold">Pay {cedis(booking.amount)}</h2>
      <p className="mt-1 text-sm text-ink-700">
        Held in escrow and released to the hostel only after you check in.
      </p>

      {payment?.status === "rejected" && payment.reviewNote && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Your previous proof wasn&apos;t accepted: {payment.reviewNote} You
          can submit a new screenshot below.
        </p>
      )}

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
            className={FIELD}
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
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-ink-50 p-1 text-sm font-medium">
            {(
              [
                ["paystack", "Pay in app"],
                ["manual", "Send MoMo manually"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setMethod(value);
                  setError(null);
                }}
                className={`rounded-lg px-3 py-2 ${
                  method === value
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {method === "paystack" ? (
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
                  className={FIELD}
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
                  Simulation mode — the API has no Paystack key configured, so
                  no real money moved.
                </p>
              )}
            </div>
          ) : (
            <ManualPayForm
              booking={booking}
              token={token}
              onSubmitted={setPayment}
            />
          )}
        </>
      )}
    </section>
  );
}

/**
 * The manual route: show the platform wallet, collect the transfer screenshot
 * (plus the receipt's transaction ID and sender number), and park it for
 * staff review.
 */
function ManualPayForm({
  booking,
  token,
  onSubmitted,
}: {
  booking: BookingResponse;
  token: string;
  onSubmitted: (payment: PaymentResponse) => void;
}) {
  const [info, setInfo] = useState<ManualPaymentInstructions | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await api.manualPaymentInstructions(token, booking.id);
        if (!cancelled) setInfo(result);
      } catch (err) {
        if (!cancelled) {
          // A 503 means the wallet isn't configured — steer back to in-app.
          setInfoError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load the payment details. Try again shortly.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, booking.id]);

  // Object URLs leak until revoked: release each one when it is replaced,
  // and the last one on unmount.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pickFile(file: File | undefined) {
    setError(null);
    if (!file) {
      setProof(null);
      setPreview(null);
      return;
    }
    if (!PROOF_TYPES.includes(file.type)) {
      setError("The screenshot must be a JPG, PNG or WEBP image.");
      setProof(null);
      setPreview(null);
      return;
    }
    if (file.size > PROOF_MAX_BYTES) {
      setError("That image is over 5 MB. Crop or re-save it and try again.");
      setProof(null);
      setPreview(null);
      return;
    }
    setProof(file);
    setPreview(URL.createObjectURL(file));
  }

  async function copyWallet() {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.walletNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the number is on screen regardless.
    }
  }

  async function submit() {
    if (!proof) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.submitManualPayment(token, {
        bookingId: booking.id,
        proof,
        transactionId: transactionId.trim() || undefined,
        senderPhone: senderPhone.trim() || undefined,
      });
      onSubmitted(result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't submit your proof. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (infoError) {
    return (
      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {infoError}
      </p>
    );
  }

  if (!info) {
    return <p className="mt-4 text-sm text-ink-500">Loading payment details…</p>;
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
        <p className="text-sm text-brand-900">
          Send <span className="font-semibold">{cedis(info.amount)}</span> to
          this {info.walletType}:
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-mono text-xl font-bold tracking-wide text-brand-700">
            {info.walletNumber}
          </p>
          <button
            onClick={copyWallet}
            className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mt-1 text-sm font-medium text-brand-900">
          {info.walletName}
        </p>
        {info.instructions && (
          <p className="mt-3 text-xs text-brand-900/80">{info.instructions}</p>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label
          className="mb-1 block text-sm font-medium text-ink-700"
          htmlFor="proof"
        >
          Transaction screenshot
        </label>
        <input
          id="proof"
          type="file"
          accept={PROOF_TYPES.join(",")}
          onChange={(e) => pickFile(e.target.files?.[0])}
          className="w-full text-sm text-ink-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
        <p className="mt-1 text-xs text-ink-500">
          JPG, PNG or WEBP, up to 5 MB. Make sure the amount and transaction ID
          are readable.
        </p>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview; next/image can't optimize a blob
          <img
            src={preview}
            alt="Your transaction screenshot"
            className="mt-3 max-h-64 rounded-lg border border-ink-100 object-contain"
          />
        )}
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-ink-700"
          htmlFor="txnId"
        >
          Transaction ID{" "}
          <span className="text-ink-300">(from your MoMo receipt)</span>
        </label>
        <input
          id="txnId"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="e.g. 8012345678"
          className={FIELD}
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-ink-700"
          htmlFor="senderPhone"
        >
          Number you sent from{" "}
          <span className="text-ink-300">(optional)</span>
        </label>
        <input
          id="senderPhone"
          value={senderPhone}
          onChange={(e) => setSenderPhone(e.target.value)}
          placeholder="e.g. 0241234567"
          inputMode="tel"
          className={FIELD}
        />
      </div>

      <button
        onClick={submit}
        disabled={busy || !proof}
        className="tap w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? "Uploading…" : "I've sent it — submit proof"}
      </button>
      <p className="text-center text-xs text-ink-500">
        We confirm transfers within a few hours. Your bed stays held while we
        do.
      </p>
    </div>
  );
}
