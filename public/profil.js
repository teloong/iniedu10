// Mengambil elemen div untuk menampilkan info profil
const profileDiv = document.getElementById('profile-info');

// Mengambil data pengguna dari localStorage yang diatur oleh sistem login PHP
const userId = localStorage.getItem('user_id');
const userNama = localStorage.getItem('user_nama');
const userEmail = localStorage.getItem('user_email');

// Fungsi sederhana untuk mendapatkan nama dari email jika nama lengkap tidak ada
function getNamaFromEmail(email) {
  if (!email || email.indexOf('@') === -1) return 'Pengguna';
  return email.split('@')[0];
}

// Cek apakah pengguna sudah login dengan memeriksa localStorage
if (!userId) {
  // Jika tidak ada user_id, tampilkan pesan dan redirect ke halaman login
  profileDiv.innerHTML = '<div class="text-red-600">Sesi tidak ditemukan. Anda akan diarahkan ke halaman login.</div>';
  setTimeout(() => window.location.href = "/login", 1500);
} else {
  // Jika login, tampilkan informasi profil
  const namaFinal = userNama && userNama !== 'null' && userNama.trim() !== '' ? userNama : getNamaFromEmail(userEmail);
  
  profileDiv.innerHTML = `
    <div class="space-y-2 text-left">
      <p><strong>Nama:</strong> ${namaFinal}</p>
      <p><strong>Email:</strong> ${userEmail || '-'}</p>
    </div>
    <button id="logout-btn" class="mt-6 px-6 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-bold transition-all">Logout</button>
  `;

  // Tambahkan event listener untuk tombol logout
  const logoutButton = document.getElementById('logout-btn');
  if (logoutButton) {
    logoutButton.onclick = async () => {
      try {
        // Panggil endpoint logout di server untuk menghancurkan sesi
        const response = await fetch('https://iniedu.id/logout.php', {
          method: 'POST',
          credentials: 'include' // Penting untuk mengirim cookie sesi
        });
        const result = await response.json();

        if (result.success) {
          console.log('Sesi server berhasil dihancurkan.');
        } else {
          console.error('Gagal menghancurkan sesi server.');
        }
      } catch (error) {
        console.error('Error saat logout di server:', error);
      } finally {
        // Hapus semua data sesi dari localStorage, terlepas dari hasil server
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_nama');
        localStorage.removeItem('user_email');
        localStorage.removeItem('selectedCourse'); // Hapus juga data kursus yang mungkin nyangkut

        // Arahkan ke halaman login setelah semuanya selesai
        window.location.href = "/login";
      }
    };
  }
}
