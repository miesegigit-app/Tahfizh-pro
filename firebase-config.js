// ==========================================
// FILE: firebase-config.js
// FUNGSI: Inisialisasi Database & SaaS Tenant Router
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// 1. KONFIGURASI FIREBASE ANDA
const firebaseConfig = {
  apiKey: "AIzaSyC4KBqM6yMA0Do9Zx64zYYrNMMYh0VA7Hc",
  authDomain: "muthobaah.firebaseapp.com",
  projectId: "muthobaah",
  storageBucket: "muthobaah.firebasestorage.app",
  messagingSenderId: "502582418252",
  appId: "1:502582418252:web:088500cd149989fd69cde9"
};

// 2. INISIALISASI CORE SYSTEM
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ==========================================
// 3. SMART CACHING URL LOGIC (MULTI-TENANT SAAS)
// ==========================================
let appId = null;

// A. Tangkap parameter dari URL (misal: tahfizhpro.my.id?sekolah=alqudwah)
const urlParams = new URLSearchParams(window.location.search);
const paramSekolah = urlParams.get('sekolah');

if (paramSekolah) {
    // Jika ada di URL, bersihkan formatnya (huruf kecil, tanpa spasi/simbol aneh)
    appId = paramSekolah.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    // Simpan ke memori permanen HP/Browser pengguna (Local Storage)
    localStorage.setItem('tahfizhpro_tenant_id', appId);
    
    // UX MAGIC: Hapus '?sekolah=alqudwah' dari address bar agar terlihat profesional dan bersih!
    window.history.replaceState({}, document.title, window.location.pathname);
    
} else {
    // B. Jika tidak ada di URL (Wali murid buka dari bookmark / ketik manual besok harinya)
    // Cek apakah HP ini pernah login sebelumnya
    appId = localStorage.getItem('tahfizhpro_tenant_id');
}

// ==========================================
// --- TAMBAHAN BARU: PENGECUALIAN HALAMAN PUBLIK (WHITELIST) ---
// ==========================================
// Deteksi apakah pengguna sedang berada di halaman yang sifatnya publik 
// (seperti Verifikasi Santri). toLowerCase() digunakan agar kebal dari salah ketik URL.
const currentPath = window.location.pathname.toLowerCase();
const isPublicVerificationPage = currentPath.includes('verifikasisantri');

// C. Sistem Pendeteksi Kehilangan Jejak (Untuk memicu UI "Safety Net" di HTML)
// KITA UBAH DISINI: Halaman tidak akan dikunci jika ini adalah halaman publik!
if (!appId && !isPublicVerificationPage) {
    // Peringatan global bahwa pengguna belum punya kamar
    window.SAAS_TENANT_MISSING = true; 
    console.warn("[SaaS Router] Tenant ID tidak ditemukan. Memicu layar Safety Net...");
} else {
    // Aman! Buka gembok halaman
    window.SAAS_TENANT_MISSING = false;
    
    if (isPublicVerificationPage && !appId) {
        console.log("[SaaS Router] Mode Publik Aktif: Bypass Tenant ID diizinkan untuk verifikasi.");
    } else {
        console.log(`[SaaS Router] Berhasil masuk ke Ruang Lingkup Klien: ${appId}`);
    }
}

// 4. EKSPOR VARIABEL UNTUK DIGUNAKAN SELURUH APLIKASI
export { db, auth, appId };