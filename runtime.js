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

/* ---------------- db local con la misma forma que el db de claude.ai ---------------- */
const DBKEY = "mila-db";
let tree = {}; try{ tree = JSON.parse(localStorage.getItem(DBKEY)||"{}"); }catch{ tree = {}; }
const listeners = new Set();
let saveT = null;
function persist(){ clearTimeout(saveT); saveT = setTimeout(()=>{ try{ localStorage.setItem(DBKEY, JSON.stringify(tree)); }catch(e){ console.error("No se pudo guardar", e); } }, 60); }
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
    async set(data){ tree[path] = clone(data); persist(); notify(); },
    async update(data){ if(tree[path]===undefined) throw {code:"invalid_argument", message:"El documento no existe"}; tree[path] = merge(tree[path], data); persist(); notify(); },
    async delete(){ delete tree[path]; persist(); notify(); },
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
  importar(prefix, entries){ for(const [p,d] of entries) tree[prefix+p] = clone(d); persist(); notify(); },
  borrarTodo(){ tree = {}; persist(); notify(); }
};

/* ---------------- user / permissions ---------------- */
const user = { id: async()=>"local", me: async()=>({id:"local", name:"", guest:false}), isOwner: async()=>true, canEdit: async()=>true, can: async()=>true, profiles: async()=>({}) };
const permissions = {
  async state(name){ if(String(name).startsWith("mcp:")) return Google.token ? "granted" : (Claves.get().googleClientId ? "prompt" : "unavailable"); return "granted"; },
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
  async ensure(){
    if(this.token && Date.now() < this.exp-60000) return this.token;
    const cid = Claves.get().googleClientId;
    if(!cid) throw {code:"server_not_connected", message:"Falta el ID de cliente de Google (Yo → Ajustes → App propia)."};
    await this.load();
    return new Promise((res,rej)=>{
      this.tc = google.accounts.oauth2.initTokenClient({ client_id:cid, scope:"https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file",
        callback:r=>{ if(r.error) return rej({code:"approval_required", message:r.error_description||r.error}); this.token=r.access_token; this.exp=Date.now()+Number(r.expires_in||3600)*1000; try{ sessionStorage.setItem("mila-gtok", JSON.stringify([this.token,this.exp])); }catch{} res(this.token); },
        error_callback:e=>rej({code:"approval_required", message:e?.message||"Permiso de Google cancelado"}) });
      this.tc.requestAccessToken({prompt:""});
    });
  },
  async api(url, init={}){
    const t = await this.ensure();
    const r = await fetch(url, {...init, headers:{...(init.headers||{}), Authorization:"Bearer "+t}});
    if(r.status===401){ this.token=null; throw {code:"needs_reauth", message:"Tu sesión de Google venció."}; }
    if(r.status===204) return {};
    const j = await r.json().catch(()=>({}));
    if(!r.ok) throw {code:"tool_error", message:j?.error?.message||("Error "+r.status)};
    return j;
  }
};
try{ const [t,e]=JSON.parse(sessionStorage.getItem("mila-gtok")||"[]"); if(t && e>Date.now()){ Google.token=t; Google.exp=e; } }catch{}
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Lima";
const rfc = s => new Date(s).toISOString();
const CAL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const TOOLS = {
  "Google Calendar": {
    async list_events(i){ const q=new URLSearchParams({timeMin:rfc(i.startTime), timeMax:rfc(i.endTime), singleEvents:"true", orderBy:"startTime", maxResults:String(i.pageSize||250)}); if(i.pageToken) q.set("pageToken", i.pageToken);
      const j=await Google.api(CAL+"?"+q); return {events:(j.items||[]).map(e=>({...e, conferenceUrl:e.hangoutLink||e.conferenceData?.entryPoints?.find(x=>x.entryPointType==="video")?.uri})), nextPageToken:j.nextPageToken}; },
    async create_event(i){ const body={summary:i.summary, description:i.description||"", location:i.location||"", start:{dateTime:rfc(i.startTime), timeZone:TZ}, end:{dateTime:rfc(i.endTime), timeZone:TZ},
        reminders: i.overrideReminders ? {useDefault:false, overrides:i.overrideReminders} : {useDefault:true}, transparency: i.availability==="AVAILABILITY_FREE" ? "transparent" : "opaque"};
      return Google.api(CAL, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)}); },
    async update_event(i){ const body={}; if(i.summary) body.summary=i.summary; if(i.startTime) body.start={dateTime:rfc(i.startTime), timeZone:TZ}; if(i.endTime) body.end={dateTime:rfc(i.endTime), timeZone:TZ};
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
  watchTool(){ return ()=>{}; }, async invalidate(){}, async listTools(){ return {servers:Object.keys(TOOLS).map(s=>({server:s, authStatus:Google.token?"connected":"unknown", tools:Object.keys(TOOLS[s]).map(n=>({name:n, description:""}))}))}; },
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
window.MilaApp = { Claves, LocalDB, Google };
