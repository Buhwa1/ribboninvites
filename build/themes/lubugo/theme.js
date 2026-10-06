THEMES.lubugo = (function(){
  function bumpy(cx,cy,R,n,amp){
    const pts = [];
    for (let i=0;i<n;i++){ const a = i/n*Math.PI*2, r = R + (i%2 ? -amp : amp*.6) + Math.sin(i*1.7)*amp*.4; pts.push([cx+Math.cos(a)*r, cy+Math.sin(a)*r]); }
    let d = '';
    pts.forEach((p,i) => { const q = pts[(i+1)%n], m = [(p[0]+q[0])/2,(p[1]+q[1])/2]; d += (i ? '' : `M${m[0].toFixed(1)} ${m[1].toFixed(1)}`); const nn = pts[(i+2)%n], m2 = [(q[0]+nn[0])/2,(q[1]+nn[1])/2]; d += ` Q${q[0].toFixed(1)} ${q[1].toFixed(1)} ${m2[0].toFixed(1)} ${m2[1].toFixed(1)}`; });
    return d + 'Z';
  }
  function triRing(cx,cy,r1,r2,n,fill){
    let s = '';
    for (let i=0;i<n;i++){ const a=i/n*Math.PI*2, b=(i+.5)/n*Math.PI*2, c=(i+1)/n*Math.PI*2;
      s += `<path d="M${(cx+Math.cos(a)*r1).toFixed(1)} ${(cy+Math.sin(a)*r1).toFixed(1)} L${(cx+Math.cos(b)*r2).toFixed(1)} ${(cy+Math.sin(b)*r2).toFixed(1)} L${(cx+Math.cos(c)*r1).toFixed(1)} ${(cy+Math.sin(c)*r1).toFixed(1)}Z" fill="${fill}"/>`; }
    return s;
  }
  return {
    openMs: 2000, goneMs: 2800,
    art: {
      wax: (ev) => `<defs><radialGradient id="wg" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#F0D998"/><stop offset=".45" stop-color="#C99B45"/><stop offset="1" stop-color="#8C6324"/></radialGradient></defs>
        <circle class="ring" cx="50" cy="50" r="52" fill="none" stroke="#F1DFA8" stroke-width="2"/>
        <path d="${bumpy(50,50,47,26,3)}" fill="url(#wg)"/>
        <circle cx="50" cy="50" r="34" fill="none" stroke="#8C6324" stroke-width="1.4" opacity=".7"/>
        <circle cx="50" cy="50" r="34" fill="none" stroke="#F6E3AE" stroke-width=".8" transform="translate(-.8 -.8)" opacity=".8"/>
        ${triRing(50,50,34,39,24,'rgba(140,99,36,.55)')}
        <text x="50" y="59" text-anchor="middle" font-family="Bodoni Moda, Didot, serif" font-style="italic" font-size="26" fill="#6B4A16" letter-spacing="1">${(ev.a||' ')[0]}${(ev.b||' ')[0]}</text>`,
      brooch: () => `<defs><radialGradient id="bg" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#F3DFA4"/><stop offset=".5" stop-color="#C69A48"/><stop offset="1" stop-color="#8C6324"/></radialGradient></defs>
        <circle cx="50" cy="50" r="48" fill="url(#bg)"/>${triRing(50,50,36,46,20,'#F6EEDF')}
        <circle cx="50" cy="50" r="34" fill="#6E3A20" stroke="#F3DFA4" stroke-width="2"/>${triRing(50,50,20,30,12,'rgba(235,212,154,.85)')}
        <circle cx="50" cy="50" r="10" fill="#EBD49A"/>`
    }
  };
})();
