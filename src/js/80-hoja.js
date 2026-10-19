/* =========================================================
   Tu hoja «Finanzas_Personales_2026» (Google Sheets)
   Cada gasto o ingreso se escribe en la pestaña del mes.
   ========================================================= */
const CAT_HOJA = { "Comida":["aliment","comida"], "Pasajes":["transporte publico","pasaje","transporte"], "Apoyo al hogar":["hogar","servicios basicos","servicio","vivienda"], "Mascotas":["mascota"], "Deudas":["deuda","prestamo"],
  "Cuidado personal":["cuidado personal","belleza","personal"], "Recargas":["recarga","telefon","celular","internet"], "Estudios":["educa","estudio","curso"], "Salud":["salud","medic","farmac"], "Ocio":["entreten","ocio","diversion"], "Inversión":["inversion","ahorro"], "Otros":["otro"] };
const sigMov = m => [m.tipo,m.fecha,m.monto,m.concepto,m.categoria,m.metodo,m.detalles,m.fuente].join("|");
const HojaSync = {
  estado:"", msg:"", busy:false, t:null, ultima:0, errAt:0,
  cfg(){ return S.profile.hoja || {}; },
  activo(){ return S.standalone && !!this.cfg().id && !!window.MilaApp?.Hoja; },
  api(){ return window.MilaApp.Hoja; },
  aCat(c, concepto){ const cats=this.api().info?.cats||[]; if(!c) return "";
    if(c==="Pasajes" && /taxi|uber|indrive|cabify|didi/.test(norm(concepto))){ const t=cats.find(x=>/taxi|aplicacion/.test(norm(x))); if(t) return t; }
    for(const kw of (CAT_HOJA[c]||[norm(c)])){ const f=cats.find(x=>norm(x).includes(kw)); if(f) return f; } return c; },
  aMetodo(m){ const ms=this.api().info?.metodos||[]; const n=norm(m); if(!n) return ""; return ms.find(x=>norm(x)===n) || ms.find(x=>norm(x).startsWith(n.split(" ")[0])) || m; },
  deCat(h){ const n=norm(h); if(!n) return ""; for(const [c,kws] of Object.entries(CAT_HOJA)) if(kws.some(k=>n.includes(k))) return c; return S.profile.categorias.find(c=>norm(c)===n) || h; },
  deMetodo(h){ const n=norm(h); if(!n) return S.profile.ajustes.metodoPorDefecto; return S.profile.metodos.find(x=>norm(x)===n) || S.profile.metodos.find(x=>n.startsWith(norm(x).split(" ")[0])) || h; },
  refs(){ try{ return JSON.parse(localStorage.getItem("mila-hoja-refs")||"{}"); }catch{ return {}; } },
  saveRefs(r){ try{ localStorage.setItem("mila-hoja-refs", JSON.stringify(r)); }catch{} },
  cola(){
    const c=this.cfg(), desde=c.desde||0, ahora=Date.now();
    const mio = m => !m.disp || m.disp===DEV_ID || ahora-(m.creado||0) > 10*60000;
    const nuevos = S.movimientos.filter(m=>m.estado==="registrado" && !m.hoja && m.origen!=="hoja" && ((m.creado||0)>=desde || m.enviarHoja) && mio(m));
    const editados = S.movimientos.filter(m=>m.hoja && m.hoja.sig && m.hoja.sig!==sigMov(m) && m.estado==="registrado");
    let borrados = [];
    if(S.loaded.movimientos){ const ids=new Set(S.movimientos.map(m=>m.id)); const r=this.refs(); borrados = Object.entries(r).filter(([id])=>!ids.has(id)).map(([id,ref])=>({id,ref})); if(borrados.length>5 && borrados.length > Object.keys(r).length/2) borrados = []; }
    return {nuevos, editados, borrados};
  },
  set(e,m=""){ this.estado=e; this.msg=m; if(S.route==="dinero"||S.route==="ajustes") render(); },
  pronto(){ clearTimeout(this.t); this.t=setTimeout(()=>this.run(), 2500); },
  async run(force){
    if(!this.activo() || this.busy) return;
    const G=window.MilaApp.Google; if(!G.valido() && !force){ const q=this.cola(); if(q.nuevos.length+q.editados.length+q.borrados.length && this.estado!=="espera") this.set("espera", "Conecta Google para enviar a tu hoja."); return; }
    const q=this.cola(); if(!q.nuevos.length && !q.editados.length && !q.borrados.length){ if(this.estado!=="ok" && this.estado!=="error") this.set("ok", this.ultima?"Al día":"Conectada"); return; }
    if(this.estado==="error" && !force && Date.now()-this.errAt<60000) return;
    this.busy=true; this.set("sync", "Escribiendo en tu hoja…");
    const H=this.api(), id=this.cfg().id; let n=0;
    try{
      await H.cargar(id); const refs=this.refs();
      for(const {id:mid, ref} of q.borrados){ await H.borrar(id, ref).catch(e=>{ if(e?.code==="sheets_disabled") throw e; }); delete refs[mid]; this.saveRefs(refs); n++; }
      for(const m of [...q.nuevos, ...q.editados]){
        const fila = {...m, catHoja:this.aCat(m.categoria, m.concepto), metodoHoja:this.aMetodo(m.metodo), fuenteHoja:(m.fuente && m.fuente!==m.metodo) ? m.fuente : (m.concepto || m.metodo)};
        let ref; try{ ref = m.hoja ? await H.actualizar(id, m.hoja, fila) : await H.agregar(id, fila); }
        catch(e){ if(e?.code==="sin_pestana"){ await Store.update("movimientos", m.id, {hoja:{omitido:e.message, sig:sigMov(m)}, enviarHoja:false}); continue; } throw e; }
        await Store.update("movimientos", m.id, {hoja:{...ref, sig:sigMov(m)}, enviarHoja:false}); refs[m.id]=ref; this.saveRefs(refs); n++;
      }
      this.ultima=Date.now(); this.set("ok", n ? `${n} ${n===1?"cambio enviado":"cambios enviados"} a tu hoja` : "Al día");
    }catch(e){ this.errAt=Date.now(); this.set("error", e?.message||String(e)); }
    finally{ this.busy=false; }
  },
  async conectar(link){
    const id=window.MilaApp.Hoja.idDe(link); if(!id) throw new Error("Ese enlace no parece de Google Sheets. Cópialo desde la barra de direcciones de tu hoja.");
    await window.MilaApp.Google.ensure(); const info = await window.MilaApp.Hoja.cargar(id);
    const anio = (info.tabs.map(t=>t.title.match(/20\d\d/)?.[0]).find(Boolean)) || String(new Date().getFullYear());
    await Store.saveProfile({hoja:{id, nombre:info.titulo, anio:Number(anio), desde:Date.now()}});
    const r=this.refs(); S.movimientos.filter(m=>m.hoja?.tab).forEach(m=>r[m.id]=m.hoja); this.saveRefs(r); return info;
  },
  async traer(){
    const H=this.api(), c=this.cfg(); await window.MilaApp.Google.ensure(); this.set("sync","Leyendo tu hoja…");
    const filas = await H.leerTodo(c.id, c.anio||new Date().getFullYear());
    const firmas = new Set(S.movimientos.map(m=>m.hoja?.firma).filter(Boolean));
    const clave = m => [m.tipo, m.fecha, Number(m.monto).toFixed(2), norm(m.concepto)].join("|");
    const claves = new Set(S.movimientos.map(clave)), sueltas = new Set(S.movimientos.filter(m=>m.origen==="importado").map(m=>[m.tipo,m.fecha,Number(m.monto).toFixed(2)].join("|")));
    const refs=this.refs(); let n=0;
    for(const f of filas){
      if(firmas.has(f.hoja.firma)) continue;
      const doc = { tipo:f.tipo, monto:round2(f.monto), fecha:f.fecha, concepto:(f.concepto||"").trim()||(f.tipo==="gasto"?"Gasto":"Ingreso"), categoria: f.tipo==="gasto" ? this.deCat(f.catHoja) : "", metodo: f.tipo==="gasto" ? this.deMetodo(f.metodoHoja) : this.deMetodo(""),
        detalles:f.detalles||"", fuente: f.tipo==="ingreso" ? (f.fuenteHoja||"") : "", estado:"registrado", origen:"hoja", creado:Date.now(), motivoPendiente:"" };
      if(claves.has(clave(doc)) || sueltas.has([doc.tipo,doc.fecha,doc.monto.toFixed(2)].join("|"))) continue;
      doc.hoja = {...f.hoja, sig:sigMov(doc)}; const id = await Store.add("movimientos", doc); refs[id]=f.hoja; claves.add(clave(doc)); n++;
    }
    this.saveRefs(refs); this.set("ok", n ? `Traje ${n} ${n===1?"movimiento":"movimientos"} de tu hoja` : "Tu hoja y Mila ya coinciden"); return n;
  },
  anteriores(){ const d=this.cfg().desde||0; return S.movimientos.filter(m=>m.estado==="registrado" && !m.hoja && m.origen!=="hoja" && (m.creado||0)<d && m.fecha?.slice(0,4)===String(this.cfg().anio||2026)); }
};
function hojaCard(enAjustes){
  if(!S.standalone) return "";
  const c=HojaSync.cfg(), G=window.MilaApp?.Google, conG=G?.valido();
  if(!c.id) return `<section class="card hojacard ${enAjustes?"aj":""}"><div class="card-h"><span class="card-ic">${ICON.sheet}</span><h3>Conecta tu hoja de finanzas</h3></div>
      <p class="mini">Cada gasto o ingreso que registres se escribirá también en la pestaña del mes de tu Google Sheets, en el bloque correcto.</p>
      <div class="hojaform"><input id="hojaLink" type="url" placeholder="Pega aquí el enlace de tu hoja" autocomplete="off"><button type="button" class="btn pri sm" data-act="hojaConectar">Conectar</button></div>
      ${window.MilaApp?.Claves.get().googleClientId?"":`<p class="mini warn">Primero agrega tu ID de cliente de Google en Ajustes.</p>`}</section>`;
  const q = HojaSync.activo() ? HojaSync.cola() : {nuevos:[],editados:[],borrados:[]}; const pend=q.nuevos.length+q.editados.length+q.borrados.length; const ant = HojaSync.anteriores();
  const est = HojaSync.estado==="error" ? "err" : HojaSync.estado==="sync" ? "sync" : pend ? "warn" : "ok";
  const txt = HojaSync.estado==="error" ? HojaSync.msg : HojaSync.estado==="sync" ? HojaSync.msg : !conG ? (pend?`${pend} por enviar · conecta Google`:"Conecta Google para sincronizar") : pend ? `${pend} por enviar…` : (HojaSync.msg||"Al día");
  return `<section class="card hojacard on ${enAjustes?"aj":""}"><div class="card-h"><span class="card-ic">${ICON.sheet}</span><h3>${esc(c.nombre||"Tu hoja")}</h3><span class="estado ${est}">${esc(txt)}</span></div>
    <div class="btns">${conG?"":btn(ICON.google+" Conectar Google","gConectar","","sm pri")}${btn("Traer de mi hoja","hojaTraer","","sm")}${ant.length?btn(`Enviar ${ant.length} anteriores`,"hojaAnteriores","","sm"):""}<a class="btn sm" href="https://docs.google.com/spreadsheets/d/${esc(c.id)}/edit" target="_blank" rel="noopener">Abrir hoja</a>${btn("Desconectar","hojaQuitar","","sm ghost")}</div></section>`;
}
