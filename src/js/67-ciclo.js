/* =========================================================
   MI CICLO · sección privada (datos sensibles)
   - Registro de inicio/fin, flujo, dolor, energía, ánimo, síntomas y notas
   - Estimaciones prudentes solo con historial suficiente (≥ 3 periodos)
   - Bloqueo opcional con PIN, exportar y borrar; nunca aparece en notificaciones
     visibles sin tu permiso. Mila no asume que el ciclo determina tu ánimo ni tu capacidad.
   ========================================================= */
const FLUJOS = [[0,"Nada"],[1,"Manchado"],[2,"Leve"],[3,"Medio"],[4,"Abundante"]];
const SINTOMAS = ["Cólicos","Dolor de cabeza","Hinchazón","Sensibilidad en el pecho","Dolor lumbar","Cansancio","Antojos","Acné","Náuseas","Insomnio","Cambios de humor","Tranquila, sin síntomas"];
function periodosOrden(){ return S.ciclo.filter(p=>p.inicio).slice().sort((a,b)=>a.inicio.localeCompare(b.inicio)); }
function finEfectivo(p){ if(p.fin) return p.fin; const d=diffDays(pymd(p.inicio), new Date()); return d<=10 ? todayStr() : ymd(addDays(pymd(p.inicio), 4)); }
function cicloStats(){
  const ps = periodosOrden(); const largos=[]; const atip=[];
  for(let i=1;i<ps.length;i++){ const n=diffDays(pymd(ps[i-1].inicio), pymd(ps[i].inicio)); (n>=18 && n<=50 ? largos : atip).push(n); }
  const durs = ps.filter(p=>p.fin).map(p=>diffDays(pymd(p.inicio), pymd(p.fin))+1).filter(n=>n>=1&&n<=12);
  const media = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : null;
  const m=media(largos), sd = largos.length>1 ? Math.sqrt(largos.reduce((s,x)=>s+(x-m)**2,0)/(largos.length-1)) : null;
  const dur = media(durs);
  let prox=null;
  if(ps.length>=3 && largos.length>=2){
    const ult = pymd(ps[ps.length-1].inicio); let ini = addDays(ult, Math.round(m));
    while(ini < startDay(new Date()) && diffDays(ini, new Date())>Math.round(m)/2) ini = addDays(ini, Math.round(m));
    const marg = Math.max(2, Math.round(sd||0)+1);
    prox = { ini, desde:addDays(ini,-marg), hasta:addDays(ini,marg), marg, dur:Math.round(dur||5),
      confianza: largos.length>=6 && (sd||0)<=3 ? "más estable" : largos.length>=3 ? "moderada" : "baja", irregular:(sd||0)>7 || atip.length>0 };
  }
  const actual = ps.length ? ps[ps.length-1] : null; const enCurso = actual && !actual.fin && diffDays(pymd(actual.inicio), new Date())<=10;
  const diaCiclo = actual ? diffDays(pymd(actual.inicio), new Date())+1 : null;
  return {ps, largos, atip, media:m, sd, dur, prox, enCurso, diaCiclo};
}
function diaEnPeriodo(s){ return S.ciclo.find(p=>p.inicio && s>=p.inicio && s<=finEfectivo(p)); }
async function sha(s){ const b=await crypto.subtle.digest("SHA-256", new TextEncoder().encode("mila:"+s)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join(""); }
VISTAS.ciclo = function(){
  const cc=S.profile.ciclo||{}; const U=S.cicloUI;
  if(cc.pin && !U.abierto) return `${cab("Mi ciclo", "Sección privada")}
    <section class="card ciclo-lock"><span class="mila-host" data-emo="carinosa"></span><h3>${ICON.lock} Protegido con PIN</h3><p class="mini">Solo tú puedes ver esta sección.</p>
      <form data-form="cicloPin" class="pin-f"><input name="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="••••" autofocus><button type="submit" class="btn pri">Abrir</button></form></section>`;
  const st=cicloStats(); const hoy=todayStr();
  const mes = U.mes ? pymd(U.mes+"-01") : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const ini = startWeek(new Date(mes.getFullYear(), mes.getMonth(), 1));
  const dias=[]; for(let i=0;i<42;i++){ const d=addDays(ini,i); if(i>=35 && d.getMonth()!==mes.getMonth()) break; dias.push(d); }
  const reg = Object.fromEntries(S.ciclodia.map(x=>[x.id,x]));
  const enProx = d => st.prox && d>=startDay(st.prox.desde) && d<=startDay(st.prox.hasta);
  const enProxPeriodo = d => st.prox && d>=startDay(st.prox.ini) && d<addDays(startDay(st.prox.ini), st.prox.dur);
  const cal = `<div class="cic-cal"><div class="cic-sem">${["L","M","M","J","V","S","D"].map(x=>`<span>${x}</span>`).join("")}</div><div class="cic-g">${dias.map(d=>{ const s=ymd(d); const per=diaEnPeriodo(s); const r=reg[s]; const fl=r?.flujo||0;
      const cls=[d.getMonth()!==mes.getMonth()?"fuera":"", s===hoy?"hoy":"", per?"per":"", per&&per.inicio===s?"ini":"", !per&&enProxPeriodo(d)?"est":"", !per&&enProx(d)?"ventana":"", d>new Date()?"futuro":""].join(" ");
      return `<button type="button" class="cic-d ${cls}" data-act="cicloDiaAbrir" data-v="${s}" style="--f:${fl}" ${tipAttr(`${fmtDia(d)}${per?" · periodo":""}${r?.dolor?` · dolor ${r.dolor}/10`:""}${(r?.sintomas||[]).length?" · "+r.sintomas.join(", "):""}${!per&&enProxPeriodo(d)?" · estimado":""}`)}><b>${d.getDate()}</b>${r?`<i class="cic-dot ${r.dolor>=6?"fuerte":""}"></i>`:""}</button>`; }).join("")}</div>
    <div class="cic-ley"><span><i class="per"></i>Periodo</span><span><i class="est"></i>Estimado</span><span><i class="ven"></i>Ventana posible</span><span><i class="dot"></i>Registro diario</span></div></div>`;
  const ultimos = st.ps.slice(-8).reverse();
  const sintFrec = Object.entries(S.ciclodia.flatMap(d=>d.sintomas||[]).reduce((o,s)=>(o[s]=(o[s]||0)+1,o),{})).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const estado = st.enCurso ? `Día ${st.diaCiclo} de tu periodo` : st.diaCiclo ? `Día ${st.diaCiclo} de tu ciclo` : "Aún sin registros";
  return `${cab("Mi ciclo", "Privado · solo tú lo ves", `${cc.pin?btn(ICON.lock+" Bloquear","cicloBloquear","","sm"):""}${btn(ICON.gear+" Privacidad","sheetOpen",'data-v="cicloAjustes"',"sm")}`)}
  <div class="cic-top">
    <section class="card cic-hoy"><div class="cic-ring">${ring(st.media&&st.diaCiclo?Math.min(1,st.diaCiclo/st.media):0,{size:118,label:st.diaCiclo?`Día ${st.diaCiclo}`:"—", color:"var(--rosa)"})}</div>
      <div class="grow"><small class="mini">${hoy.slice(8)} de ${MESES[new Date().getMonth()]}</small><h3>${estado}</h3>
        <p class="mini">${st.prox ? `Próximo periodo estimado: <b>${relDia(st.prox.ini)}</b> (entre el ${st.prox.desde.getDate()}/${st.prox.desde.getMonth()+1} y el ${st.prox.hasta.getDate()}/${st.prox.hasta.getMonth()+1}) · confianza ${st.prox.confianza}.` : `Necesito al menos 3 periodos registrados para estimar el próximo. Llevas ${st.ps.length}.`}</p>
        <div class="btns">${st.enCurso ? btn(ICON.check+" Terminó hoy","cicloFin","","pri") : btn(ICON.drop+" Empezó hoy","cicloInicio","","pri")}${btn(ICON.edit+" ¿Cómo me siento hoy?","cicloDiaAbrir",`data-v="${hoy}"`)}</div></div>
    </section>
    <section class="card cic-stats"><div class="card-h"><h3>Tus números</h3></div>
      <div class="kpis mini3"><div class="kpi"><small>Ciclo promedio</small><b>${st.media?Math.round(st.media)+" d":"—"}</b></div><div class="kpi"><small>Duración</small><b>${st.dur?Math.round(st.dur)+" d":"—"}</b></div><div class="kpi"><small>Variación</small><b>${st.sd!=null?"±"+Math.round(st.sd)+" d":"—"}</b></div></div>
      ${st.largos.length ? barChart(st.largos.slice(-8).map((v,k,a)=>({l:`#${st.largos.length-a.length+k+1}`, v, tip:`Ciclo de ${v} días`})), {h:120, highlight:Math.min(7,st.largos.length-1)}) : `<p class="mini">Con dos ciclos completos verás aquí la duración de cada uno.</p>`}
      ${st.prox?.irregular?`<p class="aviso">${ICON.alert}<span>Tus ciclos varían bastante; la estimación es menos precisa.</span></p>`:""}
    </section>
  </div>
  <section class="card"><div class="card-h"><button type="button" class="ib sm" data-act="cicMes" data-v="-1">${ICON.left}</button><h3>${capital(MESES[mes.getMonth()])} ${mes.getFullYear()}</h3><button type="button" class="ib sm" data-act="cicMes" data-v="1">${ICON.right}</button><div class="card-acc"><span class="mini">Toca un día para registrar o corregir</span></div></div>${cal}</section>
  <div class="cic-bajo">
    <section class="card"><div class="card-h"><h3>Ciclos anteriores</h3><div class="card-acc">${btn(ICON.plus+" Agregar periodo","sheetOpen",'data-v="periodo"',"sm")}</div></div>
      ${ultimos.length ? `<div class="cic-hist">${ultimos.map(p=>{ const d=p.fin?diffDays(pymd(p.inicio),pymd(p.fin))+1:null; return `<button type="button" class="cic-h" data-act="periodoEditar" data-id="${p.id}"><span class="cic-h-f"><b>${pymd(p.inicio).getDate()} ${MESES[pymd(p.inicio).getMonth()].slice(0,3)}</b><small>${pymd(p.inicio).getFullYear()}</small></span><span class="grow">${p.fin?`Hasta el ${pymd(p.fin).getDate()} ${MESES[pymd(p.fin).getMonth()].slice(0,3)} · ${d} días`:"En curso / sin fecha de fin"}${p.notas?`<small>${esc(p.notas)}</small>`:""}</span>${ICON.edit}</button>`; }).join("")}</div>` : vacio("habitos","Sin periodos registrados","Toca «Empezó hoy» o dile a Mila «me vino la regla» y lo anoto con discreción.")}
    </section>
    <section class="card"><div class="card-h"><h3>Síntomas más frecuentes</h3></div>
      ${sintFrec.length ? `<div class="cic-sint">${sintFrec.map(([s,n])=>`<div><span>${esc(s)}</span>${barraProg(n/sintFrec[0][1],"var(--rosa)")}<b>${n}</b></div>`).join("")}</div>` : `<p class="mini">Cuando registres cómo te sientes, verás aquí tus patrones.</p>`}
    </section>
  </div>
  <section class="card cic-limites"><div class="card-h"><span class="card-ic">${ICON.shield}</span><h3>Límites de las estimaciones</h3></div>
    <p class="mini">Las fechas estimadas son un promedio de tus ciclos anteriores, no un diagnóstico. No sirven como método anticonceptivo ni para planificar un embarazo. El estrés, el sueño, la salud o los cambios de rutina pueden adelantar o retrasar el periodo. Si tus ciclos cambian mucho, son muy dolorosos o tienes dudas, consulta a un profesional de salud.</p></section>`;
};
SHEETS.cicloDia = (d) => {
  const f=d.fecha||todayStr(); const r=S.ciclodia.find(x=>x.id===f)||{}; const per=diaEnPeriodo(f);
  return `${sheetHead(capital(fmtDiaLargo(pymd(f))), ICON.drop)}
  <form data-form="cicloDia" data-fecha="${f}" class="frm">
    <div class="fld"><span>Sangrado</span><div class="chips sel">${FLUJOS.map(([v,l])=>`<label class="chip ${Number(r.flujo||0)===v?"on":""}"><input type="radio" name="flujo" value="${v}" ${Number(r.flujo||0)===v?"checked":""} hidden>${l}</label>`).join("")}</div></div>
    <label class="fld"><span>Dolor: <b id="dolV">${r.dolor||0}</b>/10</span><input type="range" class="rango" name="dolor" min="0" max="10" value="${r.dolor||0}" oninput="dolV.textContent=this.value" style="--p:${(r.dolor||0)*10}%"></label>
    <div class="fld"><span>Energía</span><div class="chips sel">${[1,2,3,4,5].map(v=>`<label class="chip ${Number(r.energia)===v?"on":""}"><input type="radio" name="energia" value="${v}" ${Number(r.energia)===v?"checked":""} hidden>${["","Muy baja","Baja","Normal","Buena","Alta"][v]}</label>`).join("")}</div></div>
    <div class="fld"><span>Estado de ánimo</span><div class="chips sel">${MOODS.map(m=>`<label class="chip ${r.animo===m.k?"on":""}"><input type="radio" name="animo" value="${m.k}" ${r.animo===m.k?"checked":""} hidden>${m.l}</label>`).join("")}</div></div>
    <div class="fld"><span>Síntomas</span><div class="chips multi">${SINTOMAS.map(s=>`<label class="chip ${(r.sintomas||[]).includes(s)?"on":""}"><input type="checkbox" name="s_${esc(s)}" ${(r.sintomas||[]).includes(s)?"checked":""} hidden onchange="this.parentNode.classList.toggle('on',this.checked)">${esc(s)}</label>`).join("")}</div></div>
    ${fld("Observaciones", `<textarea name="nota" rows="2" placeholder="Opcional">${esc(r.nota||"")}</textarea>`)}
    <div class="sh-acc">${per?btn("Terminó este día","cicloFin",`data-v="${f}"`,"ghost"):btn(ICON.drop+" Empezó este día","cicloInicio",`data-v="${f}"`,"ghost")}<button type="submit" class="btn pri">Guardar</button></div>
  </form>`;
};
SHEETS.periodo = (d) => { const p = d.id ? S.ciclo.find(x=>x.id===d.id) : null;
  return `${sheetHead(p?"Corregir periodo":"Agregar periodo", ICON.drop)}<form data-form="periodo" data-id="${p?.id||""}" class="frm">
    <div class="fila2">${fld("Inicio", `<input type="date" name="inicio" required value="${esc(p?.inicio||todayStr())}">`)}${fld("Fin (opcional)", `<input type="date" name="fin" value="${esc(p?.fin||"")}">`)}</div>
    ${fld("Notas", `<input name="notas" value="${esc(p?.notas||"")}" placeholder="Opcional">`)}
    <div class="sh-acc">${p?btn(ICON.trash+" Borrar","periodoBorrar",`data-id="${p.id}"`,"ghost danger"):""}<button type="submit" class="btn pri">Guardar</button></div></form>`; };
SHEETS.cicloAjustes = () => { const c=S.profile.ciclo||{};
  return `${sheetHead("Privacidad de Mi ciclo", ICON.shield)}<form data-form="cicloAjustes" class="frm">
    <label class="tog"><input type="checkbox" name="recordar" ${c.recordar?"checked":""}><i></i>Recordarme antes del periodo estimado</label>
    ${fld("¿Cuántos días antes?", `<input type="number" name="diasAntes" min="0" max="7" value="${Number(c.diasAntes??2)}">`)}
    <label class="tog"><input type="checkbox" name="mostrarTexto" ${c.mostrarTexto?"checked":""}><i></i>Mostrar el detalle en la notificación (si no, solo dirá «recordatorio privado»)</label>
    <label class="tog"><input type="checkbox" name="sync" ${c.sync!==false?"checked":""}><i></i>Sincronizar Mi ciclo entre mis dispositivos (copia privada en tu Drive)</label>
    <label class="tog"><input type="checkbox" name="enInicio" ${c.enInicio?"checked":""}><i></i>Mostrar un resumen discreto en Inicio</label>
    ${fld(c.pin?"Cambiar PIN (déjalo vacío para mantenerlo)":"PIN para abrir esta sección (opcional)", `<input name="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password" placeholder="4 a 8 números">`)}
    ${c.pin?`<label class="tog"><input type="checkbox" name="quitarPin"><i></i>Quitar el PIN</label>`:""}
    <div class="sh-acc"><button type="submit" class="btn pri">Guardar</button></div></form>
    <div class="sep"></div><div class="btns">${btn(ICON.download+" Exportar mis datos del ciclo","cicloExportar")}${btn(ICON.trash+" Borrar todo Mi ciclo","sheetOpen",'data-v="cicloBorrar"',"ghost danger")}</div>`; };
SHEETS.cicloBorrar = () => `${sheetHead("Borrar todo Mi ciclo", ICON.trash)}<p class="mini">Se borrarán ${plural(S.ciclo.length,"periodo","periodos")} y ${plural(S.ciclodia.length,"registro diario","registros diarios")} de este dispositivo y de tu copia privada. Escribe <b>BORRAR</b> para confirmar.</p>
  <form data-form="cicloBorrar" class="frm">${fld("Confirmación", `<input name="c" autocomplete="off" required>`)}<div class="sh-acc"><button type="submit" class="btn danger">Borrar definitivamente</button></div></form>`;
function cicloExportar(){
  const filas=[["tipo","fecha_inicio","fecha_fin","flujo","dolor","energia","animo","sintomas","nota"]];
  for(const p of periodosOrden()) filas.push(["periodo",p.inicio,p.fin||"","","","","","",p.notas||""]);
  for(const d of S.ciclodia.slice().sort((a,b)=>a.id.localeCompare(b.id))) filas.push(["dia",d.id,"",d.flujo??"",d.dolor??"",d.energia??"",d.animo||"",(d.sintomas||[]).join("; "),d.nota||""]);
  const csv = filas.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv"})); a.download=`mi-ciclo-${todayStr()}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  toast("Descargué tus datos del ciclo (CSV)", {icon:ICON.download});
}
function aplicarSyncCiclo(){ try{ const ex = S.profile.ciclo?.sync===false ? ["/ciclo/","/ciclodia/"] : []; localStorage.setItem("mila-sync-excluir", JSON.stringify(ex)); }catch{} }
