window.UI = (function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, cls = '') => `<svg class="i ${cls}" aria-hidden="true"><use href="/img/icons.svg#${name}"></use></svg>`;

  async function api(path, { method = 'GET', body, key, raw, type } = {}) {
    const opts = { method, headers: {} };
    if (key) opts.headers['x-key'] = key;
    if (raw) { opts.body = raw; opts.headers['Content-Type'] = type || 'application/octet-stream'; }
    else if (body !== undefined) { opts.body = JSON.stringify(body); opts.headers['Content-Type'] = 'application/json'; }
    let r;
    try { r = await fetch('/api/' + path, opts); }
    catch { throw new Error('No connection. Please check your internet and try again.'); }
    let j = {}; try { j = await r.json(); } catch {}
    if (!r.ok) throw new Error(j.error || `Something went wrong (${r.status}). Please try again.`);
    return j;
  }

  function toast(msg, { ms = 2800, error = false } = {}) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.classList.toggle('err', error);
    t.innerHTML = icon(error ? 'alert' : 'check-circle') + `<span>${esc(msg)}</span>`;
    t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms);
  }
  const fail = (e) => toast(e && e.message ? e.message : String(e), { error: true, ms: 4500 });

  async function copy(text, msg = 'Copied to clipboard') {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(msg); } catch { toast('Copy failed. Press and hold to copy instead.', { error: true }); }
      ta.remove();
    }
  }

  const ugx = n => 'UGX ' + Number(n || 0).toLocaleString('en-US');
  const phoneDigits = v => { let p = String(v || '').replace(/\D/g, ''); if (/^0\d{9}$/.test(p)) p = '256' + p.slice(1); return p; };
  const wa = (phone, text) => `https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(text)}`;
  const ago = t => {
    if (!t) return ''; const s = (Date.now() - t) / 1000;
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago'; if (s < 86400 * 7) return Math.floor(s / 86400) + ' d ago';
    return fmtDate(new Date(t).toISOString(), { day: 'numeric', month: 'short' });
  };
  const fmtDate = (iso, o = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
    iso ? new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: 'Africa/Kampala' }, o)).format(new Date(iso)) : '';

  function shrinkImage(file, max = 1600, q = .85) {
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => { URL.revokeObjectURL(url); b ? resolve(b) : reject(new Error('We couldn’t read that image. Try a JPG or PNG.')); }, 'image/jpeg', q);
      };
      img.onerror = () => reject(new Error('We couldn’t read that image. Try a JPG or PNG.')); img.src = url;
    });
  }

  function header() {
    const top = $('.top'); if (!top) return;
    const on = () => top.classList.toggle('scrolled', scrollY > 6); on(); addEventListener('scroll', on, { passive: true });
  }
  function brand() {
    const B = window.BRAND || {};
    $$('[data-brand]').forEach(e => e.textContent = B.name || 'RibbonInvites');
    $$('[data-wordmark]').forEach(e => e.innerHTML = 'Ribbon<i>Invites</i>');
    $$('[data-year]').forEach(e => e.textContent = new Date().getFullYear());
  }
  function qr(text, cell = 4) { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: cell, margin: 2, scalable: true }); }

  function modal(html, { onClose } = {}) {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="card" role="dialog" aria-modal="true" style="position:relative"><button class="btn ghost icon-btn x" data-close aria-label="Close">${icon('x')}</button>${html}</div>`;
    const close = () => { m.remove(); document.removeEventListener('keydown', key); onClose && onClose(); };
    const key = e => { if (e.key === 'Escape') close(); };
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', key);
    document.body.appendChild(m);
    const f = m.querySelector('input,select,textarea,.btn.primary'); if (f) setTimeout(() => f.focus(), 30);
    m.close = close; return m;
  }
  function confirm(title, text, { ok = 'Confirm', danger = false } = {}) {
    return new Promise(resolve => {
      let done = false;
      const m = modal(`<h3 class="h3" style="padding-right:30px">${esc(title)}</h3><p class="muted" style="margin:10px 0 22px">${esc(text)}</p>
        <div class="row" style="justify-content:flex-end"><button class="btn" data-close>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(ok)}</button></div>`,
        { onClose: () => { if (!done) resolve(false); } });
      m.querySelector('[data-ok]').onclick = () => { done = true; m.close(); resolve(true); };
    });
  }
  async function busy(btn, fn) {
    const html = btn.innerHTML; btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true');
    try { return await fn(); } finally { btn.classList.remove('is-busy'); btn.removeAttribute('aria-busy'); btn.innerHTML = html; }
  }

  return { $, $$, esc, icon, api, toast, fail, copy, ugx, phoneDigits, wa, ago, fmtDate, shrinkImage, header, brand, qr, modal, confirm, busy };
})();
