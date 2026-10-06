// Single API entry point. vercel.json rewrites /api/<route> to /api/router?path=<route>
import { send, fail, readJson, readRaw, HttpError } from '../lib/http.js';
import { getEvent, putEvent, listEventSlugs, listGuests, getGuest, putGuest, delGuest,
         listGallery, putGalleryItem, delGalleryItem, publicEvent, stats, rid, slugify } from '../lib/data.js';
import { putFile, deleteFile } from '../lib/blob.js';
import { PLANS, guestLimit, MAX_PHOTOS, MAX_GALLERY, MAX_UPLOAD } from '../lib/plans.js';
import { storageMode } from '../lib/store.js';

const TEMPLATES = ['porcelain', 'lubugo', 'emerald', 'vellum', 'royal'];
const TYPES = ['wedding', 'introduction', 'celebration'];
const EDITABLE = ['template', 'type', 'a', 'b', 'famA', 'famB', 'date', 'endDate', 'venueA', 'mapA', 'venueB', 'mapB',
  'timeline', 'dress', 'verse', 'kicker', 'inviteLine', 'rsvpBy', 'hostPhone', 'messages', 'openRsvp'];

const ownerKey = () => process.env.OWNER_KEY || (process.env.VERCEL ? null : 'owner-dev-key');
const isOwner = k => !!k && k === ownerKey();

function clean(input, ev = {}) {
  const out = {};
  for (const f of EDITABLE) if (f in input) out[f] = input[f];
  const str = (v, n = 200) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  for (const f of ['a', 'b', 'famA', 'famB', 'venueA', 'venueB', 'dress', 'kicker', 'hostPhone']) if (f in out) out[f] = str(out[f]);
  for (const f of ['mapA', 'mapB']) if (f in out) out[f] = str(out[f], 600);
  for (const f of ['verse', 'inviteLine']) if (f in out) out[f] = str(out[f], 400);
  if ('template' in out && !TEMPLATES.includes(out.template)) out.template = 'porcelain';
  if ('type' in out && !TYPES.includes(out.type)) out.type = 'wedding';
  if ('timeline' in out) out.timeline = Array.isArray(out.timeline) ? out.timeline.slice(0, 10).map(r => [str(r[0], 30), str(r[1], 60)]).filter(r => r[0] || r[1]) : [];
  if ('messages' in out) { const m = out.messages || {}; out.messages = {}; for (const k of ['invite', 'reminder', 'dayBefore', 'thanks']) if (m[k]) out.messages[k] = str(m[k], 1000); }
  if ('openRsvp' in out) out.openRsvp = !!out.openRsvp;
  for (const f of ['date', 'endDate', 'rsvpBy']) if (f in out && out[f] && isNaN(Date.parse(out[f]))) fail(400, `Invalid ${f}`);
  return out;
}

async function loadEvent(slug) { const ev = slug && await getEvent(slug); if (!ev) fail(404, 'Invitation not found'); return ev; }
function canAdmin(ev, k) { return !!k && (k === ev.adminKey || isOwner(k)); }
function needAdmin(ev, k) { if (!canAdmin(ev, k)) fail(403, 'Not allowed'); }
function canGate(ev, k) { return canAdmin(ev, k) || (!!k && k === ev.gateKey); }

function parseGuestLine(line) {
  // "Name, phone, seats"  or  "Name x2"
  let [name, phone = '', seats = ''] = line.split(/[,;\t]/).map(s => s.trim());
  const m = name.match(/\s[x×]\s?(\d{1,2})$/i);
  if (m) { seats = m[1]; name = name.slice(0, m.index).trim(); }
  phone = phone.replace(/[^\d+]/g, '');
  if (/^0\d{9}$/.test(phone)) phone = '256' + phone.slice(1);
  phone = phone.replace(/^\+/, '');
  return { name: name.slice(0, 120), phone: phone.slice(0, 15), seats: Math.min(Math.max(parseInt(seats, 10) || 1, 1), 20) };
}

