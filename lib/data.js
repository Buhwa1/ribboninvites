import crypto from 'node:crypto';
import { kv } from './store.js';

export const rid = (n = 10) => {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(n);
  let s = ''; for (let i = 0; i < n; i++) s += abc[bytes[i] % abc.length];
  return s;
};
export const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 40);

export async function getEvent(slug) { const s = await kv.get('ev:' + slug); return s ? JSON.parse(s) : null; }
export async function putEvent(ev) { ev.updatedAt = Date.now(); await kv.set('ev:' + ev.slug, JSON.stringify(ev)); await kv.sadd('events', ev.slug); }
export async function listEventSlugs() { return (await kv.smembers('events')) || []; }

export async function listGuests(slug) {
  const h = await kv.hgetall('g:' + slug);
  return Object.values(h).map(s => JSON.parse(s)).sort((a, b) => a.createdAt - b.createdAt);
}
export async function getGuest(slug, id) { if (!id) return null; const s = await kv.hget('g:' + slug, id); return s ? JSON.parse(s) : null; }
export async function putGuest(slug, g) { await kv.hset('g:' + slug, g.id, JSON.stringify(g)); }
export async function delGuest(slug, id) { await kv.hdel('g:' + slug, id); }

export async function listGallery(slug) {
  const h = await kv.hgetall('p:' + slug);
  return Object.values(h).map(s => JSON.parse(s)).sort((a, b) => b.at - a.at);
}
export async function putGalleryItem(slug, item) { await kv.hset('p:' + slug, item.id, JSON.stringify(item)); }
export async function delGalleryItem(slug, id) { const s = await kv.hget('p:' + slug, id); await kv.hdel('p:' + slug, id); return s ? JSON.parse(s) : null; }

// What guests are allowed to see (never the keys)
export function publicEvent(ev) {
  const { adminKey, gateKey, ...rest } = ev;
  return rest;
}

export function stats(guests) {
  const s = { invited: guests.length, sent: 0, opened: 0, yes: 0, no: 0, pending: 0, attending: 0, checkedIn: 0, checkedInPeople: 0 };
  for (const g of guests) {
    if (g.sentAt) s.sent++;
    if (g.opens) s.opened++;
    if (g.status === 'yes') { s.yes++; s.attending += g.count || 1; }
    else if (g.status === 'no') s.no++;
    else s.pending++;
    if (g.checkedInAt) { s.checkedIn++; s.checkedInPeople += g.count || 1; }
  }
  return s;
}
