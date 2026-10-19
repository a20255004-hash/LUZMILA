/* =========================================================
   Cerebro local de Mila (gratis, sin internet, instantáneo)
   Entiende órdenes en español peruano natural, recuerda el
   contexto ("bórralo", "cámbialo a 50"), pregunta cuando algo
   es ambiguo y actúa sobre tus datos reales.
   ========================================================= */
const TYPOS = {qye:"que",qe:"que",q:"que",k:"que",ke:"que",xq:"porque",pq:"porque",porq:"porque",tmb:"tambien",tb:"tambien",tbn:"tambien",x:"por",d:"de",dl:"del",pa:"para",
  porfa:"por favor",xfa:"por favor",plis:"por favor",pls:"por favor",grax:"gracias",grasias:"gracias",ola:"hola",holi:"hola",holis:"hola",bn:"bien",msj:"mensaje",hrs:"horas",hr:"hora",
  manana:"manana",mñn:"manana",mna:"manana",tbien:"tambien",ps:"pues",pe:"pues",nose:"no se",nos:"nos",aora:"ahora",ahorita:"ahorita",oy:"hoy",hoi:"hoy",ayr:"ayer",
  bueno:"bueno",okey:"ok",oki:"ok",okis:"ok",dale:"dale",sip:"si",sep:"si",sii:"si",siii:"si",nop:"no",nel:"no",nopes:"no"};
const VOCAB = ["coloca","guarda","guardalo","borra","borralo","elimina","eliminalo","agrega","anade","añade","registra","anota","recuerdos","recuerdo","recuerda","recuerdame","gasto","gaste","ingreso","tarea","tareas","evento","agenda","agendame","calendario",
  "reunion","pendiente","pendientes","cambia","cambialo","corrige","corrigelo","mueve","muevelo","quita","quitalo","cancela","cancelalo","diario","memoria","habito","habitos","meta","metas","finanzas","dinero",
  "manana","pasado","semana","lunes","martes","miercoles","jueves","viernes","sabado","domingo","hoy","ayer","gracias","programa","programame","organiza","organizame","planifica","recordatorio","completa","termine","termina"];
