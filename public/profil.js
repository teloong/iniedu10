import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = window.firebaseConfig;
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const profileDiv = document.getElementById('profile-info');

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const SUPABASE_URL = "https://jcfizceoycwdvpqpwhrj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function renderProfile(user) {
  try {
    // Ambil data user dari Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', user.uid)
      .maybeSingle(); // Tidak error jika data tidak ditemukan
    if (error) throw error;
    if (data) {
      profileDiv.innerHTML = `
        <div class="mb-2"><b>Email:</b> ${user.email}</div>
        <div class="mb-2"><b>Nama:</b> ${data.display_name || '-'} </div>
        <div class="mb-2"><b>Role:</b> ${data.role || '-'} </div>
        <button id="logout-btn" class="mt-4 px-6 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-bold transition-all">Logout</button>
      `;
    } else {
      // Data user belum ada di tabel users Supabase
      let namaAuto = '-';
      if (typeof user.email === 'string' && user.email.includes('@')) {
        namaAuto = user.email.split('@')[0];
      }
      profileDiv.innerHTML = `
        <div class="mb-2"><b>Email:</b> ${user.email}</div>
        <div class="mb-2"><b>Nama:</b> ${namaAuto}</div>
        <div class="mb-2"><b>Role:</b> -</div>
        <button id="logout-btn" class="mt-4 px-6 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-bold transition-all">Logout</button>
      `;
    }
    document.getElementById('logout-btn').onclick = async () => {
      await auth.signOut();
      window.location.href = "/login";
    };
    setLogoutHandler();
  } catch (err) {
    profileDiv.innerHTML = '<div class="text-red-600">Terjadi error saat memuat profil.</div>';
    console.error('Error load profil:', err);
  }
}

let isLoggingOut = false;

onAuthStateChanged(auth, async (user) => {
  if (isLoggingOut) return; // Jangan tampilkan alert jika sedang logout
  if (user && user.email) {
    await renderProfile(user);
    // Subscribe realtime ke tabel users milik user login
    const channel = supabase.channel('public:users')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `uid=eq.${user.uid}`
      }, payload => {
        console.log('Realtime perubahan profil user:', payload);
        renderProfile(user);
      })
      .subscribe();
  } else {
    profileDiv.innerHTML = '<div class="text-red-600">User belum login atau data user tidak valid.</div>';
    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  }
});

// Ubah handler logout
function setLogoutHandler() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.onclick = async () => {
      isLoggingOut = true;
      await auth.signOut();
      window.location.href = "/login";
    };
  }
}
// Panggil setLogoutHandler setiap kali renderProfile
// Tambahkan di akhir renderProfile:
// setLogoutHandler();
