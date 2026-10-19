/* =========================================================
   Hojas: formularios para crear, ver y editar
   ========================================================= */
const fld = (label, input, cls="") => `<label class="fld ${cls}"><span>${label}</span>${input}</label>`;
const radios = (name, opts, cur, extra=c=>"") => `<div class="chips sel">${opts.map(([v,l,c])=>`<label class="chip ${v===cur?"on":""}" ${c?`style="--c:${c}"`:""}><input type="radio" name="${name}" value="${esc(v)}" ${v===cur?"checked":""} hidden>${c?`<i class="pt" style="background:${c}"></i>`:""}${esc(l)}</label>`).join("")}</div>`;
const sheetHead = (titulo, ic="", c="") => `<div class="sh-h" ${c?`style="--c:${c}"`:""}>${ic?`<span class="sh-ic">${ic}</span>`:""}<h2>${titulo}</h2></div>`;

SHEETS.mov = (d) => {
  const m = d.id ? S.movimientos.find(x=>x.id===d.id) : null; const tipo = m?.tipo || d.tipo || "gasto"; const p=S.profile;
  return `${sheetHead(m?"Editar movimiento":"Registrar "+(tipo==="ingreso"?"ingreso":"gasto"), ICON.wallet)}
  <form data-form="mov" data-id="${m?.id||""}" class="frm">
    ${segmentos("movTipo", [["gasto","Gasto"],["ingreso","Ingreso"]], tipo)}<input type="hidden" name="tipo" value="${tipo}">
    <label class="monto-big"><span>S/</span><input name="monto" type="number" inputmode="decimal" step="0.01" min="0" value="${m?m.monto:""}" placeholder="0.00" required autofocus></label>
    ${fld("Concepto", `<input name="concepto" value="${esc(m?.concepto||"")}" placeholder="${tipo==="gasto"?"Almuerzo, pasaje, copias…":"Pago de prácticas, Yape de mamá…"}">`)}
    ${tipo==="gasto" ? `<div class="fld"><span>Categoría</span>${radios("categoria", p.categorias.map(c=>[c,c,colorCat(c)]), m?.categoria||"")}</div>` : fld("¿De dónde viene?", `<input name="fuente" value="${esc(m?.fuente||"")}" list="fuentesL" placeholder="Scotiabank, Prácticas, Familia…"><datalist id="fuentesL">${p.fuentes.map(f=>`<option>${esc(f)}</option>`).join("")}</datalist>`)}
    <div class="fld"><span>Método</span>${radios("metodo", p.metodos.map(x=>[x,x]), m?.metodo||p.ajustes.metodoPorDefecto)}</div>
    <div class="fila2">${fld("Fecha", `<input name="fecha" type="date" value="${m?.fecha||todayStr()}">`)}${fld("Detalle (opcional)", `<input name="detalles" value="${esc(m?.detalles||"")}">`)}</div>
    <div class="sh-acc">${m?btn(ICON.trash+" Borrar","movBorrar",`data-id="${m.id}"`,"ghost danger"):""}<button type="submit" class="btn pri">${m?"Guardar cambios":"Registrar"}</button></div>
  </form>`;
};
SHEETS.tarea = (d) => {
  const t = d.id ? S.tareas.find(x=>x.id===d.id) : null; const areas=[...new Set([...S.profile.areas, ...S.tareas.map(x=>x.area).filter(Boolean)])];
  return `${sheetHead(t?"Editar tarea":"Nueva tarea", ICON.task)}
  <form data-form="tarea" data-id="${t?.id||""}" class="frm">
    ${fld("¿Qué tienes que hacer?", `<input name="titulo" value="${esc(t?.titulo||"")}" required autofocus placeholder="Ej.: Revisar capítulo 2 de la tesis">`)}
    <div class="fila3">${fld("Fecha", `<input name="vence" type="date" value="${t?.vence||d.fecha||""}">`)}${fld("Hora", `<input name="hora" type="time" value="${t?.hora||""}">`)}${fld("Duración", `<select name="dur">${[15,30,45,60,90,120].map(n=>`<option value="${n}" ${(t?.dur||30)==n?"selected":""}>${n<60?n+" min":n/60+" h"}</option>`).join("")}</select>`)}</div>
    <div class="atajos-f">${[["Hoy",todayStr()],["Mañana",ymd(addDays(new Date(),1))],["Viernes",ymd(nextWeekday(new Date(),5))],["Próx. semana",ymd(nextWeekday(new Date(),1,true))]].map(([l,v])=>`<button type="button" class="chip" data-act="fechaRapida" data-v="${v}">${l}</button>`).join("")}</div>
    <div class="fld"><span>Prioridad</span>${radios("prioridad", [["alta","Alta","#E0565B"],["media","Media","#E8912D"],["baja","Baja","#8A86A6"]], t?.prioridad||"media")}</div>
    <div class="fld"><span>Área</span>${radios("area", [["","Ninguna"], ...areas.map(a=>[a,a,catColor(areaCat(a))])], t?.area||"")}</div>
    ${fld("Notas", `<textarea name="notas" rows="2">${esc(t?.notas||"")}</textarea>`)}
    <div class="sh-acc">${t?btn(ICON.trash+" Borrar","tareaBorrar",`data-id="${t.id}"`,"ghost danger")+btn(ICON.check+(t.estado==="hecha"?" Reabrir":" Completar"),"tareaToggle",`data-id="${t.id}"`):""}<button type="submit" class="btn pri">${t?"Guardar":"Crear tarea"}</button></div>
  </form>`;
};
SHEETS.evento = (d) => {
  const e = d.id ? buscarEvento(d.id) : null; const fecha = e ? ymd(e.ini) : (d.fecha || todayStr());
  const hora = e ? hhmm(e.ini) : (d.hora || (()=>{ const n=new Date(); n.setMinutes(0); n.setHours(n.getHours()+1); return hhmm(n); })());
  const fin = e ? hhmm(e.fin) : (d.fin || (()=>{ const [h,m]=hora.split(":").map(Number); return pad((h+1)%24)+":"+pad(m); })());
  const cat = e?.cat || "otros";
  return `${sheetHead(e?"Editar evento":"Nuevo evento", ICON.cal, catColor(cat))}
  <form data-form="evento" data-id="${e?.id||""}" class="frm">
    ${fld("Título", `<input name="titulo" value="${esc(e?.titulo||d.titulo||"")}" required autofocus placeholder="Ej.: Reunión con mi asesor">`)}
    <div class="fila3">${fld("Fecha", `<input name="fecha" type="date" value="${fecha}">`)}${fld("Inicio", `<input name="ini" type="time" value="${hora}">`)}${fld("Fin", `<input name="fin" type="time" value="${fin}">`)}</div>
    <label class="tog"><input type="checkbox" name="allDay" ${e?.allDay?"checked":""}><i></i>Todo el día</label>
    <div class="fld"><span>Categoría</span>${radios("cat", Object.entries(CATS).map(([k,c])=>[k,c.n,c.c]), cat)}</div>
    <div class="fila2">${fld("Lugar", `<input name="lugar" value="${esc(e?.lugar||"")}" placeholder="Aula, oficina, Zoom…">`)}${fld("Aviso", `<select name="rec">${[[0,"A la hora"],[10,"10 min antes"],[30,"30 min antes"],[60,"1 hora antes"],[1440,"1 día antes"]].map(([v,l])=>`<option value="${v}" ${(e?.rec??30)==v?"selected":""}>${l}</option>`).join("")}</select>`)}</div>
    ${fld("Notas", `<textarea name="notas" rows="2">${esc(e?.notas||"")}</textarea>`)}
    ${!Cal.ok()?`<p class="mini">${ICON.alert} Se guardará en Mila. ${Cal.disponible()?"Conecta Google para que también aparezca en tu Google Calendar y suene en tu celular.":"Configura Google en Ajustes para sincronizarlo con tu calendario."}</p>`:`<p class="mini">${ICON.google} Se guardará en tu Google Calendar.</p>`}
    <div class="sh-acc">${e?btn(ICON.trash+" Borrar","evBorrar",`data-id="${esc(e.id)}"`,"ghost danger"):""}<button type="submit" class="btn pri">${e?"Guardar":"Crear evento"}</button></div>
  </form>`;
};
SHEETS.evDetalle = (d) => {
  const e = buscarEvento(d.id); if(!e) return `<p>Ese evento ya no existe.</p>`;
  if(e.src==="t"){ setTimeout(()=>abrirSheet("tarea",{id:e.tid}),0); return ""; }
  const dur = Math.round((e.fin-e.ini)/60000);
  return `<div class="ev-det" style="--c:${catColor(e.cat)}">
    <div class="evd-banda"><span class="evd-cat">${CATS[e.cat]?.n||"Evento"}</span><h2>${esc(e.titulo)}</h2><p>${capital(fmtDiaLargo(e.ini))}${e.allDay?" · todo el día":` · ${hhmm(e.ini)} – ${hhmm(e.fin)} (${dur>=60?Math.round(dur/6)/10+" h":dur+" min"})`}</p></div>
    ${e.lugar?`<p class="evd-row">${ICON.pin}${esc(e.lugar)}</p>`:""}${e.notas?`<p class="evd-row">${ICON.edit}${esc(e.notas).replace(/\n/g,"<br>")}</p>`:""}
    ${e.ini>new Date()?`<p class="evd-row">${ICON.clock}Empieza ${cuentaAtras(e.ini)}</p>`:""}
    ${e.meet?`<a class="btn" href="${esc(e.meet)}" target="_blank" rel="noopener">Unirse a la videollamada</a>`:""}
    ${e.link?`<a class="link" href="${esc(e.link)}" target="_blank" rel="noopener">${ICON.google} Ver en Google Calendar</a>`:""}
    ${e.propio===false?`<p class="mini">Este evento lo organiza otra persona; algunos cambios no se reflejarán para los demás.</p>`:""}
    <div class="sh-acc">${btn(ICON.trash+" Borrar","evBorrar",`data-id="${esc(e.id)}"`,"ghost danger")}${btn("Mañana","evManana",`data-id="${esc(e.id)}"`)}${btn(ICON.copy+" Duplicar","evDuplicar",`data-id="${esc(e.id)}"`)}${btn(ICON.edit+" Editar","evEditar",`data-id="${esc(e.id)}"`,"pri")}</div>
  </div>`;
};
SHEETS.recuerdo = (d) => {
  const r = d.id ? S.recuerdos.find(x=>x.id===d.id) : null;
  if(r && !d.editar) return `<div class="rec-det" style="--c:${emoColor(r.emocion)}"><span class="rc-emo">${emoLabel(r.emocion)}</span><h2>${esc(r.titulo)}</h2><p class="mini">${r.fecha?capital(fmtDiaLargo(pymd(r.fecha)))+" de "+r.fecha.slice(0,4):esc(r.fecha_aprox||"")}${(r.personas||[]).length?" · con "+esc(r.personas.join(", ")):""}${r.lugar?" · "+esc(r.lugar):""}</p>
    <div class="rec-txt">${esc(r.texto||r.relato||"").replace(/\n/g,"<br>")}</div>${(r.etiquetas||[]).length?`<div class="chips">${r.etiquetas.map(t=>`<span class="chip">${esc(t)}</span>`).join("")}</div>`:""}
    <div class="sh-acc">${btn(ICON.trash+" Borrar","recBorrar",`data-id="${r.id}"`,"ghost danger")}${btn(ICON.volume+" Escuchar","leer",`data-v="${esc(r.titulo+". "+(r.texto||""))}"`)}${btn(ICON.edit+" Editar","recEditar",`data-id="${r.id}"`,"pri")}</div></div>`;
  return `${sheetHead(r?"Editar recuerdo":"Nuevo recuerdo", ICON.memory)}
  <form data-form="recuerdo" data-id="${r?.id||""}" class="frm">
    ${r?fld("Título", `<input name="titulo" value="${esc(r.titulo)}">`):""}
    ${fld("¿Qué pasó?", `<textarea name="texto" rows="5" required autofocus placeholder="Cuéntalo con tus palabras…">${esc(r?.texto||"")}</textarea>`)}
    <div class="fld"><span>¿Cómo lo sentiste?</span>${radios("emocion", [["","Que Mila decida"], ...EMOS.map(([k,l,c])=>[k,l,c])], r?.emocion||"")}</div>
    ${fld("Fecha", `<input name="fecha" type="date" value="${r?.fecha||todayStr()}">`)}
    <div class="sh-acc"><button type="submit" class="btn pri">Guardar recuerdo</button></div>
  </form>`;
};
SHEETS.habito = (d) => {
  const h = d.id ? S.habitos.find(x=>x.id===d.id) : null; const icons = Object.keys(HAB_IC); const cols=["#1FA97A","#7C5CFF","#3A8DDE","#E8912D","#E06AA8","#14A3B8","#C2702B"];
  return `${sheetHead(h?"Editar hábito":"Nuevo hábito", ICON.sprout)}
  <form data-form="habito" data-id="${h?.id||""}" class="frm">
    ${fld("Hábito", `<input name="nombre" value="${esc(h?.nombre||"")}" required autofocus placeholder="Ej.: Leer 10 minutos">`)}
    <div class="atajos-f">${["Tomar 2 L de agua","Leer 10 minutos","Caminar 20 minutos","Avanzar la tesis","Dormir antes de las 12","Meditar 5 minutos"].map(x=>`<button type="button" class="chip" data-act="habSug" data-v="${x}">${x}</button>`).join("")}</div>
    <div class="fld"><span>Ícono</span><div class="iconos">${icons.map(k=>`<label class="ico ${((h?.icono)||"leaf")===k?"on":""}"><input type="radio" name="icono" value="${k}" ${((h?.icono)||"leaf")===k?"checked":""} hidden>${HAB_IC[k]}</label>`).join("")}</div></div>
    <div class="fld"><span>Color</span><div class="swatches">${cols.map(c=>`<label class="sw ${(h?.color||cols[0])===c?"on":""}" style="--c:${c}"><input type="radio" name="color" value="${c}" ${(h?.color||cols[0])===c?"checked":""} hidden></label>`).join("")}</div></div>
    <div class="sh-acc">${h?btn(ICON.trash+" Borrar","habBorrar",`data-id="${h.id}"`,"ghost danger"):""}<button type="submit" class="btn pri">${h?"Guardar":"Crear hábito"}</button></div>
  </form>`;
};
SHEETS.meta = (d) => {
  const g = d.id ? S.metas.find(x=>x.id===d.id) : null;
  return `${sheetHead(g?"Editar meta":"Nueva meta", ICON.target)}
  <form data-form="meta" data-id="${g?.id||""}" class="frm">
    ${fld("Meta", `<input name="titulo" value="${esc(g?.titulo||"")}" required autofocus placeholder="Ej.: Terminar el capítulo 2 de la tesis">`)}
    ${fld("Próximo paso pequeño", `<input name="proxima_accion" value="${esc(g?.proxima_accion||"")}" placeholder="Ej.: Leer 2 artículos sobre socialización">`)}
    <div class="fila2">${fld("Fecha límite", `<input name="fecha_limite" type="date" value="${g?.fecha_limite||""}">`)}${fld("Área", `<input name="area" value="${esc(g?.area||"")}" list="areasL"><datalist id="areasL">${S.profile.areas.map(a=>`<option>${esc(a)}</option>`).join("")}</datalist>`)}</div>
    ${g?fld(`Progreso: <b id="pv">${g.progreso||0}%</b>`, `<input name="progreso" type="range" min="0" max="100" step="5" value="${g.progreso||0}" oninput="document.getElementById('pv').textContent=this.value+'%'">`):""}
    ${g?`<div class="fld"><span>Estado</span>${radios("estado", [["activa","Activa"],["pausada","En pausa"],["lograda","Lograda"]], g.estado)}</div>`:""}
    <div class="sh-acc">${g?btn(ICON.trash+" Borrar","metaBorrar",`data-id="${g.id}"`,"ghost danger"):""}<button type="submit" class="btn pri">${g?"Guardar":"Crear meta"}</button></div>
  </form>`;
};
SHEETS.animo = () => {
  const a = S.animo.find(x=>x.id===todayStr());
  return `${sheetHead("¿Cómo te sientes hoy?", ICON.heart)}
  <form data-form="animo" class="frm"><div class="caras grandes">${MOODS.map(m=>`<label class="cara ${a?.estado===m.k?"on":""}" style="--c:${m.c}"><input type="radio" name="estado" value="${m.k}" ${a?.estado===m.k?"checked":""} hidden>${caraSVG(m.k)}<small>${m.l}</small></label>`).join("")}</div>
  ${fld("¿Quieres contar por qué? (opcional)", `<textarea name="nota" rows="2">${esc(a?.nota||"")}</textarea>`)}
  <div class="sh-acc"><button type="submit" class="btn pri">Guardar</button></div></form>`;
};
SHEETS.memoria = (d) => {
  const m = d.id ? S.memorias.find(x=>x.id===d.id) : null;
  return `${sheetHead(m?"Corregir dato":"Enséñale algo a Mila", ICON.spark)}
  <form data-form="memoria" data-id="${m?.id||""}" class="frm">${fld("Dato", `<textarea name="texto" rows="3" required autofocus placeholder="Ej.: Me encanta el helado de lúcuma">${esc(m?.texto||"")}</textarea>`)}
  <div class="sh-acc">${m?btn(ICON.trash+" Olvidar","memOlvidar",`data-id="${m.id}"`,"ghost danger"):""}<button type="submit" class="btn pri">Guardar</button></div></form>`;
};
SHEETS.presupuestos = () => {
  const p=S.profile.presupuestos||{}; const mes=ymd(new Date()).slice(0,7); const {ms}=totalesMes(mes);
  const prom = c => { const v=[1,2,3].map(k=>sum(totalesMes(mesMas(mes,-k)).ms.filter(m=>m.tipo==="gasto"&&m.categoria===c),m=>m.monto)); const n=v.filter(Boolean).length; return n?Math.round(sum(v)/n):0; };
  return `${sheetHead("Presupuestos del mes", ICON.wallet)}<p class="mini">Ponle un tope a cada categoría. Déjalo vacío si no quieres límite. Entre paréntesis, tu promedio de los últimos meses.</p>
  <form data-form="presupuestos" class="frm pres-frm">${S.profile.categorias.map(c=>`<label class="pres-in"><span><i style="background:${colorCat(c)}"></i>${esc(c)} <small>(${prom(c)?money0(prom(c)):"sin datos"})</small></span><input name="${esc(c)}" type="number" min="0" step="10" inputmode="numeric" value="${p[c]||""}" placeholder="—"></label>`).join("")}
  <div class="sh-acc"><button type="submit" class="btn pri">Guardar presupuestos</button></div></form>`;
};
SHEETS.mic = () => `${sheetHead("Hablar con Mila", ICON.mic)}
  ${ES_BRAVE ? `<p><b>Brave bloquea el dictado por voz</b> de las páginas web (es una decisión de privacidad de Brave, no de Mila).</p><ul><li><b>Opción gratis 1:</b> abre Mila en <b>Microsoft Edge</b> o <b>Chrome</b>: ahí el micrófono funciona y Edge además tiene voces naturales.</li><li><b>Opción gratis 2:</b> en la caja de texto, presiona <b>Windows + H</b> y dicta; luego toca enviar.</li><li><b>En el celular:</b> toca el micrófono de tu teclado.</li></ul>${window.MilaApp?.Claves.get().googleClientId?btn(ICON.copy+" Copiar enlace para Edge","copiarEnlace","","pri"):""}`
  : !SR ? `<p>Este navegador no tiene dictado por voz. Usa el micrófono de tu teclado (en Windows: <b>Windows + H</b>) o abre Mila en Edge o Chrome.</p>`
  : `<p>Para escucharte, tu navegador necesita permiso del micrófono. Toca el candado junto a la dirección de la página → Micrófono → Permitir, y vuelve a intentarlo.</p>`}`;