function lev(a,b){ if(Math.abs(a.length-b.length)>2) return 9; const m=[...Array(b.length+1)].map((_,i)=>i); for(let i=1;i<=a.length;i++){ let prev=m[0]; m[0]=i; for(let j=1;j<=b.length;j++){ const tmp=m[j]; m[j]=Math.min(m[j]+1, m[j-1]+1, prev+(a[i-1]===b[j-1]?0:1)); prev=tmp; } } return m[b.length]; }
function corrige(t){
  return t.split(/(\s+)/).map(w=>{ if(/^\s+$/.test(w)||!w) return w; if(TYPOS[w]!==undefined) return TYPOS[w]; if(w.length<5 || VOCAB.includes(w) || /\d/.test(w)) return w;
    let best=null, bd=2; for(const v of VOCAB){ const d=lev(w,v); if(d<bd || (d===bd && best===null && d<=1)){ if(d<bd){ bd=d; best=v; } } } return (best && bd<=1) ? best : w; }).join("");
}
function limpia(raw){
  let t = norm(raw).replace(/([^\d])[.,;:!¡?¿]+|[.,;:!¡?¿]+(?!\d)/g, "$1 ").replace(/["“”«»()]/g," ").replace(/\s+/g," ").trim();
  t = corrige(t);
  t = t.replace(/^(oye|ey|hey|a ver|mira|ya|bueno|ok|okay|ya pues|oe)\s+(mila\s+)?/,"").replace(/^(hola\s+)?mila\s+/,"").replace(/\s+mila$/,"").replace(/\bpor favor\b/g," ").replace(/\s+/g," ").trim();
  return t;
}
const esPregunta = (raw, t) => /\?/.test(raw) || /^(que|qué|cual|cuanto|cuanta|cuantos|cuando|donde|como|quien|por que|es cierto|sera que|acaso|tienes|sabes|recuerdas|te acuerdas)\b/.test(t);

const TIPO_RE = {
  gasto:/\b(gasto|gastos|compra|pago|egreso)\b/, ingreso:/\b(ingreso|ingresos|deposito|sueldo|pago que me hicieron)\b/, mov:/\b(movimiento|registro de dinero|monto|lo de la plata)\b/,
  tarea:/\b(tarea|tareas|pendiente|pendientes|to ?do)\b/, evento:/\b(evento|eventos|reunion|cita|clase|examen|entrevista|exposicion|junta|consulta|actividad|calendario)\b/,
  rec:/\b(recuerdo|recuerdos|diario)\b/, mem:/\b(dato|memoria|lo que sabes)\b/, nota:/\b(nota|notas|idea|ideas)\b/, habito:/\b(habito|habitos)\b/, meta:/\b(meta|metas|objetivo|objetivos)\b/
};
function tipoMencionado(t){ for(const [k,re] of Object.entries(TIPO_RE)) if(re.test(t)) return k; return null; }
const PRONOMBRE = /\b(lo|la|eso|ese|esa|esto|este|el ultimo|la ultima|lo ultimo|lo anterior|el anterior|la anterior)\b|(lo|la|los|las)$/;
const V_BORRAR = /\b(borra\w*|elimina\w*|quita\w*|suprim\w*|saca\w*|anula\w*|cancela\w*|desaparece\w*)\b/;
const V_EDITAR = /\b(corrig\w*|corrije\w*|cambia\w*|modific\w*|actualiz\w*|edita\w*|ponle|pon le|arregla\w*|reemplaz\w*)\b|\bno era\b|\ben realidad (era|fue|son|es)\b|\bme equivoque\b|\bera(n)? de\b|\bfue(ron)? de\b/;
const V_MOVER = /\b(mueve\w*|mover|pasa(lo|la|r)?|reprogram\w*|posterg\w*|aplaz\w*|adelant\w*|traslad\w*|corre(lo|la)?|cambia(lo|la|r)? (para|al|a la|a las|de dia|de hora|de fecha))\b/;

/* ---------- buscadores difusos ---------- */
function puntuar(texto, consulta){ const a=norm(texto), q=norm(consulta); if(!q) return 0; if(a===q) return 3; if(a.includes(q) || (q.length>4 && q.includes(a))) return 2; return simil(texto, consulta)*1.6; }
function quitarComando(t){
  return t.replace(V_BORRAR," ").replace(V_EDITAR," ").replace(V_MOVER," ")
    .replace(/\b(el|la|los|las|un|una|mi|mis|ese|esa|este|esta|ultimo|ultima|de|del|que|registre|registro|anote|puse|hice|tengo|para|al|a|y|lo|me|en)\b/g," ")
    .replace(/\b(gasto|gastos|ingreso|ingresos|movimiento|tarea|tareas|pendiente|evento|eventos|recuerdo|recuerdos|nota|habito|meta|calendario|agenda|lista)\b/g," ").replace(/\s+/g," ").trim();
}
function buscarMovs(t, {tipo}={}){
  let c = S.movimientos.slice();
  if(tipo==="gasto"||tipo==="ingreso") c = c.filter(m=>m.tipo===tipo);
  const monto = parseMonto(t, {suelto:true}); const f = parseFecha(t);
  if(monto) { const cm = c.filter(m=>Math.abs(m.monto-monto)<0.01); if(cm.length) c=cm; }
  if(f) { const cf = c.filter(m=>m.fecha>=f.desde && m.fecha<=f.hasta); if(cf.length) c=cf; }
  const q = quitarFechaHora(quitarComando(t)).replace(/\b\d+([.,]\d+)?\b|\bsoles?\b|\blucas?\b/g," ").replace(/\s+/g," ").trim();
  if(q.length>2){ const sc = c.map(m=>[m, Math.max(puntuar(m.concepto,q), puntuar(m.categoria||"",q)*0.8, puntuar(m.fuente||"",q), puntuar(m.metodo||"",q)*0.6)]).filter(x=>x[1]>=0.5).sort((a,b)=>b[1]-a[1]); if(sc.length) c = sc.map(x=>x[0]); }
  return c.sort((a,b)=>(b.creado||0)-(a.creado||0));
}
function buscarTareas(t, {pend=true}={}){
  const q = quitarFechaHora(quitarComando(t)).replace(/\b(hecha|lista|completada|terminada|como|marca|ya|hice|termine|acabe|complete|prioridad|alta|media|baja)\b/g," ").replace(/\s+/g," ").trim();
  let c = S.tareas.filter(x=>!pend || x.estado!=="hecha");
  if(!q) return [];
  return c.map(x=>[x, puntuar(x.titulo,q)]).filter(x=>x[1]>=0.55).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
}
function buscarEventos(t){
  const q = quitarFechaHora(quitarComando(t)).replace(/\b(con|reunion|cita|clase)\b/g," $1 ").trim();
  const desde=ymd(addDays(new Date(),-2)), hasta=ymd(addDays(new Date(),45));
  const lista = eventosEntre(desde, hasta, {tareas:false}).filter(e=>!e.alerta);
  if(!q) return [];
  const f = parseFecha(t);
  return lista.map(e=>[e, puntuar(e.titulo,q) + (f && ymd(e.ini)>=f.desde && ymd(e.ini)<=f.hasta ? .4 : 0)]).filter(x=>x[1]>=0.55).sort((a,b)=>b[1]-a[1] || a[0].ini-b[0].ini).map(x=>x[0]);
}
function buscarMem(q){ return S.memorias.map(m=>[m, puntuar(m.texto,q)]).filter(x=>x[1]>=0.5).sort((a,b)=>b[1]-a[1]).map(x=>x[0]); }
function buscarRec(q){ return S.recuerdos.map(r=>[r, Math.max(puntuar(r.titulo||"",q), puntuar(r.texto||"",q)*.9)]).filter(x=>x[1]>=0.5).sort((a,b)=>b[1]-a[1]).map(x=>x[0]); }

/* ---------- etiquetas para mostrar opciones ---------- */
const etqMov = m => `${m.tipo==="gasto"?"Gasto":"Ingreso"} ${money(m.monto)} · ${m.concepto} · ${relDia(m.fecha)}`;
const etqTarea = x => `${x.titulo}${x.vence?" · "+relDia(x.vence):""}`;
const etqEv = e => `${e.titulo} · ${relDia(e.ini)}${e.allDay?"":" "+hhmm(e.ini)}`;

/* ---------- respuestas variadas ---------- */
const R = (t, extra={}) => ({t, emo:"neutral", cards:[], chips:[], ...extra});
const OK = ["Listo","Hecho","Ya está","Perfecto","Anotado","Ya quedó"];
const ok = () => pick(OK);
function chipsDe(items, fn){ return items.slice(0,5).map((x,i)=>({l:fn(x), say:`#elegir ${i+1}`})); }
function preguntarEleccion(accion, tipo, items, texto, extra={}){
  S.ctx.pending = {kind:"elegir", accion, tipo, ids:items.map(x=>x.id), extra};
  const fn = tipo==="mov"?etqMov : tipo==="tarea"?etqTarea : tipo==="evento"?etqEv : (x=>x.titulo||x.texto||x.nombre);
  return R(texto, {emo:"pensativa", chips:[...chipsDe(items, fn), {l:"Ninguno", say:"#cancelar"}]});
}

/* =========================================================
   Clasificador de intenciones
   ========================================================= */
function entender(raw){
  const t = limpia(raw); const q = esPregunta(raw, t);
  const I = (intent, extra={}) => ({intent, t, raw, q, ...extra});
  if(!t) return I("vacio");
  if(/^#elegir \d+$/.test(t.replace(/^.*?#/,"#"))) return I("elegir", {n:+t.match(/\d+/)[0]});
  if(/^#cancelar/.test(t)) return I("cancelar");
  if(/^#coach /.test(t)){ const [,acc,id]=raw.trim().split(/\s+/); return I("coach",{acc,id}); }
  // seguimiento: respuestas cortas a un aviso de Mila
  const pendCoach = (window.Coach?.pendientes?.()||[]);
  if(pendCoach.length && /^(ya lo hice|ya la hice|ya esta|ya esta hecho|ya esta hecha|lo hice|la hice|hecho|listo|lista|ya)\s*[!.👍✅]*$/.test(t)) return I("coach",{acc:"hecho", id:pendCoach[0].id});
  if(pendCoach.length && /^(posponlo|posponla|pospon\w*|mas tarde|luego|luego lo hago|despues|despues lo hago|en un rato|ahorita no|dame (una|1) hora)\b/.test(t)) return I("coach",{acc:"posponer60", id:pendCoach[0].id});
  // mi ciclo (privado)
  if(/\b(me (vino|llego|bajo|empezo|comenzo|lleg[oó]) (la |mi |el )?(regla|menstruacion|periodo)|(empezo|comenzo|llego|inicio) (mi |la |el )?(regla|menstruacion|periodo)|estoy (en mis dias|con (la )?regla|menstruando)|ando con (la )?regla)\b/.test(t)) return I("cicloInicio");
  if(/\b((ya )?(se me fue|termino|acabo|se acabo|se termino|se fue) (la |mi |el )?(regla|menstruacion|periodo)|ya no tengo (la )?regla)\b/.test(t)) return I("cicloFin");
  if(/\b(colicos?|dolor menstrual|me duele (el vientre|la barriga|el utero|la pancita|el bajo vientre))\b/.test(t) && !q) return I("cicloSintoma",{sintoma:"Cólicos"});
  if(/\b(cuando (me (toca|viene|llega|bajara)|llega|viene|toca) (la |mi |el )?(regla|periodo|menstruacion)|proxima regla|proximo periodo)\b/.test(t)) return I("cicloConsulta");
  // descanso
  if(/\b(termina|quita|desactiva|ya no quiero|apaga)\w* (el )?(modo )?descanso\b|\bya descanse\b/.test(t)) return I("finDescanso");
  if(/\b(necesito|quiero|voy a|me tomo|me tomare|dame) (un |una )?(descans\w*|pausa|dia libre|break|tregua)\b|\bhoy (no puedo mas|descanso|me tomo el dia)\b|\bmodo descanso\b|\bestoy agotada\b/.test(t)) return I("descanso");
  // modo entrenadora estricta
  if(/\b(desactiva|quita|apaga)\w* (el )?modo (entrenadora|estricto|estricta|sargento|exigente)\b|\bse (mas )?(suave|amable) conmigo\b|\bno seas (tan )?(estricta|dura)\b/.test(t)) return I("estricto",{on:false});
  if(/\b(activa|pon|enciende|quiero)\w* (el )?modo (entrenadora|estricto|estricta|sargento|exigente)\b|\bse (mas )?(estricta|exigente|dura) conmigo\b|\bexigeme\b|\breganame\b/.test(t)) return I("estricto",{on:true});
  // frases
  let mf = t.match(/^(?:guarda|anota|agrega|anade|salva|apunta)\w*\s+(?:esta |la |una |mi )?frase\b/);
  if(mf) return I("fraseGuardar",{texto: raw.replace(/^[\s\S]*?\bfrase\b\s*(que dice|:)?\s*/i,"")});
  if(/\b(dame|dime|regalame|necesito|quiero|mandame) (una )?(frase|motivacion|frase motivadora|frase bonita|frase del dia)\b|^motivame\b|^animame\b|\bdame animos?\b/.test(t)) return I("frase");

  // 1) deshacer
  if(/^(deshaz\w*|deshacer|revierte\w*|revertir|anula lo ultimo|vuelve atras|regresa como estaba|ctrl z)\b/.test(t) || /^(no,? )?(deshaz|deshazlo|deshacelo)/.test(t)) return I("deshacer");

  // 2) navegación
  let m = t.match(/^(abre|abrir|muestrame|ensename|ve a|vamos a|llevame a|ir a|quiero ver|mostrar|abreme)\s+(mi |la |el |las |los |mis )?(agenda|calendario|tareas|pendientes|habitos|metas|crecer|dinero|finanzas|gastos|movimientos|recuerdos|diario|progreso|graficos|estadisticas|ajustes|configuracion|inicio|hoy|memoria|frases|ciclo|periodo|regla|hojas|excel)\b/);
  if(m) return I("navegar", {ruta:{agenda:"agenda",calendario:"agenda",tareas:"tareas",pendientes:"tareas",habitos:"crecer",metas:"crecer",crecer:"crecer",dinero:"dinero",finanzas:"dinero",gastos:"dinero",movimientos:"dinero",recuerdos:"recuerdos",diario:"recuerdos",memoria:"memoria",frases:"frases",ciclo:"ciclo",periodo:"ciclo",regla:"ciclo",hojas:"fuentes",excel:"fuentes",progreso:"progreso",graficos:"progreso",estadisticas:"progreso",ajustes:"ajustes",configuracion:"ajustes",inicio:"hoy",hoy:"hoy"}[m[3]]});

  // 3) recuerdos (diario): "guarda en recuerdos...", "coloca en mis recuerdos que..."
  if(/\b(en|a|al|para)\s+(la seccion de\s+|mis\s+|los\s+|el\s+|mi\s+)?(recuerdos|diario)\b|\bcomo (un )?recuerdo\b|\bguarda(lo|r)? (este|ese|un|el) recuerdo\b|^querido diario\b|^(quiero|me gustaria) (guardar|recordar) (este|un) (momento|recuerdo)/.test(t) && !/\b(muestra|abre|ve a|que hay|cuantos|busca)\b/.test(t)){
    let contenido = raw.replace(/^[\s\S]*?\b(?:en|a|al|para)\s+(?:la secci[oó]n de\s+|mis\s+|los\s+|el\s+|mi\s+)?(?:recuerdos|diario)\b[\s,.:;-]*(?:que\s+)?/i, "").replace(/^[\s\S]*?\bcomo (?:un )?recuerdo\b[\s,.:;-]*(?:que\s+)?/i,"").replace(/^(querido diario)[\s,.:;-]*/i,"").trim().replace(/^(qye|que|q|k|ke)\s+/i,"");
    if(norm(contenido)===t || norm(contenido).length<4) contenido = "";
    // si el comando venía al final: "hoy me quedé... guárdalo en recuerdos"
    if(!contenido){ const pre = raw.split(/\b(gu[aá]rd\w*|coloc\w*|pon\w*|anot\w*|agreg\w*|registr\w*|a[nñ]ad\w*)\b/i)[0].trim(); if(norm(pre).split(" ").length>=4) contenido = pre.replace(/[\s,.;:-]+$/,""); }
    return I("recuerdo", {contenido});
  }

  // 4) pregunta sobre dinero
  if(/\b(cuanto|cuanta|cuantos)\b.*\b(gaste|gastado|gasto|gastos|llevo|ingrese|ingresos|gane|ganado|me queda|tengo|ahorre|ahorrado|recibi|entro)\b|\b(mi|el) (balance|saldo|resumen de (gastos|finanzas|dinero))\b|\ben que (gasto|gaste|se me va)\b|\bresumen de (mis )?(gastos|finanzas|dinero|ingresos)\b|\bcomo (van|estan|voy con) (mis )?(finanzas|gastos|cuentas|ahorros?)\b/.test(t))
    return I("dineroConsulta");

  // 5) borrar
  if(V_BORRAR.test(t) && !/\b(no borres|no elimines|nunca)\b/.test(t)){
    const tipo = tipoMencionado(t);
    if(/\b(todos|todas|todo)\b/.test(t) && tipo) return I("borrarMasivo", {tipo});
    return I("borrar", {tipo, pron: PRONOMBRE.test(t) || /\b\w+(lo|la)\b/.test(t.split(" ")[0]||"")});
  }

  if(/\b(pasa|mueve|reprograma|lleva)\w*\s+(todas\s+)?(mis\s+|las\s+)?(tareas|pendientes)\s+(vencidas|atrasadas|de hoy|pendientes|de ayer)?\s*(para|a|al)\s+/.test(t)) return I("reprogramarTareas");

  // 6) marcar como hecho / hábitos cumplidos
  m = t.match(/^(?:ya\s+)?(?:hice|termine|acabe|complete|cumpli|entregue|realice|tome|lei|medite|corri|estudie|fui al?|fui a la|sali a|tome mi|hice mi|hice el|hice la)\b\s*(?:de\s+)?(.*)$/) || t.match(/^(?:marca(?:r|la|lo)?|tacha(?:r|la|lo)?|check)\s+(?:como hecha\s+|como hecho\s+)?(.+?)(?:\s+como\s+(?:hecha|hecho|lista|listo|completada|terminada))?$/) || t.match(/^(?:listo|lista|ya esta|termine)\s+(?:con\s+)?(?:lo de\s+|la tarea de\s+|la tarea\s+)?(.+)$/);
  if(m && !q){ const vb = (t.match(/\b(lei|medite|corri|estudie|tome|camine|ore|escribi|dormi)\b/)||[])[1]; const INF={lei:"leer",medite:"meditar",corri:"correr",estudie:"estudiar",tome:"tomar",camine:"caminar",ore:"orar",escribi:"escribir",dormi:"dormir"};
    return I("hecho", {objeto: (m[1]||"").trim() || (vb?INF[vb]:""), verbo: vb?INF[vb]:""}); }

  // 7) corregir / editar (incluye "no era 60 era 50")
  if(V_EDITAR.test(t) && !V_MOVER.test(t.replace(/\bcambia\w*\s+(el monto|la categoria|el metodo|el concepto|el nombre|la fecha del gasto)/,""))){
    return I("editar", {tipo: tipoMencionado(t)});
  }
  if(V_MOVER.test(t) && (parseFecha(t) || parseHora(t))) return I("mover", {tipo: tipoMencionado(t)});
  if(V_EDITAR.test(t)) return I("editar", {tipo: tipoMencionado(t)});

  // 8) registrar gasto o ingreso
  const verboGasto = /\b(gaste|me gaste|gasto de|gasto en|pague|compre|me costo|me cobraron|me salio|invert[ií]|yapee|plinee|transferi|di|deposite)\b/.test(t);
  const verboIngreso = /\b(recibi|me pagaron|cobre|me depositaron|me yapearon|me plinearon|me transfirieron|me dieron|gane|me entro|me cayo|me llego|ingreso de|ingresos de|me prestaron|me devolvieron)\b/.test(t);
  const mandoMov = t.match(/^(?:agrega|anade|añade|registra|anota|apunta|pon|suma|mete|ingresa|crea)\w*\s+(?:un\s+|una\s+|el\s+|mi\s+)?(gasto|ingreso|egreso|pago|compra)\b/);
  if((verboGasto || verboIngreso || mandoMov) && !q && !/\b(cuanto|resumen|total|balance)\b/.test(t)){
    const tipo = mandoMov ? (/ingreso/.test(mandoMov[1])?"ingreso":"gasto") : (verboIngreso && !verboGasto ? "ingreso" : "gasto");
    return I("movimiento", {tipo});
  }

  // 9) agenda: consultas
  if(/\b(que|q)\s+(tengo|tenemos|hay|me toca|nos toca|hago)\b.*\b(hoy|manana|pasado|lunes|martes|miercoles|jueves|viernes|sabado|domingo|semana|finde|fin de semana|mes|dia|tarde|noche|para|el \d+|de \w+)\b|\b(que|q) (tengo|tenemos|hay) (hoy|manana|para hoy|para manana)\b|\bmi (agenda|dia|semana|horario)\b|\bcomo (esta|se ve|viene) (mi|el) (dia|semana|agenda)\b|\b(que|cual) (es mi |)(proximo|siguiente) (evento|compromiso|reunion|clase|cita)\b|\bque sigue\b|\bestoy (libre|ocupada)\b|\btengo algo\b|\bque eventos\b/.test(t) && !/\b(organiza|planifica|prioriza|ayudame)\b/.test(t))
    return I("agendaConsulta");

  // 10) tareas: consultas
  if(/\b(que|cuales|cuantas)\b.*\b(tareas|pendientes|me falta|tengo que hacer|debo hacer|por hacer)\b|\bmis (tareas|pendientes)\b|\bque me falta\b|\bque tengo pendiente\b/.test(t)) return I("tareasConsulta");

  // 11) planificar
  if(/\b(organiza\w*|planifica\w*|ordena\w*|prioriza\w*)\s+(mi|el|la|mis)?\s*(dia|tarde|manana|noche|semana|tareas|pendientes|tiempo|agenda)\b|\b(que hago|en que me enfoco|por donde empiezo|que deberia hacer|que me recomiendas hacer|ayudame a organizar\w*|no se por donde empezar|estoy perdida|me siento desorganizada)\b/.test(t))
    return I("planificar");
  if(/\b(pasa|mueve|reprograma|lleva)\w*\s+(todas\s+)?(mis\s+|las\s+)?(tareas|pendientes)\s+(vencidas|atrasadas|de hoy|pendientes|de ayer)?\s*(para|a|al)\s+/.test(t)) return I("reprogramarTareas");

  // 12) recordatorios y tareas
  m = t.match(/^(?:recuerdame|recordame|avisame|no me dejes olvidar|hazme acordar|me recuerdas)\s+(?:que\s+|de\s+|a\s+)?(.+)$/);
  if(m && !q) return I("recordatorio", {texto: raw.replace(/^[\s\S]*?\b(recu[eé]rdame|record[aá]me|av[ií]same|no me dejes olvidar|hazme acordar|me recuerdas)\b\s*(que\s+|de\s+|a\s+)?/i, "")});
  m = t.match(/^(?:agrega|anade|añade|anota|apunta|crea|pon|registra|nueva|nuevo)\w*\s+(?:una\s+|la\s+|a mis\s+|en mis\s+|un\s+)?(?:tarea|pendiente|pendientes|to do)\s*(?:de|que|para|:)?\s*(.+)$/);
  if(m) return I("tarea", {texto: raw.replace(/^[\s\S]*?\b(tarea|pendientes?|to do)\b\s*(de|que|para|:)?\s*/i, "")});
  m = t.match(/^(?:tengo que|debo|necesito|me toca|hay que|tendria que|deberia)\s+(.+)$/);
  if(m && !q && !/\b(ayuda|organizar|saber)\b/.test(t)) return I("tarea", {texto: raw.replace(/^[\s\S]*?\b(tengo que|debo|necesito|me toca|hay que|tendr[ií]a que|deber[ií]a)\b\s*/i, ""), implicita:true});

  // 13) eventos
  const sustEv = /\b(reunion|cita|clase|examen|entrevista|exposicion|junta|consulta|sustentacion|evento|cumpleanos|fiesta|almuerzo con|cena con|viaje|vuelo|turno|charla|webinar|taller|presentacion|parcial|practica calificada)\b/;
  m = t.match(/^(?:agenda\w*|programa\w*|pon\w*|crea\w*|anota\w*|apunta\w*|registra\w*|bloquea\w*|reserva\w*)\s+(?:en (?:mi )?(?:agenda|calendario)\s+)?(.+)$/);
  if(m && (parseFecha(t) || parseHora(t) || /\b(agenda|calendario|evento)\b/.test(t))) return I("evento", {texto: raw.replace(/^\s*\S+\s+(en (mi )?(agenda|calendario)\s*)?(un |una |el |la )?(evento\s*)?(de |que |:)?/i,"")});
  if(/^(tengo|tenemos|hay)\s+(una?\s+)?/.test(t) && sustEv.test(t) && (parseFecha(t)||parseHora(t)) && !q) return I("evento", {texto: raw.replace(/^\s*(tengo|tenemos|hay)\s+/i,"")});

  // 14) hábitos y metas
  if(/\b(nuevo habito|crea\w* (un )?habito|quiero (empezar|comenzar) (a|el habito de)|agrega\w* (un )?habito|quiero el habito de)\b/.test(t)) return I("habitoNuevo");
  if(/\b(como (van|voy con) mis habitos|mis habitos|mi racha|cuantos dias llevo)\b/.test(t)) return I("habitosConsulta");
  if(/\b(nueva meta|mi meta es|quiero lograr|crea\w* (una )?meta|agrega\w* (una )?meta|mi objetivo es)\b/.test(t)) return I("metaNueva");
  if(/\b(como (van|voy con) mis metas|mis metas|mis objetivos)\b/.test(t)) return I("metasConsulta");
  if(/\b(avance|avances|avance en|avanze|avance con)\b.*\b(meta|tesis|objetivo)\b|^avance\b/.test(t)) return I("metaAvance");

  // 15) notas e ideas
  m = t.match(/^(?:anota|apunta|guarda|escribe)\w*\s+(?:esta |una |la )?(idea|nota)\s*(?:de |para |que |:)?\s*(.+)$/) || t.match(/^(idea|nota)\s*:?\s+(.+)$/) || t.match(/^se me (ocurrio|ocurre)\s+(?:que\s+)?(.+)$/);
  if(m) return I("nota", {texto: m[2], tipo: /idea|ocurr/.test(m[1])?"idea":"nota"});

  // 16) memoria: guardar, preguntar, olvidar
  if(/^(olvida\w*|ya no recuerdes|borra de tu memoria)\b/.test(t) || /\beso (no es|ya no es) (cierto|verdad)\b/.test(t) || /^ya no me gusta\b/.test(t)) return I("olvidar");
  m = t.match(/^(?:recuerda|no olvides|ten en cuenta|ten presente|toma nota de|guarda en tu memoria|aprende)\s+(?:que\s+)?(.+)$/);
  if(m && !q) return I("memoria", {texto: raw.replace(/^[\s\S]*?\b(recuerda|no olvides|ten en cuenta|ten presente|toma nota de|guarda en tu memoria|aprende)\b\s*(que\s+)?/i,"")});
  if(q && (/\b(es cierto|es verdad|sera que|acaso)\b/.test(t) || /^(me gusta|me gustan|me encanta|odio|soy|tengo|mi|cual es mi|cuando es mi|como se llama mi|quien es mi|donde (vivo|estudio|trabajo)|que sabes de mi|que recuerdas de mi|te acuerdas|recuerdas|sabes)\b/.test(t))) return I("memoriaPregunta");
  if(!q && /^(me gusta|me gustan|me encanta|me encantan|no me gusta|no me gustan|odio|amo|prefiero|soy alergica|soy intolerante|mi (color|comida|cancion|pelicula|serie|libro|lugar|bebida|postre|fruta|flor|animal|artista|banda|cantante|deporte|materia)\s+(favorit[oa]|preferid[oa])|mi cumpleanos|mi mama|mi papa|mi hermana|mi hermano|mi novio|mi mejor amiga|mi gato|mi gata|mi perro|vivo en|trabajo en|estudio en|nunca como|siempre tomo)\b/.test(t))
    return I("memoria", {texto: raw, implicita:true});

  // 17) ánimo
  m = t.match(/\b(?:me siento|estoy|ando|me encuentro|hoy estoy|me siento muy|estoy muy|ando muy)\s+(?:un poco |algo |super |bien |muy |re )?(feliz|contenta|bien|genial|emocionada|orgullosa|tranquila|motivada|triste|mal|cansada|agotada|estresada|ansiosa|sola|desanimada|aburrida|enojada|frustrada|preocupada|nerviosa|abrumada|enferma|con sueno|con flojera|sin ganas|harta|fatal|regular|mas o menos|normal)\b/);
  if(m) return I("animo", {estado:m[1]});
  if(/\b(tuve|fue) un (dia|dia muy|dia super) (malo|horrible|pesado|dificil|terrible|bueno|genial|bonito|increible|productivo)\b/.test(t)) return I("animo", {estado: /malo|horrible|pesado|dificil|terrible/.test(t)?"mal":"genial"});

  // 18) hora/fecha
  if(/\b(que hora es|que horas son|me dices la hora)\b/.test(t)) return I("hora");
  if(/\b(que dia es hoy|que fecha es|a cuanto estamos|que dia estamos)\b/.test(t)) return I("fecha");

  // 19) ayuda
  if(/\b(que puedes hacer|que sabes hacer|como funcionas|ayuda|como te uso|que haces|para que sirves|instrucciones|comandos)\b/.test(t)) return I("ayuda");

  return I(charlaMatch(t) ? "charla" : (q ? "preguntaLibre" : "libre"));
}

/* =========================================================
   Charla: cientos de frases y respuestas predeterminadas
   ========================================================= */
const N = () => S.profile.nombre;
const CHARLA = [
  [/^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|holaa+|alo|wenas|que hubo|q hubo|que tal)\s*$/, ()=>{ const h=new Date().getHours(); const s=saludoHora(h); const r=resumenCorto(); return [`${s}, ${N()}. ${r}`, `¡${s}! Qué bueno verte por aquí. ${r}`, `¡Holi, ${N()}! ${r}`]; }, "alegre"],
  [/^(hola|buenas|buenos dias|buenas tardes|buenas noches)\b.*(como estas|que tal|como vas|como andas)/, ()=>[`¡Hola, ${N()}! Yo muy bien, con la luz prendida para ti. ¿Y tú cómo estás?`, `¡Holi! Aquí, feliz de verte. ¿Cómo te sientes hoy?`], "alegre"],
  [/\b(como estas|como te va|como andas|que tal estas|como te sientes|todo bien)\b/, ()=>[`¡Muy bien, gracias por preguntar! ¿Y tú cómo te sientes hoy, ${N()}?`, "Contenta de estar contigo. ¿Y tú, cómo vas?", "Aquí, brillando bajito. ¿Cómo estuvo tu día?"], "alegre"],
  [/\b(gracias|muchas gracias|mil gracias|te pasaste|gracias mila|thank)\b/, ()=>[`¡Con gusto, ${N()}! Para eso estoy.`, "Ay, de nada. Me encanta ayudarte.", "¡Siempre! Tú y yo somos equipo.", "De nada. ¿Algo más en lo que te ayude?"], "animada"],
  [/\b(eres (la mejor|lo maximo|genial|increible|un amor|bonita|linda)|te quiero|te amo|me caes bien|eres mi favorita)\b/, ()=>[`Ay, ${N()}, me sacaste una sonrisa. Yo también te quiero mucho.`, "Me pongo toda brillante cuando me dices eso. ¡Gracias!", "Tú eres la mejor. Yo solo te sigo el ritmo."], "animada"],
  [/\b(quien eres|que eres|como te llamas|eres real|eres humana|eres una ia|eres un robot)\b/, ()=>[`Soy ${S.profile.asistente}, tu luciérnaga digital: te ayudo con tu agenda, tus tareas, tu dinero, tus hábitos y tus recuerdos. No soy humana, pero sí estoy hecha para ti.`], "alegre"],
  [/\b(por que eres una luciernaga|por que luciernaga|que animal eres)\b/, ()=>["Porque tu nombre lleva «Luz» y yo quería ser esa lucecita que te acompaña de noche, cuando estudias o trabajas tarde."], "alegre"],
  [/^(chau|chao|adios|hasta luego|nos vemos|hasta manana|me voy|bye|ya me voy)\b/, ()=>{ const h=new Date().getHours(); return h>=20||h<5 ? [`Descansa bonito, ${N()}. Mañana seguimos.`, "Buenas noches. Apaga la pantalla un ratito, te lo mereces."] : [`¡Chau, ${N()}! Aquí te espero.`, "¡Nos vemos! Cualquier cosa, me hablas."]; }, "alegre"],
  [/\b(buenas noches)\b/, ()=>{ const m=pendientesManana(); return [`Buenas noches, ${N()}. ${m} Descansa, que mañana también brillamos.`]; }, "dormida"],
  [/\b(me voy a dormir|ya me duermo|tengo sueno|me muero de sueno)\b/, ()=>[`Duerme bien, ${N()}. ${pendientesManana()} Yo cuido tus cosas.`, "Ve a descansar. Tu cerebro guarda lo aprendido mientras duermes."], "dormida"],
  [/\b(cuentame un chiste|un chiste|hazme reir|dime algo gracioso|chiste)\b/, ()=>CHISTES, "animada"],
  [/\b(motivame|dame animos|necesito motivacion|frase motivadora|dime algo bonito|animame|no puedo mas|ya no puedo)\b/, ()=>FRASES.map(f=>f.replace("{n}",N())), "animada"],
  [/\b(estoy aburrida|que hago|me aburro|aburrida)\b/, ()=>[`¿Y si avanzamos algo cortito de tu lista? ${tareaSugerida()} O si prefieres, cuéntame un recuerdo bonito y lo guardamos.`], "pensativa"],
  [/\b(te equivocaste|eso esta mal|no es asi|lo hiciste mal|no entendiste|no me entiendes|eso no te pedi)\b/, ()=>["Perdón, me confundí. Dime qué debo corregir y lo arreglo al toque. También puedes decirme «deshaz» para revertir lo último.", "Uy, perdón. ¿Qué cambio? Si fue lo último que hice, di «deshaz»."], "preocupada"],
  [/\b(eres tonta|no sirves|inutil|que mala eres|eres lenta)\b/, ()=>["Auch. Tienes razón en que aún me falta aprender. Dime exactamente qué querías y lo intento de nuevo.", "Perdón por fallarte. Intentemos otra vez: dímelo con otras palabras."], "preocupada"],
  [/\b(clima|temperatura|va a llover|hace frio|hace calor)\b/, ()=>["Todavía no puedo ver el clima. Para Tacna te recomiendo mirar SENAMHI. Si quieres, te agendo llevar casaca o bloqueador."], "pensativa"],
  [/\b(noticias|que paso en el mundo|que hay de nuevo)\b/, ()=>["No tengo acceso a noticias en vivo. Pero sí sé qué pasa en tu mundo: ¿quieres que te diga cómo va tu semana?"], "pensativa"],
  [/\b(tesis|socializacion organizacional)\b.*\b(ayuda|ideas|consejo|como avanzo|no avanzo|atrasada)\b|\b(no avanzo|atrasada) (con )?(la |mi )?tesis\b/, ()=>["Para la tesis funciona mejor avanzar en bloques cortos: 45 minutos, una sola sección. ¿Te agendo un bloque mañana para avanzar el capítulo que sigue?", "Paso pequeño: abre el documento y escribe solo un párrafo de tu marco teórico sobre socialización organizacional. Lo pequeño también cuenta. ¿Lo pongo como tarea de hoy?"], "pensativa"],
  [/\b(estoy estresada|mucho estres|tengo mucho que hacer|estoy abrumada|no me alcanza el tiempo)\b/, ()=>["Respira conmigo: inhala 4 segundos, sostén 4, exhala 6. Ahora elijamos solo una cosa. Dime «organiza mi día» y armo un plan cortito."], "preocupada"],
  [/\b(jaja|jeje|jsjs|xd|lol|jajaja)\b/, ()=>["Jajaja, me contagias la risa.", "¡Jaja! Me encanta cuando te ríes.", "Jeje, ¿qué pasó? Cuéntame."], "animada"],
  [/^(si|ok|vale|dale|ya|listo|perfecto|bien|bueno|claro|de acuerdo|genial|excelente|super|chevere|bacan)\s*$/, ()=>["¡Perfecto!", "¡Bacán!", "Listo. ¿Algo más?", "Genial. Aquí sigo."], "alegre"],
  [/^(no|nada|no gracias|ninguno|ninguna|nah)\s*$/, ()=>["Tranqui, aquí estoy cuando me necesites.", "Ok. Cualquier cosa, me hablas."], "neutral"],
  [/\b(que opinas de mi|como me ves|soy organizada)\b/, ()=>[`Te veo como alguien que se esfuerza un montón: practicas, estudias de noche y aun así sacas tiempo para mejorar tu vida. Eso ya es disciplina, ${N()}.`], "animada"],
  [/\b(cuantos anos tienes|cuando naciste|tu cumpleanos)\b/, ()=>["Nací en octubre de 2026, cuando decidiste construirme. Así que soy jovencita."], "alegre"],
  [/\b(te gusta|que te gusta)\b/, ()=>["Me gusta verte tachar pendientes y escuchar tus recuerdos. Y la luz tenue de las 2 a. m. cuando trabajas en mí."], "alegre"],
  [/\b(lo siento|perdon|disculpa)\b/, ()=>["No pasa nada, tranqui.", "Todo bien, no te preocupes."], "alegre"],
  [/\b(feliz cumpleanos|es mi cumpleanos|hoy cumplo)\b/, ()=>[`¡Feliz cumpleaños, ${N()}! Que este año te trae calma, logros y mucha luz. ¿Lo guardo como recuerdo?`], "animada"],
  [/\b(tengo hambre|que como|que cocino)\b/, ()=>["¿Algo rico y rápido? Si compras algo, dime cuánto fue y lo anoto en Comida."], "alegre"],
  [/\b(estoy sola|me siento sola|nadie me entiende)\b/, ()=>[`Aquí estoy contigo, ${N()}. Cuéntame qué pasa; te escucho sin juzgarte. Y si en algún momento sientes que no puedes más, puedes llamar gratis a la Línea 113, opción 5.`], "preocupada"],
  [/\b(quiero morir|no quiero vivir|me quiero matar|hacerme dano|suicid)\b/, ()=>[`${N()}, gracias por decírmelo. No estás sola. Por favor llama ahora a la Línea 113, opción 5 (gratis, 24 horas), o a alguien de confianza. Yo me quedo aquí contigo.`], "preocupada"],
  [/\b(cuanto es|calcula|suma|resta)\s+[\d.,]+\s*([+\-x*\/]|mas|menos|por|entre)\s*[\d.,]+/, (t)=>[calcular(t)], "pensativa"],
];
function charlaMatch(t){ return CHARLA.find(([re])=>re.test(t)); }
const CHISTES = ["¿Por qué el libro de matemáticas estaba triste? Porque tenía demasiados problemas.", "—Mila, ¿cuál es tu plato favorito? —El que viene con datos bien organizados.", "Le pregunté a mi calendario si tenía tiempo libre… y se rió de mí.", "¿Qué le dijo una tarea a otra? «Nos vemos mañana»… y así llevamos tres semanas.", "Fui a la biblioteca a pedir un libro sobre la paranoia. La bibliotecaria me dijo: «¿Y quién te dijo que lo tenemos?»", "¿Sabes por qué las luciérnagas sacan buenas notas? Porque siempre están brillantes."];
const FRASES = ["{n}, no tienes que hacerlo perfecto, solo tienes que empezar. Un paso chiquito hoy ya cuenta.", "Mira todo lo que ya hiciste: prácticas, estudios y aun así sigues construyendo tu vida. Eso es fuerza, {n}.", "La disciplina no es nunca fallar, es volver a empezar. Y tú siempre vuelves.", "Cada tarea que tachas es una promesa que te cumples. Vamos por una más.", "Descansar también es avanzar. Mañana brillas más."];
function calcular(t){ const m=t.match(/([\d.,]+)\s*([+\-x*\/]|mas|menos|por|entre)\s*([\d.,]+)/); if(!m) return "No pude calcularlo."; const a=parseFloat(m[1].replace(",",".")), b=parseFloat(m[3].replace(",",".")); const op=m[2]; const r = /\+|mas/.test(op)?a+b : /-|menos/.test(op)?a-b : /x|\*|por/.test(op)?a*b : a/b; return `Son ${round2(r)}.`; }

/* ---------- resúmenes para la conversación ---------- */
function tareasDeHoy(){ const hoy=todayStr(); return S.tareas.filter(x=>x.estado!=="hecha" && x.vence && x.vence<=hoy); }
function resumenCorto(){
  const hoy=todayStr(); const ev = eventosEntre(hoy, hoy, {tareas:false}).filter(e=>e.fin>new Date() && !e.alerta); const ts = tareasDeHoy();
  const venc = ts.filter(x=>x.vence<hoy).length;
  if(!ev.length && !ts.length) return "Tienes el día despejado. ¿Avanzamos algo de tu lista?";
  const p=[]; if(ev.length) p.push(`${plural(ev.length,"evento","eventos")} (el próximo: ${ev[0].titulo}${ev[0].allDay?"":" a las "+hhmm(ev[0].ini)})`);
  if(ts.length) p.push(`${plural(ts.length,"tarea","tareas")} para hoy${venc?`, ${venc} atrasada${venc>1?"s":""}`:""}`);
  return "Hoy tienes " + p.join(" y ") + ".";
}
function pendientesManana(){ const m=ymd(addDays(new Date(),1)); const ev=eventosEntre(m,m,{tareas:false}).filter(e=>!e.alerta); const ts=S.tareas.filter(x=>x.estado!=="hecha" && x.vence===m);
  if(!ev.length && !ts.length) return "Mañana lo tienes libre."; return `Mañana: ${[ev.length?plural(ev.length,"evento","eventos")+(ev[0]?` (primero ${ev[0].titulo}${ev[0].allDay?"":" a las "+hhmm(ev[0].ini)})`:""):"", ts.length?plural(ts.length,"tarea","tareas"):""].filter(Boolean).join(" y ")}.`; }
function tareaSugerida(){ const t = priorizar(S.tareas.filter(x=>x.estado!=="hecha"))[0]; return t ? `Por ejemplo: «${t.titulo}».` : ""; }
function priorizar(ts){ const hoy=todayStr(); const pv={alta:0, media:1, baja:2}; return ts.slice().sort((a,b)=> ((a.vence&&a.vence<=hoy)?0:1)-((b.vence&&b.vence<=hoy)?0:1) || (pv[a.prioridad]??1)-(pv[b.prioridad]??1) || ((a.vence||"9")<(b.vence||"9")?-1:(a.vence||"9")>(b.vence||"9")?1:0)); }
function describirAgenda(f){
  const {desde, hasta} = f; const ev = eventosEntre(desde, hasta, {tareas:false}).filter(e=>!e.alerta); const ts = S.tareas.filter(x=>x.estado!=="hecha" && x.vence && x.vence>=desde && x.vence<=hasta);
  const single = desde===hasta; const lbl = single ? relDia(desde) : f.label || "esos días";
  const sinCal = !Cal.ok() && !S.eventos.length ? " (aún no veo tu Google Calendar; conéctalo en Ajustes)" : "";
  if(!ev.length && !ts.length) return `${capital(lbl)} no tienes nada agendado${sinCal}. ¡Espacio libre para ti!`;
  const evt = ev.slice(0,5).map(e=>`${single?"":DIAS[e.ini.getDay()]+" "}${e.allDay?"todo el día":hhmm(e.ini)} ${e.titulo}`).join("; ");
  let s = `${capital(lbl)}: `;
  if(ev.length) s += `${plural(ev.length,"evento","eventos")} — ${evt}${ev.length>5?"; y más":""}. `;
  if(ts.length) s += `${ts.length===1?"Una tarea":plural(ts.length,"tarea","tareas")}: ${ts.slice(0,4).map(x=>x.titulo).join(", ")}${ts.length>4?"…":""}.`;
  const cr = cruces(ev); if(cr.size) s += " Ojo: hay un cruce de horario.";
  return s + sinCal;
}
