import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const firebaseConfig = window.firebaseConfig;
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const SUPABASE_URL = "https://jcfizceoycwdvpqpwhrj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const dashboardDiv = document.getElementById('dashboard-content');

function formatRupiah(angka) {
  return angka == null ? '-' : angka.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
}

function renderPembelianList(pembelian) {
  if (!dashboardDiv) return;
  if (!pembelian.length) {
    dashboardDiv.innerHTML = '<div class="text-gray-400 italic">Belum ada riwayat pembelian.</div>';
    return;
  }
  dashboardDiv.innerHTML = pembelian.map(item => `
    <div class="bg-blue-50 border border-blue-200 rounded-xl shadow p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div class="flex-1 text-left">
        <div class="font-semibold text-blue-700 text-lg mb-1">${item.nama_kursus || '-'} </div>
        <div class="text-gray-600 text-sm mb-1">Tanggal: ${item.waktu_pembelian ? new Date(item.waktu_pembelian).toLocaleString('id-ID') : '-'}</div>
        <div class="text-gray-600 text-sm mb-1">Harga: <span class="font-bold">${formatRupiah(item.harga)}</span></div>
        <div class="text-gray-600 text-sm mb-1">Metode: ${item.payment_method || '-'}</div>
        <div class="text-gray-600 text-sm mb-1">Status: <span class="font-bold ${item.status_pembayaran === 'PAID' ? 'text-green-600' : 'text-red-600'}">${item.status_pembayaran}</span></div>
      </div>
    </div>
  `).join('');
}

async function fetchPembelian(uid) {
  dashboardDiv.innerHTML = '<div class="text-gray-400 italic">Memuat riwayat pembelian...</div>';
  const { data, error } = await supabase
    .from('pembelian_kursus')
    .select('*')
    .eq('user_uid', uid)
    .eq('status_pembayaran', 'PAID')
    .order('waktu_pembelian', { ascending: false });
  if (error) {
    ('Supabase error:', error); // Debug error detail
    dashboardDiv.innerHTML = '<div class="text-red-500">Gagal memuat data pembelian.</div>';
    return;
  }
  renderPembelianList(data || []);
}

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = '/login';
    return;
  }
  fetchPembelian(user.uid);
});