SHEETS.avisos = () => `${sheetHead("Lo que Mila nota", ICON.bell)}<div class="avisos">${avisosMila().map(a=>`<div class="aviso-i"><span class="mila-mini">${milaSVG({emo:a.emo})}</span><div><p>${esc(a.t)}</p>${a.acc?`<div class="btns">${a.acc.map(([l,k,v])=>`<button type="button" class="btn sm" data-act="${k==="say"?"decir":k==="go"?"ir":"sheetOpen"}" data-v="${esc(v)}">${esc(l)}</button>`).join("")}</div>`:""}</div></div>`).join("")}</div>`;
SHEETS.mas = () => `${sheetHead("Más secciones")}<div class="mas-g">${[...RUTAS.slice(3), {id:"ajustes", n:"Ajustes", ic:"gear"}].map(r=>`<button type="button" class="mas-i" data-go="${r.id}">${ICON[r.ic]}<span>${r.n}</span></button>`).join("")}</div>`;
SHEETS.tareaMenu = (d) => { const t=S.tareas.find(x=>x.id===d.id); if(!t) return ""; return `${sheetHead(esc(t.titulo), ICON.task)}<div class="menu-l">
  ${[["tareaEditar",ICON.edit,"Editar"],["tareaHoy",ICON.sun,"Para hoy"],["tareaManana",ICON.right,"Para mañana"],["tareaAgendar",ICON.cal,"Ponerle hora en la agenda"],["tareaPrio",ICON.flag,t.prioridad==="alta"?"Quitar prioridad":"Marcar prioritaria"],["tareaBorrar",ICON.trash,"Borrar"]].map(([a,ic,l])=>`<button type="button" class="menu-i ${a==="tareaBorrar"?"danger":""}" data-act="${a}" data-id="${t.id}">${ic}<span>${l}</span></button>`).join("")}</div>`; };
