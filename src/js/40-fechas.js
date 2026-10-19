/* =========================================================
   Fechas y horas en español natural
   ========================================================= */
const WD = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
const MES_RE = "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre";
function nextWeekday(base, wd, strictlyAfter=false){ const d=startDay(base); let diff=(wd-d.getDay()+7)%7; if(diff===0 && strictlyAfter) diff=7; return addDays(d,diff); }
// Devuelve {desde, hasta, single, label} o null
function parseFecha(text, base=new Date()){
  const t = " "+norm(text)+" ";
  const day = d => ({desde:ymd(d), hasta:ymd(d), single:true, label:relDia(d)});
  let m;
  if(/pasado manana/.test(t)) return day(addDays(base,2));
  if(/anteayer|antier/.test(t)) return day(addDays(base,-2));
  if(/\bmanana\b/.test(t) && !/\b(la|de la|en la|por la|esta|en las)\s+manana\b/.test(t)) return day(addDays(base,1));
  if(/\bayer\b/.test(t)) return day(addDays(base,-1));
  if((m=t.match(/\b(?:dentro de|en)\s+(\d+|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince)\s+(dias?|semanas?)\b/))){ const n=/^\d+$/.test(m[1])?+m[1]:NUMW[m[1]]; return day(addDays(base, n*(m[2].startsWith("semana")?7:1))); }
  if((m=t.match(/\bhace\s+(\d+|un|una|dos|tres|cuatro|cinco|seis|siete)\s+dias?\b/))){ const n=/^\d+$/.test(m[1])?+m[1]:NUMW[m[1]]; return day(addDays(base,-n)); }
  if(/\bhoy\b|\besta (tarde|noche|manana)\b|\bahorita\b|\besta madrugada\b/.test(t)) return day(base);
  if(/fin de semana|finde/.test(t)){ const sat=nextWeekday(base,6); const sun=addDays(sat,1); const from = base.getDay()===0 ? startDay(base) : sat; return {desde:ymd(from), hasta:ymd(base.getDay()===0?startDay(base):sun), label:"el fin de semana"}; }
  if(/(proxima semana|semana que viene|siguiente semana)/.test(t)){ const mon=nextWeekday(base,1,true); return {desde:ymd(mon), hasta:ymd(addDays(mon,6)), label:"la próxima semana"}; }
  if(/(semana pasada)/.test(t)){ const mon=addDays(startWeek(base),-7); return {desde:ymd(mon), hasta:ymd(addDays(mon,6)), label:"la semana pasada"}; }
  if(/(esta semana|en la semana|toda la semana)/.test(t)){ if(base.getDay()===0){ const mon=addDays(startDay(base),1); return {desde:ymd(base), hasta:ymd(addDays(mon,6)), label:"esta semana"}; } const mon=startWeek(base); return {desde:ymd(base), hasta:ymd(addDays(mon,6)), label:"esta semana"}; }
  if(/(proximo mes|mes que viene|siguiente mes)/.test(t)){ const a=new Date(base.getFullYear(),base.getMonth()+1,1), b=new Date(base.getFullYear(),base.getMonth()+2,0); return {desde:ymd(a),hasta:ymd(b),label:MESES[a.getMonth()]}; }
  if(/(mes pasado)/.test(t)){ const a=new Date(base.getFullYear(),base.getMonth()-1,1), b=new Date(base.getFullYear(),base.getMonth(),0); return {desde:ymd(a),hasta:ymd(b),label:"el mes pasado"}; }
  if(/(este mes|del mes|en el mes|el mes)/.test(t)){ const a=new Date(base.getFullYear(),base.getMonth(),1), b=new Date(base.getFullYear(),base.getMonth()+1,0); return {desde:ymd(a),hasta:ymd(b),label:"este mes"}; }
  if((m=t.match(new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${MES_RE})(?:\\s+(?:de|del)\\s+(\\d{4}))?\\b`)))){ const mi=MESES.indexOf(m[2]==="setiembre"?"septiembre":m[2]); let d=new Date(m[3]?+m[3]:base.getFullYear(),mi,+m[1]); if(!m[3] && d<addDays(startDay(base),-90)) d=new Date(base.getFullYear()+1,mi,+m[1]); return day(d); }
  if((m=t.match(new RegExp(`\\b(?:en|de|todo)\\s+(${MES_RE})\\b`)))){ const mi=MESES.indexOf(m[1]==="setiembre"?"septiembre":m[1]); let y=base.getFullYear(); const a=new Date(y,mi,1), b=new Date(y,mi+1,0); return {desde:ymd(a),hasta:ymd(b),label:MESES[mi]}; }
  if((m=t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))){ const y = m[3] ? (m[3].length===2 ? 2000+Number(m[3]) : Number(m[3])) : base.getFullYear(); return day(new Date(y, Number(m[2])-1, Number(m[1]))); }
  for(let i=0;i<7;i++){ const re=new RegExp(`\\b(proximo|siguiente|este|el|este proximo)?\\s*${WD[i]}\\b(\\s+(que viene|proximo|pasado))?`); const mm=t.match(re); if(mm){ if(mm[3] && /pasado/.test(mm[3])){ let d=nextWeekday(base,i); d=addDays(d,-7); if(d>=startDay(base)) d=addDays(d,-7); return day(d); } return day(nextWeekday(base,i, !!mm[1]&&/proximo|siguiente/.test(mm[1]) || !!mm[3])); } }
  if((m=t.match(/\b(?:el|este|para el|hasta el)\s+(\d{1,2})\b(?!\s*(?:soles?|lucas?|:|am|pm|de la|horas?|minutos?))/))){ const n=+m[1]; if(n>=1 && n<=31){ let d=new Date(base.getFullYear(),base.getMonth(),n); if(d<startDay(base)) d=new Date(base.getFullYear(),base.getMonth()+1,n); return day(d); } }
  return null;
}
// Devuelve "HH:MM" o null. Ambiguas: 1–6 → tarde, 7–11 → mañana
function parseHora(text){
  const t = " "+norm(text)+" ";
  let h, mi=0, suf="", m;
  const sufRe = "(de la manana|de la tarde|de la noche|de la madrugada|del mediodia|en la manana|en la tarde|en la noche|por la manana|por la tarde|por la noche|am|pm|a\\.?\\s?m\\.?|p\\.?\\s?m\\.?|hrs?|horas)?";
  m = t.match(new RegExp(`\\b(?:a las?|las|desde las?|para las?|tipo|como a las?|a eso de las?|hasta las?)\\s+(\\d{1,2})(?:[:.h](\\d{2}))?(?:\\s+y\\s+(media|cuarto|\\d{1,2}))?\\s*${sufRe}`))
   || t.match(new RegExp(`\\b(\\d{1,2})(?:[:.](\\d{2}))\\s*${sufRe}`))
   || t.match(/\b(\d{1,2})\s*(am|pm|a\.?\s?m\.?|p\.?\s?m\.?)\b()()/);
  if(m){ if(m[4]===undefined && /am|pm/.test(m[2]||"")){ h=+m[1]; suf=m[2]; } else { h=+m[1]; mi = m[2] && /^\d+$/.test(m[2]) ? +m[2] : m[3]==="media" ? 30 : m[3]==="cuarto" ? 15 : (/^\d+$/.test(m[3]||"")? +m[3] : 0); suf=m[4]||""; } }
  else {
    m = t.match(new RegExp(`\\b(?:a las?|las|para las?|desde las?|como a las?)\\s+(una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)(?:\\s+y\\s+(media|cuarto))?\\s*${sufRe}`));
    if(m){ h = NUMW[m[1]]; mi = m[2]==="media"?30 : m[2]==="cuarto"?15 : 0; suf=m[3]||""; }
    else if(/mediodia/.test(t)) return "12:00";
    else if(/medianoche/.test(t)) return "23:59";
    else { m = t.match(/\b(\d{1,2})\s+(de la manana|de la tarde|de la noche|de la madrugada)\b/); if(m){ h=+m[1]; suf=m[2]; } }
  }
  if(h===undefined || h>23 || mi>59) return null;
  if(/tarde|noche|pm|p\.?\s?m/.test(suf) && h<12) h+=12;
  else if(/madrugada|manana|am|a\.?\s?m/.test(suf) && h===12) h=0;
  else if(!suf && h>=1 && h<=6) h+=12;
  return pad(h%24)+":"+pad(mi);
}
// Duración: "por 2 horas", "de 3 a 5", "hasta las 6"
function parseRango(text){
  const t = norm(text); let m;
  if((m=t.match(/\b(?:de|desde)\s+(?:las?\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(?:a|hasta)\s+(?:las?\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(de la manana|de la tarde|de la noche|am|pm)?/))){
    let a=+m[1], b=+m[3]; const suf=m[5]||""; if(/tarde|noche|pm/.test(suf)){ if(a<12) a+=12; if(b<12) b+=12; } else if(!suf){ if(a>=1&&a<=6) a+=12; if(b>=1&&b<=7 || b<a) b+=12; }
    return {ini:pad(a)+":"+pad(+(m[2]||0)), fin:pad(b%24)+":"+pad(+(m[4]||0))};
  }
  if((m=t.match(/\bpor\s+(\d+|una|un|dos|tres|cuatro)\s*(horas?|h|minutos?|min)\b/))){ const n=/^\d+$/.test(m[1])?+m[1]:NUMW[m[1]]; return {dur: /^h/.test(m[2]) ? n*60 : n}; }
  if(/\bpor\s+(media hora)\b/.test(t)) return {dur:30};
  if(/\bpor\s+(una hora y media|hora y media)\b/.test(t)) return {dur:90};
  return null;
}
function quitarFechaHora(s){
  return String(s)
    .replace(/\b(de|desde)\s+(las?\s+)?\d{1,2}([:.]\d{2})?\s*(a|hasta)\s+(las?\s+)?\d{1,2}([:.]\d{2})?(\s+de la (mañana|manana|tarde|noche))?/gi," ")
    .replace(/\b(a\s+las?|a\s+la|para\s+las?|desde\s+las?|como\s+a\s+las?|a eso de las?)\s+(\d{1,2}([:.h]\d{2})?|[a-záéíóúñ]+)(\s+y\s+(media|cuarto))?(\s+(de\s+la\s+(mañana|manana|tarde|noche|madrugada)|am|pm|a\.?\s?m\.?|p\.?\s?m\.?))?/gi," ")
    .replace(/\b\d{1,2}([:.]\d{2})?\s*(am|pm|a\.?\s?m\.?|p\.?\s?m\.?)\b/gi," ")
    .replace(/\b(pasado\s+)?(mañana|manana)\b(?!\s+de\b)|\bhoy\b|\bayer\b|\bahorita\b|\besta\s+(tarde|noche|mañana|manana)\b|\bal mediod[ií]a\b|\bmediod[ií]a\b/gi," ")
    .replace(/\b(en la|por la|de la)\s+(mañana|manana|tarde|noche)\b/gi," ")
    .replace(/\b(el\s+|este\s+|el\s+próximo\s+|el\s+proximo\s+|próximo\s+|proximo\s+|para el\s+)?(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)(\s+que viene)?\b/gi," ")
    .replace(new RegExp(`\\b(el\\s+|para el\\s+)?\\d{1,2}\\s+de\\s+(${MES_RE})\\b`,"gi")," ").replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g," ")
    .replace(/\b(la\s+)?(próxima|proxima|esta)\s+semana\b|\bfin de semana\b|\bdentro de \d+ d[ií]as\b/gi," ")
    .replace(/\bpor\s+(\d+|una|un|dos|tres)\s*(horas?|minutos?|min)\b|\bpor media hora\b/gi," ")
    .replace(/\s+/g," ").replace(/\s+([,.])/g,"$1").replace(/^[\s,.:;-]+|[\s,.:;-]+$/g,"");
}
