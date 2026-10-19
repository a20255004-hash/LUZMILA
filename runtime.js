/* =========================================================
   Mila · motor de la app propia
   Implementa en el navegador las mismas capacidades que Mila usa dentro de claude.ai:
   - db:          memoria persistente en este dispositivo (localStorage)
   - sample:      cerebro con la API de Claude (SDK oficial) y herramientas
   - mcp:         Google Calendar y Google Drive con tu cuenta (OAuth de Google)
   - user / permissions
   Las claves se guardan solo en este dispositivo.
   ========================================================= */
const KEYS = "mila-claves";
export const Claves = {
  get(){ try{ return JSON.parse(localStorage.getItem(KEYS)||"{}"); }catch{ return {}; } },
  set(patch){ const k={...Claves.get(), ...patch}; localStorage.setItem(KEYS, JSON.stringify(k)); return k; }
};
// Enlace para abrir Mila en otro navegador: #cid=<ID de cliente de Google> (no es secreto; solo identifica la app)
try{ const m = location.hash.match(/cid=([^&]+)/); if(m){ const cid=decodeURIComponent(m[1]); if(/\.apps\.googleusercontent\.com$/.test(cid)) { Claves.set({googleClientId:cid}); window.__milaNuevoNavegador = true; } history.replaceState(null, "", location.pathname); } }catch{}

/* ---------------- db local con la misma forma que el db de claude.ai ---------------- */
const DBKEY = "mila-db";
let tree = {}; try{ tree = JSON.parse(localStorage.getItem(DBKEY)||"{}"); }catch{ tree = {}; }
const listeners = new Set();
let saveT = null;
// Marcas de tiempo por documento (y borrados) para fusionar con la copia de Google Drive sin perder nada.
const METAKEY = "mila-dbmeta";
let meta = { t:{}, tomb:{} }; try{ meta = {t:{}, tomb:{}, ...JSON.parse(localStorage.getItem(METAKEY)||"{}")}; }catch{}
function stamp(path, borrado){ const now=Date.now(); if(borrado){ meta.tomb[path]=now; delete meta.t[path]; } else { meta.t[path]=now; delete meta.tomb[path]; } Sync.cambio(); }
function persist(){ clearTimeout(saveT); saveT = setTimeout(()=>{ try{ localStorage.setItem(DBKEY, JSON.stringify(tree)); localStorage.setItem(METAKEY, JSON.stringify(meta)); }catch(e){ console.error("No se pudo guardar", e); } }, 60); }
const clone = v => v===undefined ? undefined : JSON.parse(JSON.stringify(v));
const freeze = o => Object.freeze(clone(o));
function merge(a,b){ const out = {...(a||{})}; for(const k of Object.keys(b)){ const v=b[k]; out[k] = (v && typeof v==="object" && !Array.isArray(v) && out[k] && typeof out[k]==="object" && !Array.isArray(out[k])) ? merge(out[k], v) : clone(v); } return out; }
function notify(){ queueMicrotask(()=>{ for(const l of [...listeners]) l(); }); }
const parentOf = p => p.split("/").slice(0,-1).join("/");
function docSnap(path){ const d = tree[path]; return { id: path.split("/").pop(), exists: d!==undefined, data: ()=> d===undefined ? undefined : freeze(d), metadata:{fromCache:false, hasPendingWrites:false} }; }
function querySnap(col, q){
  let docs = Object.keys(tree).filter(p=>parentOf(p)===col).sort().map(docSnap);
  for(const [f,op,v] of q.where){ docs = docs.filter(d=>{ const x=d.data()[f]; return op==="=="?x===v: op==="!="?x!==v: op==="<"?x<v: op==="<="?x<=v: op===">"?x>v: op===">="?x>=v: op==="in"?v.includes(x): op==="not-in"?!v.includes(x): op==="array-contains"?Array.isArray(x)&&x.includes(v): true; }); }
  if(q.order){ const [f,dir]=q.order; docs.sort((a,b)=>{ const x=a.data()[f], y=b.data()[f]; return (x<y?-1:x>y?1:0)*(dir==="desc"?-1:1); }); }
  if(q.lim) docs = docs.slice(0,q.lim);
  return { docs, size:docs.length, empty:!docs.length, docChanges:()=>[], metadata:{fromCache:false, hasPendingWrites:false} };
}
function docRef(path){
  return {
    id: path.split("/").pop(), path,
    async get(){ return docSnap(path); },
    async set(data){ tree[path] = clone(data); stamp(path); persist(); notify(); },
    async update(data){ if(tree[path]===undefined) throw {code:"invalid_argument", message:"El documento no existe"}; tree[path] = merge(tree[path], data); stamp(path); persist(); notify(); },
    async delete(){ delete tree[path]; stamp(path, true); persist(); notify(); },
    onSnapshot(next){ let last; const run=()=>{ const j=JSON.stringify(tree[path]); if(j===last) return; last=j; next(docSnap(path)); }; listeners.add(run); queueMicrotask(run); return ()=>listeners.delete(run); },
    collection(sub){ return colRef(path+"/"+sub); },
    async acquire(){ return {acquired:true}; }
  };
}
function colRef(path, q={where:[], order:null, lim:0}){
  const self = {
    path,
    doc(id){ return docRef(path+"/"+(id || (Date.now().toString(36)+Math.random().toString(36).slice(2,8)))); },
    async add(data){ const r=self.doc(); await r.set(data); return r; },
    where(f,op,v){ return colRef(path, {...q, where:[...q.where,[f,op,v]]}); },
    orderBy(f,dir="asc"){ return colRef(path, {...q, order:[f,dir]}); },
    limit(n){ return colRef(path, {...q, lim:n}); },
    async get(){ return querySnap(path,q); },
    onSnapshot(next){ let last; const run=()=>{ const s=querySnap(path,q); const j=JSON.stringify(s.docs.map(d=>[d.id,d.data()])); if(j===last) return; last=j; next(s); }; listeners.add(run); queueMicrotask(run); return ()=>listeners.delete(run); }
  };
  return self;
}
const db = { doc: docRef, collection: p => colRef(p) };
export const LocalDB = {
  exportar(){ return clone(tree); },
  importar(prefix, entries){ for(const [p,d] of entries){ tree[prefix+p] = clone(d); stamp(prefix+p); } persist(); notify(); },
  borrarTodo(){ for(const p of Object.keys(tree)) stamp(p, true); tree = {}; persist(); notify(); }
};

