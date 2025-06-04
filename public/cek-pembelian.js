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

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  // Ambil semua tombol beli
  const beliButtons = document.querySelectorAll('[data-id-kursus]');
  if (!beliButtons.length) return;

  // Query pembelian user
  const { data, error } = await supabase
    .from('pembelian_kursus')
    .select('id_kursus')
    .eq('user_uid', user.uid);

  console.log('Cek Pembelian - Data:', data, 'Error:', error);
  const boughtIds = (data || []).map(row => String(row.id_kursus));
  console.log('Cek Pembelian - boughtIds:', boughtIds);

  beliButtons.forEach(btn => {
    const id = btn.getAttribute('data-id-kursus');
    console.log('Cek Pembelian - Button id:', id);
    // Gunakan == agar "2" dan 2 dianggap sama
    if (boughtIds.some(bid => bid == id)) {
      // Ganti tombol dengan badge
      const badge = document.createElement('span');
      badge.className = 'mt-2 px-5 py-2 rounded-full font-semibold bg-green-100 text-green-700 shadow-md';
      badge.innerText = 'Sudah Dibeli';
      btn.parentNode.replaceChild(badge, btn);
    }
  });
});
