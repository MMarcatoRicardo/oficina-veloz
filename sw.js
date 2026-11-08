/* Service worker: deixa o app abrindo offline (cache do app shell). */
var CACHE = 'veloz-v6';
var SHELL = [
  './', 'index.html', 'css/styles.css', 'js/data.js', 'js/dev.js', 'js/app.js',
  'manifest.webmanifest', 'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png',
  '404.html', 'js/jogo-404.js', 'assets/img/hero.webp', 'assets/img/hero-sm.webp', 'assets/img/pastilha.webp', 'assets/img/palheta.webp', 'assets/img/mecanico.webp', 'assets/img/elevador.webp'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* Arquivos do próprio site: rede primeiro (sempre a versão nova), cache se estiver offline. */
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (r) { return r || caches.match('index.html'); });
    })
  );
});
