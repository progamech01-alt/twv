// Only cache the public offline page and icons. Never cache navigation, API, auth or private media.
const CACHE='tawanverse-shell-v2.0';
const ASSETS=['/offline.html','/icon-192.png','/icon-512.png','/icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tawanverse-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));return;}if(ASSETS.includes(url.pathname))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));});
