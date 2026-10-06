(function () {
  const { $, $$, esc, icon, api, toast, fail, ugx, wa, ago, fmtDate, copy } = UI; const B = BRAND;
  UI.header(); UI.brand();
  const slug = decodeURIComponent((location.pathname.match(/\/dashboard\/([^/?#]+)/) || [])[1] || '');
  const key = new URLSearchParams(location.search).get('k') || '';
  const origin = location.origin;
  const S = { ev: null, guests: [], stats: {}, limit: 0, filter: 'all', q: '', msg: 'invite', sentNow: new Set() };
  const DEFAULT_MSG = {
    invite: 'Dear {name},\n\n{couple} would love for you to celebrate with them on {date}.\n\nTap to open your personal invitation: {link}',
    reminder: 'Hello {name}, a gentle reminder to reply to {couple}’s invitation{rsvpByText}. It only takes a moment: {link}',
    dayBefore: 'Hello {name}! {couple} can’t wait to see you tomorrow at {venue}. Your entry pass is in your invitation: {link}',
    thanks: 'Dear {name}, thank you for celebrating with {couple}. We’d love to see the moments you captured. Add your photos here: {link}'
  };
  const MSG_LABEL = { invite: 'Still to send', reminder: 'Awaiting a reply', dayBefore: 'Attending guests', thanks: 'Guests to thank' };
  const glink = g => `${origin}/i/${slug}?g=${g.id}`;
  const k = () => `slug=${encodeURIComponent(slug)}`;
  const initials = n => (n.replace(/^(mr|mrs|ms|dr|prof|rev|aunt|uncle|hon)\.?\s+(&\s+(mr|mrs|ms|dr)\.?\s+)?/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('') || '?').toUpperCase();
  $('#helpBtn').href = wa(B.salesWhatsApp, `Hello ${B.name}! I need help with my invitation (${slug}).`);

  if (!slug || !key) return fatal('This dashboard link is incomplete', 'Please open the full link you saved when you created your invitation.');

  function fatal(title, text) {
    $('#app').innerHTML = `<div class="wrap fatal">${icon('lock')}<h1 class="h2" style="font-size:2rem">${esc(title)}</h1><p class="muted" style="max-width:32em">${esc(text)}</p>
      <div class="row" style="justify-content:center"><a class="btn" href="/">Go to homepage</a><a class="btn primary" target="_blank" rel="noopener" href="${wa(B.salesWhatsApp, `Hello ${B.name}! I can't open my dashboard.`)}">${icon('whatsapp')}Contact support</a></div></div>`;
  }

  // ---------- tabs ----------
  $$('.tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
  function showTab(t) {
    $$('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
    $$('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== t);
    if (t === 'gallery') loadGallery(); if (t === 'send') drawQueue();
    history.replaceState(null, '', location.pathname + location.search + '#' + t);
  }
  document.addEventListener('click', e => { const c = e.target.closest('[data-copy]'); if (c) copy($('#' + c.dataset.copy).textContent, 'Link copied'); const g = e.target.closest('[data-goto]'); if (g) { e.preventDefault(); showTab(g.dataset.goto); scrollTo({ top: $('.tabs').offsetTop - 70, behavior: 'smooth' }); } });

  async function loadEvent() { const r = await api(`event?${k()}&preview=1`, { key }); S.ev = r.event; S.limit = r.limit; drawHeader(); drawMedia(); drawGate(); }
  async function loadGuests() { const r = await api(`guests?${k()}`, { key }); S.guests = r.guests; S.stats = r.stats; S.limit = r.limit; drawAll(); }
  function drawAll() { drawOverview(); drawGuests(); drawQueue(); drawGateStats(); drawChecklist(); $('#gCount').textContent = S.guests.length; }

  const planOf = id => B.plans.find(p => p.id === id) || B.plans.find(p => p.popular) || B.plans[0];
  function drawHeader() {
    const ev = S.ev, tpl = B.templates.find(t => t.id === ev.template), plan = planOf(ev.plan);
    document.title = `${ev.a} & ${ev.b} · Dashboard · RibbonInvites`;
    $('#evTitle').textContent = `${ev.a} & ${ev.b}`;
    $('#evMeta').innerHTML = `<span>${icon('calendar')}${esc(fmtDate(ev.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</span>
      <span>${icon('pin')}${esc(ev.venueA || '')}</span><span>${icon('palette')}${esc(tpl ? tpl.name : ev.template)}</span>
      ${ev.active ? `<span class="badge ok">Active · ${esc(ev.plan === 'custom' ? 'Custom plan' : plan.name)}</span>` : '<span class="badge warn">Preview</span>'}`;
    $('#viewBtn').href = `/i/${slug}?preview=1`;
    $('#viewBtn').onclick = () => { try { localStorage.setItem('pv:' + slug, '1'); } catch {} setTimeout(drawChecklist, 300); };
    $('#editBtn').href = `/create?slug=${encodeURIComponent(slug)}&k=${encodeURIComponent(key)}`;
    $('#prevLink').textContent = `${origin}/i/${slug}?preview=1`;
    $('#genLink').textContent = `${origin}/i/${slug}`; $('#genWrap').hidden = !ev.openRsvp;
    $('#dashLink').textContent = location.href.split('#')[0];
    drawBanner();
  }

  function drawBanner() {
    const ev = S.ev, el = $('#banner');
    if (ev.active) { el.innerHTML = ''; return; }
    const plan = planOf(ev.plan);
    el.innerHTML = `<div class="activate" id="activate">
      <div class="l">
        <span class="badge gold plain">${icon('sparkle', 'i-sm')}Preview mode</span>
        <h2>Activate to invite your full guest list</h2>
        <p>Your invitation is fully working. You can test it with up to 5 guests, yourself included. When you’re happy, activate your plan to send to everyone.</p>
        <div class="field" style="max-width:420px"><label class="lbl" for="planSel">Your plan</label>
          <select class="select" id="planSel">${B.plans.map(p => `<option value="${p.id}" ${p.id === ev.plan ? 'selected' : ''}>${esc(p.name)} · up to ${p.guests} guests · ${ugx(p.price)}</option>`).join('')}</select></div>
      </div>
      <div class="r">
        <ol><li>Send ${ugx(plan.price)} by Mobile Money to the details below.</li><li>Tap “I’ve paid” and share your transaction ID.</li><li>We activate your invitation, usually within the hour.</li></ol>
        <div class="paybox"><b>${ugx(plan.price)}</b>${B.payment.lines.map(l => `<span>${esc(l)}</span>`).join('')}<span>Name: ${esc(B.payment.accountName)}</span></div>
        <div class="row"><a class="btn wa" target="_blank" rel="noopener" href="${wa(B.salesWhatsApp, `Hello ${B.name}! I've paid ${ugx(plan.price)} for the ${plan.name} plan for ${ev.a} & ${ev.b}'s invitation.\nReference: ${slug}\nTransaction ID: `)}">${icon('whatsapp')}I’ve paid</a>
          <a class="btn ghost" target="_blank" rel="noopener" href="${wa(B.salesWhatsApp, `Hello ${B.name}! I have a question about my invitation (${slug}).`)}">Ask a question</a></div>
      </div></div>`;
    $('#planSel').onchange = async e => {
      try { await api(`event?${k()}`, { method: 'PUT', key, body: { plan: e.target.value } }); S.ev.plan = e.target.value; drawBanner(); toast('Plan updated'); }
      catch (x) { fail(x); }
    };
  }

  // ---------- overview ----------
  function drawOverview() {
    const s = S.stats, n = s.invited || 0, pct = v => n ? Math.round(v / n * 100) : 0;
    $('#stats').innerHTML = [
      ['users', 'Guests', n, `of ${S.limit} on your ${S.ev && S.ev.active ? 'plan' : 'preview'}`],
      ['send', 'Sent', s.sent, `${pct(s.sent)}% of guests`],
      ['eye', 'Opened', s.opened, `${pct(s.opened)}% of guests`],
      ['heart', 'People attending', s.attending, `${s.yes} accepted · ${s.no} declined`]
    ].map(([ic, a, b, c]) => `<div class="stat"><small>${icon(ic)}${a}</small><b>${b}</b><span>${c}</span></div>`).join('');
    const seg = [['var(--ok)', s.yes, 'Accepted'], ['var(--bad)', s.no, 'Declined'], ['var(--line-2)', s.pending, 'Awaiting reply']];
    $('#bar').innerHTML = n ? seg.filter(x => x[1]).map(([c, v]) => `<i style="width:${v / n * 100}%;background:${c}"></i>`).join('') : '';
    $('#legend').innerHTML = seg.map(([c, v, l]) => `<span><i style="background:${c}"></i>${l} <b>${v}</b></span>`).join('');
    $('#replyLine').textContent = n ? `${pct(s.yes + s.no)}% of guests have replied.` : 'Replies appear here as guests respond.';
    const ev = [];
    for (const g of S.guests) {
      if (g.respondedAt) ev.push([g.respondedAt, g.status === 'yes' ? ['var(--ok-soft)', 'var(--ok)', 'check'] : ['var(--bad-soft)', 'var(--bad)', 'x'],
        `<b>${esc(g.name)}</b> ${g.status === 'yes' ? `accepted${g.count > 1 ? ` for ${g.count}` : ''}` : 'declined'}`]);
      if (g.firstOpen) ev.push([g.firstOpen, ['var(--gold-soft)', 'var(--gold-2)', 'mail-open'], `<b>${esc(g.name)}</b> opened the invitation`]);
      if (g.checkedInAt) ev.push([g.checkedInAt, ['var(--ribbon-soft)', 'var(--ribbon)', 'door'], `<b>${esc(g.name)}</b> arrived`]);
    }
    ev.sort((a, b) => b[0] - a[0]);
    $('#feed').innerHTML = ev.length ? ev.slice(0, 10).map(([t, [bg, fg, ic], h]) => `<div><span class="fi" style="background:${bg};color:${fg}">${icon(ic)}</span><span>${h}</span><time>${ago(t)}</time></div>`).join('')
      : `<p class="empty">${icon('bell')}<span>No activity yet. When guests open and reply, you’ll see it here.</span></p>`;
  }

  function drawChecklist() {
    if (!S.ev) return;
    let previewed = false; try { previewed = !!localStorage.getItem('pv:' + slug); } catch {}
    const opened = S.guests.some(g => g.opens), many = S.guests.length > 1, live = S.ev.active, sent = (S.stats.sent || 0) > 0;
    const items = [
      [previewed, 'Preview your invitation', 'See it exactly as your guests will.', `<a class="btn sm" href="/i/${slug}?preview=1" target="_blank" rel="noopener" data-pv>${icon('eye')}Preview</a>`],
      [opened, 'Test it as a guest', 'Add yourself, open your personal link and try replying.', `<button class="btn sm primary" type="button" data-test>${icon('user-plus')}Add me as a test guest</button>`],
      [many, 'Add your guests', 'Paste your list, with WhatsApp numbers if you have them.', `<button class="btn sm" type="button" data-goto="guests">${icon('users')}Add guests</button>`],
      [live && sent, live ? 'Send your invitations' : 'Activate and send', live ? 'Send each guest their personal link on WhatsApp.' : 'Pay for your plan to invite your full list.',
        live ? `<button class="btn sm" type="button" data-goto="send">${icon('send')}Send</button>` : `<button class="btn sm" type="button" data-act>${icon('sparkle')}Activate</button>`]
    ];
    $('#checklist').innerHTML = items.map(([d, t, s, b]) => `<div class="ck${d ? ' done' : ''}"><span class="dot">${icon('check')}</span><div><b>${t}</b><span>${s}</span></div>${d ? '' : b}</div>`).join('');
    $('#startCard').hidden = items.every(i => i[0]);
    const pv = $('[data-pv]', $('#checklist')); if (pv) pv.onclick = () => { try { localStorage.setItem('pv:' + slug, '1'); } catch {} setTimeout(drawChecklist, 300); };
    const t = $('[data-test]', $('#checklist')); if (t) t.onclick = addTestGuest;
    const a = $('[data-act]', $('#checklist')); if (a) a.onclick = () => $('#activate').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function addTestGuest() {
    const m = UI.modal(`<h3 class="h3" style="padding-right:30px">Add yourself as a test guest</h3>
      <p class="muted" style="margin:8px 0 18px">You’ll get your own personal link, just like a guest. Open it, tap the seal and try replying. You can remove yourself afterwards to free the place.</p>
      <form class="stack" id="tg"><div class="field"><label class="lbl" for="tgName">Your name, as a guest would see it</label><input class="input" id="tgName" value="${esc(S.ev.a)}" required></div>
      <div class="field"><label class="lbl" for="tgPhone">Your WhatsApp number <span class="opt">Optional</span></label><input class="input" id="tgPhone" type="tel" inputmode="tel" placeholder="e.g. 0772 123 456"></div>
      <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Create my test link</button></div></form>`);
    $('#tg', m).onsubmit = async e => {
      e.preventDefault();
      const name = $('#tgName', m).value.replace(/[,;\t]/g, ' ').trim(); if (!name) return;
      try {
        const r = await api(`guests?${k()}`, { method: 'POST', key, body: { lines: [`${name}, ${$('#tgPhone', m).value}`] } });
        if (!r.added.length) throw new Error(r.skipped[0] && r.skipped[0].reason === 'plan limit reached' ? 'Your preview is full (5 guests). Remove a guest to add yourself.' : 'A guest with that name is already on your list.');
        m.close(); await loadGuests(); showTestLink(r.added[0]);
      } catch (x) { fail(x); }
    };
  }
  function showTestLink(g) {
    const link = glink(g);
    const m = UI.modal(`<span class="badge ok">Test link ready</span><h3 class="h3" style="margin-top:12px">Open your invitation as a guest</h3>
      <p class="muted" style="margin:8px 0 16px">This link is personal to <b>${esc(g.name)}</b>. Open it on your phone to see the full experience, then come back here to watch your reply arrive.</p>
      <div class="linkbox"><code>${esc(link)}</code><button class="btn sm" type="button" id="tlc">${icon('copy')}Copy</button></div>
      <div class="row" style="margin-top:18px"><a class="btn wa" target="_blank" rel="noopener" href="${wa(g.phone, `My test invitation: ${link}`)}">${icon('whatsapp')}Send to my phone</a><span class="spacer"></span><a class="btn primary" href="${esc(link)}" target="_blank" rel="noopener">${icon('external')}Open it now</a></div>`);
    $('#tlc', m).onclick = () => copy(link, 'Test link copied');
  }

  // ---------- guests ----------
  const FILTERS = [['all', 'All', () => true], ['notsent', 'Not sent', g => !g.sentAt], ['unopened', 'Not opened', g => !g.opens],
    ['pending', 'Awaiting', g => (g.status || 'pending') === 'pending'], ['yes', 'Attending', g => g.status === 'yes'], ['no', 'Declined', g => g.status === 'no'], ['in', 'Arrived', g => !!g.checkedInAt]];
  function statusBadge(g) {
    if (g.checkedInAt) return '<span class="badge ribbon">Arrived</span>';
    if (g.status === 'yes') return `<span class="badge ok">Attending${g.count > 1 ? ' · ' + g.count : ''}</span>`;
    if (g.status === 'no') return '<span class="badge bad">Declined</span>';
    return '<span class="badge">Awaiting reply</span>';
  }
  function drawGuests() {
    $('#filters').innerHTML = FILTERS.map(([id, l, f]) => `<button data-f="${id}" aria-pressed="${S.filter === id}">${l}<em>${S.guests.filter(f).length}</em></button>`).join('');
    $$('#filters button').forEach(b => b.onclick = () => { S.filter = b.dataset.f; drawGuests(); });
    const f = FILTERS.find(x => x[0] === S.filter)[2], q = S.q.toLowerCase();
    const list = S.guests.filter(f).filter(g => !q || g.name.toLowerCase().includes(q) || (g.phone || '').includes(q.replace(/\D/g, '') || '#'));
    const left = Math.max(S.limit - S.guests.length, 0);
    $('#limitNote').textContent = S.ev && !S.ev.active
      ? `${S.guests.length} of 5 preview places used. Activate your plan to add your full list.`
      : `${S.guests.length} of ${S.limit} guests on your plan. ${left} place${left === 1 ? '' : 's'} left.`;
    $('#glist').innerHTML = `<div class="grow h"><span>GUEST</span><span>SEATS</span><span>REPLY</span><span>OPENED</span><span></span></div>` +
      (list.length ? list.map(g => `<div class="grow">
        <div class="nm"><span class="av">${esc(initials(g.name))}</span><div><b>${esc(g.name)}</b><span>${g.phone ? '+' + esc(g.phone) : 'No number'}${g.sentAt ? ` · ${icon('check', 'i-sm')}Sent` : ''}</span></div></div>
        <span class="seats">${g.seats || 1}</span><span>${statusBadge(g)}</span>
        <span class="seen">${g.opens ? `${icon('eye')}${ago(g.lastOpen)}` : '<span class="faint">Not yet</span>'}</span>
        <span class="acts">
          <a class="btn sm wa" data-send="${g.id}" target="_blank" rel="noopener" href="${wa(g.phone, fill(msgTpl('invite'), g))}" aria-label="Send to ${esc(g.name)} on WhatsApp">${icon('whatsapp')}Send</a>
          <button class="btn sm icon-btn" data-link="${g.id}" aria-label="Copy link for ${esc(g.name)}" title="Copy link">${icon('link')}</button>
          <button class="btn sm icon-btn" data-edit="${g.id}" aria-label="Edit ${esc(g.name)}" title="Edit">${icon('edit')}</button>
        </span>
        ${g.note ? `<div class="note">${icon('message')}<span>“${esc(g.note)}”</span></div>` : ''}
      </div>`).join('') : `<div class="empty">${icon('users')}${S.guests.length ? '<span>No guests match this filter.</span>' : '<b>No guests yet</b><span>Add your first guests above, or add yourself as a test guest from the Overview.</span>'}</div>`);
  }
  $('#glist').addEventListener('click', e => {
    const s = e.target.closest('[data-send]'), l = e.target.closest('[data-link]'), ed = e.target.closest('[data-edit]');
    if (s) markSent(s.dataset.send, 'markSent');
    if (l) { const g = S.guests.find(x => x.id === l.dataset.link); copy(glink(g), `Link for ${g.name} copied`); }
    if (ed) editGuest(ed.dataset.edit);
  });
  $('#search').oninput = e => { S.q = e.target.value; drawGuests(); };

  async function markSent(id, flag) {
    S.sentNow.add(id + flag);
    try { const r = await api(`guest?${k()}&id=${id}`, { method: 'PATCH', key, body: { [flag]: true } }); const i = S.guests.findIndex(g => g.id === id); if (i >= 0) S.guests[i] = r.guest; } catch {}
    setTimeout(() => loadGuests().catch(() => {}), 800);
  }
  function editGuest(id) {
    const g = S.guests.find(x => x.id === id);
    const m = UI.modal(`<h3 class="h3" style="padding-right:30px">Edit guest</h3><form class="stack" id="eg" style="margin-top:18px">
      <div class="field"><label class="lbl" for="eName">Name, as it appears on the invitation</label><input class="input" id="eName" value="${esc(g.name)}"></div>
      <div class="grid2"><div class="field"><label class="lbl" for="ePhone">WhatsApp number</label><input class="input" id="ePhone" type="tel" value="${g.phone ? '+' + esc(g.phone) : ''}" placeholder="e.g. 0772 123 456"></div>
      <div class="field"><label class="lbl" for="eSeats">Seats</label><input class="input" id="eSeats" type="number" min="1" max="20" value="${g.seats || 1}"></div></div>
      <div class="field"><label class="lbl" for="eStatus">Reply</label><select class="select" id="eStatus"><option value="pending">Awaiting reply</option><option value="yes">Attending</option><option value="no">Declined</option></select><p class="hint">Update this if a guest replied by phone or in person.</p></div>
      ${g.note ? `<div class="notice">${icon('message')}<span>“${esc(g.note)}”</span></div>` : ''}
      <div class="row"><button class="btn danger sm" type="button" id="eDel">${icon('trash')}Remove guest</button><span class="spacer"></span><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Save</button></div></form>`);
    $('#eStatus', m).value = g.status || 'pending';
    $('#eg', m).onsubmit = async e => {
      e.preventDefault();
      try { await api(`guest?${k()}&id=${id}`, { method: 'PATCH', key, body: { name: $('#eName', m).value, phone: $('#ePhone', m).value, seats: $('#eSeats', m).value, status: $('#eStatus', m).value } });
        m.close(); toast('Guest updated'); loadGuests(); } catch (x) { fail(x); }
    };
    $('#eDel', m).onclick = async () => {
      if (!await UI.confirm(`Remove ${g.name}?`, 'Their personal link will stop working and their reply will be deleted.', { ok: 'Remove guest', danger: true })) return;
      try { await api(`guest?${k()}&id=${id}`, { method: 'DELETE', key }); m.close(); toast('Guest removed'); loadGuests(); } catch (x) { fail(x); }
    };
  }
  $('#addGuests').onclick = async e => {
    const text = $('#newGuests').value.trim(); if (!text) { $('#newGuests').focus(); return toast('Type or paste at least one name', { error: true }); }
    await UI.busy(e.currentTarget, async () => {
      try {
        const r = await api(`guests?${k()}`, { method: 'POST', key, body: { text } });
        $('#newGuests').value = '';
        const over = r.skipped.filter(s => s.reason === 'plan limit reached').length, dup = r.skipped.length - over;
        const parts = [`${r.added.length} guest${r.added.length === 1 ? '' : 's'} added`]; if (dup) parts.push(`${dup} already on the list`); if (over) parts.push(`${over} over your limit`);
        toast(parts.join(' · '), { ms: 4500, error: !r.added.length });
        if (over && !S.ev.active) setTimeout(() => toast('Activate your plan to add your full guest list', { ms: 4500 }), 4600);
        await loadGuests();
      } catch (x) { fail(x); }
    });
  };
  $('#exportCsv').onclick = () => {
    const rows = [['Name', 'Phone', 'Seats', 'Reply', 'Attending', 'Times opened', 'Note', 'Arrived', 'Personal link']].concat(S.guests.map(g => [g.name, g.phone ? '+' + g.phone : '', g.seats || 1, g.status || 'pending', g.status === 'yes' ? g.count || 1 : 0, g.opens || 0, g.note || '', g.checkedInAt ? new Date(g.checkedInAt).toLocaleString('en-GB') : '', glink(g)]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = `${slug}-guest-list.csv`; a.click();
    toast('Guest list downloaded');
  };

  // ---------- messages ----------
  const msgTpl = t => (S.ev && S.ev.messages && S.ev.messages[t]) || DEFAULT_MSG[t];
  function fill(tpl, g) {
    const ev = S.ev || {}, rb = ev.rsvpBy ? fmtDate(ev.rsvpBy + 'T12:00:00+03:00', { day: 'numeric', month: 'long' }) : '';
    return tpl.replaceAll('{name}', g.name).replaceAll('{couple}', `${ev.a} & ${ev.b}`)
      .replaceAll('{date}', fmtDate(ev.date, { weekday: 'long', day: 'numeric', month: 'long' })).replaceAll('{venue}', ev.venueA || '')
      .replaceAll('{rsvpByText}', rb ? ' by ' + rb : '').replaceAll('{rsvpBy}', rb || 'soon').replaceAll('{link}', glink(g));
  }
  const QUEUE = { invite: [g => !g.sentAt, 'markSent'], reminder: [g => (g.status || 'pending') === 'pending', 'markReminded'],
    dayBefore: [g => g.status === 'yes', 'markReminded'], thanks: [g => g.status === 'yes' || !!g.checkedInAt, 'markReminded'] };
  $$('#msgType button').forEach(b => b.onclick = () => { S.msg = b.dataset.m; $$('#msgType button').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#msgText').value = msgTpl(S.msg); drawQueue(true); });
  $('#msgText').oninput = () => drawQueue(true);
  $('#saveMsg').onclick = async () => {
    const messages = Object.assign({}, S.ev.messages || {}, { [S.msg]: $('#msgText').value });
    try { const r = await api(`event?${k()}`, { method: 'PUT', key, body: { event: { messages } } }); S.ev = r.event; toast('Wording saved'); } catch (x) { fail(x); }
  };
  $('#resetMsg').onclick = () => { $('#msgText').value = DEFAULT_MSG[S.msg]; drawQueue(true); toast('Default wording restored. Save to keep it.'); };
  function drawQueue(keep) {
    if (!S.ev) return;
    if (!keep && document.activeElement !== $('#msgText')) $('#msgText').value = msgTpl(S.msg);
    const [f, flag] = QUEUE[S.msg], tpl = $('#msgText').value, list = S.guests.filter(f);
    const sample = S.guests[0] || { id: 'example', name: 'Grace Nakato' };
    $('#bubble').textContent = fill(tpl, sample); $('#prevFor').textContent = `How it reads for ${sample.name}.`;
    $('#queueTitle').textContent = MSG_LABEL[S.msg];
    $('#queueCount').textContent = `${list.length} guest${list.length === 1 ? '' : 's'}`;
    $('#queue').innerHTML = list.length ? list.map(g => { const done = S.sentNow.has(g.id + flag); return `<div class="q${done ? ' done' : ''}"><span class="av">${esc(initials(g.name))}</span>
      <div class="who"><b>${esc(g.name)}</b><span>${g.phone ? '+' + esc(g.phone) : 'No number. WhatsApp will ask you to pick the contact.'}</span></div>
      <a class="btn sm ${done ? '' : 'wa'}" target="_blank" rel="noopener" data-q="${g.id}" href="${wa(g.phone, fill(tpl, g))}">${done ? icon('check') + 'Sent' : icon('whatsapp') + 'Send'}</a></div>`; }).join('')
      : `<div class="card flat empty">${icon('check-circle')}<span>Nobody to message here right now.</span></div>`;
  }
  $('#queue').addEventListener('click', e => { const a = e.target.closest('[data-q]'); if (a) { markSent(a.dataset.q, QUEUE[S.msg][1]); a.closest('.q').classList.add('done'); a.classList.remove('wa'); a.innerHTML = icon('check') + 'Sent'; } });

  // ---------- music & photos ----------
  function drawMedia() {
    const ev = S.ev;
    $('#musicNow').innerHTML = ev.music
      ? `<div class="music-now"><span class="disc">${icon('music', 'i-sm')}</span><div style="flex:1;min-width:0"><b>${esc(ev.music.name)}</b><audio controls preload="none" src="${esc(ev.music.url)}" style="width:100%;margin-top:6px;height:36px"></audio></div></div>`
      : `<div class="dropzone">${icon('music')}<b style="color:var(--ink)">No song yet</b><span class="small">Add music to make opening the invitation feel special.</span></div>`;
    $('#musicDel').hidden = !ev.music; $('#musicBtn span').textContent = ev.music ? 'Replace song' : 'Upload a song';
    $('#seePhotos').href = `/i/${slug}?preview=1&open=1&page=photos`;
    const ph = ev.photos || [];
    $('#photoNote').textContent = ph.length ? `${ph.length} of 12 photos. Use the arrows to set the order.` : 'Engagement or pre-wedding photos work beautifully. Up to 12.';
    $('#photos').innerHTML = ph.length ? ph.map((p, i) => `<div class="ph"><img src="${esc(p.url)}" alt="Photo ${i + 1}" loading="lazy">${i === 0 ? '<span class="badge plain first" style="background:rgba(255,255,255,.94);color:#1E1619">Shows first</span>' : ''}<div class="ov">
      ${i ? `<button data-mv="${i}" data-d="-1" aria-label="Move earlier">${icon('chevron-left')}</button>` : ''}${i < ph.length - 1 ? `<button data-mv="${i}" data-d="1" aria-label="Move later">${icon('chevron-right')}</button>` : ''}<button data-rm="${p.id}" aria-label="Remove photo">${icon('trash')}</button></div></div>`).join('')
      : `<div class="dropzone" style="grid-column:1/-1">${icon('image')}<b style="color:var(--ink)">No photos yet</b><span class="small">Tap “Add photos” to choose from your phone or computer.</span></div>`;
  }
  $('#musicFile').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (f.size > 4 * 1024 * 1024) return fail(new Error('That song is over 4 MB. Try a shorter clip or a lower-quality MP3.'));
    const btn = $('#musicBtn'); btn.classList.add('is-busy'); toast('Uploading your song…', { ms: 20000 });
    try { const r = await api(`upload?${k()}&kind=music&name=${encodeURIComponent(f.name)}`, { method: 'POST', key, raw: f, type: f.type || 'audio/mpeg' }); S.ev.music = r.music; drawMedia(); toast('Song added'); }
    catch (x) { fail(x); } finally { btn.classList.remove('is-busy'); }
  };
  $('#musicDel').onclick = async () => {
    if (!await UI.confirm('Remove this song?', 'Your invitation will open without music.', { ok: 'Remove', danger: true })) return;
    try { await api(`upload?${k()}&kind=music`, { method: 'DELETE', key }); S.ev.music = null; drawMedia(); toast('Song removed'); } catch (x) { fail(x); }
  };
  $('#photoFile').onchange = async e => {
    const files = [...e.target.files]; e.target.value = ''; let ok = 0;
    for (const [i, f] of files.entries()) {
      toast(`Uploading photo ${i + 1} of ${files.length}…`, { ms: 20000 });
      try { const blob = await UI.shrinkImage(f, 1600); const r = await api(`upload?${k()}&kind=photo&name=${encodeURIComponent(f.name.replace(/\.\w+$/, '') + '.jpg')}`, { method: 'POST', key, raw: blob, type: 'image/jpeg' }); S.ev.photos = r.photos; drawMedia(); ok++; }
      catch (x) { fail(x); return; }
    }
    if (ok) toast(`${ok} photo${ok === 1 ? '' : 's'} added`);
  };
  $('#photos').addEventListener('click', async e => {
    const rm = e.target.closest('[data-rm]'), mv = e.target.closest('[data-mv]');
    try {
      if (rm) { if (!await UI.confirm('Remove this photo?', 'It will no longer appear in your invitation.', { ok: 'Remove', danger: true })) return;
        const r = await api(`upload?${k()}&kind=photo&id=${rm.dataset.rm}`, { method: 'DELETE', key }); S.ev.photos = r.photos; drawMedia(); toast('Photo removed'); }
      if (mv) { const ids = S.ev.photos.map(p => p.id), i = +mv.dataset.mv, j = i + +mv.dataset.d; [ids[i], ids[j]] = [ids[j], ids[i]];
        const r = await api(`photo-order?${k()}`, { method: 'PUT', key, body: { ids } }); S.ev.photos = r.photos; drawMedia(); }
    } catch (x) { fail(x); }
  });

  // ---------- gate ----------
  function drawGate() {
    const link = `${origin}/checkin/${slug}?k=${S.ev.gateKey}`;
    $('#gateLink').textContent = link; $('#gateOpen').href = link;
    $('#gateWa').href = wa('', `Hello! Thank you for helping at ${S.ev.a} & ${S.ev.b}'s celebration. On the day, open this link to check guests in at the gate: ${link}`);
    try { $('#gateQr').innerHTML = UI.qr(link, 4); } catch {}
  }
  function drawGateStats() {
    const s = S.stats;
    $('#gateStats').innerHTML = [['door', 'Arrived', s.checkedIn, `${s.checkedInPeople} people inside`], ['heart', 'Expected', s.yes, `${s.attending} people`],
      ['clock', 'Still to arrive', Math.max(s.yes - s.checkedIn, 0), 'accepted guests'], ['bell', 'Awaiting reply', s.pending, 'may still come']]
      .map(([ic, a, b, c]) => `<div class="stat"><small>${icon(ic)}${a}</small><b>${b}</b><span>${c}</span></div>`).join('');
  }

  // ---------- guest album ----------
  async function loadGallery() {
    try {
      const r = await api(`gallery?${k()}`, { key });
      $('#gallery').innerHTML = r.items.length ? r.items.map(it => `<div class="ph"><img src="${esc(it.url)}" alt="Photo from ${esc(it.by)}" loading="lazy"><div class="ov"><span class="by">${esc(it.by)}</span>
        <a href="${esc(it.url)}" target="_blank" rel="noopener" download aria-label="Download">${icon('download')}</a><button data-gd="${it.id}" aria-label="Remove">${icon('trash')}</button></div></div>`).join('')
        : `<div class="dropzone" style="grid-column:1/-1">${icon('camera')}<b style="color:var(--ink)">No guest photos yet</b><span class="small">Guests can start adding photos on the day of your event.</span></div>`;
    } catch (x) { fail(x); }
  }
  $('#galRefresh').onclick = loadGallery;
  $('#gallery').addEventListener('click', async e => {
    const d = e.target.closest('[data-gd]'); if (!d) return;
    if (!await UI.confirm('Remove this photo?', 'It will be deleted from your guest album.', { ok: 'Remove', danger: true })) return;
    try { await api(`upload?${k()}&kind=gallery&id=${d.dataset.gd}`, { method: 'DELETE', key }); loadGallery(); toast('Photo removed'); } catch (x) { fail(x); }
  });

  // ---------- start ----------
  (async () => {
    try {
      await loadEvent(); await loadGuests();
      const t = location.hash.slice(1); if (t && document.querySelector(`[data-panel="${t}"]`)) showTab(t);
      try { const saved = JSON.parse(localStorage.getItem('myInvites') || '[]'); if (!saved.some(x => x.slug === slug)) { saved.unshift({ slug, k: key, name: `${S.ev.a} & ${S.ev.b}`, at: Date.now() }); localStorage.setItem('myInvites', JSON.stringify(saved.slice(0, 10))); } } catch {}
    } catch (x) {
      return fatal(/not allowed|not found/i.test(x.message) ? 'We couldn’t open this dashboard' : 'Something went wrong', /not allowed/i.test(x.message) ? 'This link doesn’t match the invitation. Please use the full dashboard link you saved.' : x.message);
    }
    setInterval(() => { if (!document.hidden) loadGuests().catch(() => {}); }, 30000);
    addEventListener('focus', () => loadGuests().catch(() => {}));
  })();
})();
