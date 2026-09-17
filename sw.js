var CACHE='maint-v29';
var FILES=['./','./index.html','./manifest.json','./icon.svg'];
/* the PDF reader is fetched once, then kept, so manuals work with no signal */
var EXTRA=[
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];
self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(FILES).then(function(){
        /* if these fail there is no signal yet - they get cached on first use */
        return Promise.all(EXTRA.map(function(u){
          return c.add(new Request(u,{mode:'cors'})).catch(function(){});
        }));
      });
    }).then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k===CACHE?null:caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET') return;
  var isLib = e.request.url.indexOf('cdnjs.cloudflare.com')>=0;
  if(isLib){
    /* cache first for the library: it never changes and must work offline */
    e.respondWith(
      caches.match(e.request).then(function(r){
        return r || fetch(e.request).then(function(res){
          var copy=res.clone();
          caches.open(CACHE).then(function(c){ try{ c.put(e.request,copy); }catch(err){} });
          return res;
        });
      })
    );
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy=res.clone();
      caches.open(CACHE).then(function(c){ try{ c.put(e.request,copy); }catch(err){} });
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(r){ return r || caches.match('./index.html'); });
    })
  );
});
