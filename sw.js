// ========================================
// sw.js - Service Worker para OFFLINE
// ========================================

const CACHE_NAME = 'habits-v8';
const urlsToCache = [
    './',
    './index.html',
    './supermercado.html',
    './style.css',
    './app.js',
    './supermercado.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './offline.html'
];

// ===== INSTALACIÓN =====
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ Cacheando archivos...');
                return cache.addAll(urlsToCache)
                    .then(() => self.skipWaiting());
            })
            .catch(err => console.error('❌ Error en caché:', err))
    );
    caches.open(CACHE_NAME).then(cache => {
    cache.keys().then(keys => {
        console.log('Archivos cacheados:', keys);
    });
});
});

// ===== ACTIVACIÓN =====
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Eliminando caché antiguo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ===== FETCH =====
self.addEventListener('fetch', event => {
    console.log('📥 Solicitud:', event.request.url);

    event.respondWith(
        caches.match(event.request)
            .then(response => {

                if (response) {
                    console.log('✅ Desde caché:', event.request.url);
                    return response;
                }

                console.log('🌐 Desde red:', event.request.url);

                return fetch(event.request)
                    .catch(() => {

                    console.log(
                        '❌ OFFLINE:',
                        event.request.url,
                        'MODE:',
                        event.request.mode
                    );

                    if (event.request.mode === 'navigate') {
                        console.log('📄 Entregando index.html desde caché');
                        return caches.match('./index.html');
                    }

                    return caches.match('./offline.html');
                })
            })
    );
    console.log(
    '📥',
    event.request.url,
    'MODE:',
    event.request.mode
);
});