/* ---------------- Sincronización entre navegadores y dispositivos ----------------
   Guarda una copia privada en tu Google Drive (carpeta oculta de la app, appDataFolder:
   solo esta app la ve, no aparece en tu Drive). Cada documento lleva su hora de cambio;
   al fusionar gana el cambio más reciente y nada se duplica. */
const SYNC_FILE = "mila-sync.json";
const CLAVES_SYNC = ["claude","modelo","elevenlabs","elVoice","vozMotor","gtts","gVoice","llmProv","llmKey","llmModel","llmOn","piperVoz"];
export const Sync = {
  estado:"off", msg:"", ultima:0, fileId:null, corriendo:null, pendiente:false, t:null, oyentes:new Set(),
  set(estado, msg=""){ this.estado=estado; this.msg=msg; for(const f of this.oyentes) try{ f(); }catch{} },
  cambio(){ if(this.aplicando) return; this.pendiente=true; clearTimeout(this.t); this.t=setTimeout(()=>{ if(Google.valido()) this.run().catch(()=>{}); }, 2500); },
  excluir(){ try{ return JSON.parse(localStorage.getItem("mila-sync-excluir")||"[]"); }catch{ return []; } },
  filtrar(obj){ const ex=this.excluir(); if(!ex.length) return obj; const o={}; for(const [k,v] of Object.entries(obj||{})) if(!ex.some(e=>k.includes(e))) o[k]=v; return o; },
  async buscar(){
    if(this.fileId) return this.fileId;
    const q = new URLSearchParams({spaces:"appDataFolder", q:`name='${SYNC_FILE}'`, fields:"files(id,modifiedTime)", pageSize:"5"});
    const j = await Google.api("https://www.googleapis.com/drive/v3/files?"+q);
    this.fileId = j.files?.[0]?.id || null; return this.fileId;
  },
  async run(){
    if(this.corriendo) { this.pendiente=true; return this.corriendo; }
    this.corriendo = (async()=>{
      this.set("sync", "Sincronizando…");
      try{
        const id = await this.buscar();
        let remoto = null;
        if(id){ const t=await Google.ensure(); const r=await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {headers:{Authorization:"Bearer "+t}}); if(r.ok) remoto = await r.json().catch(()=>null); else if(r.status===404) this.fileId=null; }
        this.subir = !remoto || this.pendiente;
        const cambiosLocales = remoto ? this.fusionar(remoto) : 0;
        const misClaves = Object.fromEntries(CLAVES_SYNC.map(k=>[k, Claves.get()[k]]).filter(([,v])=>v));
        if(remoto && JSON.stringify(misClaves)!==JSON.stringify(remoto.claves||{})) this.subir = true;
        if(!this.subir){ this.pendiente=false; this.ultima=Date.now(); this.set("ok", cambiosLocales ? `Traje ${cambiosLocales} ${cambiosLocales===1?"cambio":"cambios"} de tus otros dispositivos` : "Sincronizado"); return cambiosLocales; }
        const paquete = { app:"mila", v:1, at:Date.now(), tree:this.filtrar(tree), meta:{t:this.filtrar(meta.t), tomb:this.filtrar(meta.tomb)}, claves:Object.fromEntries(CLAVES_SYNC.map(k=>[k, Claves.get()[k]]).filter(([,v])=>v)) };
        const body = JSON.stringify(paquete);
        if(this.fileId){
          await Google.api(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`, {method:"PATCH", headers:{"Content-Type":"application/json"}, body});
        } else {
          const b="mila"+Date.now();
          const mp=`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name:SYNC_FILE, parents:["appDataFolder"]})}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`;
          const j = await Google.api("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {method:"POST", headers:{"Content-Type":"multipart/related; boundary="+b}, body:mp});
          this.fileId = j.id;
        }
        this.pendiente=false; this.ultima=Date.now(); try{ localStorage.setItem("mila-sync-ultima", String(this.ultima)); }catch{}
        this.set("ok", cambiosLocales ? `Traje ${cambiosLocales} ${cambiosLocales===1?"cambio":"cambios"} de tus otros dispositivos` : "Sincronizado");
        return cambiosLocales;
      }catch(e){
        const m = String(e?.message||e?.code||e);
        this.set("error", /insufficient|scope|permission/i.test(m) ? "Falta tu permiso para la copia en Drive. Toca Sincronizar." : m);
        throw e;
      }finally{ this.corriendo=null; if(this.pendiente && Google.valido()) setTimeout(()=>this.run().catch(()=>{}), 1500); }
    })();
    return this.corriendo;
  },
  fusionar(remoto){
    const rt = remoto.tree||{}, rm = {t:{}, tomb:{}, ...(remoto.meta||{})};
    let n = 0; this.aplicando = true;
    const rutas = new Set([...Object.keys(rt), ...Object.keys(rm.tomb), ...Object.keys(tree), ...Object.keys(meta.tomb)]);
    const ex=this.excluir();
    for(const p of rutas){
      if(ex.some(e=>p.includes(e))) continue;
      // sin marca = dato antiguo (antes de sincronizar): vale menos que cualquier cambio con hora
      const lt = meta.t[p] ?? (tree[p]!==undefined ? 1 : 0), lb = meta.tomb[p] || 0;
      const rtt = rm.t[p] ?? (rt[p]!==undefined ? 1 : 0), rb = rm.tomb[p] || 0;
      const local = Math.max(lt, lb), rem = Math.max(rtt, rb);
      if(rem > local){
        if(rb >= rtt){ if(tree[p]!==undefined){ delete tree[p]; n++; } meta.tomb[p]=rb; delete meta.t[p]; }
        else { if(JSON.stringify(tree[p])!==JSON.stringify(rt[p])){ tree[p]=clone(rt[p]); n++; } meta.t[p]=rtt; delete meta.tomb[p]; }
      } else if(rem===local && rem<=1 && rt[p]!==undefined && tree[p]===undefined){ tree[p]=clone(rt[p]); n++; }
      else if(local > rem || (local===rem && tree[p]!==undefined && rt[p]===undefined)) this.subir = true;
    }
    // claves: solo completa las que faltan en este navegador
    const k = Claves.get(), falt = {}; for(const [kk,v] of Object.entries(remoto.claves||{})) if(v && !k[kk]) falt[kk]=v;
    if(Object.keys(falt).length){ Claves.set(falt); n++; this.clavesNuevas = true; }
    this.aplicando = false;
    if(n){ persist(); notify(); }
    return n;
  }
};
try{ Sync.ultima = Number(localStorage.getItem("mila-sync-ultima")||0); }catch{}

/* ---------------- user / permissions ---------------- */
const user = { id: async()=>"local", me: async()=>({id:"local", name:"", guest:false}), isOwner: async()=>true, canEdit: async()=>true, can: async()=>true, profiles: async()=>({}) };
const permissions = {
  async state(name){ if(String(name).startsWith("mcp:")) return Google.valido() ? "granted" : (Claves.get().googleClientId ? "prompt" : "unavailable"); return "granted"; },
  async request(names){ const out={}; for(const n of names||[]) out[n]=await permissions.state(n); return out; },
  async manage(){}
};

/* ---------------- cerebro: API de Claude (SDK oficial) ---------------- */
let anthropicMod = null;
async function client(){
  const key = Claves.get().claude;
  if(!key) throw {code:"not_granted", message:"Falta tu clave de la API de Claude (Yo → Ajustes → App propia)."};
  if(!anthropicMod) anthropicMod = await import("https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.135.0/+esm");
  const Anthropic = anthropicMod.default;
  return { Anthropic, c: new Anthropic({ apiKey:key, dangerouslyAllowBrowser:true, maxRetries:2 }) };
}
function toMessages(input){
  const turns = typeof input==="string" ? [{role:"user", content:input}] : input.map(t=>({role:t.role, content:String(t.content)}));
  // La primera instrucción del usuario es el contexto de Mila: va como system.
  let system = null;
  if(turns.length>1 && turns[0].role==="user") system = turns.shift().content;
  const msgs = [];
  for(const t of turns){ const last=msgs[msgs.length-1]; if(last && last.role===t.role) last.content += "\n\n"+t.content; else msgs.push({...t}); }
  if(msgs[0]?.role!=="user") msgs.unshift({role:"user", content:"(continúa)"});
  return {system, msgs};
}
function mapErr(e, Anthropic){
  if(e?.code) return e;
  if(e?.name==="AbortError" || e instanceof (Anthropic?.APIUserAbortError||class{})) return {code:"cancelled", message:"Detenido"};
  if(Anthropic && e instanceof Anthropic.AuthenticationError) return {code:"not_granted", message:"Tu clave de la API de Claude no es válida."};
  if(Anthropic && e instanceof Anthropic.PermissionDeniedError) return {code:"not_granted", message:"Tu clave no tiene permiso para este modelo."};
  if(Anthropic && e instanceof Anthropic.RateLimitError) return {code:"rate_limited", message:"Demasiadas solicitudes o sin saldo en tu cuenta de la API."};
  if(Anthropic && e instanceof Anthropic.BadRequestError) return {code:"invalid_request", message:String(e.message||"Solicitud inválida")};
  if(Anthropic && e instanceof Anthropic.APIConnectionError) return {code:"upstream_error", message:"Sin conexión con Claude."};
  return {code:"upstream_error", message:String(e?.message||e)};
}
async function sample(input, opts={}){
  const {Anthropic, c} = await client();
  const k = Claves.get();
  const model = k.modelo || "claude-opus-5-5";
  const effort = opts.modelTier==="quick" ? "low" : opts.modelTier==="complex" ? "high" : "medium";
  const {system, msgs} = toMessages(input);
  const tools = (opts.tools||[]).map(t=>({ name:t.name, description:t.description, input_schema: t.inputSchema || {type:"object", properties:{}} }));
  const byName = Object.fromEntries((opts.tools||[]).map(t=>[t.name,t]));
  let text = "", stop = null, rounds = 0;
  try{
    while(rounds++ < 8){
      const req = { model, max_tokens:8000, messages:msgs, output_config:{effort}, cache_control:{type:"ephemeral"} };
      if(system) req.system = system;
      if(tools.length) req.tools = tools;
      // Respaldo del lado del servidor si el modelo rechaza una solicitud (Opus/Sonnet); Haiku no lo admite.
      const usesFallback = /opus|sonnet/.test(model);
      const msg = usesFallback
        ? await c.beta.messages.create({ ...req, betas:["server-side-fallback-2026-07-01"], fallbacks:"default" }, {signal:opts.signal})
        : await c.messages.create(req, {signal:opts.signal});
      stop = msg.stop_reason;
      const part = msg.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      if(part){ text = text ? text+"\n\n"+part : part; opts.onText?.({text, delta:part}); }
      if(stop==="refusal") throw {code:"refused", message:"Claude no puede ayudar con eso."};
      if(stop==="pause_turn"){ msgs.push({role:"assistant", content:msg.content}); continue; }
      const uses = msg.content.filter(b=>b.type==="tool_use");
      if(stop!=="tool_use" || !uses.length) break;
      if(stop==="max_tokens") break;
      msgs.push({role:"assistant", content:msg.content});
      const results = await Promise.all(uses.map(async u=>{
        const t = byName[u.name];
        try{
          if(!t) throw new Error("Herramienta desconocida: "+u.name);
          const out = await t.execute(u.input||{}, {signal: opts.signal || new AbortController().signal});
          return {type:"tool_result", tool_use_id:u.id, content: typeof out==="string" ? out : JSON.stringify(out ?? {ok:true}).slice(0,32000)};
        }catch(err){ return {type:"tool_result", tool_use_id:u.id, is_error:true, content:"Error: "+(err?.message||err?.code||String(err))}; }
      }));
      msgs.push({role:"user", content:results});
    }
  }catch(e){ const m = mapErr(e, Anthropic); if(text) m.text=text; throw m; }
  if(!text.trim()) throw {code:"empty_completion", message:"Sin respuesta"};
  return { text, truncated: stop==="max_tokens", modelTierApplied: opts.modelTier||"default" };
}
sample.json = async (input, opts={}) => {
  const suffix = "\n\nResponde solo con el JSON pedido, sin texto adicional.";
  const inp = typeof input==="string" ? input+suffix : [...input.slice(0,-1), {...input[input.length-1], content: input[input.length-1].content+suffix}];
  const {text} = await sample(inp, opts);
  const tryParse = s => { try{ return JSON.parse(s); }catch{ return undefined; } };
  let v = tryParse(text.trim());
  if(v===undefined){ const m=text.match(/```(?:json)?\s*([\s\S]*?)```/); if(m) v=tryParse(m[1]); }
  if(v===undefined){ const a=Math.min(...["{","["].map(ch=>{ const i=text.indexOf(ch); return i<0?Infinity:i; })), b=Math.max(text.lastIndexOf("}"), text.lastIndexOf("]")); if(a<b) v=tryParse(text.slice(a,b+1)); }
  if(v===undefined) throw {code:"invalid_json", message:"Respuesta sin JSON", text};
  return v;
};
sample.limits = async () => ({ maxPromptBytes:262144, tools:{maxCount:20} });

/* ---------------- Google Calendar y Drive (OAuth de Google, sin servidor) ---------------- */
export const Google = {
  token:null, exp:0, tc:null,
  async load(){
    if(window.google?.accounts?.oauth2) return;
    await new Promise((res,rej)=>{ const s=document.createElement("script"); s.src="https://accounts.google.com/gsi/client"; s.onload=res; s.onerror=()=>rej({code:"server_unavailable", message:"No cargó el inicio de sesión de Google"}); document.head.appendChild(s); });
  },
  SCOPES:["https://www.googleapis.com/auth/calendar.events","https://www.googleapis.com/auth/drive.file","https://www.googleapis.com/auth/drive.appdata","https://www.googleapis.com/auth/spreadsheets"],
  scope:"", oyentes:new Set(),
  valido(){ return !!this.token && Date.now() < this.exp-60000 && this.SCOPES.every(s=>this.scope.includes(s)); },
  faltan(){ return this.SCOPES.filter(s=>!this.scope.includes(s)); },
  async ensure(){
    if(this.valido()) return this.token;
    const cid = Claves.get().googleClientId;
    if(!cid) throw {code:"server_not_connected", message:"Falta el ID de cliente de Google (Yo → Ajustes → App propia)."};
    await this.load();
    return new Promise((res,rej)=>{
      this.tc = google.accounts.oauth2.initTokenClient({ client_id:cid, scope:this.SCOPES.join(" "), include_granted_scopes:true,
        callback:r=>{ if(r.error) return rej({code:"approval_required", message:r.error_description||r.error});
          this.token=r.access_token; this.exp=Date.now()+Number(r.expires_in||3600)*1000; this.scope=String(r.scope||"");
          try{ localStorage.setItem("mila-gtok", JSON.stringify([this.token,this.exp,this.scope])); localStorage.setItem("mila-gok","1"); }catch{}
          for(const f of this.oyentes) try{ f(); }catch{}
          if(!this.SCOPES.every(s=>this.scope.includes(s))) return rej({code:"approval_required", message:"Faltó marcar algún permiso de Google (Calendar, Drive o Sheets). Vuelve a tocar Conectar y marca todas las casillas."});
          res(this.token); setTimeout(()=>Sync.run().catch(()=>{}), 50); },
        error_callback:e=>rej({code:"approval_required", message:e?.type==="popup_closed"?"Cerraste la ventana de Google.":e?.type==="popup_failed_to_open"?"Tu navegador bloqueó la ventana de Google. Permite ventanas emergentes para esta página.":(e?.message||"Permiso de Google cancelado")}) });
      this.tc.requestAccessToken({prompt:""});
    });
  },
  async api(url, init={}){
    const t = await this.ensure();
    const r = await fetch(url, {...init, headers:{...(init.headers||{}), Authorization:"Bearer "+t}});
    if(r.status===401){ this.token=null; try{ localStorage.removeItem("mila-gtok"); }catch{} throw {code:"needs_reauth", message:"Tu sesión de Google venció. Toca Conectar otra vez."}; }
    if(r.status===204) return {};
    const j = await r.json().catch(()=>({}));
    if(!r.ok){
      const m = j?.error?.message||("Error "+r.status);
      if(/Sheets API has not been used|sheets\.googleapis\.com.*disabled|SERVICE_DISABLED/i.test(m) && /sheets/i.test(url+m)) throw {code:"sheets_disabled", message:"Falta activar «Google Sheets API» en tu proyecto de Google Cloud (APIs y servicios → Biblioteca → Google Sheets API → Habilitar). Luego espera 2 minutos."};
      throw {code:"tool_error", status:r.status, message:m};
    }
    return j;
  }
};
try{ const [t,e,s]=JSON.parse(localStorage.getItem("mila-gtok")||sessionStorage.getItem("mila-gtok")||"[]"); if(t && e>Date.now()){ Google.token=t; Google.exp=e; Google.scope=s||""; } }catch{}

/* ---------------- Tu hoja «Finanzas_Personales_2026» (Google Sheets API) ----------------
   Escribe cada gasto o ingreso en la pestaña del mes, dentro del bloque correcto
   (Ingresos: Fecha/Monto/Fuente; Gastos: Concepto/Monto/Categoria/Detalles/Fecha/Método de Pago),
   en la primera fila vacía antes de «Total». Si el bloque está lleno, inserta una fila
   para que las sumas de la hoja la incluyan. */
const MESES_H = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
const nrm = s => String(s??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
const colL = i => String.fromCharCode(65+i);
export const Hoja = {
  info:null, // {id, tabs:[{title,sheetId}], cats:[], metodos:[]}
  idDe(link){ const m=String(link||"").match(/\/d\/([a-zA-Z0-9_-]{20,})/) || String(link||"").match(/^([a-zA-Z0-9_-]{30,})$/); return m?m[1]:null; },
  url(id, a1){ return `https://sheets.googleapis.com/v4/spreadsheets/${id}${a1?"/values/"+encodeURIComponent(a1):""}`; },
  async cargar(id){
    if(this.info?.id===id) return this.info;
    const j = await Google.api(`https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=properties.title,sheets.properties(title,sheetId)`);
    const tabs = (j.sheets||[]).map(s=>({title:s.properties.title, sheetId:s.properties.sheetId}));
    let cats=[], metodos=[];
    const cat = tabs.find(t=>/catalog/i.test(nrm(t.title)));
    if(cat){ const v = await Google.api(this.url(id, `'${cat.title}'!A1:B80`)); const rows=v.values||[]; cats=rows.slice(1).map(r=>r[0]).filter(Boolean); metodos=rows.slice(1).map(r=>r[1]).filter(Boolean); }
    this.info = {id, titulo:j.properties?.title||"", tabs, cats, metodos};
    return this.info;
  },
  tabDe(info, fecha){
    const [y,m] = fecha.split("-").map(Number); const mes=MESES_H[m-1];
    return info.tabs.find(t=>{ const s=t.title.toUpperCase().replace(/\s+/g,""); return s.startsWith(mes) && s.includes(String(y)); })
        || null;
  },
  // Lee la pestaña y ubica los bloques
  async leer(id, tab){
    const v = await Google.api(this.url(id, `'${tab.title}'!A1:H200`)+"?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=SERIAL_NUMBER");
    const rows = v.values||[];
    const cell = (r,c) => rows[r]?.[c];
    const bloque = (clave, otro) => {
      let hr=-1, cols={};
      for(let r=0;r<rows.length;r++){ const row=rows[r]||[]; const i=row.findIndex(x=>nrm(x)===clave); if(i>=0 && !(otro && hr>=0)){ hr=r; row.forEach((x,c)=>{ const n=nrm(x); if(n) cols[n]=c; }); break; } }
      if(hr<0) return null;
      const c0 = Math.min(...Object.values(cols));
      let fin = rows.length; // fila del «Total» o del siguiente encabezado
      for(let r=hr+1;r<Math.max(rows.length, hr+2);r++){ const a=nrm(cell(r,c0)); if(a.startsWith("total") || a==="gastos" || a==="ingresos" || a==="concepto" || a==="fecha"){ fin=r; break; } }
      return {hr, cols, c0, fin};
    };
    return { rows, ing: bloque("fuente"), gas: bloque("concepto") };
  },
  serialAFecha(n){ const d=new Date(Date.UTC(1899,11,30)+Math.round(Number(n))*86400000); return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`; },
  fechaASerial(s){ const [y,m,d]=s.split("-").map(Number); return Math.round((Date.UTC(y,m-1,d)-Date.UTC(1899,11,30))/86400000); },
  valores(b, mov){
    const out = []; const put=(names,val)=>{ for(const n of names){ if(b.cols[n]!==undefined){ out.push([b.cols[n], val]); return; } } };
    if(mov.tipo==="ingreso"){ put(["fecha"], this.fechaASerial(mov.fecha)); put(["monto"], mov.monto); put(["fuente"], mov.fuenteHoja||mov.fuente||mov.metodo||""); }
    else { put(["concepto"], mov.concepto); put(["monto"], mov.monto); put(["categoria","categoría"], mov.catHoja||mov.categoria||""); put(["detalles","detalle"], mov.detalles||""); put(["fecha"], this.fechaASerial(mov.fecha)); put(["metodo de pago","metodo","método de pago"], mov.metodoHoja||mov.metodo||""); }
    return out;
  },
  async escribirFila(id, tab, row, vals, fmtFecha){
    const data = vals.map(([c,v])=>({range:`'${tab.title}'!${colL(c)}${row+1}`, values:[[v]]}));
    await Google.api(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchUpdate`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({valueInputOption:"RAW", data})});
    if(fmtFecha!=null){ // que la fecha se vea como fecha aunque la celda no tenga formato
      await Google.api(`https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({requests:[{repeatCell:{range:{sheetId:tab.sheetId, startRowIndex:row, endRowIndex:row+1, startColumnIndex:fmtFecha, endColumnIndex:fmtFecha+1}, cell:{userEnteredFormat:{numberFormat:{type:"DATE", pattern:"dd/mm/yyyy"}}}, fields:"userEnteredFormat.numberFormat"}}]})}).catch(()=>{});
    }
  },
  async agregar(id, mov){
    const info = await this.cargar(id);
    const tab = this.tabDe(info, mov.fecha); if(!tab) throw {code:"sin_pestana", message:`Tu hoja no tiene pestaña para ${MESES_H[Number(mov.fecha.slice(5,7))-1]} ${mov.fecha.slice(0,4)}.`};
    const L = await this.leer(id, tab); const b = mov.tipo==="ingreso" ? L.ing : L.gas;
    if(!b) throw {code:"sin_bloque", message:`No encontré el bloque de ${mov.tipo==="ingreso"?"Ingresos":"Gastos"} en «${tab.title}».`};
    const usadas = Object.values(b.cols);
    let row = -1;
    for(let r=b.hr+1; r<b.fin; r++){ if(usadas.every(c=>L.rows[r]?.[c]===undefined || L.rows[r][c]==="")){ row=r; break; } }
    if(row<0){ // bloque lleno: inserta una fila antes del total
      row = b.fin;
      await Google.api(`https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({requests:[{insertDimension:{range:{sheetId:tab.sheetId, dimension:"ROWS", startIndex:row, endIndex:row+1}, inheritFromBefore:true}}]})});
    }
    const vals = this.valores(b, mov);
    await this.escribirFila(id, tab, row, vals, b.cols.fecha ?? null);
    return {tab:tab.title, fila:row+1, firma:this.firma(mov)};
  },
  firma(m){ return [m.tipo, m.fecha, Number(m.monto).toFixed(2), nrm(m.tipo==="ingreso"?(m.fuenteHoja||m.fuente||m.metodo):m.concepto)].join("|"); },
  // Busca la fila de un movimiento ya enviado (las filas pueden moverse si se insertan otras)
  async ubicar(id, ref){
    const info = await this.cargar(id); const tab = info.tabs.find(t=>t.title===ref.tab); if(!tab) return null;
    const L = await this.leer(id, tab); const [tipo, fecha, monto, txt] = ref.firma.split("|");
    const b = tipo==="ingreso" ? L.ing : L.gas; if(!b) return null;
    const cand = r => { const row=L.rows[r]||[]; const f=row[b.cols.fecha]; const mo=Number(row[b.cols.monto]); const t=nrm(row[tipo==="ingreso"?b.cols.fuente:b.cols.concepto]);
      return Math.abs(mo-Number(monto))<0.005 && (f===undefined || f==="" || this.serialAFecha(f)===fecha || typeof f==="string") && t===txt; };
    if(cand(ref.fila-1)) return {tab, b, row:ref.fila-1};
    for(let r=b.hr+1; r<b.fin; r++) if(cand(r)) return {tab, b, row:r};
    return null;
  },
  async borrar(id, ref){
    const u = await this.ubicar(id, ref); if(!u) return false;
    const vals = Object.values(u.b.cols).map(c=>[c, ""]);
    await this.escribirFila(id, u.tab, u.row, vals, null); return true;
  },
  async actualizar(id, ref, mov){
    const u = await this.ubicar(id, ref);
    if(!u || u.tab.title!==this.tabDe(this.info, mov.fecha)?.title){ if(u) await this.borrar(id, ref); return this.agregar(id, mov); }
    await this.escribirFila(id, u.tab, u.row, this.valores(u.b, mov), u.b.cols.fecha ?? null);
    return {tab:u.tab.title, fila:u.row+1, firma:this.firma(mov)};
  },
  // Trae los movimientos que ya están en la hoja (para verlos en Mila)
  async leerTodo(id, anio){
    const info = await this.cargar(id); const out=[];
    for(const tab of info.tabs){
      const s=tab.title.toUpperCase().replace(/\s+/g,""); const mi=MESES_H.findIndex(m=>s.startsWith(m)); if(mi<0 || !s.includes(String(anio))) continue;
      const L = await this.leer(id, tab);
      const mesStr = `${anio}-${String(mi+1).padStart(2,"0")}`;
      const fechaDe = v => typeof v==="number" ? this.serialAFecha(v) : (()=>{ const m=String(v||"").match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/); return m ? `${m[3].length===2?"20"+m[3]:m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}` : null; })();
      for(const [tipo,b] of [["ingreso",L.ing],["gasto",L.gas]]){ if(!b) continue;
        for(let r=b.hr+1;r<b.fin;r++){ const row=L.rows[r]||[]; const monto=Number(row[b.cols.monto]); if(!(monto>0)) continue;
          let fecha = fechaDe(row[b.cols.fecha]); if(!fecha || !fecha.startsWith(mesStr)) fecha = fecha && fecha.slice(0,4)==String(anio) ? fecha : mesStr+"-01";
          const m = tipo==="ingreso" ? {tipo, monto, fecha, fuenteHoja:String(row[b.cols.fuente]??""), concepto:String(row[b.cols.fuente]??"Ingreso")}
                                     : {tipo, monto, fecha, concepto:String(row[b.cols.concepto]??"Gasto"), catHoja:String(row[b.cols.categoria]??""), detalles:String(row[b.cols.detalles]??""), metodoHoja:String(row[b.cols["metodo de pago"]]??"")};
          out.push({...m, hoja:{tab:tab.title, fila:r+1, firma:this.firma(m)}}); } }
    }
    return out;
  }
};

