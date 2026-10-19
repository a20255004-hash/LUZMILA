const C = "mila-1792453787";
const SHELL = ["./", "./index.html", "./icon.svg", "./manifest.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
// Tocar una notificaciÃ³n de Mila: abre la app (o la enfoca) y le pasa la respuesta (Hecho / Posponer)
self.addEventListener("notificationclick", e => {
  const n = e.notification; const d = n.data || {}; const accion = e.action || (d.tid ? "abrir" : ""); n.close();
  e.waitUntil((async () => {
    const lista = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const c = lista.find(x => new URL(x.url).origin === location.origin);
    if (c) { await c.focus(); if (d.tid) c.postMessage({ tipo: "coach", accion, tid: d.tid }); return; }
    const url = new URL("./", self.registration.scope).href + (d.tid ? `#coach=${accion}:${d.tid}` : "");
    await self.clients.openWindow(url);
  })());
});