SHEETS.habMenu = (d) => { const h=S.habitos.find(x=>x.id===d.id); if(!h) return ""; return `${sheetHead(esc(h.nombre), ICON.sprout)}<div class="menu-l">${[["habEditar",ICON.edit,"Editar"],["habAyer",ICON.undo,h.registros?.[ymd(addDays(new Date(),-1))]?"Desmarcar ayer":"Marcar ayer"],["habBorrar",ICON.trash,"Borrar hábito"]].map(([a,ic,l])=>`<button type="button" class="menu-i ${a==="habBorrar"?"danger":""}" data-act="${a}" data-id="${h.id}">${ic}<span>${l}</span></button>`).join("")}</div>`; };
SHEETS.metaMenu = (d) => { const g=S.metas.find(x=>x.id===d.id); if(!g) return ""; return `${sheetHead(esc(g.titulo), ICON.target)}<div class="menu-l">${[["metaEditar",ICON.edit,"Editar"],["metaPausar",ICON.clock,g.estado==="pausada"?"Reactivar":"Poner en pausa"],["metaBorrar",ICON.trash,"Borrar meta"]].map(([a,ic,l])=>`<button type="button" class="menu-i ${a==="metaBorrar"?"danger":""}" data-act="${a}" data-id="${g.id}">${ic}<span>${l}</span></button>`).join("")}</div>`; };
SHEETS.texto = (d) => `${sheetHead(esc(d.titulo||""), d.ic||"")}<form data-form="texto" class="frm" data-k="${esc(d.k)}">${fld(esc(d.label||""), `<input name="v" required autofocus value="${esc(d.valor||"")}">`)}<div class="sh-acc"><button type="submit" class="btn pri">Guardar</button></div></form>`;
SHEETS.enlace = (d) => `${sheetHead("Enlace para otro navegador", ICON.link)}<p class="mini">Ábrelo en Edge (u otro navegador) y toca «Conectar Google»: Mila traerá todo desde tu Drive.</p><textarea readonly rows="3" class="enlace" onclick="this.select()">${esc(d.url)}</textarea>`;

