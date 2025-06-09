// kursus-button.js
// Mengatur tombol dinamis "Beli"/"Akses Materi" di halaman kursus

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Konfigurasi Firebase dari global
const firebaseConfig = window.firebaseConfig || {
  apiKey: "AIzaSyAlxYWD4bCwpoKEErXDX1_4AZC9wzQTkwA",
  authDomain: "iniedu.firebaseapp.com",
  projectId: "iniedu",
  storageBucket: "iniedu.appspot.com",
  messagingSenderId: "743403637628",
  appId: "1:743403637628:web:15b40396e94c8b91ce32f9",
  measurementId: "G-P2NBXXWM7T"
};
if (!window._firebaseApp) window._firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth();

const SUPABASE_URL = "https://jcfizceoycwdvpqpwhrj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function setButtonLoading(btn) {
  btn.textContent = "Loading...";
  btn.disabled = true;
  btn.classList.remove("bg-gradient-to-r", "from-blue-500", "to-cyan-400", "from-green-500", "to-emerald-400");
}
function setButtonBeli(btn, id) {
  btn.textContent = "Beli";
  btn.disabled = false;
  btn.classList.remove("from-blue-500", "to-cyan-400");
  btn.classList.add("bg-gradient-to-r", "from-green-500", "to-emerald-400");
  btn.onclick = () => window.location.href = `/pembayaran?id_kursus=${id}`;
}
function setButtonAkses(btn, id) {
  btn.textContent = "Akses Materi";
  btn.disabled = false;
  btn.classList.remove("from-green-500", "to-emerald-400");
  btn.classList.add("bg-gradient-to-r", "from-blue-500", "to-cyan-400");
  // Routing ke materi sesuai id kursus
  let materiPath = "/materi-digital";
  if (id == "2") materiPath = "/kursus/simulasi-ujian";
  if (id == "3") materiPath = "/kursus/kelas-menulis";
  btn.onclick = () => window.location.href = materiPath;
}
function setButtonLogin(btn) {
  btn.textContent = "Login untuk Beli";
  btn.disabled = false;
  btn.classList.remove("from-green-500", "to-emerald-400", "from-blue-500", "to-cyan-400");
  btn.classList.add("bg-gradient-to-r", "from-gray-400", "to-gray-500");
  btn.onclick = () => window.location.href = "/login";
}

function setButtonError(btn) {
  btn.textContent = "Error";
  btn.disabled = true;
  btn.classList.remove("from-green-500", "to-emerald-400", "from-blue-500", "to-cyan-400");
  btn.classList.add("bg-gradient-to-r", "from-red-500", "to-pink-400");
}

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll('.btn-kursus');
  buttons.forEach(btn => setButtonLoading(btn));

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      buttons.forEach(btn => setButtonLogin(btn));
      return;
    }
    // Ambil JWT Firebase user dan set ke Supabase agar policy RLS bisa jalan
    try {
      const token = await user.getIdToken();
      // Proses sign-in ke Supabase Auth dengan JWT Firebase agar user muncul di Supabase Auth Users
      await fetch(`${SUPABASE_URL}/auth/v1/token?provider=firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: token })
      });
      if (supabase.auth && typeof supabase.auth.setSession === 'function') {
        await supabase.auth.setSession({ access_token: token, refresh_token: '' }); // supabase-js v2
      }
    } catch (e) {
      console.error('Gagal sign-in ke Supabase Auth:', e);
    }

    // Ambil semua id kursus dari tombol dan pastikan bertipe integer
    const kursusIds = Array.from(document.querySelectorAll('.btn-kursus')).map(btn => btn.getAttribute('data-id-kursus'));
    if (!user) return;
    // Debug: pastikan user.uid sama dengan user_uid di database
    console.log('Firebase user.uid:', user.uid);
    const { data: pembelian, error } = await supabase
      .from('pembelian_kursus')
      .select('id_kursus')
      .in('id_kursus', kursusIds);
    console.log('DEBUG hasil pembelian:', pembelian);
    if (error) {
      ('Gagal cek pembelian:', error);
      buttons.forEach(btn => setButtonError(btn));
      return;
    }
    const boughtIds = pembelian.map(row => String(row.id_kursus));
    buttons.forEach(btn => {
      const id = btn.getAttribute('data-id-kursus');
      if (boughtIds.includes(String(id))) {
        setButtonAkses(btn, id);
      } else {
        setButtonBeli(btn, id);
      }
    });
  });
});
