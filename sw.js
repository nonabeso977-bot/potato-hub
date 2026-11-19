const CACHE_NAME = "potato-hub-shell-v1";
const APP_SHELL = ["./","./index.html","./styles.css","./app.js","./manifest.webmanifest"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));self.clients.claim();});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET"||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}
    return response;
  })));
});
self.addEventListener("push",event=>{
  let data={title:"POTATO HUB",body:"هناك تحديث جديد لإحدى ألعاب مكتبتك.",url:"./"};
  try{if(event.data)data={...data,...event.data.json()};}catch(_){if(event.data)data.body=event.data.text();}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:"./assets/potato.svg",badge:"./assets/potato.svg",data:{url:data.url},tag:data.tag||"potato-hub-update"}));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();const target=event.notification.data?.url||"./";
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const client of list){if("focus" in client)return client.navigate(target).then(c=>c.focus());}
    return clients.openWindow(target);
  }));
});