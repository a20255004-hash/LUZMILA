/* =========================================================
   Gráficos en SVG (sin librerías): barras, líneas, anillos,
   donas y mapas de calor. Todos con datos reales y tooltips.
   ========================================================= */
const tipAttr = t => `data-tip="${esc(t)}"`;
function ring(p, {size=64, stroke=8, color="var(--violeta)", bg="var(--ring-bg)", label="", sub=""}={}){
  const r=(size-stroke)/2, c=2*Math.PI*r, v=clamp(p,0,1);
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${bg}" stroke-width="${stroke}"/>
    <circle class="ring-v" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-v)}" transform="rotate(-90 ${size/2} ${size/2})" style="--c:${c}"/></svg>
    <div class="ring-l"><b>${label}</b>${sub?`<small>${sub}</small>`:""}</div></div>`;
}
function barChart(data, {h=150, color="var(--violeta)", fmt=v=>v, max=null, highlight=-1, goal=null}={}){
  // data: [{l, v, tip?, c?}]
  if(!data.length) return "";
  const W=Math.max(280, data.length*36), pb=22, pt=10, mx = max ?? Math.max(1, ...data.map(d=>d.v), goal||0);
  const bw = Math.min(26, (W/data.length)*0.6), step = W/data.length;
  const bars = data.map((d,i)=>{ const bh = (h-pb-pt)*(d.v/mx); const x = i*step + (step-bw)/2; const y = h-pb-bh;
    return `<g class="bar ${i===highlight?"hl":""}" ${tipAttr(d.tip || `${d.l}: ${fmt(d.v)}`)}><rect x="${i*step}" y="${pt}" width="${step}" height="${h-pb-pt}" fill="transparent"/>
      <rect class="bar-v" x="${x}" y="${y}" width="${bw}" height="${Math.max(d.v>0?3:0,bh)}" rx="${Math.min(7,bw/2)}" fill="${d.c||color}" style="--d:${i*30}ms"/>
      <text x="${i*step+step/2}" y="${h-6}" text-anchor="middle" class="ax">${esc(d.l)}</text></g>`; }).join("");
  const g = goal ? `<line x1="0" x2="${W}" y1="${h-pb-(h-pb-pt)*(goal/mx)}" y2="${h-pb-(h-pb-pt)*(goal/mx)}" class="goal"/>` : "";
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px">${g}${bars}</svg>`;
}
function lineChart(series, {h=160, labels=[], fmt=v=>v, area=true, max=null, min=0}={}){
  // series: [{name, color, values:[]}]
  const n = Math.max(...series.map(s=>s.values.length)); if(!n) return "";
  const W=560, pl=6, pr=6, pt=12, pb=24; const all = series.flatMap(s=>s.values.filter(v=>v!=null));
  const mx = max ?? Math.max(1, ...all), mn = min ?? Math.min(...all);
  const X = i => pl + (n===1?0.5:i/(n-1))*(W-pl-pr), Y = v => pt + (1-(v-mn)/((mx-mn)||1))*(h-pt-pb);
  const path = vals => { let d="", prev=null; vals.forEach((v,i)=>{ if(v==null){ prev=null; return; } const x=X(i), y=Y(v); if(prev){ const cx=(prev[0]+x)/2; d+=` C${cx} ${prev[1]} ${cx} ${y} ${x} ${y}`; } else d+=` M${x} ${y}`; prev=[x,y]; }); return d; };
  const grid = [0,.5,1].map(f=>`<line x1="${pl}" x2="${W-pr}" y1="${pt+f*(h-pt-pb)}" y2="${pt+f*(h-pt-pb)}" class="grid"/>`).join("");
  const lines = series.map((s,si)=>{ const d=path(s.values); const last=[...s.values].map((v,i)=>[v,i]).filter(x=>x[0]!=null).pop();
    const ar = area && si===0 && d ? `<path d="${d} L${X(last?.[1]??0)} ${h-pb} L${X(s.values.findIndex(v=>v!=null))} ${h-pb}Z" fill="${s.color}" opacity=".12"/>` : "";
    return `${ar}<path class="line-v" d="${d}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linecap="round" ${s.dash?'stroke-dasharray="6 6"':""}/>` +
      s.values.map((v,i)=> v==null?"" : `<circle cx="${X(i)}" cy="${Y(v)}" r="${i===last?.[1]?5:3.2}" fill="${s.color}" stroke="var(--card)" stroke-width="2" ${tipAttr(`${s.name}${labels[i]?" · "+labels[i]:""}: ${fmt(v)}`)}/>`).join(""); }).join("");
  const lab = labels.map((l,i)=> (n<=8 || i%Math.ceil(n/8)===0 || i===n-1) ? `<text x="${X(i)}" y="${h-6}" text-anchor="middle" class="ax">${esc(l)}</text>` : "").join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px">${grid}${lines}${lab}</svg>`;
}
function donut(parts, {size=170, stroke=24, center="", sub="", active=null, fmt=money}={}){
  // parts: [{l, v, c}]
  const tot = sum(parts, p=>p.v); const r=(size-stroke)/2, C=2*Math.PI*r; let off=0;
  const segs = tot ? parts.filter(p=>p.v>0).map(p=>{ const len = C*p.v/tot; const s = `<circle class="seg ${active&&active!==p.l?"dim":""}" data-l="${esc(p.l)}" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${p.c}" stroke-width="${stroke}" stroke-dasharray="${Math.max(0,len-2)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size/2} ${size/2})" ${tipAttr(`${p.l}: ${fmt(p.v)} (${Math.round(p.v/tot*100)}%)`)}/>`; off+=len; return s; }).join("")
    : `<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--ring-bg)" stroke-width="${stroke}"/>`;
  return `<div class="donut" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}">${segs}</svg><div class="donut-c"><b>${center}</b><small>${sub}</small></div></div>`;
}
function heatmap(valores, {semanas=17, color="#7C5CFF", fin=new Date(), fmt=(d,v)=>`${fmtDia(d)}: ${v}`, max=null}={}){
  // valores: {"YYYY-MM-DD": número}
  const end = startDay(fin), start = addDays(startWeek(end), -(semanas-1)*7);
  const mx = max ?? Math.max(1, ...Object.values(valores)); const cell=13, gap=3; let cells="", months="";
  for(let w=0; w<semanas; w++){ for(let d=0; d<7; d++){ const day=addDays(start, w*7+d); if(day>end) continue; const v=valores[ymd(day)]||0;
      const op = v ? .25 + .75*Math.min(1, v/mx) : 0; cells += `<rect x="${w*(cell+gap)}" y="${d*(cell+gap)}" width="${cell}" height="${cell}" rx="3.5" fill="${v?color:"var(--hm-empty)"}" ${v?`fill-opacity="${op.toFixed(2)}"`:""} ${tipAttr(fmt(day,v))}/>`; }
    const first = addDays(start, w*7); if(first.getDate()<=7) months += `<text x="${w*(cell+gap)}" y="-5" class="ax">${MESES[first.getMonth()].slice(0,3)}</text>`; }
  const W = semanas*(cell+gap), H = 7*(cell+gap);
  return `<svg class="heat" viewBox="-2 -16 ${W+4} ${H+18}" style="max-width:${W+4}px">${months}${cells}</svg>`;
}
function sparkBars(vals, color="var(--violeta)"){ const mx=Math.max(1,...vals); return `<span class="spark">${vals.map(v=>`<i style="height:${Math.max(8,v/mx*100)}%;background:${color}"></i>`).join("")}</span>`; }
function barraProg(p, color="var(--violeta)", extra=""){ return `<div class="prog ${extra}"><i style="width:${clamp(p,0,1)*100}%;background:${color}"></i></div>`; }

/* tooltip global */
(function(){
  let tip;
  const show = (el, x, y) => { if(!tip) tip=$("#tip"); if(!tip) return; tip.textContent = el.dataset.tip; tip.hidden=false; const r=tip.getBoundingClientRect(); tip.style.left = clamp(x - r.width/2, 8, innerWidth-r.width-8)+"px"; tip.style.top = Math.max(8, y - r.height - 12)+"px"; };
  document.addEventListener("pointerover", e=>{ const el=e.target.closest?.("[data-tip]"); if(el){ show(el, e.clientX, e.clientY); } });
  document.addEventListener("pointermove", e=>{ const el=e.target.closest?.("[data-tip]"); if(el) show(el, e.clientX, e.clientY); else if(tip) tip.hidden=true; });
  document.addEventListener("pointerdown", e=>{ const el=e.target.closest?.("[data-tip]"); if(el && e.pointerType!=="mouse") show(el, e.clientX, e.clientY); });
  document.addEventListener("scroll", ()=>{ if(tip) tip.hidden=true; }, true);
})();
