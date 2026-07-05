// ==========================================
// FILE: firebase-config.js
// FUNGSI: Konfigurasi Terpusat Firebase (Enterprise Standard)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4KBqM6yMA0Do9Zx64zYYrNMMYh0VA7Hc",
  authDomain: "muthobaah.firebaseapp.com",
  projectId: "muthobaah",
  storageBucket: "muthobaah.firebasestorage.app",
  messagingSenderId: "502582418252",
  appId: "1:502582418252:web:088500cd149989fd69cde9"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Namespace Enterprise agar data sinkron antara portal Admin dan Guru
const appIdString = 'tahfizhpro-ent';

// Mengekspor modul agar bisa digunakan di file HTML lainnya
export { app, auth, db, appIdString as appId };