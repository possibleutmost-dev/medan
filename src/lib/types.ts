/**
 * TypeScript mirrors of the MeDan API's C# DTOs.
 *
 * Source of truth is `apis-main/Dtos/*.cs` — ASP.NET serialises with camelCase,
 * so field names match the C# properties with a lowercased first letter. When a
 * DTO changes there, change it here; nothing generates these, so drift is
 * silent until a page renders `undefined`.
 */

/** Hostel.PropertyType */
export type PropertyType =
  | "hostel"
  | "hometel"
  | "apartment"
  | "selfContained"
  | "hall";

/** Room.Type. Capacity 1–4 maps onto these. */
export type RoomType =
  | "single"
  | "doublyShared"
  | "triplyShared"
  | "quadShared"
  | "ensuite"
  | "apartment";

export type RoomStatus = "available" | "occupied" | "maintenance";
export type Gender = "male" | "female" | "mixed";

/**
 * Booking escrow state machine (Models/Enums.cs):
 * pending → paymentHeld → checkedIn → completed,
 * with disputed / refunded / cancelled as exits.
 */
export type BookingStatus =
  | "pending"
  | "paymentHeld"
  | "checkedIn"
  | "completed"
  | "disputed"
  | "refunded"
  | "cancelled";

export type PaymentChannel = "momoMtn" | "momoTelecel" | "card";

export interface HostelSummary {
  id: string;
  name: string;
  /** Campus code, e.g. "UENR". */
  campus: string;
  ownerId: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  minPrice: number;
  maxPrice: number;
  photos: string[];
  /** Amenity icon keys, e.g. ["wifi", "ac"]. */
  amenities: string[];
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  description: string | null;
  contactPhone: string | null;
  propertyType: PropertyType;
  companyId: string;
}

export interface RoomSummary {
  id: string;
  hostelId: string;
  label: string;
  type: RoomType;
  /** Price per bed per semester, in whole cedis. */
  pricePerSemester: number;
  status: RoomStatus;
  capacity: number;
  availableBeds: number;
  gender: Gender;
}

export interface PhotoResponse {
  id: string;
  url: string;
}

export interface HostelDetail extends HostelSummary {
  rooms: RoomSummary[];
  photoItems: PhotoResponse[];
}

export interface BookingResponse {
  id: string;
  hostelId: string;
  hostelName: string;
  hostelPhotoUrl: string | null;
  roomId: string;
  roomLabel: string;
  bedId: string;
  bedLabel: string;
  academicYear: string;
  amount: number;
  commission: number;
  status: BookingStatus;
  checkInCode: string | null;
  paystackReference: string | null;
  disputeReason: string | null;
  disputeResolution: string | null;
  createdAt: string;
  paidAt: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
  disputedAt: string | null;
  resolvedAt: string | null;
}

/** Deliberately thin — no contact details, see RoommateResponse in the API. */
export interface RoommateResponse {
  userId: string;
  name: string;
  photoUrl: string | null;
  course: string | null;
  level: string | null;
  bedLabel: string;
  hasCheckedIn: boolean;
}

export interface PaymentResponse {
  reference: string;
  bookingId: string;
  /** Cedis, not pesewas. */
  amount: number;
  channel: PaymentChannel;
  status: string;
  checkoutUrl: string | null;
  authorizationCode: string | null;
  bookingStatus: BookingStatus;
  createdAt: string;
  /** True when the API has no Paystack key and simulated the transaction. */
  simulated: boolean;
  /**
   * Paystack is holding a Mobile Money charge pending the customer's code.
   * Polling alone will never resolve it — the code must be submitted.
   */
  requiresOtp: boolean;
  displayText: string | null;
}

export type UserRole = "student" | "owner" | "worker" | "manager" | "admin";

export interface StudentInfo {
  course: string;
  department: string;
  level?: string | null;
  campusCode?: string | null;
  indexNumber?: string | null;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship: string;
  guardianEmail?: string | null;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  role: UserRole;
  student: StudentInfo | null;
}

/** Successful login/register/verify — the API issues its own JWT. */
export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserResponse;
}

/**
 * Register and login return this instead of a token when the address still
 * needs its 6-digit code. It is a 200, not an error — the UI must branch on
 * the shape rather than the status.
 */
export interface VerificationPendingResponse {
  requiresVerification: true;
  email: string;
  message: string;
}

export type AuthResult = AuthResponse | VerificationPendingResponse;

export function needsVerification(
  result: AuthResult,
): result is VerificationPendingResponse {
  return (result as VerificationPendingResponse).requiresVerification === true;
}

export interface HostelQuery {
  campus?: string;
  type?: PropertyType;
  roomType?: RoomType;
  maxPrice?: number;
  verified?: boolean;
  q?: string;
}

/** Human labels for the camelCase enums the API returns. */
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  single: "Single",
  doublyShared: "2 in a room",
  triplyShared: "3 in a room",
  quadShared: "4 in a room",
  ensuite: "En-suite",
  apartment: "Apartment",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  hostel: "Hostel",
  hometel: "Hometel",
  apartment: "Apartment",
  selfContained: "Self-contained",
  hall: "Hall",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Awaiting payment",
  paymentHeld: "Payment held in escrow",
  checkedIn: "Checked in",
  completed: "Completed",
  disputed: "Disputed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};
