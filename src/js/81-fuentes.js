/* =========================================================
   MIS HOJAS · PROYECTO_LUZMILA, Taller del Zorro y Proyecto Culta
   Solo lectura (Google Sheets API): Mila consulta, resume y propone recuerdos,
   datos y frases; nunca escribe ni cambia tus hojas. Los IDs se guardan en tu
   perfil privado, no en el sitio.
   ========================================================= */
const FUENTES_DEF = {
  luzmila:{ n:"PROYECTO_LUZMILA", d:"Tu sistema de crecimiento: fases, niveles, chips mentales, Expediente y metas", ic:"sprout", c:"#1FA97A",
    rangos:["RESUMEN!A1:G40","NIVELES!A3:C12","FASE4_METAS!A4:L40","CHIPS_MENTALES!A4:E40","FASE3_EXPEDIENTE!A3:H90","FASE2_MENTALIDAD!A4:E90","FASE1_ENERGIA!A4:G140"] },
  zorro:{ n:"Taller del Zorro", d:"Humor, alegría y espontaneidad: plan semanal, bitácora, anécdotas y cosmovisión", ic:"spark", c:"#E8912D",
    rangos:["'Panel de Control'!A1:I31","Bitacora!A1:G160","'Anecdotas Rakugo'!A1:E80","Cosmovision!A1:D80","'Nivel y XP'!A1:C26"] },
  culta:{ n:"Proyecto Culta", d:"Formación intelectual: bloques, sesiones con nota y cronograma", ic:"cap", c:"#7C5CFF",
    rangos:["Dashboard!B1:F26","'Registro de Sesiones'!B4:G80","Cronograma!B4:N11"] }
};
const Fuentes = {
  data:{}, err:{}, at:{},
  ids(){ return S.profile.fuentes||{}; },
  idDe(txt){ const m=String(txt||"").match(/\/d\/([a-zA-Z0-9_-]{20,})/) || String(txt||"").match(/^([a-zA-Z0-9_-]{25,})$/); return m?m[1]:null; },
  cache(){ try{ const c=JSON.parse(localStorage.getItem("mila-fuentes-cache")||"{}"); this.data={...c.data}; this.at={...c.at}; }catch{} },
  guardarCache(){ try{ localStorage.setItem("mila-fuentes-cache", JSON.stringify({data:this.data, at:this.at})); }catch{} },
  async leer(k){
    const id=this.ids()[k]; if(!id) throw new Error("Esa hoja no está conectada.");
    const G=window.MilaApp?.Google; if(!G) throw new Error("Abre Mila desde su página para leer tus hojas.");
    const q = FUENTES_DEF[k].rangos.map(r=>"ranges="+encodeURIComponent(r)).join("&");
    const j = await G.api(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchGet?${q}&valueRenderOption=FORMATTED_VALUE`);
    const out={}; for(const vr of (j.valueRanges||[])){ const hoja=String(vr.range||"").split("!")[0].replace(/^'|'$/g,""); out[hoja]=vr.values||[]; }
    this.data[k]=out; this.at[k]=Date.now(); delete this.err[k]; this.guardarCache(); return out;
  },
  async leerTodas(){ S.fuentesUI.cargando=true; render(); const ks=Object.keys(this.ids()).filter(k=>FUENTES_DEF[k]);
    await Promise.all(ks.map(k=>this.leer(k).catch(e=>{ this.err[k]=errMsg(e); }))); S.fuentesUI.cargando=false; render(); },
  filas(k, hoja, desde=1){ const v=this.data[k]?.[hoja]||[]; return v.slice(desde).filter(r=>r.some(c=>String(c||"").trim())); },
  /* resúmenes */
  luzmila(){ const R_=this.data.luzmila; if(!R_) return null; const res=R_["RESUMEN"]||[];
    const val = lbl => { const r=res.find(x=>norm(x[0]||"").startsWith(norm(lbl))); return r?r[1]:""; };
    const kp = res.findIndex(r=>/PUNTOS TOTALES/.test(r[0]||"")); const puntos = kp>=0 ? res[kp+1]?.[0] : ""; const nivel = kp>=0 ? res[kp+1]?.[1] : "";
    const fases = res.filter(r=>/^\d+$/.test(String(r[0]||"")) && r[1]).map(r=>({n:r[0], dim:r[1], estado:r[2]||"", mes:r[3]||"", pts:r[6]||"0"}));
    const niveles = (R_["NIVELES"]||[]).slice(1).filter(r=>r[1]); const frase = niveles.find(r=>r[1]===nivel)?.[2]||"";
    const energia = (R_["FASE1_ENERGIA"]||[]).slice(1).filter(r=>r[0]);
    const ultimaE = [...energia].reverse().find(r=>[r[1],r[2],r[3]].some(v=>/s[ií]/i.test(v||"")));
    const metas = (R_["FASE4_METAS"]||[]).slice(1).filter(r=>r[0]).map(r=>({t:r[0], plan:r[1], prox:r[2], urg:r[3], imp:r[4], cuad:r[5], lim:r[6], ult:r[7], estado:r[10]}));
    return {dia:val("Día del proyecto"), inicio:val("Fecha de inicio"), puntos, nivel, frase, fases, ultimaE:ultimaE?.[0]||"", metas,
      chips:(R_["CHIPS_MENTALES"]||[]).slice(1).filter(r=>r[1]).length, expediente:(R_["FASE3_EXPEDIENTE"]||[]).slice(1).filter(r=>r[1]).length, distorsiones:(R_["FASE2_MENTALIDAD"]||[]).slice(1).filter(r=>r[1]).length}; },
  zorro(){ const Z=this.data.zorro; if(!Z) return null; const P=Z["Panel de Control"]||[];
    const ix = P.findIndex(r=>/XP TOTAL/.test(r[0]||"")); const xp = ix>=0?P[ix+1]?.[0]:"", nivel=ix>=0?P[ix+1]?.[3]:"", falta=ix>=0?P[ix+1]?.[6]:"";
    const plan = P.filter(r=>/^(Domingo|Lunes|Martes|Mi[eé]rcoles|Jueves|Viernes|S[aá]bado)$/.test(r[0]||"")).map(r=>({dia:r[0], enfoque:r[1], ic:r[2], accion:r[3]}));
    const hoyN = norm(DIAS[new Date().getDay()]); const hoy = plan.find(p=>norm(p.dia)===hoyN);
    const bit = (Z["Bitacora"]||[]).slice(1).filter(r=>r[3]); const nombreNivel = (Z["Nivel y XP"]||[]).find(r=>String(r[0])===String(nivel))?.[2]||"";
    return {xp, nivel, falta, plan, hoy, bit, nombreNivel, anecdotas:(Z["Anecdotas Rakugo"]||[]).slice(1).filter(r=>r[1]).length, cosmo:(Z["Cosmovision"]||[]).slice(1).filter(r=>r[2]).length}; },
  culta(){ const C=this.data.culta; if(!C) return null; const D=C["Dashboard"]||[];
    const bloques = D.filter(r=>/^XP — Bloque/.test(r[0]||"")).map(r=>({n:r[0].replace("XP — ",""), xp:Number(String(r[1]).replace(",","."))||0}));
    const ses = (C["Registro de Sesiones"]||[]).slice(1).filter(r=>r[0]&&r[2]).map(r=>({f:r[0], b:r[1], tema:r[2], nota:Number(String(r[4]||"").replace(",","."))||null, fb:r[5]||""}));
    const notas = ses.filter(s=>s.nota!=null).map(s=>s.nota); return {bloques, ses, prom: notas.length?round2(notas.reduce((a,b)=>a+b,0)/notas.length):null}; },
  /* propuestas de recuerdos, datos y frases (para revisar antes de guardar) */
  extraer(){
    const items=[]; const add=(tipo, clave, data, txt)=>{ items.push({tipo, clave, data, txt}); };
    const fechaDe = s => { const m=String(s||"").match(/(\d{1,2}) de (\w+)/); if(!m) return ""; const mi=MESES.indexOf(norm(m[2]).replace("setiembre","septiembre")); return mi<0?"":`${new Date().getFullYear()}-${pad(mi+1)}-${pad(Number(m[1]))}`; };
    const Z=this.data.zorro, L=this.data.luzmila, C=this.data.culta;
    if(Z){
      (Z["Anecdotas Rakugo"]||[]).slice(1).forEach((r,i)=>{ if(!r[1]) return; add("recuerdo", "zorro:anec:"+i, {titulo:"Anécdota: "+String(r[1]).split(/[,.]/)[0].slice(0,50), relato:[r[1],r[2],r[3]].filter(Boolean).join(" … "), fecha:fechaDe(r[0]), emocion:"gracioso", origen:"Taller del Zorro · Anécdotas", etiquetas:["humor","Taller del Zorro"]}, `Anécdota: ${r[1]} … ${r[3]||""}`); });
      (Z["Bitacora"]||[]).slice(1).forEach((r,i)=>{ if(!r[3]) return; add("recuerdo", "zorro:bit:"+i, {titulo:capital(String(r[3]).slice(0,60)), relato:`${r[3]}.${r[5]?" "+r[5]+".":""}`, fecha:fechaDe(r[0]), emocion:/feliz|alegr/i.test(r[5]||"")?"alegre":"logro", origen:"Taller del Zorro · Bitácora", etiquetas:["Taller del Zorro", r[2]||""].filter(Boolean)}, `${r[0]}: ${r[3]}${r[5]?" — "+r[5]:""}`); });
      (Z["Cosmovision"]||[]).slice(1).forEach((r,i)=>{ if(!r[2]) return; add("nota", "zorro:cosmo:"+i, {texto:`${r[1]}: ${r[2]}${r[3]?" — Me gustó: "+r[3]:""}`, tipo:"idea"}, `Cosmovisión · ${r[1]}: ${String(r[2]).slice(0,120)}`); });
    }
    if(L){
      (L["CHIPS_MENTALES"]||[]).slice(1).forEach((r,i)=>{ if(!r[1]) return; add("frase", "luz:chip:"+i, {texto:String(r[1]).replace(/^"|"$/g,""), cat:"Mis chips", situacion:r[0]||"", autor:"Tú", origen:"PROYECTO_LUZMILA · Chips mentales", propia:true}, `Chip: ${r[1]} (para: ${r[0]})`); });
      (L["FASE3_EXPEDIENTE"]||[]).slice(1).forEach((r,i)=>{ if(!r[1]) return; add("recuerdo", "luz:exp:"+i, {titulo:"Logro: "+String(r[1]).slice(0,60), relato:`${r[1]}. Contradice la creencia «${r[4]||""}».`, fecha:fechaDe(r[0]), emocion:"logro", origen:"PROYECTO_LUZMILA · El Expediente", etiquetas:["Expediente", r[2]||""].filter(Boolean)}, `Expediente: ${r[1]}`); });
      (L["FASE4_METAS"]||[]).slice(1).forEach((r,i)=>{ if(!r[0]) return; add("meta", "luz:meta:"+i, {titulo:r[0], proxima_accion:r[2]||"", fecha_limite:"", estado:/cumplida|lograda/i.test(r[10]||r[8]||"")?"lograda":"activa", area:"Proyecto Luzmila"}, `Meta${/cumplida/i.test(r[10]||"")?" (cumplida)":""}: ${r[0]}`); });
    }
    if(C){ (C["Registro de Sesiones"]||[]).slice(1).forEach((r,i)=>{ if(!r[2]) return; add("recuerdo", "culta:ses:"+i, {titulo:`Sesión Culta: ${r[2]}`, relato:`Estudié ${r[2]} (${r[1]}) y saqué ${r[4]||"—"}/20.${r[5]?" Para reforzar: "+r[5]:""}`, fecha:fechaDe(r[0]), emocion:"logro", origen:"Proyecto Culta · Sesiones", etiquetas:["Proyecto Culta", r[1]||""]}, `Culta · ${r[2]}: ${r[4]||"—"}/20`); }); }
    return items.filter(it=>!yaImportado(it.clave));
  }
};
Fuentes.cache();
function yaImportado(clave){ return S.recuerdos.some(r=>r.clave===clave) || S.memorias.some(m=>m.clave===clave) || S.frases.some(f=>f.clave===clave) || S.notas.some(n=>n.clave===clave) || S.metas.some(g=>g.clave===clave); }
/* aplica elementos revisados (del paquete privado o de tus hojas) */
async function importarItems(items){
  let n=0; const cuenta={};
  for(const it of items){
    if(it.clave && yaImportado(it.clave)) continue;
    const d={...it.data, clave:it.clave||""};
    try{
      if(it.tipo==="recuerdo"){ const r=await A.recuerdo({...d, origen:d.origen||"importado"}); if(it.clave) await Store.update("recuerdos", r.id, {clave:it.clave, etiquetas:d.etiquetas||[]}); }
      else if(it.tipo==="memoria"){ const r=await A.recordar({texto:d.texto, tipo:d.tipo, area:d.area, fuente:d.fuente||"Importado", confianza:"confirmado"}); if(r.id && it.clave) await Store.update("memorias", r.id, {clave:it.clave}); }
      else if(it.tipo==="frase"){ const r=await A.frase({...d}); if(r.id && it.clave) await Store.update("frases", r.id, {clave:it.clave}); }
      else if(it.tipo==="nota"){ const r=await A.nota({texto:d.texto, tipo:d.tipo}); if(it.clave) await Store.update("notas", r.id, {clave:it.clave}); }
      else if(it.tipo==="meta"){ const r=await A.meta({titulo:d.titulo, proxima_accion:d.proxima_accion, area:d.area}); await Store.update("metas", r.id, {clave:it.clave||"", estado:d.estado||"activa", progreso:d.estado==="lograda"?100:0}); }
      else if(it.tipo==="habito"){ const r=await A.nuevoHabito({nombre:d.nombre, icono:d.icono}); if(r.dup) continue; }
      else if(it.tipo==="foto"){ await A.foto(d.src, "Paquete privado"); }
      else if(it.tipo==="fuentes"){ await Store.saveProfile({fuentes:{...S.profile.fuentes, ...d}}); }
      else continue;
      n++; cuenta[it.tipo]=(cuenta[it.tipo]||0)+1;
    }catch(e){ console.warn("import", it, e); }
  }
  return {n, cuenta};
}
const NOMBRE_TIPO = {habito:"Hábitos (de tu Fase 1: Energía)", recuerdo:"Recuerdos", memoria:"Datos sobre ti", frase:"Frases y chips", nota:"Notas e ideas", meta:"Metas", foto:"Tu foto de perfil", fuentes:"Conexión con tus hojas"};
SHEETS.revisar = (d) => { const items=d.items||[]; S.ui.revisar=items;
  const g=groupBy(items.map((x,i)=>({...x,i})), x=>x.tipo);
  return `${sheetHead(d.titulo||`Revisa ${plural(items.length,"elemento","elementos")}`, ICON.inbox)}<p class="mini">${esc(d.sub||"Desmarca lo que no quieras guardar. Nada se guarda hasta que confirmes.")}</p>
  <form data-form="revisar" class="frm"><div class="rev-l">${Object.entries(g).map(([t,l])=>`<div class="rev-g"><label class="rev-h"><input type="checkbox" checked onchange="for(const c of this.closest('.rev-g').querySelectorAll('.rev-i input'))c.checked=this.checked"><b>${esc(NOMBRE_TIPO[t]||t)}</b><span>${l.length}</span></label>${l.map(x=>`<label class="rev-i"><input type="checkbox" name="i${x.i}" checked>${x.tipo==="foto"?`<img src="${x.data.src}" alt="" class="rev-foto">`:""}<span>${esc(String(x.txt||x.data?.texto||x.data?.titulo||"").slice(0,220))}</span></label>`).join("")}</div>`).join("")}</div>
  <div class="sh-acc"><button type="submit" class="btn pri">Guardar seleccionados</button></div></form>`; };
VISTAS.fuentes = function(){
  const ids=Fuentes.ids(); const G=window.MilaApp?.Google; const conectadas=Object.keys(ids).filter(k=>FUENTES_DEF[k]&&ids[k]);
  const card = (k) => { const F=FUENTES_DEF[k]; const id=ids[k]; const at=Fuentes.at[k]; const er=Fuentes.err[k];
    let cuerpo="";
    if(!id) cuerpo = `<form data-form="fuenteConectar" data-k="${k}" class="fuente-con"><input name="link" placeholder="Pega el enlace de tu hoja ${esc(F.n)}" required><button type="submit" class="btn pri sm">Conectar</button></form>`;
    else if(!Fuentes.data[k]) cuerpo = `<p class="mini">${er?`${ICON.alert} ${esc(er)}`:"Aún no la leo."}</p>${btn(ICON.repeat+" Leer ahora","fuentesLeer","","pri sm")}`;
    else if(k==="luzmila"){ const x=Fuentes.luzmila();
      cuerpo = `<div class="kpis mini3"><div class="kpi"><small>Día del proyecto</small><b>${esc(x.dia||"—")}</b></div><div class="kpi"><small>Puntos</small><b>${esc(x.puntos||"0")}</b></div><div class="kpi"><small>Nivel</small><b class="sm">${esc(x.nivel||"—")}</b></div></div>
        ${x.frase?`<p class="cita">«${esc(x.frase)}»</p>`:""}
        <div class="fases">${x.fases.slice(0,8).map(f=>`<span class="fase ${/activa/i.test(f.estado)?"on":""}" ${tipAttr(`${f.dim} · ${f.estado} · ${f.mes}`)}><b>${esc(f.n)}</b>${esc(f.dim)}</span>`).join("")}</div>
        <p class="mini">${x.ultimaE?`Tu último ritual registrado en Energía fue el <b>${esc(x.ultimaE.trim())}</b>. ${diasDesde(x.ultimaE)>3?"¿Lo retomamos? Mila puede recordártelo cada mañana.":""}`:"Aún no hay rituales marcados en Energía."} · ${plural(x.chips,"chip mental","chips mentales")} · ${plural(x.expediente,"entrada","entradas")} en el Expediente.</p>
        ${x.metas.length?`<div class="mini-l">${x.metas.slice(0,5).map(m=>`<div><span class="tag ${/cumplida/i.test(m.estado)?"ok":""}">${esc(m.estado||"—")}</span>${esc(m.t)}</div>`).join("")}</div>`:""}`; }
    else if(k==="zorro"){ const x=Fuentes.zorro();
      cuerpo = `<div class="kpis mini3"><div class="kpi"><small>XP</small><b>${esc(x.xp||"0")}</b></div><div class="kpi"><small>Nivel</small><b>${esc(x.nivel||"1")}</b></div><div class="kpi"><small>Para subir</small><b>${esc(x.falta||"—")} XP</b></div></div>
        ${x.hoy?`<div class="hoy-toca"><span>${esc(x.hoy.ic||"")}</span><div><small>Hoy toca · ${esc(x.hoy.enfoque)}</small><b>${esc(x.hoy.accion)}</b></div>${btn(ICON.plus+" Agendar","decir",`data-v="${esc("agrega tarea "+x.hoy.accion+" para hoy")}"`,"sm")}</div>`:""}
        <p class="mini">${plural(x.bit.length,"registro","registros")} en la bitácora · ${plural(x.anecdotas,"anécdota","anécdotas")} · ${plural(x.cosmo,"dato cultural","datos culturales")}${x.nombreNivel?` · ${esc(x.nombreNivel)}`:""}</p>`; }
    else if(k==="culta"){ const x=Fuentes.culta(); const mx=Math.max(1,...x.bloques.map(b=>b.xp));
      cuerpo = `<div class="bloques">${x.bloques.map(b=>`<div><span>${esc(b.n)}</span>${barraProg(b.xp/mx,"var(--violeta)")}<b>${b.xp} XP</b></div>`).join("")}</div>
        ${x.ses.filter(s=>s.nota!=null).length>1 ? lineChart([{name:"Nota", color:"#7C5CFF", values:x.ses.filter(s=>s.nota!=null).map(s=>s.nota)}], {h:110, labels:x.ses.filter(s=>s.nota!=null).map(s=>s.tema.slice(0,10)), fmt:v=>v+"/20", min:0, max:20}) : ""}
        <p class="mini">${plural(x.ses.length,"sesión","sesiones")}${x.prom?` · promedio <b>${x.prom}/20</b>`:""}${x.ses.length?` · última: ${esc(x.ses[x.ses.length-1].tema)} (${esc(x.ses[x.ses.length-1].f.trim())})`:""}</p>`; }
    return `<section class="card fuente" style="--c:${F.c}"><div class="card-h"><span class="card-ic">${ICON[F.ic]}</span><h3>${esc(F.n)}</h3><div class="card-acc">${id?`<a class="link" href="https://docs.google.com/spreadsheets/d/${esc(id)}/edit" target="_blank" rel="noopener">Abrir ${ICON.right}</a>`:""}</div></div><p class="mini">${esc(F.d)}</p>${cuerpo}${at?`<small class="fuente-at">Leída ${hace(at)} · solo lectura</small>`:""}</section>`; };
  return `${cab("Mis hojas", "Tus sistemas en Google Sheets, leídos por Mila sin modificarlos", conectadas.length?`${btn(ICON.repeat+(S.fuentesUI.cargando?" Leyendo…":" Actualizar"),"fuentesLeer")}${btn(ICON.inbox+" Extraer recuerdos y frases","fuentesExtraer","","pri")}`:"")}
  ${!G?.valido()&&conectadas.length?`<div class="aviso">${ICON.alert}<span>Para leer tus hojas necesito Google conectado. ${btn("Conectar Google","gConectar","","sm pri")}</span></div>`:""}
  <div class="fuentes-g">${Object.keys(FUENTES_DEF).map(card).join("")}</div>
  <p class="mini">Mila solo lee tus hojas. Cuando extraes recuerdos o frases, primero los revisas; luego viven en Mila y se sincronizan con tus dispositivos.</p>`;
};
function diasDesde(txt){ const m=String(txt||"").match(/(\d{1,2}) de (\w+)/); if(!m) return 0; const mi=MESES.indexOf(norm(m[2])); if(mi<0) return 0; return diffDays(new Date(new Date().getFullYear(), mi, Number(m[1])), new Date()); }
