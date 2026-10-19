/* =========================================================
   FRASES · banco propio de Mila, tus favoritas y tus propias frases
   (las frases del banco son originales de Mila; las clásicas son ideas
   parafraseadas de autores antiguos de dominio público)
   ========================================================= */
const FRASE_CATS = {
  "Constancia":"#7C5CFF", "Ánimo":"#F5A524", "Calma":"#3A8DDE", "Valentía social":"#E06AA8", "Estudio y tesis":"#D9468C",
  "Autocompasión":"#1FA97A", "Descanso":"#8E6CFF", "Dinero":"#119C9C", "Humor":"#E8912D", "Clásicas":"#6B5B95", "Mías":"#C2702B", "Mis chips":"#5B33C9"
};
const FRASES_BANCO = [
  ["Constancia","No necesitas ganas para empezar; necesitas empezar para que lleguen las ganas."],
  ["Constancia","Un día no es un patrón. Mañana sigue."],
  ["Constancia","La constancia no es hacerlo perfecto todos los días, es volver cada vez que te caes."],
  ["Constancia","Diez minutos hoy valen más que un plan perfecto para mañana."],
  ["Constancia","Lo pequeño repetido se vuelve enorme."],
  ["Constancia","No rompas la cadena; y si se rompe, empieza una nueva hoy."],
  ["Constancia","Tu yo de dentro de un mes te está mirando. Dale algo de qué sentirse orgullosa."],
  ["Constancia","Primero lo hago, después lo pienso bonito."],
  ["Constancia","El hábito es la versión de ti que no necesita convencerse."],
  ["Constancia","Retomar después de fallar es la habilidad más importante de todas."],
  ["Ánimo","Ya has superado días que creías imposibles. Este también."],
  ["Ánimo","No estás atrasada: vas a tu ritmo, y tu ritmo cuenta."],
  ["Ánimo","Brilla aunque nadie aplauda; tú sabes lo que te costó."],
  ["Ánimo","Lo que hoy te parece cuesta arriba, mañana será tu punto de vista."],
  ["Ánimo","Eres más capaz de lo que tu cansancio te hace creer."],
  ["Ánimo","Cada tarea tachada es una prueba de que puedes."],
  ["Ánimo","Tu esfuerzo de hoy es el orgullo de mañana."],
  ["Ánimo","Hoy basta con dar un paso. Mañana daremos otro."],
  ["Calma","Respira: inhala 4, sostén 4, exhala 6. El cuerpo se calma antes que la mente."],
  ["Calma","No todo lo urgente es importante. Elige una cosa y hazla bien."],
  ["Calma","Lo que no depende de ti, suéltalo; lo que sí, empiézalo."],
  ["Calma","Una cosa a la vez es más rápido que todo a la vez."],
  ["Calma","El caos de la cabeza se ordena en papel. Escríbelo."],
  ["Calma","No tienes que resolver tu vida hoy, solo tu siguiente hora."],
  ["Valentía social","No necesitas la respuesta perfecta. Solo estar presente."],
  ["Valentía social","Un saludo breve no exige nada más."],
  ["Valentía social","Proponer no es imponer. Si dicen que no, el plan no era el adecuado, no tú."],
  ["Valentía social","La gente piensa en ti mucho menos de lo que temes, y te aprecia más de lo que crees."],
  ["Valentía social","El nervio puede venir contigo. Actúa según tu propósito, no según cómo te sientes."],
  ["Valentía social","Tu voz también merece estar en la conversación."],
  ["Estudio y tesis","Una tesis se escribe párrafo a párrafo. Hoy toca uno."],
  ["Estudio y tesis","Lee un paper, subraya una idea, escribe una línea. Eso ya es avanzar."],
  ["Estudio y tesis","Un borrador feo es infinitamente mejor que una página en blanco."],
  ["Estudio y tesis","Estudiar 25 minutos con foco gana a estudiar tres horas distraída."],
  ["Estudio y tesis","Cada fuente que lees es un ladrillo de tu marco teórico."],
  ["Estudio y tesis","Explícalo con manzanitas: si lo puedes explicar simple, lo entendiste."],
  ["Estudio y tesis","Lo que hoy investigas, mañana lo sustentas con seguridad."],
  ["Autocompasión","Me comparo con mi propio ayer, no con un ideal sin cuerpo."],
  ["Autocompasión","Esto también cuenta. Va al Expediente."],
  ["Autocompasión","Equivocarte bajo cansancio no te define: te pasó, no eres eso."],
  ["Autocompasión","Háblate como le hablarías a tu mejor amiga."],
  ["Autocompasión","No eres floja; estás cansada, y eso se atiende, no se castiga."],
  ["Autocompasión","Mereces la misma paciencia que le das a los demás."],
  ["Autocompasión","Está bien sentir enojo; no tienes que reprimirlo, solo elegir qué hacer con él."],
  ["Descanso","Descansar también es parte del plan."],
  ["Descanso","Una mente descansada resuelve en una hora lo que una cansada no resuelve en cinco."],
  ["Descanso","Apagar la pantalla a tiempo es un regalo para tu yo de mañana."],
  ["Descanso","Zombie no decide. Decide Luzmila."],
  ["Descanso","Dormir bien no es perder tiempo: es invertirlo."],
  ["Dinero","Cada sol registrado es un sol que ya no se escapa."],
  ["Dinero","No es cuánto ganas, es cuánto decides con intención."],
  ["Dinero","Primero págate a ti: ahorra antes de gastar."],
  ["Dinero","Un gasto pequeño repetido es un gasto grande disfrazado."],
  ["Dinero","Tu presupuesto no te limita: te da permiso para disfrutar sin culpa."],
  ["Humor","Que la iluminación también pueda llegar riendo."],
  ["Humor","El remate corto y seco tiene más impacto que la versión larga."],
  ["Humor","Si hoy no salió, al menos ya tienes una anécdota."],
  ["Humor","La vida es más liviana cuando encuentras una cosa graciosa en un día normal."],
  ["Humor","Hoy tu misión: hacer reír a alguien, aunque sea a ti misma."],
  ["Clásicas","No es que tengamos poco tiempo, es que perdemos mucho. (idea de Séneca)"],
  ["Clásicas","Nos perturban menos las cosas que las opiniones que tenemos de ellas. (idea de Epicteto)"],
  ["Clásicas","Tienes poder sobre tu mente, no sobre los hechos externos; ahí está tu fuerza. (idea de Marco Aurelio)"],
  ["Clásicas","El viaje de mil leguas empieza con un paso. (idea de Lao Tse)"],
  ["Clásicas","No importa lo lento que vayas mientras no te detengas. (idea atribuida a Confucio)"],
  ["Clásicas","Somos lo que hacemos repetidamente. (idea inspirada en Aristóteles)"],
  ["Clásicas","La felicidad de tu vida depende de la calidad de tus pensamientos. (idea de Marco Aurelio)"]
].map(([cat, texto], i)=>({clave:"b"+i, cat, texto: texto.replace(/ \(idea[^)]*\)$/,"").replace(/ \(idea atribuida[^)]*\)$/,""), autor:capital((texto.match(/\((idea [^)]+)\)$/)||[])[1]||"")||"Mila", banco:true}));
function frasesTodas(){
  const propias = S.frases.filter(f=>f.propia!==false).map(f=>({...f, cat:f.cat||"Mías"}));
  return [...FRASES_BANCO, ...propias];
}
function esFav(f){ return f.banco ? S.frases.some(x=>x.clave===f.clave && x.fav) : !!f.fav; }
function fraseDelDia(offset=0){
  const pref = S.profile.frase?.cats||[]; let l = frasesTodas(); if(pref.length) { const f=l.filter(x=>pref.includes(x.cat)); if(f.length) l=f; }
  const d=new Date(); const seed = d.getFullYear()*372 + d.getMonth()*31 + d.getDate();
  return l[(seed*7 + offset*13) % l.length];
}
// mensajes personalizados según tus metas, hábitos y avances reales
function mensajesParaTi(){
  const out=[]; const c=Coach.mensaje(); if(c) out.push(c.t);
  const g=S.metas.filter(x=>x.estado==="activa").sort((a,b)=>(a.ultima_vez||"").localeCompare(b.ultima_vez||""))[0];
  if(g){ const d=g.ultima_vez?diffDays(pymd(g.ultima_vez), new Date()):null; out.push(d>=5 ? `Hace ${d} días que no tocas «${g.titulo}». No hace falta mucho: ${g.proxima_accion||"un paso de 10 minutos"} y ya se mueve.` : `Vas bien con «${g.titulo}». Sigue así: el progreso pequeño también suma.`); }
  const h=S.habitos.find(x=>!x.registros?.[todayStr()]); if(h) out.push(`Aún puedes cumplir «${h.nombre}» hoy. Un hábito se gana en los días normales.`);
  const hechas=S.tareas.filter(x=>x.hecha_en && Date.now()-x.hecha_en<86400000).length; if(hechas) out.push(`Hoy ya tachaste ${plural(hechas,"tarea","tareas")}. Eso cuenta, ${N()}.`);
  const chip = S.frases.find(f=>f.cat==="Mis chips" && f.situacion); if(chip) out.push(`Tu chip mental para «${chip.situacion.toLowerCase()}»: ${chip.texto}`);
  return out.slice(0,4);
}
VISTAS.frases = function(){
  const U=S.fraseUI; const f=fraseDelDia(U.i); const fav=esFav(f); const cats=Object.keys(FRASE_CATS);
  let lista = frasesTodas();
  if(U.tab==="fav") lista = lista.filter(esFav); else if(U.tab==="mias") lista = lista.filter(x=>!x.banco);
  if(U.cat) lista = lista.filter(x=>x.cat===U.cat);
  const para = mensajesParaTi();
  const tarjetaF = x => `<div class="frase" style="--c:${FRASE_CATS[x.cat]||"var(--violeta)"}"><span class="fr-cat">${esc(x.cat)}</span><p>${esc(x.texto)}</p>${x.situacion?`<small class="fr-sit">Para: ${esc(x.situacion)}</small>`:""}<div class="fr-pie"><small>${esc(x.autor&&x.autor!=="Mila"?x.autor:x.banco?"Mila":x.origen||"Tú")}</small>
      <button type="button" class="ib sm ${esFav(x)?"on":""}" data-act="fraseFav" ${x.banco?`data-clave="${x.clave}"`:`data-id="${x.id}"`} title="Favorita">${ICON.heart}</button>
      <button type="button" class="ib sm" data-act="leer" data-v="${esc(x.texto)}" title="Escuchar">${ICON.volume}</button>
      ${!x.banco?`<button type="button" class="ib sm" data-act="fraseBorrar" data-id="${x.id}" title="Borrar">${ICON.trash}</button>`:""}</div></div>`;
  return `${cab("Frases", "Para cuando necesitas un empujón, calma o una sonrisa")}
  <section class="frase-hero" style="--c:${FRASE_CATS[f.cat]||"var(--violeta)"}">
    <span class="fh-q">${ICON.quote}</span>
    <div class="fh-in"><span class="fr-cat">${esc(f.cat)} · frase del día</span><blockquote>${esc(f.texto)}</blockquote><small>— ${esc(f.autor&&f.autor!=="Mila"?f.autor:f.banco?"Mila":"Tú")}</small>
      <div class="btns"><button type="button" class="btn ${fav?"pri":""}" data-act="fraseFav" ${f.banco?`data-clave="${f.clave}"`:`data-id="${f.id}"`}>${ICON.heart} ${fav?"Favorita":"Me gusta"}</button>${btn(ICON.repeat+" Otra","fraseOtra")}${btn(ICON.volume+" Escuchar","leer",`data-v="${esc(f.texto)}"`)}${btn(ICON.copy+" Copiar","fraseCopiar",`data-v="${esc(f.texto)}"`)}</div></div>
    <div class="fh-mila mila-host" data-emo="carinosa"></div>
  </section>
  ${para.length?`<section class="card para-ti"><div class="card-h"><span class="card-ic">${ICON.spark}</span><h3>Mila te dice</h3><div class="card-acc"><span class="mini">Según tus metas y avances reales</span></div></div><div class="pt-l">${para.map(t=>`<div class="pt-i"><span class="mila-host" data-emo="alegre"></span><p>${esc(t)}</p></div>`).join("")}</div></section>`:""}
  <div class="t-barra">${segmentos("fraseTab", [["hoy","Todas"],["fav",`Favoritas · ${frasesTodas().filter(esFav).length}`],["mias",`Mías · ${S.frases.filter(x=>x.propia!==false).length}`]], U.tab)}
    <div class="chips"><button type="button" class="chip ${!U.cat?"on":""}" data-act="fraseCat" data-v="">Todas</button>${cats.filter(c=>frasesTodas().some(x=>x.cat===c)).map(c=>`<button type="button" class="chip ${U.cat===c?"on":""}" style="--c:${FRASE_CATS[c]}" data-act="fraseCat" data-v="${esc(c)}"><i class="pt" style="background:${FRASE_CATS[c]}"></i>${esc(c)}</button>`).join("")}</div></div>
  <form class="card frase-nueva" data-form="fraseNueva"><span class="qa-ic">${ICON.quote}</span><div class="grow"><textarea name="texto" rows="2" required placeholder="Escribe una frase tuya o una que te inspire…"></textarea>
    <div class="fila3"><input name="autor" placeholder="Autor (opcional)"><select name="cat">${cats.filter(c=>c!=="Clásicas").map(c=>`<option ${c==="Mías"?"selected":""}>${esc(c)}</option>`).join("")}</select><input name="situacion" placeholder="¿Para qué momento? (opcional)"></div></div><button type="submit" class="btn pri">Guardar</button></form>
  ${lista.length?`<div class="frases-g">${lista.map(tarjetaF).join("")}</div>`:vacio("memoria", U.tab==="fav"?"Aún no tienes favoritas":"Sin frases aquí", U.tab==="fav"?"Toca el corazón en las que más te muevan.":"Guarda tus propias frases arriba.")}`;
};
