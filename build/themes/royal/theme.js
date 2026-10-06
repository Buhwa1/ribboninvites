THEMES.royal = (function(){
  const G1 = '#E6C97A', G2 = '#B08A3A';
  return {
    openMs: 1500, goneMs: 2200,
    art: {
      flourish: () => `<g fill="none" stroke="${G2}" stroke-width="1.1" stroke-linecap="round">
          <path d="M4 56 C4 26 26 4 56 4"/><path d="M10 56 C10 31 31 10 56 10" opacity=".6"/>
          <path d="M4 30 C10 30 14 26 14 20 C14 15 10 12 6 14 C3 16 4 21 8 21"/>
          <path d="M30 4 C30 10 26 14 20 14 C15 14 12 10 14 6 C16 3 21 4 21 8"/>
          <path d="M18 18 C24 24 30 26 38 26" opacity=".8"/><path d="M18 18 C24 24 26 30 26 38" opacity=".8"/></g>
        <circle cx="18" cy="18" r="2.6" fill="${G2}"/><circle cx="40" cy="26" r="1.4" fill="${G2}"/><circle cx="26" cy="40" r="1.4" fill="${G2}"/>`,
      crown: () => `<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3DD98"/><stop offset=".55" stop-color="${G1}"/><stop offset="1" stop-color="${G2}"/></linearGradient></defs>
        <path d="M14 56 L8 18 L30 36 L50 8 L70 36 L92 18 L86 56 Z" fill="url(#cg)" stroke="#8A6624" stroke-width="1.2" stroke-linejoin="round"/>
        <rect x="12" y="56" width="76" height="9" rx="2" fill="url(#cg)" stroke="#8A6624" stroke-width="1.2"/>
        <circle cx="8" cy="16" r="4" fill="${G1}" stroke="#8A6624"/><circle cx="50" cy="6" r="4.5" fill="${G1}" stroke="#8A6624"/><circle cx="92" cy="16" r="4" fill="${G1}" stroke="#8A6624"/>
        <circle cx="30" cy="48" r="3.2" fill="#7A1830"/><circle cx="50" cy="44" r="4" fill="#7A1830"/><circle cx="70" cy="48" r="3.2" fill="#7A1830"/>`,
      medal: (ev) => `<defs><radialGradient id="mg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#F6E4A8"/><stop offset=".5" stop-color="${G1}"/><stop offset="1" stop-color="#8A6624"/></radialGradient></defs>
        <circle class="ring" cx="50" cy="50" r="52" fill="none" stroke="${G1}" stroke-width="1.6"/>
        ${Array.from({length:24},(_,i)=>{const a=i*15*Math.PI/180;return `<circle cx="${(50+Math.cos(a)*45).toFixed(1)}" cy="${(50+Math.sin(a)*45).toFixed(1)}" r="4.2" fill="url(#mg)"/>`}).join('')}
        <circle cx="50" cy="50" r="42" fill="url(#mg)"/><circle cx="50" cy="50" r="34" fill="#6B1528" stroke="#F6E4A8" stroke-width="1.5"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="${G1}" stroke-width=".6" stroke-dasharray="1.5 2"/>
        <text x="50" y="60" text-anchor="middle" font-family="Great Vibes, cursive" font-size="27" fill="${G1}">${(ev.a||' ')[0]}&amp;${(ev.b||' ')[0]}</text>`
    }
  };
})();
