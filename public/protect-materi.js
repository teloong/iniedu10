// protect-materi.js
// Proteksi akses materi: hanya user yang sudah membeli kursus bisa akses
// Ganti ID_KURSUS sesuai materi

('[PROTECT] Script protect-materi.js dimulai');
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// GANTI dengan konfigurasi Firebase Anda!
const firebaseConfig = {
  apiKey: "AIzaSyAlxYWD4bCwpoKEErXDX1_4AZC9wzQTkwA", // contoh, GANTI
  authDomain: "iniedu.firebaseapp.com", // contoh, GANTI
  projectId: "iniedu", // contoh, GANTI
  storageBucket: "iniedu.appspot.com",
  messagingSenderId: "743403637628", // contoh, GANTI
  appId: "1:743403637628:web:15b40396e94c8b91ce32f9" // contoh, GANTI
};
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const SUPABASE_URL = "https://jcfizceoycwdvpqpwhrj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA";

const ID_KURSUS = 1; // GANTI sesuai id kursus materi-digital
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const auth = getAuth();

function blokirAkses() {
  alert("Akses materi hanya untuk user yang sudah membeli kursus ini.\nAnda akan diarahkan kembali ke halaman kursus.");
  window.location.href = "/kursus";
}

onAuthStateChanged(auth, async (user) => {
  ('[PROTECT] onAuthStateChanged', user);

  if (!user) {
    window.location.href = "/login";
    return;
  }
  const { data, error } = await supabase
    .from('pembelian_kursus')
    .select('id_kursus')
    .eq('id_kursus', ID_KURSUS)
    .eq('user_uid', user.uid); // User-spesifik!
  ('[PROTECT] Query result:', data, error);
  if (!data || data.length === 0) {
    blokirAkses();
  } else {
    // Lolos verifikasi, tampilkan konten
    document.body.classList.remove('protected-hide');
  }
});