const routes = {
  async 'health'() { return { ok: true, storage: storageMode, time: Date.now() }; },

  // Create a new invitation (draft until the owner activates it)
  async 'events:POST'(req) {
    const body = await readJson(req);
    const d = clean(body.event || {});
    if (!d.a || !d.b) fail(400, 'Both names are required');
    if (!d.date) fail(400, 'The date is required');
    let slug = slugify(`${d.a}-${d.b}`) || 'invite';
    slug = `${slug}-${rid(4)}`;
    const plan = PLANS[body.plan] ? body.plan : 'classic';
    const ev = { template: 'porcelain', type: 'wedding', openRsvp: false, ...d, slug, plan, active: false,
      adminKey: rid(24), gateKey: rid(14), photos: [], music: null, createdAt: Date.now() };
    await putEvent(ev);
    return { slug, adminKey: ev.adminKey };
  },

  // Read an invitation. With g=<guestId> also returns that guest and records the open.
  async 'event:GET'(req, q) {
    const ev = await loadEvent(q.slug);
    const admin = canAdmin(ev, q.k);
    let guest = null;
    if (q.g) {
      guest = await getGuest(ev.slug, q.g);
      if (guest && !q.preview && !admin) {
        guest.opens = (guest.opens || 0) + 1;
        guest.firstOpen ||= Date.now();
        guest.lastOpen = Date.now();
        await putGuest(ev.slug, guest);
      }
    }
    const out = { event: admin ? ev : publicEvent(ev) };
    if (guest) out.guest = { id: guest.id, name: guest.name, seats: guest.seats, status: guest.status, count: guest.count, note: guest.note || '' };
    if (admin) out.limit = guestLimit(ev);
    return out;
  },

  async 'event:PUT'(req, q) {
    const ev = await loadEvent(q.slug); needAdmin(ev, q.k);
    const body = await readJson(req);
    Object.assign(ev, clean(body.event || {}, ev));
    if (body.plan && PLANS[body.plan] && !ev.active) ev.plan = body.plan;
    await putEvent(ev);
    return { event: ev };
  },

  // Guest replies
  async 'rsvp:POST'(req) {
    const b = await readJson(req);
    const ev = await loadEvent(b.slug);
    if (!['yes', 'no'].includes(b.status)) fail(400, 'Please choose yes or no');
    let g = await getGuest(ev.slug, b.g);
    if (!g) {
      if (!ev.openRsvp) fail(403, 'Please use the personal link you were sent.');
      const name = String(b.name || '').trim().slice(0, 120);
      if (!name) fail(400, 'Please enter your name');
      const all = await listGuests(ev.slug);
      if (all.length >= guestLimit(ev)) fail(403, 'This guest list is full. Please contact the hosts.');
      g = { id: rid(10), name, phone: String(b.phone || '').replace(/[^\d]/g, '').slice(0, 15), seats: 1, status: 'pending', createdAt: Date.now(), self: true };
    }
    g.status = b.status;
    g.count = b.status === 'yes' ? Math.min(Math.max(parseInt(b.count, 10) || 1, 1), g.seats || 1) : 0;
    g.note = String(b.note || '').trim().slice(0, 500);
    g.respondedAt = Date.now();
    await putGuest(ev.slug, g);
    return { guest: { id: g.id, name: g.name, seats: g.seats, status: g.status, count: g.count, note: g.note } };
  },

  // Guest list (admin)
  async 'guests:GET'(req, q) {
    const ev = await loadEvent(q.slug); needAdmin(ev, q.k);
    const guests = await listGuests(ev.slug);
    return { guests, stats: stats(guests), limit: guestLimit(ev) };
  },
  async 'guests:POST'(req, q) {
    const ev = await loadEvent(q.slug); needAdmin(ev, q.k);
    const b = await readJson(req);
    const lines = (Array.isArray(b.lines) ? b.lines : String(b.text || '').split('\n')).map(s => String(s).trim()).filter(Boolean);
    const existing = await listGuests(ev.slug);
    const limit = guestLimit(ev);
    const seen = new Set(existing.map(g => g.name.toLowerCase()));
    const added = [], skipped = [];
    let n = existing.length;
    for (const line of lines.slice(0, 1000)) {
      const p = parseGuestLine(line);
      if (!p.name) continue;
      if (seen.has(p.name.toLowerCase())) { skipped.push({ name: p.name, reason: 'already on the list' }); continue; }
      if (n >= limit) { skipped.push({ name: p.name, reason: 'plan limit reached' }); continue; }
      const g = { id: rid(10), ...p, status: 'pending', createdAt: Date.now() + added.length };
      await putGuest(ev.slug, g); added.push(g); seen.add(p.name.toLowerCase()); n++;
    }
    return { added, skipped, limit };
  },
  async 'guest:PATCH'(req, q) {
    const ev = await loadEvent(q.slug); needAdmin(ev, q.k);
    const g = await getGuest(ev.slug, q.id); if (!g) fail(404, 'Guest not found');
    const b = await readJson(req);
    if ('name' in b) g.name = String(b.name).trim().slice(0, 120) || g.name;
    if ('phone' in b) g.phone = parseGuestLine('x,' + b.phone).phone;
    if ('seats' in b) g.seats = Math.min(Math.max(parseInt(b.seats, 10) || 1, 1), 20);
    if (b.markSent) g.sentAt = Date.now();
    if (b.markReminded) g.remindedAt = Date.now();
    if ('status' in b && ['yes', 'no', 'pending'].includes(b.status)) { g.status = b.status; if (b.status === 'yes') g.count = Math.min(g.count || g.seats || 1, g.seats || 1); }
    await putGuest(ev.slug, g);
    return { guest: g };
  },
  async 'guest:DELETE'(req, q) {
    const ev = await loadEvent(q.slug); needAdmin(ev, q.k);
    await delGuest(ev.slug, q.id);
    return { ok: true };
  },

  // Gate check-in
  async 'gate:GET'(req, q) {
    const ev = await loadEvent(q.slug); if (!canGate(ev, q.k)) fail(403, 'This check-in link is not valid');
    const guests = (await listGuests(ev.slug)).map(g => ({ id: g.id, name: g.name, seats: g.seats, status: g.status, count: g.count, checkedInAt: g.checkedInAt || null }));
    return { event: { a: ev.a, b: ev.b, date: ev.date, template: ev.template, venueA: ev.venueA }, guests, stats: stats(guests) };
  },
  async 'checkin:POST'(req) {
    const b = await readJson(req);
    const ev = await loadEvent(b.slug); if (!canGate(ev, b.k)) fail(403, 'This check-in link is not valid');
    const g = await getGuest(ev.slug, b.id); if (!g) fail(404, 'This pass is not on the guest list');
    if (b.undo) { delete g.checkedInAt; await putGuest(ev.slug, g); return { guest: g, undone: true }; }
    if (g.checkedInAt) return { guest: g, already: true };
    g.checkedInAt = Date.now();
    await putGuest(ev.slug, g);
    return { guest: g };
  },

  // Uploads: music + couple photos (admin), gallery photos (guests, from the event day)
  async 'upload:POST'(req, q) {
    const ev = await loadEvent(q.slug);
    const kind = q.kind;
    const type = String(req.headers['content-type'] || '').split(';')[0];
    if (kind === 'music') { needAdmin(ev, q.k); if (!/^audio\//.test(type)) fail(400, 'Please choose an audio file (MP3 or M4A).'); }
    else if (kind === 'photo') { needAdmin(ev, q.k); if (!/^image\//.test(type)) fail(400, 'Please choose an image.'); if ((ev.photos || []).length >= MAX_PHOTOS) fail(400, `You can add up to ${MAX_PHOTOS} photos.`); }
    else if (kind === 'gallery') {
      const g = await getGuest(ev.slug, q.g);
      if (!g && !canAdmin(ev, q.k)) fail(403, 'Please use your personal invitation link.');
      if (!/^image\//.test(type)) fail(400, 'Please choose a photo.');
      if (Date.now() < Date.parse(ev.date) - 6 * 3600e3) fail(400, 'Photo sharing opens on the day of the event.');
      if ((await listGallery(ev.slug)).length >= MAX_GALLERY) fail(400, 'The gallery is full.');
    } else fail(400, 'Unknown upload type');

    const buf = await readRaw(req, MAX_UPLOAD);
    if (!buf.length) fail(400, 'The file was empty.');
    const name = String(q.name || kind).slice(0, 80);
    const url = await putFile(`${ev.slug}/${kind}-${name}`, buf, type);

    if (kind === 'music') {
      if (ev.music?.url) await deleteFile(ev.music.url);
      ev.music = { url, name: name.replace(/\.[^.]+$/, '') }; await putEvent(ev);
      return { music: ev.music };
    }
    if (kind === 'photo') {
      const item = { id: rid(8), url }; ev.photos = [...(ev.photos || []), item]; await putEvent(ev);
      return { photo: item, photos: ev.photos };
    }
    const g = await getGuest(ev.slug, q.g);
    const item = { id: rid(10), url, by: g ? g.name : 'Hosts', guestId: g?.id || null, at: Date.now() };
    await putGalleryItem(ev.slug, item);
    return { item };
  },
  async 'upload:DELETE'(req, q) {
    const ev = await loadEvent(q.slug); needAdmin(ev, q.k);
    if (q.kind === 'music') { if (ev.music?.url) await deleteFile(ev.music.url); ev.music = null; await putEvent(ev); return { ok: true }; }
    if (q.kind === 'photo') {
      const p = (ev.photos || []).find(x => x.id === q.id); if (p) await deleteFile(p.url);
      ev.photos = (ev.photos || []).filter(x => x.id !== q.id); await putEvent(ev); return { photos: ev.photos };
    }
    if (q.kind === 'gallery') { const it = await delGalleryItem(ev.slug, q.id); if (it) await deleteFile(it.url); return { ok: true }; }
    fail(400, 'Unknown upload type');
  },
  async 'photo-order:PUT'(req, q) {
    const ev = await loadEvent(q.slug); needAdmin(ev, q.k);
    const { ids = [] } = await readJson(req);
    const byId = Object.fromEntries((ev.photos || []).map(p => [p.id, p]));
    ev.photos = [...ids.map(i => byId[i]).filter(Boolean), ...(ev.photos || []).filter(p => !ids.includes(p.id))];
    await putEvent(ev); return { photos: ev.photos };
  },
  async 'gallery:GET'(req, q) {
    const ev = await loadEvent(q.slug);
    const ok = canAdmin(ev, q.k) || !!(await getGuest(ev.slug, q.g));
    if (!ok) fail(403, 'Not allowed');
    return { items: await listGallery(ev.slug) };
  },

  // Owner (you): see every invitation and activate paid ones
  async 'owner/events:GET'(req, q) {
    if (!isOwner(q.k)) fail(403, 'Owner key required');
    const slugs = await listEventSlugs();
    const events = [];
    for (const s of slugs) {
      const ev = await getEvent(s); if (!ev) continue;
      const guests = await listGuests(s);
      events.push({ slug: s, a: ev.a, b: ev.b, date: ev.date, template: ev.template, plan: ev.plan, active: ev.active,
        createdAt: ev.createdAt, adminKey: ev.adminKey, hostPhone: ev.hostPhone || '', stats: stats(guests) });
    }
    events.sort((x, y) => y.createdAt - x.createdAt);
    return { events, plans: PLANS };
  },
  async 'owner/activate:POST'(req, q) {
    if (!isOwner(q.k)) fail(403, 'Owner key required');
    const b = await readJson(req);
    const ev = await loadEvent(b.slug);
    if (b.plan && (PLANS[b.plan] || b.plan === 'custom')) ev.plan = b.plan;
    if (b.plan === 'custom') ev.customGuests = Math.max(parseInt(b.customGuests, 10) || 600, 1);
    ev.active = !!b.active;
    ev.activatedAt = ev.active ? Date.now() : null;
    await putEvent(ev);
    return { ok: true, active: ev.active, plan: ev.plan };
  }
};

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://local');
    const q = Object.fromEntries(url.searchParams);
    if (!q.k && req.headers['x-key']) q.k = req.headers['x-key'];
    const route = (q.path || url.pathname.replace(/^\/api\/?/, '')).replace(/\/$/, '');
    const fn = routes[`${route}:${req.method}`] || (req.method === 'GET' && routes[route]);
    if (!fn) return send(res, 404, { error: 'Not found' });
    const out = await fn(req, q);
    send(res, 200, out);
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.code, { error: e.message });
    console.error(e);
    send(res, 500, { error: e.message || 'Something went wrong' });
  }
}