/* ---------- guardar formularios ---------- */
const FORMS = {
  async mov(f, el){ const id=el.dataset.id; const data={tipo:f.tipo, monto:f.monto, concepto:f.concepto, categoria:f.categoria, metodo:f.metodo, fecha:f.fecha, fuente:f.fuente||"", detalles:f.detalles||""};
    const r = id ? await A.editarMovimiento(id, data) : await A.movimiento(data, "manual"); cerrarSheet(); toast(id?"Movimiento actualizado":`${f.tipo==="ingreso"?"Ingreso":"Gasto"} de ${money(f.monto)} registrado`, {undo:r.log, icon:ICON.wallet}); },
  async tarea(f, el){ const id=el.dataset.id; const data={titulo:f.titulo, vence:f.vence||"", hora:f.hora||"", prioridad:f.prioridad, area:f.area||"", notas:f.notas||"", dur:f.dur};
    const r = id ? await A.editarTarea(id, data) : await A.tarea(data); cerrarSheet(); toast(id?"Tarea actualizada":"Tarea creada", {undo:r.log, icon:ICON.task}); },
  async evento(f, el){ const id=el.dataset.id; const allDay=!!f.allDay; const ini=allDay?pymd(f.fecha):new Date(`${f.fecha}T${f.ini||"09:00"}:00`); let fin=allDay?addDays(pymd(f.fecha),1):new Date(`${f.fecha}T${f.fin||f.ini}:00`); if(!allDay && fin<=ini) fin=addMin(ini,60);
    const data={titulo:f.titulo, ini, fin, allDay, cat:f.cat, lugar:f.lugar, notas:f.notas, rec:Number(f.rec)};
    const r = id ? await A.editarEvento(id, {...data, ini:ini.toISOString(), fin:fin.toISOString()}) : await A.evento(data); cerrarSheet();
    toast(id?"Evento actualizado":`Evento creado ${relDia(ini)}${allDay?"":" a las "+hhmm(ini)}`, {undo:r.log, icon:ICON.cal}); if(r.choques?.length) setTimeout(()=>toast(`Ojo: se cruza con «${r.choques[0].titulo}»`, {icon:ICON.alert}), 3300); },
  async recuerdo(f, el){ const id=el.dataset.id; if(id){ const r=await A.editarRecuerdo(id, {titulo:f.titulo, texto:f.texto, fecha:f.fecha, ...(f.emocion?{emocion:f.emocion}:{})}); cerrarSheet(); toast("Recuerdo actualizado", {undo:r.log}); return; }
    const r = await A.recuerdo({relato:f.texto, fecha:f.fecha, ...(f.emocion?{emocion:f.emocion}:{}), origen:"manual"}); cerrarSheet(); toast(REC_REPLY[r.doc.emocion]||"Recuerdo guardado", {undo:r.log, icon:ICON.memory}); },
  async habito(f, el){ const id=el.dataset.id; if(id){ const h=S.habitos.find(x=>x.id===id); const prev={...h}; delete prev.id; await Store.update("habitos", id, {nombre:capital(f.nombre), icono:f.icono, color:f.color}); await logAction("Hábito editado", {op:"restore", col:"habitos", id, data:prev}); cerrarSheet(); toast("Hábito actualizado"); return; }
    const r=await A.nuevoHabito({nombre:f.nombre, icono:f.icono, color:f.color}); cerrarSheet(); toast(r.resumen, {undo:r.log, icon:ICON.sprout}); },
  async meta(f, el){ const id=el.dataset.id; const r = await A.meta({...(id?{id}:{}), titulo:f.titulo, proxima_accion:f.proxima_accion, fecha_limite:f.fecha_limite, area:f.area, ...(f.progreso!==undefined?{progreso:Number(f.progreso)}:{}), ...(f.estado?{estado:f.estado}:{})});
    cerrarSheet(); toast(r.resumen, {undo:r.log, icon:ICON.target}); if(f.estado==="lograda") Mila.celebrar(); },
  async animo(f){ if(!f.estado) return toast("Elige una carita"); await A.animo(f.estado, f.nota); cerrarSheet(); toast("Ánimo guardado", {icon:ICON.heart}); },
  async memoria(f, el){ const id=el.dataset.id; const r = id ? await A.corregirMemoria(id, f.texto) : await A.recordar({texto:f.texto}); cerrarSheet(); toast(r.resumen, {undo:r.log, icon:ICON.spark}); },
  async presupuestos(f){ const p={}; for(const c of S.profile.categorias){ const v=Number(f[c]); if(v>0) p[c]=v; } S.profile.presupuestos = {}; await Store.saveProfile({presupuestos:null}); await Store.saveProfile({presupuestos:p}); cerrarSheet(); toast("Presupuestos guardados"); render(); },
  async texto(f, el){ const k=el.dataset.k; const v=String(f.v||"").trim(); if(!v) return;
    if(k==="cat") await Store.saveProfile({categorias:[...S.profile.categorias, capital(v)]}); if(k==="met") await Store.saveProfile({metodos:[...S.profile.metodos, capital(v)]}); cerrarSheet(); render(); },
  async quickTarea(f, el){ const v=String(f.t||"").trim(); if(!v) return; el.reset(); const r = await ejecutar({...entender("agrega tarea "+v), raw:"agrega tarea "+v}); toast(r.t, {icon:ICON.task, undo:r.cards?.[0]?.log}); if(S.ctx.pending?.kind==="fechaTarea") S.ctx.pending=null; },
  async notaNueva(f, el){ const v=String(f.t||"").trim(); if(!v) return; el.reset(); const r=await A.nota({texto:v, tipo:/^idea|se me ocurri/i.test(v)?"idea":"nota"}); toast("Guardada", {undo:r.log}); },
  async recNuevo(f, el){ const v=String(f.t||"").trim(); if(!v) return; el.reset(); const r=await A.recuerdo({relato:v, origen:"manual"}); toast(REC_REPLY[r.doc.emocion]||"Recuerdo guardado", {undo:r.log, icon:ICON.memory}); }
};
