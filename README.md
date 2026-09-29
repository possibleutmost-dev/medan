# MeDan Web

Web client for the **MeDan** student hostel platform — the browser counterpart
to the Flutter app, talking to the same ASP.NET Core API in
[`APPP/apis-main`](../APPP/apis-main).

Students browse hostels near their campus, reserve a specific bed, and pay by
Mobile Money or card. Payment is held in **escrow** and released to the hostel
only after check-in.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS. No database of its own —
the .NET API owns all state.

## Running

```bash
npm install
cp .env.example .env.local     # optional; defaults to the deployed API
npm run dev                    # http://localhost:3000
```

`npm run build` · `npm run lint`

## How it talks to the API

`src/lib/api.ts` is the only place that knows about HTTP. `src/lib/types.ts`
mirrors the C# DTOs in `apis-main/Dtos/`; nothing generates those types, so
when a DTO changes there it must change here too — drift is silent until a
page renders `undefined`.

**Auth is the API's own JWT**, issued by `POST /api/auth/login`. The backend
README still describes Firebase; that is out of date — `AuthController` does
email + password with a 6-digit email verification code. Register and login
both return `200` with `{requiresVerification: true}` when the address is
unverified, so the UI branches on the response *shape*, not the status code.

Public reads (hostel list and detail) are server-rendered so listings appear in
the first paint and are crawlable. Everything behind auth is a client component
holding the token.

## Booking flow

```
POST /api/bookings              reserve a bed        → pending
POST /api/payments/initialize   start Paystack       → reference (+ checkoutUrl)
POST /api/payments/{ref}/submit-otp   Mobile Money code, when required
POST /api/payments/{ref}/verify       settle          → paymentHeld
      (hostel scans the check-in code on arrival)     → checkedIn → completed
```

Three payment outcomes all need handling, and the panel covers each: a
`checkoutUrl` (card — redirect to Paystack), `requiresOtp` (Mobile Money is
held pending the customer's code; the API is explicit that **polling alone
never resolves it**), and `simulated` (no Paystack key configured, dev only).

## Known gaps

- **Owner/manager side.** This is the student journey only — no listing
  management, check-in desk, or company dashboard. The API supports all of it.
- **Reviews, favourites and referrals** have endpoints but no UI yet.
- **Map view.** Hostels carry lat/lng and the API returns `distanceKm`, but
  nothing is plotted; note most seeded listings currently have `lat/lng = 0`.
- **No automated tests.** The pages were verified by hand against the live API.