/* ---------------- Voz de Google (Text-to-Speech, voces Chirp 3 HD) ---------------- */
export const VozGoogle = {
  async sintetizar(texto, voz){
    const k = Claves.get(); if(!k.gtts) throw new Error("Falta tu clave de Google Text-to-Speech.");
    const name = voz || k.gVoice || "es-US-Chirp3-HD-Aoede";
    const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize?key="+encodeURIComponent(k.gtts), {method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({input:{text:texto}, voice:{languageCode:name.split("-").slice(0,2).join("-"), name}, audioConfig:{audioEncoding:"MP3", speakingRate:1}})});
    const j = await r.json().catch(()=>({}));
    if(!r.ok){ const m=j?.error?.message||("error "+r.status); throw new Error(/has not been used|disabled/i.test(m) ? "Activa «Cloud Text-to-Speech API» en tu proyecto de Google Cloud (y la facturación)." : /API key not valid/i.test(m) ? "La clave de Google no es válida." : /billing/i.test(m) ? "Google pide activar la facturación del proyecto para usar esta voz." : m); }
    const bin = atob(j.audioContent); const buf = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
    return buf.buffer;
  }
};
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Lima";
const rfc = s => new Date(s).toISOString();
const CAL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const TOOLS = {
  "Google Calendar": {
    async list_events(i){ const q=new URLSearchParams({timeMin:rfc(i.startTime), timeMax:rfc(i.endTime), singleEvents:"true", orderBy:"startTime", maxResults:String(i.pageSize||250)}); if(i.pageToken) q.set("pageToken", i.pageToken);
      const j=await Google.api(CAL+"?"+q); return {events:(j.items||[]).map(e=>({...e, conferenceUrl:e.hangoutLink||e.conferenceData?.entryPoints?.find(x=>x.entryPointType==="video")?.uri})), nextPageToken:j.nextPageToken}; },
    async create_event(i){ const body={summary:i.summary, description:i.description||"", location:i.location||"",
        start: i.allDay ? {date:String(i.startTime).slice(0,10)} : {dateTime:rfc(i.startTime), timeZone:TZ}, end: i.allDay ? {date:String(i.endTime).slice(0,10)} : {dateTime:rfc(i.endTime), timeZone:TZ},
        reminders: i.overrideReminders ? {useDefault:false, overrides:i.overrideReminders} : {useDefault:true}, transparency: i.availability==="AVAILABILITY_FREE" ? "transparent" : "opaque"};
      if(i.extendedProperties) body.extendedProperties = i.extendedProperties;
      return Google.api(CAL, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)}); },
    async update_event(i){ const body={}; if(i.summary) body.summary=i.summary;
      if(i.startTime) body.start = i.allDay ? {date:String(i.startTime).slice(0,10)} : {dateTime:rfc(i.startTime), timeZone:TZ};
      if(i.endTime) body.end = i.allDay ? {date:String(i.endTime).slice(0,10)} : {dateTime:rfc(i.endTime), timeZone:TZ};
      if(i.description!==undefined) body.description=i.description; if(i.location!==undefined) body.location=i.location;
      if(i.extendedProperties) body.extendedProperties=i.extendedProperties; if(i.overrideReminders) body.reminders={useDefault:false, overrides:i.overrideReminders};
      return Google.api(CAL+"/"+encodeURIComponent(i.eventId), {method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)}); },
    async delete_event(i){ return Google.api(CAL+"/"+encodeURIComponent(i.eventId), {method:"DELETE"}); }
  },
  "Google Drive": {
    async create_file(i){ const b="mila"+Date.now(); const meta={name:i.title, mimeType:"application/vnd.google-apps.spreadsheet"};
      const body=`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: ${i.contentMimeType||"text/csv"}\r\n\r\n${i.textContent||""}\r\n--${b}--`;
      const j=await Google.api("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {method:"POST", headers:{"Content-Type":"multipart/related; boundary="+b}, body});
      return {id:j.id, viewUrl:j.webViewLink}; }
  }
};
const mcp = {
  async callTool(server, tool, input){ const f=TOOLS[server]?.[tool]; if(!f) throw {code:"not_in_manifest", message:`${server}/${tool} no disponible`}; const payload=await f(input||{}); return {content:[{type:"text", text:JSON.stringify(payload)}], payload}; },
  watchTool(){ return ()=>{}; }, async invalidate(){}, async listTools(){ return {servers:Object.keys(TOOLS).map(s=>({server:s, authStatus:Google.valido()?"connected":"unknown", tools:Object.keys(TOOLS[s]).map(n=>({name:n, description:""}))}))}; },
  async server(name){ return TOOLS[name]; }
};

/* ---------------- window.claude ---------------- */
window.claude = {
  standalone: true,
  use(name){
    const k = Claves.get();
    const caps = { db, user, permissions, sample: k.claude ? sample : null, mcp: k.googleClientId ? mcp : null };
    return Promise.resolve(caps[name] ?? null);
  }
};
window.MilaApp = { Claves, LocalDB, Google, Sync, Hoja, VozGoogle };
// Al volver a la página o cada 2 minutos, trae lo que hayas hecho en otro dispositivo.
document.addEventListener("visibilitychange", ()=>{ if(!document.hidden && Google.valido() && Date.now()-Sync.ultima>20000) Sync.run().catch(()=>{}); });
setInterval(()=>{ if(!document.hidden && Google.valido()) Sync.run().catch(()=>{}); }, 120000);
if(Google.valido()) setTimeout(()=>Sync.run().catch(()=>{}), 800);
