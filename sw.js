const CACHE='yakyulife-shell-v1';
const CORE=[
  './','./index.html','./css/style.css','./css/mobile-pwa.css','./src/main.js','./src/ui/mobile-pwa.js','./manifest.webmanifest',
  './assets/app-icon-180.png','./assets/app-icon-192.png','./assets/app-icon-512.png','./assets/favicon-64.png','./assets/wordmark-cream.png','./assets/wordmark-dark.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return res;}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(hit=>{
    const net=fetch(req).then(res=>{
      if(res&&res.status===200){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
      return res;
    }).catch(()=>hit);
    return hit||net;
  }));
});
