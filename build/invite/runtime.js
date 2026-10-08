(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const frame = $('frame');
  const qs = new URLSearchParams(location.search);
  const slug = decodeURIComponent((location.pathname.match(/\/i\/([^/?#]+)/) || [])[1] || qs.get('slug') || '');
  const isDraft = qs.has('draft');
  const isDemo = slug.startsWith('demo-');
  const embed = qs.has('embed');
  let guestId = qs.get('g') || '';
  const isPreview = qs.has('preview') && !guestId;

  const TYPE_TEXT = {
    wedding: { kicker: 'TOGETHER WITH THEIR FAMILIES', lede: 'are getting married',
      invite: 'would be honoured to have you beside them as they say “I do” and begin their life together.', venueA: 'CEREMONY' },
    introduction: { kicker: 'WITH JOY, THE FAMILIES OF', lede: 'invite you to their introduction ceremony',
      invite: 'request the honour of your presence as our families meet, celebrate and bless this union.', venueA: 'CEREMONY' },
    celebration: { kicker: 'YOU ARE INVITED TO CELEBRATE WITH', lede: 'are celebrating',
      invite: 'would love you to join them for a day of joy, good food and dancing.', venueA: 'CELEBRATION' }
  };

  function demoEvent(t){
    const y = new Date().getFullYear() + (new Date().getMonth() > 9 ? 1 : 0);
    return { slug: 'demo-' + t, template: t, type: t === 'royal' ? 'introduction' : 'wedding', active: true, demo: true,
      a: 'Joe', b: 'Jane', famA: 'Mr. & Mrs. John Doe', famB: 'Mr. & Mrs. Robert Smith',
      date: `${y}-12-12T14:00:00+03:00`, endDate: `${y}-12-12T23:00:00+03:00`, rsvpBy: `${y}-11-20`,
      venueA: 'Namirembe Cathedral', mapA: 'Namirembe Cathedral, Kampala', venueB: 'Speke Resort Munyonyo', mapB: 'Speke Resort Munyonyo, Kampala',
      timeline: [['2:00 pm','Ceremony'],['4:30 pm','Photos & cocktails'],['6:30 pm','Reception dinner'],['9:00 pm','First dance & party']],
      dress: 'Dress code: formal, in soft neutrals', verse: 'Two hearts, one story, and a seat kept just for you.',
      openRsvp: true, photos: [], music: null };
  }

  function toast(msg){ const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600); }
  function oops(title, text){
    frame.innerHTML = `<div class="oops"><div><img src="/img/logo-mark.svg" alt="" width="72" height="72"><h1></h1><p></p><a href="/">RibbonInvites</a></div></div>`;
    frame.querySelector('h1').textContent = title; frame.querySelector('p').textContent = text;
  }

  async function load(){
    if (isDraft) {
      const d = (window.parent && window.parent.__draft) || {};
      return { event: Object.assign(demoEvent(d.template || 'porcelain'), { demo: false, draft: true }, d) };
    }
    if (isDemo) return { event: demoEvent(slug.slice(5)) };
    if (!slug) throw new Error('missing invitation link');
    const p = new URLSearchParams({ slug }); if (guestId) p.set('g', guestId); if (qs.has('preview')) p.set('preview', '1');
    let r;
    for (let attempt = 0; attempt < 2; attempt++) {
      try { r = await fetch('/api/event?' + p); break; }
      catch { if (attempt === 1) throw new Error('The invitation server could not be reached. Please refresh and try again.'); }
    }
    if (!r.ok) {
      const message = (await r.json().catch(() => ({}))).error;
      if (r.status === 404) throw new Error('This invitation does not exist. Ask the hosts to send you a new link.');
      throw new Error(message || 'The invitation could not be loaded. Please try again.');
    }
    return r.json();
  }

  load().then(d => { const l = $('loader'); if (l) l.remove(); start(d); })
    .catch(e => oops('We couldn’t open this invitation', e.message || 'Please check the link you were sent, or ask the hosts to send it to you again.'));

  function start({ event: ev, guest }){
    const T = window.THEMES[ev.template] || window.THEMES.porcelain;
    const tName = window.THEMES[ev.template] ? ev.template : 'porcelain';
    document.body.className = 't-' + tName;
    const font = document.createElement('link'); font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=' + FONTS[tName] + '&display=swap'; document.head.appendChild(font);
    const inside = frame.querySelector('.inside');
    inside.insertAdjacentHTML('afterbegin', $('deco-' + tName).innerHTML);
    frame.insertAdjacentHTML('beforeend', $('gate-' + tName).innerHTML);
    requestAnimationFrame(() => { document.documentElement.style.background = getComputedStyle(document.body).getPropertyValue('--outer'); });

    const tx = TYPE_TEXT[ev.type] || TYPE_TEXT.wedding;
    const when = new Date(ev.date);
    const end = ev.endDate ? new Date(ev.endDate) : new Date(when.getTime() + 9 * 3600e3);
    const fmt = (o, d = when) => new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: 'Africa/Kampala' }, o)).format(d);
    const guestName = guest ? guest.name : (ev.demo ? 'Grace Nakato' : isPreview || isDraft ? 'Your guest’s name' : 'Our dear guest');
    const trial = !!(ev.demo || isDraft || isPreview);
    document.title = `You’re invited · ${ev.a} & ${ev.b}`;
    const ia = (ev.a || ' ')[0], ib = (ev.b || ' ')[0];
    const F = {
      a: ev.a, b: ev.b, guest: guestName, kicker: ev.kicker || tx.kicker, lede: tx.lede, inviteLine: ev.inviteLine || tx.invite,
      initials: ia + ' ' + ib, initialsAmp: ia + '&' + ib, initialsSlash: ia + ' / ' + ib, initialsTight: ia + ib, couple: `${ev.a} & ${ev.b}`,
      famA: ev.famA || '', famB: ev.famB || '',
      day: fmt({ day: '2-digit' }), month: fmt({ month: 'long' }).toUpperCase(), year: fmt({ year: 'numeric' }), weekday: fmt({ weekday: 'long' }),
      time: fmt({ hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '\u00a0'),
      dateDots: fmt({ day: '2-digit' }) + ' . ' + fmt({ month: '2-digit' }) + ' . ' + fmt({ year: 'numeric' }),
      yearDots: fmt({ year: 'numeric' }),
      venueA: ev.venueA || '', venueB: ev.venueB || '', venueLabelA: ev.venueB ? tx.venueA : 'VENUE',
      pinA: (ev.venueA || '').split(',')[0].slice(0, 20), pinB: (ev.venueB || '').split(',')[0].slice(0, 20),
      verse: ev.verse || 'Two hearts, one story, and a seat kept just for you.', dress: ev.dress || '',
      rsvpBy: ev.rsvpBy ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' }).format(new Date(ev.rsvpBy + 'T12:00:00')).toUpperCase() : ''
    };
    frame.querySelectorAll('[data-f]').forEach(el => { el.textContent = F[el.dataset.f] ?? ''; });
    frame.querySelectorAll('[data-art]').forEach(el => { const fn = T.art && T.art[el.dataset.art]; if (fn) el.innerHTML = fn(ev); });
    if (T.after) T.after(frame, ev, F);

    if (!F.famA && !F.famB) frame.querySelector('.fam-wrap').remove();
    if (!ev.rsvpBy) $('rsvpLabel').textContent = 'KINDLY REPLY';

    // cartouches
    const box = (w, h, o, c) => `M${o+c} ${o} H${w-o-c} A${c} ${c} 0 0 0 ${w-o} ${o+c} V${h-o-c} A${c} ${c} 0 0 0 ${w-o-c} ${h-o} H${o+c} A${c} ${c} 0 0 0 ${o} ${h-o-c} V${o+c} A${c} ${c} 0 0 0 ${o+c} ${o}Z`;
    frame.querySelectorAll('[data-cart]').forEach(el => {
      const [w, h] = el.dataset.cart.split('x').map(Number), c = Math.min(w, h) * .16;
      el.insertAdjacentHTML('afterbegin', `<svg viewBox="-4 -4 ${w+8} ${h+8}" aria-hidden="true"><path class="ct-fill" d="${box(w,h,0,c)}"/><path class="ct-hi" d="${box(w,h,0,c)}" transform="translate(-.8 -.8)"/><path class="ct-in" d="${box(w,h,5,c*.8)}"/><circle class="ct-dot" cx="${w/2}" cy="0" r="3"/><circle class="ct-dot" cx="${w/2}" cy="${h}" r="3"/></svg>`);
    });

    // venue
    const gmaps = q => /^https?:\/\//.test(q) ? q : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
    frame.querySelector('[data-map="A"]').href = gmaps(ev.mapA || ev.venueA || '');
    if (ev.venueB) frame.querySelector('[data-map="B"]').href = gmaps(ev.mapB || ev.venueB);
    else { frame.querySelector('.vB').remove(); frame.querySelector('.map .two').remove(); }
    const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    $('calLink').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(`${ev.a} & ${ev.b}`)
      + '&dates=' + z(when) + '/' + z(end) + '&location=' + encodeURIComponent(ev.mapA || ev.venueA || '');

    // which pages to show
    const now = Date.now();
    const afterStart = now > when.getTime() - 6 * 3600e3;
    const drop = p => { const el = frame.querySelector(`[data-p="${p}"]`); if (el) el.remove(); };
    if (!(ev.timeline || []).length && !ev.dress) drop('day');
    const photos = ev.photos || [];
    if (!photos.length && !isDraft) drop('photos');
    if (!(afterStart && (guest || ev.demo)) || isDraft || isPreview) drop('gallery');
    if (now > end.getTime()) drop('countdown');

    // programme
    const tl = $('timeline');
    if (tl) (ev.timeline || []).forEach(([t, what], k) => {
      const li = document.createElement('li'); li.className = 'rv'; li.style.setProperty('--i', k + 1);
      li.innerHTML = '<time></time><span></span>'; li.querySelector('time').textContent = String(t).toUpperCase(); li.querySelector('span').textContent = what;
      tl.appendChild(li);
    });

    // photos carousel
    if (frame.querySelector('[data-p="photos"]')) {
      const sl = $('slides'), sd = $('sdots');
      if (!photos.length) sl.innerHTML = '<div class="ph-empty">Your couple photos will appear here</div>';
      photos.forEach((p, i) => {
        const im = new Image(); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.src = p.url; if (!i) im.classList.add('on'); sl.appendChild(im);
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Photo ' + (i + 1)); if (!i) b.setAttribute('aria-current', 'true');
        b.onclick = () => show(i); sd.appendChild(b);
      });
      let cur = 0, timer = null;
      function show(i){ const ims = sl.querySelectorAll('img'), ds = sd.children; if (!ims.length) return; cur = (i + ims.length) % ims.length;
        ims.forEach((m, k) => m.classList.toggle('on', k === cur)); [...ds].forEach((d, k) => k === cur ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')); }
      if (photos.length > 1) timer = setInterval(() => show(cur + 1), 4200);
      sl.addEventListener('click', () => show(cur + 1));
    }

    // countdown
    const pad = n => String(n).padStart(2, '0');
    function tick(){ let s = Math.max(0, Math.floor((when - Date.now()) / 1000)); $('cdD').textContent = Math.floor(s / 86400); s %= 86400;
      $('cdH').textContent = pad(Math.floor(s / 3600)); s %= 3600; $('cdM').textContent = pad(Math.floor(s / 60)); $('cdS').textContent = pad(s % 60); }
    if ($('cdD')) { tick(); setInterval(tick, 1000); }

    // host contact
    if (ev.hostPhone) { $('hostLine').hidden = false; $('hostLink').href = 'https://wa.me/' + ev.hostPhone.replace(/\D/g, '') + '?text=' + encodeURIComponent(`Hello! A question about ${ev.a} & ${ev.b}’s invitation.`); }

    // status ribbon
    if (isPreview && !embed) frame.insertAdjacentHTML('beforeend', '<div class="badge">PREVIEW · REPLIES HERE ARE NOT SAVED</div>');

    // ---------- RSVP ----------
    let me = guest ? Object.assign({}, guest) : null;
    let choice = null, count = 1;
    const form = $('rsvpForm'), done = $('rsvpDone');
    const seats = () => (me && me.seats) || 1;
    function setChoice(s){ choice = s; form.querySelectorAll('[data-s]').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === s)); $('counter').hidden = !(s === 'yes' && seats() > 1); }
    function setCount(n){ count = Math.min(Math.max(n, 1), seats()); $('cVal').textContent = count; }
    form.querySelectorAll('[data-s]').forEach(b => b.onclick = () => setChoice(b.dataset.s));
    $('cMinus').onclick = () => setCount(count - 1); $('cPlus').onclick = () => setCount(count + 1);
    function showDone(){
      form.hidden = true; done.hidden = false;
      const name = me.name.split(/\s+/).length > 3 ? '' : ', ' + me.name;
      $('doneText').textContent = me.status === 'yes'
        ? `Thank you${name}. We can’t wait to celebrate with you${me.count > 1 ? ` (${me.count} people)` : ''}.`
        : `Thank you for letting us know${name}. You’ll be dearly missed.`;
      $('passBtn').hidden = me.status !== 'yes';
      $('ask').textContent = me.status === 'yes' ? 'See you there' : 'With love';
    }
    if (!me && !ev.openRsvp && !trial) {
      form.innerHTML = `<p class="lede" style="margin-top:1cqh">${guestId ? 'This personal link is no longer active. Please contact the hosts for a new one.' : 'Please use the personal link you were sent to reply.'}</p>`;
    } else if (!me && !trial) { $('whoFields').hidden = false; }
    if (me && me.status && me.status !== 'pending') { setChoice(me.status); setCount(me.count || 1); $('fNote').value = me.note || ''; showDone(); }
    else setCount(1);
    $('changeBtn').onclick = () => { done.hidden = true; form.hidden = false; $('ask').textContent = 'Will you join us?'; };
    form.addEventListener('submit', async e => {
      e.preventDefault(); const err = $('rsvpErr'); err.textContent = '';
      if (!choice) { err.textContent = 'Please choose accept or decline.'; return; }
      const body = { slug: ev.slug, status: choice, count, note: $('fNote').value };
      if (trial) {} else if (me) body.g = me.id; else { body.name = $('fName').value.trim(); body.phone = $('fPhone').value.trim(); if (!body.name) { err.textContent = 'Please enter your name.'; return; } }
      if (trial) { me = Object.assign(me || { name: guestName, seats: 2 }, { status: choice, count }); showDone(); toast(isPreview ? 'Preview only. Replies from personal links are saved.' : 'This is a demo, so nothing was saved.'); if (choice === 'yes') setTimeout(openPass, 700); return; }
      const btn = $('sendBtn'); btn.disabled = true; btn.textContent = 'Sending your reply…';
      try {
        const r = await fetch('/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Could not send your reply');
        me = j.guest;
        if (!guestId) { guestId = me.id; const u = new URL(location.href); u.searchParams.set('g', me.id); history.replaceState(null, '', u); }
        showDone(); if (me.status === 'yes') openPass();
      } catch (x) { err.textContent = /fetch|network/i.test(x.message) ? 'No connection. Please check your internet and try again.' : x.message; } finally { btn.disabled = false; btn.textContent = 'Send my reply'; }
    });

    function openPass(){
      if (!me || typeof qrcode !== 'function') return;
      const q = qrcode(0, 'M'); q.addData(`INV:${ev.slug}:${me.id || 'sample'}`); q.make();
      $('passQr').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
      $('passName').textContent = me.name; $('passEvent').textContent = `${ev.a} & ${ev.b} · ${F.day} ${fmt({ month: 'short' })} ${F.year}`;
      $('passAdm').textContent = `ADMITS ${me.count || 1}`; $('passSample').hidden = !trial; $('pass').hidden = false;
    }
    $('passBtn').onclick = openPass; $('passClose').onclick = () => $('pass').hidden = true;

    // ---------- gallery (after the event) ----------
    if (frame.querySelector('[data-p="gallery"]')) {
      const gal = $('gal');
      const addThumb = url => { const im = new Image(); im.src = url; im.alt = ''; im.loading = 'lazy'; gal.prepend(im); };
      if (!ev.demo) fetch(`/api/gallery?slug=${encodeURIComponent(ev.slug)}&g=${encodeURIComponent(guestId)}`).then(r => r.json()).then(j => (j.items || []).slice(0, 30).reverse().forEach(it => addThumb(it.url))).catch(() => {});
      $('galInput').addEventListener('change', async e => {
        const files = [...e.target.files].slice(0, 10); e.target.value = '';
        if (ev.demo) { toast('This is a demo, so photos are not uploaded.'); return; }
        for (const f of files) {
          try { toast('Uploading…'); const blob = await shrink(f, 1600);
            const r = await fetch(`/api/upload?slug=${encodeURIComponent(ev.slug)}&g=${encodeURIComponent(guestId)}&kind=gallery&name=${encodeURIComponent(f.name.replace(/\.\w+$/, '') + '.jpg')}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
            const j = await r.json(); if (!r.ok) throw new Error(j.error); addThumb(j.item.url); toast('Photo added. Thank you!');
          } catch (x) { toast(x.message || 'Upload failed'); }
        }
      });
    }

    // ---------- music ----------
    let audio = null;
    if (ev.music && ev.music.url) {
      audio = new Audio(ev.music.url); audio.loop = true; audio.preload = 'auto';
      const mb = $('music'); mb.hidden = false;
      mb.onclick = () => { if (audio.paused) audio.play().catch(() => {}); else audio.pause(); };
      audio.addEventListener('play', () => { mb.classList.remove('paused'); mb.setAttribute('aria-label', 'Pause music'); });
      audio.addEventListener('pause', () => { mb.classList.add('paused'); mb.setAttribute('aria-label', 'Play music'); });
    } else $('music').remove();

    // ---------- navigation ----------
    const gate = $('gate');
    const pages = [...frame.querySelectorAll('.page')];
    const next = $('next'), dots = $('dots');
    let cur = -1, opened = false, busy = false;
    pages.forEach((p, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', p.getAttribute('aria-label')); b.onclick = () => go(i); dots.appendChild(b); });
    function go(i){
      if (!opened || busy || i === cur || i < 0 || i >= pages.length) return;
      busy = true; const dir = i > cur ? 'leave-up' : 'leave-down', old = pages[cur];
      if (old) { old.classList.add(dir); old.classList.remove('on'); setTimeout(() => old.classList.remove(dir), 520); }
      setTimeout(() => { cur = i; pages[i].classList.add('on');
        [...dots.children].forEach((d, k) => k === i ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current'));
        next.hidden = i === pages.length - 1; busy = false; }, old ? 380 : 0);
    }
    function openGate(instant){
      if (opened || gate.classList.contains('opening')) return;
      if (audio) { try { audio.volume = 0; audio.play().then(() => { let v = 0; const f = setInterval(() => { v = Math.min(1, v + .05); audio.volume = v; if (v >= 1) clearInterval(f); }, 120); }).catch(() => {}); } catch {} }
      if (instant) { gate.classList.add('gone'); frame.classList.add('open'); opened = true; go(0); return; }
      gate.classList.add('opening'); frame.classList.add('opening');
      setTimeout(() => { frame.classList.add('open'); opened = true; go(0); }, T.openMs || 900);
      setTimeout(() => gate.classList.add('gone'), T.goneMs || 1800);
    }
    $('seal').addEventListener('click', e => { e.stopPropagation(); openGate(); });
    gate.addEventListener('click', () => openGate());
    next.onclick = () => go(cur + 1);
    $('again').onclick = () => go(0);
    let y0 = null;
    frame.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; }, { passive: true });
    frame.addEventListener('touchend', e => {
      if (y0 === null) return; const dy = e.changedTouches[0].clientY - y0; y0 = null;
      if (e.target.closest('form,.gal,.pass')) return;
      if (!opened) { if (Math.abs(dy) > 40) openGate(); return; }
      if (dy < -50) go(cur + 1); else if (dy > 50) go(cur - 1);
    });
    window.addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input,textarea')) return;
      if (!opened) { if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body) { e.preventDefault(); openGate(); } return; }
      if (['ArrowDown', 'PageDown'].includes(e.key)) go(cur + 1);
      if (['ArrowUp', 'PageUp'].includes(e.key)) go(cur - 1);
    });
    let wheelLock = 0;
    window.addEventListener('wheel', e => { if (!opened || Date.now() < wheelLock || Math.abs(e.deltaY) < 30 || e.target.closest('.gal')) return; wheelLock = Date.now() + 900; go(cur + (e.deltaY > 0 ? 1 : -1)); }, { passive: true });

    // builder preview: jump straight to a page
    if (qs.has('open')) { openGate(true); const p = qs.get('page'); if (p) { const i = pages.findIndex(x => x.dataset.p === p); if (i > 0) setTimeout(() => { busy = false; go(i); }, 50); } }
    window.__goPage = name => { if (!opened) openGate(true); const i = pages.findIndex(x => x.dataset.p === name); if (i >= 0) setTimeout(() => go(i), 60); };
  }

  // downscale photos before upload so they load fast on mobile data
  function shrink(file, max){
    return new Promise((resolve, reject) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => { URL.revokeObjectURL(url); b ? resolve(b) : reject(new Error('Could not read that photo')); }, 'image/jpeg', .85); };
      img.onerror = () => reject(new Error('Could not read that photo')); img.src = url;
    });
  }
})();