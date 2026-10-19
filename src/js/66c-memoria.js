/* =========================================================
   MEMORIA · lo que Mila sabe de ti (buscar, filtrar, corregir, olvidar)
   Fuentes: lo que tú le dices, tus hojas (PROYECTO_LUZMILA, Taller del Zorro, Culta)
   y lo que autorices importar de la memoria de Claude.
   ========================================================= */
const MEM_CATS = ["Personalidad","Proyectos","Metas","Estudios","Prácticas","Familia","Salud y energía","Gustos","Valores","Rutinas","General"];
const MEM_TIPOS = {preferencia:"Gusto", persona:"Persona", hecho:"Dato", objetivo:"Objetivo", rutina:"Rutina", decision:"Decisión", proyecto:"Proyecto", suposicion:"Suposición", rasgo:"Rasgo"};
function memCat(m){ if(MEM_CATS.includes(m.area)) return m.area; const t=norm(m.texto+" "+(m.area||""));
  if(/tesis|universidad|ciclo|curso|clase|estudi|unjbg|culta/.test(t)) return "Estudios"; if(/practica|roqaseg|trabajo|jefe/.test(t)) return "Prácticas";
  if(/mama|papa|herman|familia/.test(t)) return "Familia"; if(/proyecto|zorro|sistema|fase/.test(t)) return "Proyectos"; if(/meta|objetivo|quiero lograr/.test(t)) return "Metas";
  if(/me gusta|me encanta|prefiero|favorit|odio|no me gusta/.test(t)) return "Gustos"; if(/energia|dormir|sueno|salud|comida|ritual/.test(t)) return "Salud y energía";
  if(/soy |me cuesta|tiendo|personalidad|humor|timida|miedo/.test(t)) return "Personalidad"; return "General"; }
function memFuente(m){ const f=norm(m.fuente||""); return /claude/.test(f)?"Memoria de Claude": /hoja|proyecto_luzmila|zorro|culta|sheet/.test(f)?"Tus hojas": "Me lo dijiste"; }
VISTAS.memoria = function(){
  const U=S.memUI; const q=norm(U.q);
  let l = S.memorias.slice().sort((a,b)=>(b.actualizado||b.creado||0)-(a.actualizado||a.creado||0));
  const conteo = c => S.memorias.filter(m=>memCat(m)===c).length;
  if(q) l = l.filter(m=>norm(m.texto+" "+(m.area||"")+" "+(m.fuente||"")).includes(q));
  if(U.cat) l = l.filter(m=>memCat(m)===U.cat); if(U.fuente) l = l.filter(m=>memFuente(m)===U.fuente);
  const grupos = groupBy(l, memCat);
  const fuentes = ["Me lo dijiste","Tus hojas","Memoria de Claude"];
  return `${cab("Lo que sé de ti", `${plural(S.memorias.length,"dato","datos")} que Mila usa para ayudarte. Tú decides qué se queda.`, btn(ICON.plus+" Enséñame algo","sheetOpen",'data-v="memoria"',"pri")+btn(ICON.brain+" Importar de Claude","sheetOpen",'data-v="claudeMem"'))}
  <div class="mem-top card">
    <label class="buscar grande">${ICON.search}<input id="memBuscar" placeholder="Busca: tesis, mamá, lúcuma, Zorro…" value="${esc(U.q)}"></label>
    <div class="chips">${`<button type="button" class="chip ${!U.cat?"on":""}" data-act="memCat" data-v="">Todo<span>${S.memorias.length}</span></button>`+MEM_CATS.filter(conteo).map(c=>`<button type="button" class="chip ${U.cat===c?"on":""}" data-act="memCat" data-v="${esc(c)}">${esc(c)}<span>${conteo(c)}</span></button>`).join("")}</div>
    <div class="chips sm">${fuentes.map(f=>`<button type="button" class="chip ${U.fuente===f?"on":""}" data-act="memFuente" data-v="${esc(f)}">${f==="Memoria de Claude"?ICON.brain:f==="Tus hojas"?ICON.sheet:ICON.user}${f}</button>`).join("")}</div>
  </div>
  ${l.length ? `<div class="mem-g">${Object.entries(grupos).map(([k,ms])=>`<section class="card"><div class="card-h"><h3>${esc(k)}</h3><span class="cnt">${ms.length}</span></div>${ms.map(m=>`<div class="mem ${m.confianza==="inferido"?"inf":""}"><div class="grow"><p>${esc(m.texto)}</p><small>${esc(MEM_TIPOS[m.tipo]||capital(m.tipo||"Dato"))} · ${esc(memFuente(m))}${m.confianza==="inferido"?" · por confirmar":""}</small></div><span class="mem-acc"><button type="button" class="ib sm" data-act="memEditar" data-id="${m.id}" title="Corregir">${ICON.edit}</button><button type="button" class="ib sm" data-act="memOlvidar" data-id="${m.id}" title="Olvidar">${ICON.trash}</button></span></div>`).join("")}</section>`).join("")}</div>`
    : vacio("memoria", q||U.cat||U.fuente?"Nada coincide":"Aún no sé mucho de ti", q||U.cat||U.fuente?"Prueba otra búsqueda o quita los filtros.":"Dime cosas como «me encanta la lúcuma» o importa tu paquete en Ajustes → Importar.")}
  <section class="card mem-nota"><div class="card-h"><span class="card-ic">${ICON.shield}</span><h3>Sobre la memoria de Claude</h3></div>
    <p class="mini">La memoria de tus chats en claude.ai no tiene una conexión directa con Mila. Para traerla: en claude.ai pídele a Claude «resume lo que recuerdas de mí en una lista», copia la respuesta y pégala en <b>Importar de Claude</b>. Verás cada dato y eliges cuáles guardar. Lo que Claude Code ya sabe de ti viene en tu paquete privado de importación.</p></section>`;
};
SHEETS.claudeMem = (d={}) => {
  const items = d.items||null;
  if(!items) return `${sheetHead("Importar de la memoria de Claude", ICON.brain)}<p class="mini">Pega aquí lo que Claude recuerda de ti (una idea por línea). Nada se guarda hasta que lo revises.</p>
    <form data-form="claudeMemPrev" class="frm">${fld("Texto", `<textarea name="t" rows="8" required autofocus placeholder="• Estudia Administración en la UNJBG…&#10;• Prefiere respuestas breves…"></textarea>`)}<div class="sh-acc"><button type="submit" class="btn pri">Revisar</button></div></form>`;
  return `${sheetHead(`Revisa ${plural(items.length,"dato","datos")}`, ICON.brain)}<p class="mini">Desmarca lo que no quieras que Mila recuerde.</p>
    <form data-form="claudeMemGuardar" class="frm"><div class="rev-l">${items.map((t,i)=>`<label class="rev-i"><input type="checkbox" name="i${i}" checked><span>${esc(t)}</span><input type="hidden" name="t${i}" value="${esc(t)}"></label>`).join("")}</div>
    <div class="sh-acc"><button type="submit" class="btn pri">Guardar seleccionados</button></div></form>`;
};
function partirMemoria(txt){
  return String(txt||"").split(/\r?\n|(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ])/).map(s=>s.replace(/^[\s•\-–*·\d.)]+/,"").trim()).filter(s=>s.length>6 && s.length<400 && !/^(claro|aqu[ií] (tienes|est[aá])|esto es lo que|resumen)/i.test(s));
}
