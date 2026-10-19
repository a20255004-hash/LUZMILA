/* =========================================================
   Voz: hablar (varios motores) y escuchar (dictado del navegador)
   ========================================================= */
const UA = navigator.userAgent;
const ES_EDGE = /Edg\//.test(UA);
let ES_BRAVE = false; try{ navigator.brave?.isBrave?.().then(v=>{ ES_BRAVE=!!v; render(); }); }catch{}
const Voz = {
  motor(){ return window.MilaApp?.Claves.get().vozMotor || "navegador"; },
  voces(){ return (speechSynthesis?.getVoices?.()||[]).filter(v=>/^es/i.test(v.lang)); },
  puntaje(v){ const n=v.name; let s=0; if(/natural|online|neural|wavenet|premium|enhanced/i.test(n)) s+=50; if(/google/i.test(n)) s+=18; if(/Camila|Dalia|Elena|Paloma|Sabina|Ximena|Larissa|Elvira|Salome|Valentina|Catalina|Beatriz|Marina|Andrea|Helena|Laura|Monica|Paulina/i.test(n)) s+=22;
    if(/es-PE/i.test(v.lang)) s+=14; else if(/es-(MX|US|419|CO|AR|CL)/i.test(v.lang)) s+=9; else if(/es-ES/i.test(v.lang)) s+=4; if(/male|hombre|Jorge|Pablo|Raul|Alvaro|Gonzalo|Mateo|Alex|Diego/i.test(n)) s-=20; return s; },
  mejor(){ const pref=S.profile.ajustes.vozNombre; const vs=this.voces(); return vs.find(v=>v.name===pref) || vs.sort((a,b)=>this.puntaje(b)-this.puntaje(a))[0] || null; },
  hayNatural(){ return this.voces().some(v=>this.puntaje(v)>=50); },
  hablando:false, audio:null, cola:[], token:0,
  limpiar(t){ return String(t||"").replace(/S\/\s?(\d+)\.00\b/g,"$1 soles").replace(/S\/\s?(\d+)\.(\d{2})/g,"$1 soles con $2").replace(/\bS\/\s?/g,"").replace(/https?:\S+/g,"").replace(/[«»*_#]/g,"").replace(/\s+/g," ").trim(); },
  async decir(texto){
    if(!S.profile.ajustes.hablar) return; this.parar(); const tk = ++this.token;
    const t = this.limpiar(texto); if(!t) return;
    const m = this.motor(); Mila.set("hablando"); Mila.talk(true); this.hablando=true; Oido.pausar();
    try{
      if(m==="neural") await this.piper(t, tk);
      else if(m==="elevenlabs") await this.audioDe(await this.eleven(t), tk);
      else if(m==="google") await this.audioDe(await window.MilaApp.VozGoogle.sintetizar(t), tk);
      else await this.navegador(t, tk);
    }catch(e){ console.warn("voz", e); if(m!=="navegador" && tk===this.token){ toast("La voz elegida falló; uso la del navegador."); await this.navegador(t, tk).catch(()=>{}); } }
    if(tk===this.token){ this.hablando=false; Mila.talk(false); Mila.set("idle"); Oido.reanudar(); }
  },
  parar(){ this.token++; try{ speechSynthesis.cancel(); }catch{} if(this.audio){ try{ this.audio.pause(); }catch{} this.audio=null; } this.hablando=false; Mila.talk(false); },
  navegador(t, tk){ return new Promise(res=>{ if(!window.speechSynthesis) return res();
    const partes = t.match(/[^.!?]+[.!?]*/g) || [t]; let i=0; const v=this.mejor();
    const sig = ()=>{ if(tk!==this.token || i>=partes.length) return res(); const u=new SpeechSynthesisUtterance(partes[i++].trim()); if(v){ u.voice=v; u.lang=v.lang; } else u.lang="es-PE";
      u.rate = S.profile.ajustes.vozRate||1; u.pitch = S.profile.ajustes.vozPitch||1; u.onboundary=()=>{ Mila.boca(.6); setTimeout(()=>Mila.boca(0),120); }; u.onend=sig; u.onerror=sig; speechSynthesis.speak(u); };
    sig(); }); },
  async audioDe(buf, tk){ if(tk!==this.token) return; const url = URL.createObjectURL(new Blob([buf], {type:"audio/mpeg"})); await this.reproducir(url, tk); URL.revokeObjectURL(url); },
  reproducir(url, tk){ return new Promise(res=>{ const a=new Audio(url); this.audio=a; let ctx, an, raf;
    try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); const src=ctx.createMediaElementSource(a); an=ctx.createAnalyser(); an.fftSize=256; src.connect(an); an.connect(ctx.destination); const d=new Uint8Array(an.frequencyBinCount); const loop=()=>{ an.getByteFrequencyData(d); let s=0; for(let i=2;i<40;i++) s+=d[i]; Mila.boca(Math.min(1, s/40/140)); raf=requestAnimationFrame(loop); }; loop(); }catch{}
    const fin=()=>{ cancelAnimationFrame(raf); Mila.boca(0); try{ ctx?.close(); }catch{} res(); }; a.onended=fin; a.onerror=fin; a.play().catch(fin); if(tk!==this.token) fin(); }); },
  async eleven(t){ const k=window.MilaApp.Claves.get(); if(!k.elevenlabs) throw new Error("Falta tu clave de ElevenLabs");
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${k.elVoice||"EXAVITQu4vr4xnSDxMaL"}?output_format=mp3_44100_64`, {method:"POST", headers:{"xi-api-key":k.elevenlabs, "Content-Type":"application/json"}, body:JSON.stringify({text:t, model_id:"eleven_multilingual_v2", voice_settings:{stability:.45, similarity_boost:.8, style:.25}})});
    if(!r.ok) throw new Error("ElevenLabs "+r.status); return r.arrayBuffer(); },
  /* Voz neuronal que corre dentro de tu navegador (Piper, código abierto). Se descarga una vez (~60 MB). */
  piperSes:null, piperCargando:null, piperEstado:"",
  async piperCargar(onProg){
    if(this.piperSes) return this.piperSes; if(this.piperCargando) return this.piperCargando;
    this.piperCargando = (async()=>{ this.piperEstado="Descargando voz…"; render();
      const tts = await import("https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.5/+esm");
      const voz = window.MilaApp.Claves.get().piperVoz || "es_MX-claude-high";
      this.piperSes = await tts.TtsSession.create({voiceId:voz, progress:p=>{ if(p?.total){ this.piperEstado=`Descargando voz… ${Math.round(p.loaded/p.total*100)}%`; onProg?.(this.piperEstado); } },
        wasmPaths:{onnxWasm:"https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/", piperData:tts.WASM_BASE+".data", piperWasm:tts.WASM_BASE+".wasm"}});
      this.piperEstado="Lista"; render(); return this.piperSes; })();
    try{ return await this.piperCargando; } catch(e){ this.piperCargando=null; this.piperEstado="Error: "+errMsg(e); render(); throw e; }
  },
  async piper(t, tk){
    const ses = await this.piperCargar(); const partes = (t.match(/[^.!?]+[.!?]*/g)||[t]).map(s=>s.trim()).filter(Boolean);
    let sig = ses.predict(partes[0]);
    for(let i=0;i<partes.length;i++){ const wav = await sig; if(tk!==this.token) return; if(i+1<partes.length) sig = ses.predict(partes[i+1]);
      const url = URL.createObjectURL(wav); await this.reproducir(url, tk); URL.revokeObjectURL(url); if(tk!==this.token) return; }
  }
};
if(window.speechSynthesis) speechSynthesis.onvoiceschanged = ()=>{ if(S.route==="ajustes") render(); };

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const Oido = {
  activo:false, rec:null, manos:false, interino:"", pausado:false,
  disponible(){ return !!SR && !ES_BRAVE; },
  iniciar({manos=false}={}){
    if(!SR){ abrirSheet("mic"); return; }
    if(ES_BRAVE){ abrirSheet("mic"); return; }
    Voz.parar(); this.manos = manos; this.activo = true; this.pausado=false;
    const r = new SR(); this.rec = r; r.lang = "es-PE"; r.interimResults = true; r.continuous = manos; r.maxAlternatives = 1;
    let final = ""; this.interino="";
    r.onresult = e => { let inter=""; for(let i=e.resultIndex;i<e.results.length;i++){ const x=e.results[i]; if(x.isFinal) final += x[0].transcript+" "; else inter += x[0].transcript; }
      this.interino = (final+inter).trim(); const q=$("#q"); if(q){ q.value=this.interino; autoAlto(q); }
      if(manos && final.trim()){ const txt=final.trim(); final=""; this.interino=""; if(q) q.value=""; enviar(txt); } };
    r.onerror = e => { if(e.error==="not-allowed"||e.error==="service-not-allowed"){ this.activo=false; abrirSheet("mic"); } else if(e.error==="network"){ toast("El dictado necesita internet."); } };
    r.onend = () => { if(this.manos && this.activo && !this.pausado){ try{ r.start(); }catch{} return; }
      this.activo=false; Mila.set("idle"); pintarMic(); const txt=(final||this.interino).trim(); this.interino=""; if(txt && !this.manos){ const q=$("#q"); if(q) q.value=""; enviar(txt); } };
    try{ r.start(); Mila.set("escuchando","escuchando"); pintarMic(); haptic(12); }catch(e){ this.activo=false; toast("No pude activar el micrófono: "+errMsg(e)); }
  },
  detener(){ this.manos=false; this.activo=false; try{ this.rec?.stop(); }catch{} pintarMic(); },
  pausar(){ if(this.manos && this.activo){ this.pausado=true; try{ this.rec?.stop(); }catch{} } },
  reanudar(){ if(this.manos && this.pausado){ this.pausado=false; this.activo=true; try{ this.rec?.start(); }catch{} } }
};
function pintarMic(){ for(const b of $$(".mic-btn")) b.classList.toggle("on", Oido.activo); }
