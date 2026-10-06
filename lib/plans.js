// Pricing tiers. Keep in sync with public/js/brand.js
export const PLANS = {
  intimate: { name: 'Intimate', guests: 50,  price: 200000 },
  classic:  { name: 'Classic',  guests: 100, price: 300000 },
  grand:    { name: 'Grand',    guests: 250, price: 550000 },
  gala:     { name: 'Gala',     guests: 500, price: 850000 }
};
export const PREVIEW_GUESTS = 5;            // guests allowed before the invitation is activated
export const MAX_PHOTOS = 12;               // couple photos per invitation
export const MAX_GALLERY = 400;             // guest photos after the event
export const MAX_UPLOAD = 4 * 1024 * 1024;  // 4 MB (Vercel request limit is 4.5 MB)

export function guestLimit(ev) {
  if (!ev.active) return PREVIEW_GUESTS;
  if (ev.plan === 'custom') return ev.customGuests || 1000;
  return (PLANS[ev.plan] || PLANS.classic).guests;
}
