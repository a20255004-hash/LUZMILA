/* =========================================================
   Mila 8 · utilidades
   ========================================================= */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s => String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const uid8 = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const round2 = n => Math.round(n*100)/100;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const DIAS_C = ["dom","lun","mar","mié","jue","vie","sáb"];
const DIAS_L = ["D","L","M","M","J","V","S"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const pad = n => String(n).padStart(2,"0");
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const pymd = s => { const [y,m,d] = String(s).slice(0,10).split("-").map(Number); return new Date(y,(m||1)-1,d||1); };
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const addMin = (d,n) => new Date(d.getTime()+n*60000);
const startDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startWeek = d => { const x=startDay(d); const wd=(x.getDay()+6)%7; return addDays(x,-wd); }; // lunes
const isoLocal = d => `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const h12 = d => { const h=d.getHours(), m=d.getMinutes(); const hh=((h+11)%12)+1; return `${hh}${m?":"+pad(m):""} ${h<12?"am":"pm"}`; };
const fmtDia = d => `${DIAS_C[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()].slice(0,3)}`;
const fmtDiaLargo = d => `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
const money = n => (n<0?"−":"") + "S/ " + Math.abs(Number(n||0)).toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2});
const money0 = n => (n<0?"−":"") + "S/ " + Math.abs(Math.round(Number(n||0))).toLocaleString("es-PE");
const todayStr = () => ymd(new Date());
const diffDays = (a,b) => Math.round((startDay(b)-startDay(a))/86400000);
const sameDay = (a,b) => ymd(a)===ymd(b);
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const capital = s => { s=String(s||"").trim().replace(/[.\s]+$/,""); return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; };
const plural = (n, a, b) => `${n} ${n===1?a:b}`;
const sum = (arr, f=x=>x) => arr.reduce((s,x)=>s+(Number(f(x))||0),0);
const groupBy = (arr, f) => arr.reduce((o,x)=>{ const k=f(x); (o[k] ||= []).push(x); return o; },{});
function relDia(fecha){
  const d = typeof fecha==="string" ? pymd(fecha) : fecha; const n = diffDays(new Date(), d);
  if(n===0) return "hoy"; if(n===1) return "mañana"; if(n===-1) return "ayer"; if(n===2) return "pasado mañana";
  if(n>2 && n<7) return "el " + DIAS[d.getDay()];
  if(n<-1 && n>-7) return `hace ${-n} días`;
  return `el ${d.getDate()} de ${MESES[d.getMonth()]}`;
}
function hace(ts){
  const s = (Date.now()-ts)/1000;
  if(s<60) return "hace un momento"; if(s<3600) return `hace ${Math.round(s/60)} min`;
  if(s<86400) return `hace ${Math.round(s/3600)} h`; const d=Math.round(s/86400); return d===1?"ayer":`hace ${d} días`;
}
function saludoHora(h=new Date().getHours()){ return h<5 ? "Hola" : h<12 ? "Buenos días" : h<19 ? "Buenas tardes" : "Buenas noches"; }
function momentoDia(h=new Date().getHours()){ return h<5?"madrugada":h<7?"amanecer":h<12?"mañana":h<17?"tarde":h<19?"atardecer":"noche"; }
// similitud simple entre textos (palabras significativas compartidas)
const STOP = new Set("el la los las un una unos unas de del al a en y o que con por para mi mis tu su sus es era fue me te se lo le les ya muy mas pero como cuando donde hoy este esta eso esa ese".split(" "));
function palabras(s){ return norm(s).replace(/[^a-z0-9ñ\s]/g," ").split(/\s+/).filter(w=>w.length>2 && !STOP.has(w)); }
function raiz(w){ return w.replace(/(aciones|acion|amientos|amiento|mente|ando|iendo|adas|idas|ados|idos|ada|ida|ado|ido|ar|er|ir|es|s)$/,"").slice(0,7); }
function simil(a, b){
  const A = new Set(palabras(a).map(raiz)), B = new Set(palabras(b).map(raiz));
  if(!A.size || !B.size) return 0; let n=0; for(const w of A) if(B.has(w)) n++;
  return n / Math.min(A.size, B.size);
}
let toastT;
function toast(msg, opts={}){
  const t = $("#toast"); if(!t) return;
  t.innerHTML = `<span class="t-ic">${opts.icon||ICON.spark}</span><span class="t-tx">${esc(msg)}</span>${opts.undo?`<button type="button" class="t-undo" data-act="undo" data-id="${esc(opts.undo)}">Deshacer</button>`:""}`;
  t.classList.remove("show"); void t.offsetWidth; t.classList.add("show"); t.hidden=false;
  clearTimeout(toastT); toastT = setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=>t.hidden=true, 300); }, opts.ms || (opts.undo?6000:3200));
}
function haptic(ms=8){ try{ navigator.vibrate?.(ms); }catch{} }
