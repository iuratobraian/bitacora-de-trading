
const VERSION = '5.0.0-SMART-CACHE'; // Incrementamos versión para forzar limpieza
const CACHE_NAME = `apex-journal-${VERSION}`;

// Archivos críticos para el arranque (App Shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ---------------------------
// 1. INSTALACIÓN
// ---------------------------
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activar inmediatamente sin esperar a que se cierren pestañas
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching App Shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// ---------------------------
// 2. ACTIVACIÓN (Limpieza)
// ---------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Eliminando caché obsoleta:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim(); // Tomar control de los clientes inmediatamente
});

// ---------------------------
// 3. ESTRATEGIAS DE CACHEO
// ---------------------------

// Estrategia: Cache First, falling back to Network
// Ideal para: JS, CSS, Imágenes, Fuentes (Archivos con hash en el nombre)
const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    // Solo cacheamos respuestas válidas
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Si falla red y no hay caché, retornamos error (o placeholder si fuera imagen)
    return new Response('Network error occurred', { status: 408 });
  }
};

// Estrategia: Network First, falling back to Cache
// Ideal para: HTML, Manifest, JSON de datos internos
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, falling back to cache for:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
};

// ---------------------------
// 4. INTERCEPTOR DE PETICIONES
// ---------------------------
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. EXCLUSIONES: APIs Externas (Supabase, Google AI) -> SIEMPRE RED (Network Only)
  // No queremos cachear datos financieros en tiempo real ni respuestas de IA.
  if (url.hostname.includes('supabase') || url.hostname.includes('googleapis')) {
      return; 
  }

  // B. CACHE FIRST: Activos Estáticos (JS, CSS, Imágenes, Fuentes)
  // Dado que usamos Vite, los archivos JS/CSS tienen hashes (ej: index-a1b2.js).
  // Si el contenido cambia, el nombre cambia, así que es seguro cachearlos agresivamente.
  if (
      event.request.destination === 'script' ||
      event.request.destination === 'style' ||
      event.request.destination === 'image' ||
      event.request.destination === 'font' ||
      url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2)$/)
  ) {
      event.respondWith(cacheFirst(event.request));
      return;
  }

  // C. NETWORK FIRST: Navegación (HTML) y Manifiesto
  // Esto es CRÍTICO: Siempre intentamos ir a la red primero para obtener el index.html más nuevo.
  // Si obtenemos un index.html nuevo, este apuntará a los nuevos archivos JS (cache first).
  // Si no hay red, servimos el HTML cacheado para funcionalidad Offline.
  event.respondWith(networkFirst(event.request));
});
