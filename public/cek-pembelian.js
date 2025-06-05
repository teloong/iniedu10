// cek-pembelian.js
// Script untuk menyembunyikan tombol "Beli" jika user sudah membeli kursus
// Menggunakan Firebase Auth dan Supabase

// cek-pembelian.js
// Script untuk cek status pembelian kursus dengan Firebase Auth dan Supabase
// Hanya gunakan import module, tidak ada deklarasi ganda!

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jcfizceoycwdvpqpwhrj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA";

const auth = getAuth();
let supabase = null; // Deklarasi hanya satu kali untuk seluruh file

// Listener perubahan login user
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken();
    // Inisialisasi Supabase client dengan JWT Firebase
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    cekPembelianDanUpdateTombol(user);
  } else {
    supabase = null;
    cekPembelianDanUpdateTombol(null);
  }
});

// Fungsi utama untuk update UI tombol berdasarkan status pembelian
async function cekPembelianDanUpdateTombol(user) {
  if (!user) return;
  const beliButtons = document.querySelectorAll('[data-id-kursus]');
  const aksesButtons = document.querySelectorAll('[data-akses-id-kursus]');
  if (!beliButtons.length && !aksesButtons.length) return;
  // Disable semua tombol beli sebelum pengecekan selesai
  beliButtons.forEach(btn => {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
    btn.setAttribute('aria-disabled', 'true');
  });
  aksesButtons.forEach(btn => {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
    btn.setAttribute('aria-disabled', 'true');
    btn.classList.add('locked');
    btn.removeEventListener('click', btn._lockedHandler || (()=>{}));
    btn._lockedHandler = null;
  });
  if (!supabase) {
    console.error('Supabase belum diinisialisasi karena user belum login.');
    return;
  }
  // Query tanpa .eq('user_uid', user.uid) karena sudah dibatasi oleh policy RLS
  const { data, error } = await supabase
    .from('pembelian_kursus')
    .select('id_kursus');
  const boughtIds = (data || []).map(row => String(row.id_kursus));
  console.log('DEBUG UID:', user ? user.uid : null, 'Bought IDs:', boughtIds, 'Supabase error:', error);
  beliButtons.forEach(btn => {
    const id = btn.getAttribute('data-id-kursus');
    if (boughtIds.some(bid => bid == id)) {
      const warning = document.createElement('span');
      warning.className = 'mt-2 px-5 py-2 rounded bg-red-100 text-red-600 font-semibold block text-center border border-red-300';
      warning.innerText = 'Anda sudah pernah membeli kursus ini.';
      btn.parentNode.replaceChild(warning, btn);
    } else {
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
      btn.removeAttribute('aria-disabled');
    }
  });
  aksesButtons.forEach(btn => {
    const id = btn.getAttribute('data-akses-id-kursus');
    if (boughtIds.some(bid => bid == id)) {
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
      btn.removeAttribute('aria-disabled');
      btn.classList.remove('locked');
      btn.removeEventListener('click', btn._lockedHandler || (()=>{}));
      btn._lockedHandler = null;
    } else {
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
      btn.setAttribute('aria-disabled', 'true');
      btn.classList.add('locked');
      const lockedHandler = function(e) {
        e.preventDefault();
        alert('Silakan beli kursus terlebih dahulu untuk mengakses materi.');
      };
      btn.removeEventListener('click', btn._lockedHandler || (()=>{}));
      btn.addEventListener('click', lockedHandler);
      btn._lockedHandler = lockedHandler;
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken();
    // Inisialisasi Supabase client dengan JWT Firebase
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    cekPembelianDanUpdateTombol(user);
  } else {
    supabase = null;
    cekPembelianDanUpdateTombol(null);
  }
});

async function cekPembelianDanUpdateTombol(user) {
  if (!user) return;
  const beliButtons = document.querySelectorAll('[data-id-kursus]');
  const aksesButtons = document.querySelectorAll('[data-akses-id-kursus]');
  if (!beliButtons.length && !aksesButtons.length) return;
  // Disable semua tombol beli sebelum pengecekan selesai
  beliButtons.forEach(btn => {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
    btn.setAttribute('aria-disabled', 'true');
  });
  aksesButtons.forEach(btn => {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
    btn.setAttribute('aria-disabled', 'true');
    btn.classList.add('locked');
    btn.removeEventListener('click', btn._lockedHandler || (()=>{}));
    btn._lockedHandler = null;
  });
  if (!supabase) {
    console.error('Supabase belum diinisialisasi karena user belum login.');
    return;
  }
  // Query tanpa .eq('user_uid', user.uid) karena sudah dibatasi oleh policy RLS
  const { data, error } = await supabase
    .from('pembelian_kursus')
    .select('id_kursus');
  const boughtIds = (data || []).map(row => String(row.id_kursus));
  console.log('DEBUG UID:', user ? user.uid : null, 'Bought IDs:', boughtIds, 'Supabase error:', error);
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
  aksesButtons.forEach(btn => {
    const id = btn.getAttribute('data-akses-id-kursus');
    if (boughtIds.some(bid => bid == id)) {
      // Sudah dibeli, tombol aktif
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
      btn.removeAttribute('aria-disabled');
      btn.classList.remove('locked');
      btn.removeEventListener('click', btn._lockedHandler || (()=>{}));
      btn._lockedHandler = null;
    } else {
      // Belum dibeli, tombol terkunci
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
      btn.setAttribute('aria-disabled', 'true');
      btn.classList.add('locked');
      // Handler alert hanya jika belum dibeli
      const lockedHandler = function(e) {
        e.preventDefault();
        alert('Silakan beli kursus terlebih dahulu untuk mengakses materi.');
      };
      btn.removeEventListener('click', btn._lockedHandler || (()=>{}));
      btn.addEventListener('click', lockedHandler);
      btn._lockedHandler = lockedHandler;
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
