// ==========================================
// FILE: service-worker.js
// FUNGSI: PWA Cache Manager & Auto-Update Handler (Enterprise Grade)
// ==========================================

const CACHE_NAME = 'tahfizhpro-enterprise-v1.0.0';

// Daftar aset inti aplikasi yang wajib tersedia saat offline
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/guru.html',
    '/admin.html',
    '/master-developer.html',
    '/logo.png',
    '/frame.png',
    '/manifest.json'
];

// ==========================================
// 1. INSTALL EVENT - Caching App Shell
// ==========================================
self.addEventListener('install', (event) => {
    // Memaksa service worker baru untuk langsung mengambil alih tanpa menunggu tab ditutup
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Menyimpan App Shell ke Cache...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// ==========================================
// 2. ACTIVATE EVENT - Cleanup Old Caches
// ==========================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    // Hapus cache versi lama yang tidak cocok dengan CACHE_NAME saat ini
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Menghapus cache usang:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Berhasil diaktifkan dan siap melayani.');
            // Segera kendalikan semua client (tab browser) yang terbuka
            return self.clients.claim(); 
        })
    );
});

// ==========================================
// 3. FETCH EVENT - Smart Caching Strategy
// ==========================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // PENGECUALIAN PENTING: Jangan pernah melakukan intercept/cache pada koneksi API Firestore/Firebase
    // Firestore memiliki sistem persistent-offline memory-nya sendiri.
    if (url.hostname.includes('firestore.googleapis.com') || 
        url.hostname.includes('identitytoolkit.googleapis.com') || 
        url.hostname.includes('firebase')) {
        return;
    }

    // STRATEGI 1: NETWORK-FIRST UNTUK NAVIGASI HTML
    // Tujuannya agar setiap kali ada Push Deploy / Update dari God Mode, browser selalu menarik UI terbaru.
    if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Jika sukses mengambil dari jaringan (online), simpan salinannya ke cache
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    // Jika gagal (offline), kembalikan versi terakhir yang ada di cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // STRATEGI 2: CACHE-FIRST UNTUK ASET STATIS (Gambar, Ikon)
    // Tujuannya agar aplikasi memuat dengan sangat cepat, menghemat kuota data, dan menghindari 깜kedipan layar (flicker).
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Kembalikan dari cache jika ada
            }
            
            // Jika tidak ada di cache, ambil dari jaringan
            return fetch(event.request).then((response) => {
                // Pastikan respons valid sebelum disimpan ke cache
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            }).catch(() => {
                // Ignore failure untuk aset statis yang gagal dimuat (misal offline)
            });
        })
    );
});

// ==========================================
// 4. MESSAGE EVENT - Remote Cache Wipe (God Mode Command)
// ==========================================
self.addEventListener('message', (event) => {
    // Perintah standar untuk memaksa update Service Worker
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    // Perintah khusus dari sistem God Mode jika terjadi force update mayor
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((cacheNames) => {
            cacheNames.forEach((cache) => {
                caches.delete(cache);
            });
            console.log('[Service Worker] Seluruh cache UI telah dibersihkan secara paksa via perintah sistem.');
        });
    }
});