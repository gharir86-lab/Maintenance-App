var CACHE='maint-v1';
var FILES=['./','./index.html','./manifest.json','./icon.svg'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k===CACHE?null:caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch',function(e){
  e.respondWith(caches.match(e.request).then(function(r){
    return r || fetch(e.request).then(function(res){
      var copy=res.clone();
      caches.open(CACHE).then(function(c){ try{ c.put(e.request,copy); }catch(err){} });
      return res;
    }).catch(function(){ return caches.match('./index.html'); });
  }));
});
