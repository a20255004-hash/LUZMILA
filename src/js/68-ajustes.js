/* =========================================================
   AJUSTES · perfil, inteligencia, voz, Google, finanzas, datos
   ========================================================= */
const PIELES = ["#F1C9A5","#E0AC84","#C98E68","#A86F4C","#7E4F35","#5A3825"];
const PELOS = ["#1B1311","#3B2418","#5E3A22","#8A5A33","#B98A57","#4A2B5C"];
const ROPAS = ["#1F1B24","#3B2F6B","#6D4AFF","#B6345C","#1F6F5C","#E7E1F2"];
const LABIOS = ["#B4505A","#C8667A","#9C3B48","#D98484","#8E4A6E"];
let installEvt=null; addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); installEvt=e; if(S.route==="ajustes") render(); });
VISTAS.ajustes = function(){
  const p=S.profile, a=p.avatar, aj=p.ajustes; const K = window.MilaApp?.Claves.get()||{}; const ia=IA.cfg(); const G=window.MilaApp?.Google; const Sy=window.MilaApp?.Sync; const cco=Coach.cfg();
  const sw = (k, list, cur) => `<div class="swatches">${list.map(c=>`<button type="button" class="sw ${c===cur?"on":""}" style="--c:${c}" data-act="avatar" data-k="${k}" data-v="${c}" aria-label="${c}"></button>`).join("")}</div>`;
  const voces = Voz.voces().sort((x,y)=>Voz.puntaje(y)-Voz.puntaje(x)); const vm = Voz.motor();
  const sec = (id, ic, t, body) => `<section class="card aj" id="aj-${id}"><div class="card-h"><span class="card-ic">${ICON[ic]}</span><h3>${t}</h3></div>${body}</section>`;
  return `${cab("Ajustes", "Haz que Mila sea tuya")}
  <div class="aj-grid">
  ${sec("perfil","user","Tú y Mila", `
    <div class="aj-perfil"><div class="aj-prev"><span class="aj-foto">${yoAvatar({size:132, ring:true})}</span><div class="mila-host" data-size="110" data-emo="carinosa"></div></div>
      <div class="grow">
        <div class="btns">${btn(ICON.camera+(fotoYo()?" Cambiar foto":" Subir mi foto"),"fotoSubir","","pri")}${fotoYo()?btn("Quitar foto","fotoQuitar","","ghost"):""}<input type="file" id="fotoArchivo" accept="image/*" hidden></div>
        <p class="mini">Tu foto real se guarda solo en tu almacenamiento privado (este navegador y tu copia oculta de Drive). Nunca se publica en el sitio.</p>
        <label class="fld"><span>Tu nombre</span><input id="setNom" value="${esc(p.nombre)}"></label>
        <label class="fld"><span>Nombre de tu asistente</span><input id="setAsis" value="${esc(p.asistente)}"></label>
      </div></div>`)}
  ${sec("coach","whistle","Seguimiento y modo entrenadora", `
    <p class="mini">Cuando una tarea con fecha vence sin tu confirmación, Mila te avisa: primero amable, luego más firme y después insistente, según la frecuencia que elijas. Nunca la da por hecha sin que tú lo digas.</p>
    <div class="estado-ia ${cco.activo?"ok":"no"}">${cco.activo?ICON.check:ICON.alert}<span>${cco.activo?`Activo · avisos cada ${cco.intervalos.join(" / ")} min · máximo ${cco.maxDia} por día`:"Seguimiento pausado"}</span></div>
    <label class="tog"><input type="checkbox" data-act="coachTog" data-k="estricto" ${cco.estricto?"checked":""}><i></i>Modo entrenadora estricta 😤 (directa, juguetonamente enojada)</label>
    <div class="btns">${btn(ICON.sliders+" Configurar avisos","sheetOpen",'data-v="coachAjustes"',"pri")}${Coach.enDescanso()?btn("Terminar descanso","finDescanso"):btn(ICON.moon+" Descansar hasta mañana","descansoHoy")}</div>`)}
  ${sec("notif","bell","Notificaciones", `
    <p class="mini">${"Notification" in window ? (Notification.permission==="granted" ? "Este dispositivo ya puede mostrar avisos de Mila." : Notification.permission==="denied" ? "Bloqueaste las notificaciones en este navegador. Actívalas en el candado de la barra de direcciones." : "Permite las notificaciones para que Mila te avise aunque estés en otra pestaña.") : "Este navegador no permite notificaciones."}</p>
    <div class="btns">${"Notification" in window && Notification.permission==="default" ? btn(ICON.bell+" Permitir notificaciones","notifPermitir","","pri") : ""}${btn("Probar aviso","notifProbar")}</div>
    <p class="mini"><b>Con Mila cerrada:</b> si conectas Google, cada tarea con hora crea un aviso silencioso en tu Google Calendar con tres recordatorios escalonados, y tu celular te avisará con la app de Google Calendar. Desaparece apenas la marcas como hecha. Los datos de Mi ciclo nunca se muestran en notificaciones sin tu permiso.</p>`)}
  ${sec("sync","cloud","Sincronización entre dispositivos", `
    <p class="mini">Tus tareas, recuerdos, avances, frases y tu foto se guardan en una copia privada y oculta de tu Google Drive (solo Mila la ve). Cada cambio se sube en segundos y Mila trae lo nuevo cada minuto y cada vez que vuelves a la app.</p>
    <div class="estado-ia ${G?.valido()?"ok":"no"}">${G?.valido()?`${ICON.check}<span>${esc(Sy?.msg||"Sincronizado")}${Sy?.ultima?` · ${hace(Sy.ultima)}`:""}</span>`:`${ICON.alert}<span>Sin conectar en este dispositivo</span>`}</div>
    <div class="btns">${G?.valido()?btn(ICON.repeat+" Sincronizar ahora","syncAhora","","pri"):btn(ICON.google+" Conectar Google","gConectar","","pri")}${K.googleClientId?btn(ICON.copy+" Enlace para tu celular u otro navegador","copiarEnlace"):""}</div>
    <ol class="mini pasos"><li>En tu celular, abre el enlace de arriba (o ${esc(location.host+location.pathname)}).</li><li>Toca «Conectar Google» con la misma cuenta.</li><li>Listo: verás lo mismo que en tu laptop. Lo que empieces en uno, sigue en el otro.</li></ol>`)}
  ${sec("importar","inbox","Importar a Mila", `
    <p class="mini">Carga tu <b>paquete privado</b> (recuerdos y datos de tus hojas, lo que Claude sabe de ti, tus chips mentales y tu foto). Revisas cada elemento antes de guardarlo.</p>
    <div class="btns"><label class="btn pri">${ICON.upload} Cargar paquete privado<input type="file" id="paqueteArchivo" accept="application/json,.json" hidden></label>${btn(ICON.brain+" Pegar memoria de Claude","sheetOpen",'data-v="claudeMem"')}${btn(ICON.sheet+" Mis hojas","ir",'data-v="fuentes"')}</div>`)}
  ${sec("ia","spark","Inteligencia", `
    <p class="mini">Sin configurar nada, Mila usa su <b>cerebro local</b>: entiende cientos de formas de pedir cosas (gastos, agenda, tareas, recuerdos, correcciones…), gratis y al instante. Para conversar de cualquier tema y entender frases muy libres, conéctale una IA <b>gratuita</b> con tu propia clave. La clave se guarda solo en tu navegador y en tu copia privada de Drive.</p>
    <div class="estado-ia ${IA.configurada()?(ia.on?"ok":"off"):"no"}">${IA.configurada()?`${ICON.check}<span>Conectada: ${esc(PROVEEDORES[ia.prov]?.n||ia.prov)} · ${esc(ia.model||"")}</span><label class="tog"><input type="checkbox" data-act="iaOn" ${ia.on?"checked":""}><i></i>${ia.on?"Activa":"Pausada"}</label>`:`${ICON.alert}<span>Usando el cerebro local</span>`}</div>
    <label class="fld"><span>Proveedor</span><select id="iaProv">${Object.entries(PROVEEDORES).map(([k,v])=>`<option value="${k}" ${k===(ia.prov||"groq")?"selected":""}>${v.n}</option>`).join("")}</select></label>
    <p class="mini" id="iaNota">${esc(PROVEEDORES[ia.prov||"groq"].nota)} <a href="${PROVEEDORES[ia.prov||"groq"].url}" target="_blank" rel="noopener">Obtener clave ${ICON.right}</a></p>
    <label class="fld"><span>Clave</span><input id="iaKey" type="password" autocomplete="off" placeholder="${IA.configurada()?"•••••••• (guardada)":"Pega aquí tu clave"}"></label>
    <div class="btns">${btn("Conectar y probar","iaGuardar","","pri")}${IA.configurada()?btn("Quitar clave","iaQuitar","","ghost"):""}</div>
    <details class="ayuda"><summary>¿Cómo consigo una clave gratis? (2 minutos)</summary><ol><li>Abre <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a> y entra con tu cuenta de Google.</li><li>Toca «Create API Key», ponle de nombre «Mila» y copia la clave.</li><li>Pégala aquí arriba y toca «Conectar y probar».</li></ol><p class="mini">Si prefieres Google: entra a <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> con un Gmail personal (es distinto de Google Cloud y no pide tarjeta).</p></details>`)}
  ${sec("voz","volume","Voz", `
    <label class="tog"><input type="checkbox" data-act="hablarTog" ${aj.hablar?"checked":""}><i></i>Mila responde en voz alta</label>
    <label class="fld"><span>Motor de voz</span><select id="vozMotor">
      <option value="navegador" ${vm==="navegador"?"selected":""}>Voz del navegador (gratis, instantánea)</option>
      <option value="neural" ${vm==="neural"?"selected":""}>Voz neuronal en tu equipo (gratis, funciona en Brave)</option>
      <option value="elevenlabs" ${vm==="elevenlabs"?"selected":""}>ElevenLabs (de pago)</option>
      <option value="google" ${vm==="google"?"selected":""}>Google Chirp (requiere facturación)</option></select></label>
    ${vm==="navegador" ? `${!Voz.hayNatural()?`<div class="aviso">${ICON.alert}<span>${ES_BRAVE?"Brave solo trae voces robóticas.":"Este navegador no trae voces naturales en español."} Opciones gratis: abre Mila en <b>Microsoft Edge</b> (voz «Camila» de Perú, muy natural) o elige arriba la <b>voz neuronal</b>.</span></div>`:""}
      <label class="fld"><span>Voz</span><select id="setVoz"><option value="">Automática (la más natural)</option>${voces.map(v=>`<option value="${esc(v.name)}" ${v.name===aj.vozNombre?"selected":""}>${esc(v.name)} · ${v.lang}${Voz.puntaje(v)>=50?" ★":""}</option>`).join("")}</select></label>
      <div class="fila2"><label class="fld"><span>Velocidad</span><input type="range" id="setRate" min=".7" max="1.4" step=".05" value="${aj.vozRate||1}"></label><label class="fld"><span>Tono</span><input type="range" id="setPitch" min=".7" max="1.4" step=".05" value="${aj.vozPitch||1}"></label></div>` : ""}
    ${vm==="neural" ? `<p class="mini">Una voz neuronal de código abierto (Piper) que corre dentro de tu navegador, sin cuentas ni pagos. Se descarga una sola vez (unos 60 MB) y tarda unos segundos en hablar cada frase.</p>
      <label class="fld"><span>Voz</span><select id="piperVoz">${[["es_MX-claude-high","Claude · México (femenina, alta calidad)"],["es_ES-sharvard-medium","Sharvard · España"],["es_MX-ald-medium","Ald · México (masculina)"]].map(([k,l])=>`<option value="${k}" ${(K.piperVoz||"es_MX-claude-high")===k?"selected":""}>${l}</option>`).join("")}</select></label>
      <p class="mini"><b>Estado:</b> ${esc(Voz.piperEstado || "Sin descargar")}</p>` : ""}
    ${vm==="elevenlabs" ? `<label class="fld"><span>Clave de ElevenLabs</span><input id="elKey" type="password" placeholder="${K.elevenlabs?"•••• guardada":"Pega tu clave"}"></label><label class="fld"><span>ID de voz</span><input id="elVoice" value="${esc(K.elVoice||"")}" placeholder="EXAVITQu4vr4xnSDxMaL"></label>` : ""}
    ${vm==="google" ? `<label class="fld"><span>Clave de Google Text-to-Speech</span><input id="gttsKey" type="password" placeholder="${K.gtts?"•••• guardada":"Pega tu clave"}"></label>` : ""}
    <div class="btns">${btn(ICON.play+" Probar voz","vozProbar","","pri")}</div>
    <p class="mini">Para hablarle: el micrófono funciona en <b>Edge</b> y <b>Chrome</b>. En Brave, el dictado del navegador está bloqueado; usa el dictado de tu teclado (Windows + H en la laptop, el micrófono del teclado en el celular).</p>`)}
  ${sec("google","google","Google: Calendar, Drive y tu hoja", `
    <p class="mini">Conecta tu cuenta para ver y editar tu Google Calendar, guardar una copia privada de todo en tu Drive (así Mila es la misma en cualquier navegador o celular) y escribir tus gastos en tu hoja de finanzas.</p>
    <label class="fld"><span>ID de cliente de Google</span><input id="gCid" value="${esc(K.googleClientId||"")}" placeholder="…apps.googleusercontent.com"></label>
    <div class="estado-ia ${G?.valido()?"ok":"no"}">${G?.valido()?`${ICON.check}<span>Conectada · ${esc(Sy?.msg||"sincronizado")}</span>`:`${ICON.alert}<span>Sin conectar</span>`}</div>
    <div class="btns">${btn(ICON.google+" Conectar Google","gConectar","","pri")}</div>`)}
  ${hojaCard(true)}
  ${sec("finanzas","wallet","Finanzas", `
    <div class="fld"><span>Categorías de gasto</span><div class="chips">${p.categorias.map(c=>`<span class="chip on" style="--c:${colorCat(c)}"><i class="pt" style="background:${colorCat(c)}"></i>${esc(c)}<button type="button" class="x" data-act="catQuitar" data-v="${esc(c)}" aria-label="Quitar">×</button></span>`).join("")}<button type="button" class="chip" data-act="catAgregar">${ICON.plus} Agregar</button></div></div>
    <div class="fld"><span>Métodos de pago</span><div class="chips">${p.metodos.map(c=>`<span class="chip on">${esc(c)}<button type="button" class="x" data-act="metQuitar" data-v="${esc(c)}">×</button></span>`).join("")}<button type="button" class="chip" data-act="metAgregar">${ICON.plus} Agregar</button></div></div>
    <label class="fld"><span>Método por defecto</span><select id="setMetodo">${p.metodos.map(m=>`<option ${m===aj.metodoPorDefecto?"selected":""}>${esc(m)}</option>`).join("")}</select></label>
    <div class="btns">${btn("Presupuestos por categoría","sheetOpen",'data-v="presupuestos"')}</div>`)}
  ${sec("apariencia","sun","Apariencia", `
    <div class="fld"><span>Tema</span>${segmentos("tema", [["auto","Automático"],["claro","Claro"],["oscuro","Oscuro"]], aj.tema||"auto")}</div>
    <p class="mini">En automático, Mila se oscurece de noche (desde las 8 p. m.) para cuidar tus ojos.</p>
    <div class="fld"><span>Animaciones</span>${segmentos("movimiento", [["normal","Completas"],["reducido","Suaves"]], aj.movimiento||"normal")}</div>`)}
  ${sec("app","download","Instalar como app", `
    <p class="mini">Mila funciona como una app instalada: ícono en tu pantalla, pantalla completa y abre al toque.</p>
    ${installEvt?btn(ICON.download+" Instalar Mila","instalar","","pri"):`<ul class="mini"><li><b>Android (Chrome):</b> menú ⋮ → «Agregar a pantalla principal».</li><li><b>iPhone (Safari):</b> compartir → «Agregar a inicio».</li><li><b>Laptop (Edge/Chrome):</b> ícono de instalar en la barra de direcciones.</li></ul>`}`)}
  ${sec("datos","inbox","Tus datos", `
    <p class="mini">Todo vive en tu navegador${G?.valido()?" y en tu copia privada de Google Drive":""}. Nadie más lo ve.</p>
    <div class="btns">${btn(ICON.download+" Descargar copia","exportar")}<label class="btn">${ICON.upload} Importar copia<input type="file" id="importar" accept="application/json" hidden></label>${btn("Borrar conversación","chatBorrar","","ghost")}</div>
    <p class="mini">${S.memorias.length} datos · ${S.recuerdos.length} recuerdos · ${S.tareas.length} tareas · ${S.movimientos.length} movimientos · ${S.habitos.length} hábitos</p>`)}
  </div>`;
};
async function exportar(){
  const data = window.MilaApp?.LocalDB?.exportar() || {}; const blob = new Blob([JSON.stringify({app:"mila", v:8, at:new Date().toISOString(), tree:data}, null, 1)], {type:"application/json"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`mila-copia-${todayStr()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 2000); toast("Copia descargada");
}
async function importar(file){
  try{ const j = JSON.parse(await file.text()); const tree = j.tree || j; const entries = Object.entries(tree).filter(([k])=>k.startsWith("data/"));
    if(!entries.length) throw new Error("Ese archivo no parece una copia de Mila."); window.MilaApp.LocalDB.importar("", entries); toast(`Importé ${entries.length} elementos`); }
  catch(e){ toast("No pude importar: "+errMsg(e)); }
}

/* ---------- tu foto: recorte cuadrado en el navegador (nada sale de tu equipo) ---------- */
const FotoEd = { img:null, z:1.15, x:0, y:-.12 };
function fotoCargar(file){
  if(!file || !/^image\//.test(file.type)) return toast("Elige una imagen (JPG o PNG).");
  const url=URL.createObjectURL(file); const img=new Image(); img.onload=()=>{ FotoEd.img=img; FotoEd.z=1.15; FotoEd.x=0; FotoEd.y= img.height>img.width ? -.14 : 0; abrirSheet("foto"); setTimeout(fotoPintar, 60); }; img.onerror=()=>toast("No pude abrir esa imagen."); img.src=url;
}
function fotoRender(size=480){
  const {img,z,x,y}=FotoEd; if(!img) return ""; const c=document.createElement("canvas"); c.width=c.height=size; const g=c.getContext("2d");
  const lado=Math.min(img.width,img.height)/z; const cx=img.width/2 + x*img.width/2, cy=img.height/2 + y*img.height/2;
  const sx=clamp(cx-lado/2, 0, img.width-lado), sy=clamp(cy-lado/2, 0, img.height-lado);
  g.imageSmoothingQuality="high"; g.drawImage(img, sx, sy, lado, lado, 0, 0, size, size); return c.toDataURL("image/jpeg", .86);
}
function fotoPintar(){ const p=$("#fotoPrev"); if(p) p.src=fotoRender(320); }
SHEETS.foto = () => `${sheetHead("Tu foto", ICON.camera)}<div class="foto-ed"><img id="fotoPrev" alt="Vista previa" class="foto-prev"><div class="grow">
  <label class="fld"><span>Acercar</span><input type="range" min="1" max="3" step=".02" value="${FotoEd.z}" data-foto="z" class="rango"></label>
  <label class="fld"><span>Izquierda / derecha</span><input type="range" min="-1" max="1" step=".01" value="${FotoEd.x}" data-foto="x" class="rango"></label>
  <label class="fld"><span>Arriba / abajo</span><input type="range" min="-1" max="1" step=".01" value="${FotoEd.y}" data-foto="y" class="rango"></label>
  <p class="mini">Se queda en tu almacenamiento privado y se sincroniza con tus dispositivos. No se publica.</p></div></div>
  <div class="sh-acc"><button type="button" class="btn pri" data-act="fotoGuardar">Guardar foto</button></div>`;
document.addEventListener("input", e=>{ const k=e.target.dataset?.foto; if(k){ FotoEd[k]=Number(e.target.value); fotoPintar(); } });
SHEETS.coachAjustes = () => { const c=Coach.cfg(), aj=S.profile.ajustes;
  return `${sheetHead("Seguimiento de compromisos", ICON.whistle)}<form data-form="coachAjustes" class="frm">
    <label class="tog"><input type="checkbox" name="activo" ${c.activo?"checked":""}><i></i>Activar seguimiento</label>
    <label class="tog"><input type="checkbox" name="estricto" ${c.estricto?"checked":""}><i></i>Modo entrenadora estricta 😤</label>
    <div class="fila3">${fld("1.º → 2.º aviso (min)", `<input type="number" name="i1" min="5" max="600" value="${c.intervalos[0]}">`)}${fld("2.º → 3.º (min)", `<input type="number" name="i2" min="5" max="600" value="${c.intervalos[1]}">`)}${fld("Luego, cada (min)", `<input type="number" name="i3" min="10" max="1440" value="${c.intervalos[2]}">`)}</div>
    <div class="fila3">${fld("Máximo de avisos al día", `<input type="number" name="maxDia" min="1" max="40" value="${c.maxDia}">`)}${fld("Silencio desde", `<input type="time" name="silDesde" value="${esc(aj.silencioDesde||"23:00")}">`)}${fld("hasta", `<input type="time" name="silHasta" value="${esc(aj.silencioHasta||"07:00")}">`)}</div>
    ${fld("Margen antes del primer aviso (min)", `<input type="number" name="gracia" min="0" max="240" value="${c.gracia}">`)}
    <label class="tog"><input type="checkbox" name="sistema" ${c.sistema?"checked":""}><i></i>Notificaciones del sistema cuando Mila está en segundo plano</label>
    <label class="tog"><input type="checkbox" name="celular" ${c.celular?"checked":""}><i></i>Avisos en el celular con Mila cerrada (vía Google Calendar)</label>
    <div class="sh-acc"><button type="submit" class="btn pri">Guardar</button></div></form>`; };
async function paqueteCargar(file){
  try{ const j=JSON.parse(await file.text());
    if(j.app==="mila-paquete" && Array.isArray(j.items)){ const items=j.items.filter(it=>!it.clave || !yaImportado(it.clave)); if(!items.length) return toast("Todo lo de ese paquete ya estaba en Mila.");
      abrirSheet("revisar", {items, titulo:`Tu paquete privado · ${plural(items.length,"elemento","elementos")}`, sub:j.nota||"Revisa y desmarca lo que no quieras guardar."}); return; }
    importar(file);
  }catch(e){ toast("No pude leer ese archivo: "+errMsg(e)); }
}
