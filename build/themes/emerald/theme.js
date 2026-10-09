THEMES.emerald = (function(){
  const G = '#D4AF6A';
  const oct = (c,r) => { let d=''; for (let i=0;i<8;i++){ const a=(i*45+22.5)*Math.PI/180; d += (i?'L':'M') + (c+Math.cos(a)*r).toFixed(2) + ' ' + (c+Math.sin(a)*r).toFixed(2); } return d+'Z'; };
  return {
    openMs: 1300, goneMs: 2300,
    // Emerald-only wording tweaks (called by runtime after fields are filled)
    after: (frame) => {
      const set = (sel, txt) => { const el = frame.querySelector(sel); if (el) el.textContent = txt; };
      set('[data-p="names"] .names-lede', 'request the honor of your presence at their Holy Matrimony');
      set('[data-p="venue"] .label', 'LOCATION');
      set('[data-f="venueLabelA"]', 'HOLY MATRIMONY');
    },
    art: {
      burst: () => { let s=''; for (let i=0;i<72;i++){ const a=i*5*Math.PI/180, r1=26, r2=i%2?62:96;
          s += `<line x1="${(Math.cos(a)*r1).toFixed(2)}" y1="${(Math.sin(a)*r1).toFixed(2)}" x2="${(Math.cos(a)*r2).toFixed(2)}" y2="${(Math.sin(a)*r2).toFixed(2)}" stroke="${G}" stroke-width="${i%2?.25:.35}"/>`; }
        return s + `<circle r="30" fill="none" stroke="${G}" stroke-width=".4"/><circle r="66" fill="none" stroke="${G}" stroke-width=".25" stroke-dasharray="1 2"/>`; },
      fan: () => { let s=`<path d="M8 50 A42 42 0 0 1 92 50" fill="none" stroke="${G}" stroke-width=".8"/><path d="M22 50 A28 28 0 0 1 78 50" fill="none" stroke="${G}" stroke-width=".6"/>`;
        for (let i=0;i<=12;i++){ const a=Math.PI+i*Math.PI/12, r2=i%2?38:46; s += `<line x1="${(50+Math.cos(a)*14).toFixed(2)}" y1="${(50+Math.sin(a)*14).toFixed(2)}" x2="${(50+Math.cos(a)*r2).toFixed(2)}" y2="${(50+Math.sin(a)*r2).toFixed(2)}" stroke="${G}" stroke-width=".7"/>`; }
        return s + `<path d="M50 38 L56 50 L44 50Z" fill="${G}"/>`; },
      octo: (ev) => `<path class="ring" d="${oct(50,52)}" fill="none" stroke="#F2DCA2" stroke-width="1.5"/>
        <defs><linearGradient id="og" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2DCA2"/><stop offset=".5" stop-color="#C69F58"/><stop offset="1" stop-color="#8E6A2E"/></linearGradient></defs>
        <path d="${oct(50,48)}" fill="url(#og)"/><path d="${oct(50,42)}" fill="#0F3B2E"/><path d="${oct(50,38)}" fill="none" stroke="${G}" stroke-width=".8"/>
        <text x="50" y="57" text-anchor="middle" font-family="Cinzel, serif" font-size="22" fill="${G}" letter-spacing="1">${(ev.a||' ')[0]}<tspan font-family="Cormorant Garamond, serif" font-style="italic" font-size="18" dx="2" dy="-1">&amp;</tspan><tspan dx="2" dy="1">${(ev.b||' ')[0]}</tspan></text>`
    }
  };
})();