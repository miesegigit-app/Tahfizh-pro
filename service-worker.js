// ==========================================
// FILE: service-worker.js
// FUNGSI: Service Worker untuk kapabilitas PWA Native (Offline & Caching)
// ==========================================

const CACHE_NAME = 'tahfizhpro-enterprise-v1';

// Daftar file inti yang akan disimpan di memori HP (Cache)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './guru.html',
  './admin.html',
  './manifest.json',
  './firebase-config.js'
];

// 1. EVENT INSTALL: Menyimpan aset penting ke dalam cache lokal perangkat
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Menyimpan Kerangka Aplikasi (App Shell)...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. EVENT ACTIVATE: Membersihkan cache versi lama jika ada pembaruan aplikasi
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. EVENT FETCH: Strategi Jaringan (Mencari di memori HP dulu, jika tidak ada baru pakai internet)
self.addEventListener('fetch', (event) => {
  // Melewati request yang bukan GET (seperti POST/PUT ke database Firebase)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Jika file sudah ada di memori HP, langsung tampilkan (sangat cepat)
        if (response) {
          return response;
        }

        // Jika tidak ada di memori, ambil dari internet
        return fetch(event.request).then(
          function(networkResponse) {
            // Jangan simpan cache jika respon bermasalah
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Simpan salinan file baru ke dalam cache HP pengguna
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(() => {
            // Logika ketika pengguna benar-benar offline dan file tidak ada di cache
            console.log('[Service Worker] Anda sedang offline.');
        });
      })
  );
});