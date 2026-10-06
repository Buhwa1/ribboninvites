THEMES.porcelain = (function(){
  const r2 = n => +n.toFixed(2);
  const petal = r => `M0 0 C${r2(r*.58)} ${r2(-r*.12)} ${r2(r*.66)} ${r2(-r*.95)} 0 ${r2(-r)} C${r2(-r*.66)} ${r2(-r*.95)} ${r2(-r*.58)} ${r2(-r*.12)} 0 0Z`;
  function rose(x,y,r,rot=0){
    let s = `<g transform="translate(${x} ${y}) rotate(${rot})">`;
    for (let i=0;i<7;i++) s += `<path class="p" transform="rotate(${i*51.4})" d="${petal(r)}"/>`;
    for (let i=0;i<5;i++) s += `<path class="p" transform="rotate(${i*72+30})" d="${petal(r*.7)}"/>`;
    for (let i=0;i<4;i++) s += `<path class="p" transform="rotate(${i*90+15})" d="${petal(r*.44)}"/>`;
    return s + `<circle class="c" r="${r2(r*.17)}"/></g>`;
  }
  function blossom(x,y,r){
    let s = `<g transform="translate(${x} ${y})">`;
    for (let i=0;i<5;i++){ const a=i*72*Math.PI/180; s += `<circle class="p" cx="${r2(Math.sin(a)*r*.62)}" cy="${r2(-Math.cos(a)*r*.62)}" r="${r2(r*.5)}"/>`; }
    return s + `<circle class="c" r="${r2(r*.3)}"/></g>`;
  }
  const leaf = (x,y,len,rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path class="l" d="M0 0 C${r2(len*.3)} ${r2(-len*.24)} ${r2(len*.72)} ${r2(-len*.22)} ${len} 0 C${r2(len*.72)} ${r2(len*.22)} ${r2(len*.3)} ${r2(len*.24)} 0 0Z"/><path class="v" d="M${r2(len*.08)} 0 L${r2(len*.88)} 0"/></g>`;
  function sprig(x,y,len,rot,n){
    let s = `<g transform="translate(${x} ${y}) rotate(${rot})"><path class="st" d="M0 0 Q${r2(len*.5)} ${r2(-len*.07)} ${len} 0"/>`;
    for (let k=1;k<=n;k++){ const t=k/(n+1); s += leaf(r2(len*t), r2(-len*.07*2*t*(1-t)), Math.max(5,len*.17), (k%2?-38:38)); }
    return s + `<circle class="pearl" cx="${len}" cy="0" r="1.2"/></g>`;
  }
  const pearls = l => l.map(([x,y,r]) => `<circle class="pearl" cx="${x}" cy="${y}" r="${r}"/>`).join('');
  return {
    openMs: 900, goneMs: 1800,
    art: {
      corner: () => leaf(18,16,26,8)+leaf(18,16,24,62)+leaf(30,10,20,-8)+leaf(14,30,20,96)+leaf(40,14,18,28)+leaf(20,24,16,40)+
        sprig(34,8,64,6,5)+sprig(8,34,64,84,5)+sprig(26,26,36,45,3)+rose(16,15,13,0)+rose(38,9,8,20)+rose(9,40,8,-15)+
        blossom(30,28,4.5)+blossom(54,17,3.6)+blossom(19,53,3.6)+blossom(66,6,3)+blossom(6,66,3)+
        pearls([[44,24,1.2],[26,40,1.2],[58,11,1],[13,58,1],[48,31,.9],[32,47,.9],[72,13,.8],[12,74,.8]]),
      door: () => `<path class="st" d="M30 310 C 8 252, 46 212, 25 160 S 42 60, 18 -10"/>`+
        leaf(24,48,22,140)+leaf(24,48,20,-40)+leaf(30,118,18,192)+leaf(30,118,18,38)+leaf(22,205,22,152)+leaf(22,205,20,-28)+leaf(30,272,18,200)+leaf(30,272,18,-35)+
        sprig(30,60,52,-22,4)+sprig(31,124,46,14,4)+sprig(25,214,56,-12,4)+sprig(31,278,48,-26,3)+sprig(20,90,30,200,2)+sprig(20,182,30,165,2)+
        rose(24,48,14,10)+rose(31,118,10,-20)+rose(22,205,15,5)+rose(31,272,11,30)+
        blossom(52,28,4)+blossom(57,92,3.5)+blossom(47,166,4.5)+blossom(60,240,3.5)+blossom(11,84,3.5)+blossom(9,180,4)+blossom(54,292,3)+blossom(64,58,2.6)+
        pearls([[44,72,1.2],[49,142,1.1],[40,236,1.2],[14,130,1],[66,196,1],[12,252,1],[42,10,1],[60,128,.9],[38,180,.9]]),
      sprigSeal: () => `<g transform="translate(39 76) scale(.95)"><path class="st" d="M0 0 L0 -50"/>${leaf(0,-12,11,-140)+leaf(0,-12,11,-40)+leaf(0,-25,10,-145)+leaf(0,-25,10,-35)+leaf(0,-37,8,-150)+leaf(0,-37,8,-30)}<circle class="pearl" cx="0" cy="-52" r="1.6"/></g>`
    }
  };
})();
