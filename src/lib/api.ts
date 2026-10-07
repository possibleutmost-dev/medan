/**
 * Client for the MeDan API (ASP.NET Core, `apis-main/`).
 *
 * Auth is the API's own JWT from `/api/auth/login` — not Firebase, despite what
 * the backend README still says. The token goes in `Authorization: Bearer`.
 *
 * The API sets `AllowAnyOrigin`, so the browser can call it directly; public
 * reads are also done from server components for faster first paint.
 */

import type {
  AuthResult,
  BookingResponse,
  HostelDetail,
  HostelQuery,
  HostelSummary,
  ManualPaymentInstructions,
  PaymentChannel,
  PaymentResponse,
  RoommateResponse,
  StudentInfo,
  UserResponse,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_MEDAN_API ?? "https://apis-jphj.onrender.com";

/** Thrown for any non-2xx. `status` lets callers distinguish 401 from 422. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * The API returns errors in several shapes: a bare string, `{message}`, or
 * ASP.NET's ValidationProblemDetails with a nested `errors` map. Flatten them
 * into something worth showing a student.
 */
async function readError(res: Response): Promise<string> {
  const raw = await res.text();
  if (!raw) return `Request failed (${res.status})`;
  try {
    const body = JSON.parse(raw);
    if (typeof body === "string") return body;
    if (body.errors && typeof body.errors === "object") {
      const first = Object.values(body.errors as Record<string, string[]>)[0];
      if (Array.isArray(first) && first[0]) return first[0];
    }
    return body.message ?? body.title ?? body.detail ?? raw;
  } catch {
    return raw;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  /** Server-component caching. Public reads use a short revalidate. */
  revalidate?: number;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, revalidate } = opts;

  // FormData goes through untouched: the browser sets the multipart
  // Content-Type (with its boundary) itself — setting it by hand breaks it.
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
    ...(revalidate !== undefined
      ? { next: { revalidate } }
      : { cache: "no-store" as RequestCache }),
  });

  if (!res.ok) throw new ApiError(res.status, await readError(res));
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function buildQuery(query: HostelQuery): string {
  const params = new URLSearchParams();
  // Skip empty strings as well as undefined: a blank search box must not
  // become `?q=`, which the API treats as a real (never-matching) filter.
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Photo URLs come back site-relative (`/uploads/...`). Resolve against the API
 * origin, but leave absolute URLs alone.
 */
export function photoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

export const api = {
  // ----- Hostels (public) --------------------------------------------
  listHostels: (query: HostelQuery = {}) =>
    request<HostelSummary[]>(`/api/hostels${buildQuery(query)}`, {
      revalidate: 60,
    }),

  getHostel: (id: string) =>
    request<HostelDetail>(`/api/hostels/${id}`, { revalidate: 60 }),

  // ----- Auth ---------------------------------------------------------
  register: (body: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: string;
    student?: StudentInfo;
  }) => request<AuthResult>("/api/auth/register", { method: "POST", body }),

  login: (email: string, password: string) =>
    request<AuthResult>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  verifyEmail: (email: string, code: string) =>
    request<AuthResult>("/api/auth/verify-email", {
      method: "POST",
      body: { email, code },
    }),

  resendCode: (email: string) =>
    request<void>("/api/auth/resend-code", { method: "POST", body: { email } }),

  forgotPassword: (email: string) =>
    request<void>("/api/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request<void>("/api/auth/reset-password", {
      method: "POST",
      body: { email, code, newPassword },
    }),

  me: (token: string) => request<UserResponse>("/api/auth/me", { token }),

  updateStudent: (token: string, student: StudentInfo) =>
    request<UserResponse>("/api/auth/me/student", {
      method: "PUT",
      body: student,
      token,
    }),

  // ----- Bookings -----------------------------------------------------
  myBookings: (token: string) =>
    request<BookingResponse[]>("/api/bookings/mine", { token }),

  getBooking: (token: string, id: string) =>
    request<BookingResponse>(`/api/bookings/${id}`, { token }),

  /** The student's active booking, if any. 404 when they have none. */
  currentBooking: (token: string) =>
    request<BookingResponse>("/api/bookings/current", { token }),

  /** Reserves a bed. Omit bedId and the API picks the first free one. */
  createBooking: (
    token: string,
    body: { roomId: string; bedId?: string; academicYear: string },
  ) => request<BookingResponse>("/api/bookings", { method: "POST", body, token }),

  cancelBooking: (token: string, id: string) =>
    request<BookingResponse>(`/api/bookings/${id}/cancel`, {
      method: "POST",
      token,
    }),

  roommates: (token: string, bookingId: string) =>
    request<RoommateResponse[]>(`/api/bookings/${bookingId}/roommates`, {
      token,
    }),

  // ----- Payments -----------------------------------------------------
  initializePayment: (
    token: string,
    body: { bookingId: string; channel: PaymentChannel; phone?: string },
  ) =>
    request<PaymentResponse>("/api/payments/initialize", {
      method: "POST",
      body,
      token,
    }),

  verifyPayment: (token: string, reference: string) =>
    request<PaymentResponse>(`/api/payments/${reference}/verify`, {
      method: "POST",
      token,
    }),

  /** Mobile Money charges stall until the customer's code is submitted. */
  submitOtp: (token: string, reference: string, otp: string) =>
    request<PaymentResponse>(`/api/payments/${reference}/submit-otp`, {
      method: "POST",
      body: { otp },
      token,
    }),

  paymentForBooking: (token: string, bookingId: string) =>
    request<PaymentResponse>(`/api/payments/booking/${bookingId}`, { token }),

  // ----- Manual MoMo transfer (student pays the platform wallet by hand) ---
  /** The wallet to send to and how much, for the "pay by MoMo" panel. */
  manualPaymentInstructions: (token: string, bookingId: string) =>
    request<ManualPaymentInstructions>(
      `/api/payments/manual/instructions?bookingId=${encodeURIComponent(bookingId)}`,
      { token },
    ),

  /**
   * Records a transfer the student already made, with the screenshot as
   * evidence. The booking stays pending until staff approve it.
   */
  submitManualPayment: (
    token: string,
    input: {
      bookingId: string;
      proof: File;
      transactionId?: string;
      senderPhone?: string;
      senderName?: string;
    },
  ) => {
    const form = new FormData();
    form.set("bookingId", input.bookingId);
    form.set("proof", input.proof);
    if (input.transactionId) form.set("transactionId", input.transactionId);
    if (input.senderPhone) form.set("senderPhone", input.senderPhone);
    if (input.senderName) form.set("senderName", input.senderName);
    return request<PaymentResponse>("/api/payments/manual/submit", {
      method: "POST",
      body: form,
      token,
    });
  },
};
