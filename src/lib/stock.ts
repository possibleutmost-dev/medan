/**
 * Stand-in photography for listings that have none.
 *
 * Most hostels in the catalogue have an empty `photos` array, and a page of
 * grey boxes doesn't communicate what is being sold. These are generic
 * accommodation photographs from Unsplash, committed under `public/images`
 * (see CREDITS.md) rather than hotlinked, so the site keeps working if the CDN
 * does not.
 *
 * A real listing photo ALWAYS wins — these only fill a gap. Replace them with
 * photographs of the actual properties before launch: showing a student a room
 * that isn't the one they're booking is misleading.
 */

export const HERO_IMAGE = "/images/hero-hostel.jpg";
export const CAMPUS_IMAGE = "/images/campus.jpg";

const ROOM_STOCK = [
  "/images/room-1.jpg",
  "/images/room-2.jpg",
  "/images/room-3.jpg",
  "/images/room-4.jpg",
];

/**
 * Deterministic pick, so the same room always shows the same photo — a picture
 * that changes on every render reads as broken.
 */
export function stockRoomImage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return ROOM_STOCK[Math.abs(hash) % ROOM_STOCK.length];
}
