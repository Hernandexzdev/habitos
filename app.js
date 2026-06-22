// ========================================
// sw.js - Service Worker para OFFLINE (CORREGIDO)
// ========================================

const CACHE_NAME = 'habits-v6';
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
    console.log('✅ Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ Cacheando archivos...');
                return cache.addAll(urlsToCache)
                    .then(() => {
                        console.log('✅ Archivos cacheados correctamente');
                        return self.skipWaiting();
                    });
            })
            .catch(err => {
                console.error('❌ Error al cachear:', err);
            })
    );
});

// ===== ACTIVACIÓN =====
self.addEventListener('activate', event => {
    console.log('✅ Service Worker: Activando...');
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
        }).then(() => {
            console.log('✅ Service Worker activado');
            return self.clients.claim();
        })
    );
});

// ===== FETCH (CON FILTRO PARA EVITAR ERRORES) =====
self.addEventListener('fetch', event => {
    const request = event.request;
    
    // ✅ IGNORAR SOLICITUDES QUE NO SE PUEDEN CACHEAR
    // Ignorar extensiones de Chrome, chrome-extension://, etc.
    if (request.url.startsWith('chrome-extension://')) {
        return;
    }
    
    // Ignorar solicitudes a extensiones de navegador
    if (request.url.includes('extension')) {
        return;
    }
    
    // Ignorar solicitudes que no son HTTP/HTTPS
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(request)
                    .then(networkResponse => {
                        // Solo cachear respuestas exitosas
                        if (networkResponse && networkResponse.status === 200) {
                            const clone = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    try {
                                        cache.put(request, clone);
                                    } catch (error) {
                                        // Ignorar errores al cachear
                                        console.log('⚠️ No se pudo cachear:', request.url);
                                    }
                                })
                                .catch(() => {
                                    // Ignorar errores
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Si falla la red, devolver página offline
                        if (request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('./offline.html');
                        }
                        return new Response('Error: Recurso no disponible offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// ===== MENSAJES (para comunicación con la app) =====
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});