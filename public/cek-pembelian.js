// cek-pembelian.js
// Script untuk menyembunyikan tombol "Beli" jika user sudah membeli kursus
// Menggunakan Firebase Auth dan Supabase

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const firebaseConfig = window.firebaseConfig;
const supabaseUrl = "https://jcfizceoycwdvpqpwhrj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA";
const supabase = createClient(supabaseUrl, supabaseKey);

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
const auth = getAuth(app);

async function cekPembelianDanUpdateTombol(user) {
  if (!user) return;
  const beliButtons = document.querySelectorAll('[data-id-kursus]');
  if (!beliButtons.length) return;
  // Disable semua tombol beli sebelum pengecekan selesai
  beliButtons.forEach(btn => {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
    btn.setAttribute('aria-disabled', 'true');
  });
  const { data, error } = await supabase
    .from('pembelian_kursus')
    .select('id_kursus')
    .eq('user_uid', user.uid);
  const boughtIds = (data || []).map(row => String(row.id_kursus));
  beliButtons.forEach(btn => {
    const id = btn.getAttribute('data-id-kursus');
    if (boughtIds.some(bid => bid == id)) {
      const warning = document.createElement('span');
      warning.className = 'mt-2 px-5 py-2 rounded bg-red-100 text-red-600 font-semibold block text-center border border-red-300';
      warning.innerText = 'Anda sudah pernah membeli kursus ini.';
      btn.parentNode.replaceChild(warning, btn);
    } else {
      // Enable tombol beli jika belum dibeli
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
      btn.removeAttribute('aria-disabled');
    }
  });
}


onAuthStateChanged(auth, (user) => {
  cekPembelianDanUpdateTombol(user);
});

// Tambahkan event listener custom agar bisa update real-time setelah pembayaran
window.addEventListener('pembelian:berhasil', async function() {
  const user = auth.currentUser;
  await cekPembelianDanUpdateTombol(user);
});
