"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { cedis, shortDate } from "@/lib/format";
import type {
  BookingResponse,
  ManualPaymentInstructions,
  PaymentResponse,
} from "@/lib/types";

/** Screenshot constraints mirrored from the API (JPG/PNG/WEBP, 5 MB). */
const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

/** Support group where students can also share their payment screenshot. */
const WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/DyNYgfb4xFtKFKCV4gTgPP?mode=gi_t";

/** Support lines for anything that goes wrong along the way. */
const SUPPORT_PHONES = ["0533688612", "0557732115", "0552859150"];

const FIELD =
  "w-full rounded-lg border border-ink-100 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

/**
 * Payment for a pending booking — manual MoMo transfer only.
 *
 * The student sends Mobile Money to the platform wallet themselves and
 * uploads the transfer screenshot. Nothing settles until staff review it,
 * so after submission the panel shows a "we're confirming" state instead
 * of the pay form; a rejection shows the staff note and lets them retry.
 *
 * (The in-app Paystack flow was removed on request — bring it back from
 * git history once a live key is configured.)
 */
export function PayPanel({
  booking,
  token,
}: {
  booking: BookingResponse;
  token: string;
}) {
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  // Distinguishes "you just submitted" from "this was already pending when
  // you opened the page", so the success note only shows once.
  const [justSubmitted, setJustSubmitted] = useState(false);

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
        }
      } catch {
        // 404 — no payment yet. Anything else surfaces when they try to pay.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, booking.id]);

  // Proof already with staff: no pay form, just where things stand.
  if (payment?.status === "pendingReview") {
    return (
      <section className="mt-5 card p-5">
        {justSubmitted && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
            ✓ Payment proof uploaded successfully.
          </p>
        )}
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
        <WhatsAppJoin note="Questions about your payment? Our staff are in the group." />
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

      <ManualPayForm
        booking={booking}
        token={token}
        onSubmitted={(p) => {
          setPayment(p);
          setJustSubmitted(true);
        }}
      />
    </section>
  );
}

/**
 * Show the platform wallet, collect the transfer screenshot (plus the
 * receipt's transaction ID and sender number), and park it for staff review.
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
          // A 503 means the wallet isn't configured server-side.
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
    if (
      !confirm(
        `Submit this screenshot as proof of your ${cedis(info?.amount ?? booking.amount)} transfer? Our staff will review and confirm it.`,
      )
    )
      return;
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

      <WhatsAppJoin note="After booking you can also share your screenshot there — our staff will approve it." />

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

/** Link into the support WhatsApp group, with a line of context. */
function WhatsAppJoin({ note }: { note: string }) {
  return (
    <div className="mt-4">
      <a
        href={WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="tap flex items-center justify-center gap-2 rounded-lg border border-green-600/40 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100"
      >
        {/* WhatsApp glyph, inline so no icon dependency is needed. */}
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path d="M12 2a10 10 0 0 0-8.65 15.02L2.2 21.1a.75.75 0 0 0 .93.93l4.1-1.14A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.24 15.22.9.9 0 0 0-.71-.09l-2.6.72.73-2.56a.9.9 0 0 0-.1-.72A8.2 8.2 0 0 1 12 3.8Zm-2.9 4.1c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.42 1.03 2.59.12.17 1.74 2.78 4.3 3.78 2.13.84 2.56.67 3.03.63.46-.04 1.5-.61 1.71-1.2.21-.6.21-1.1.15-1.21-.06-.1-.23-.17-.48-.29s-1.5-.74-1.73-.82c-.23-.08-.4-.13-.57.12-.17.25-.65.82-.8.99-.14.17-.29.19-.54.06a6.8 6.8 0 0 1-2-1.23 7.5 7.5 0 0 1-1.39-1.72c-.14-.25-.01-.39.11-.51.12-.12.26-.3.38-.44.13-.15.17-.25.25-.42.09-.17.05-.32-.02-.44-.06-.13-.55-1.37-.77-1.87-.2-.49-.4-.42-.56-.43h-.55Z" />
        </svg>
        Join our WhatsApp group
      </a>
      <p className="mt-1.5 text-center text-xs text-ink-500">{note}</p>
      <p className="mt-1 text-center text-xs text-ink-500">
        Or call us if anything comes up:{" "}
        {SUPPORT_PHONES.map((phone, i) => (
          <span key={phone}>
            {i > 0 && " · "}
            <a
              href={`tel:${phone}`}
              className="font-semibold text-brand-700 hover:underline"
            >
              {phone}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}
