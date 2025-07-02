document.addEventListener('DOMContentLoaded', async function() {
  const form = document.getElementById('formPembayaran');
  if (!form) return;

  const emailInput = document.getElementById('email');
  const namaLengkapInput = document.getElementById('nama_lengkap');
  const submitBtn = form.querySelector('button[type="submit"]');
  let currentUserId = null;

  // 1. Ambil data sesi pengguna dari server
  try {
    const response = await fetch('https://iniedu.id/get_user_session.php', { credentials: 'include' });
    const userData = await response.json();

    if (userData.success && userData.isLoggedIn) {
      // Pengguna login, isi form
      emailInput.value = userData.email;
      emailInput.readOnly = true;
      if (userData.nama_lengkap) {
        namaLengkapInput.value = userData.nama_lengkap;
      }
      currentUserId = userData.user_id;
      // Tombol submit diaktifkan oleh skrip inline di pembayaran.astro
    } else {
      // Pengguna tidak login, nonaktifkan form dan arahkan ke login
      const redirectUrl = `/login?redirect_to=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      document.getElementById('pembayaran-info').innerHTML = `<p class="text-red-500">Anda harus login untuk melanjutkan. <a href="${redirectUrl}" class="font-bold underline">Login di sini</a>.</p>`;

      emailInput.readOnly = true;
      namaLengkapInput.readOnly = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Login Dulu';
      submitBtn.onclick = (e) => {
          e.preventDefault();
          window.location.href = redirectUrl;
      };
      return; // Hentikan eksekusi lebih lanjut
    }
  } catch (error) {
    console.error('Gagal mengambil data sesi:', error);
    document.getElementById('pembayaran-info').innerHTML = '<p class="text-red-500">Gagal memuat data sesi Anda. Coba refresh halaman.</p>';
    submitBtn.disabled = true;
    return;
  }

  // 2. Tambahkan event listener untuk submit form
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memproses...';

    const payload = {
        // user_id diambil dari sesi di backend, tidak perlu dikirim dari sini
        email: emailInput.value,
        nama_lengkap: namaLengkapInput.value,
        id_kursus: document.getElementById('id_kursus').value,
        nama_kursus: document.getElementById('nama_kursus').value,
        amount: parseInt(document.getElementById('harga').value, 10)
    };

    // Validasi frontend (user_id sudah divalidasi di backend melalui sesi)
    if (!payload.id_kursus) {
        alert('Error: Data sesi atau kursus tidak lengkap. Silakan coba lagi dari halaman kursus.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Konfirmasi Pembelian';
        return;
    }

    try {
      const res = await fetch('https://iniedu.id/create_invoice.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // PENTING: Kirim cookies sesi ke server
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = data.invoice_url;
      } else {
        alert('Gagal membuat invoice: ' + (data.message || 'Terjadi kesalahan di server.'));
        submitBtn.disabled = false;
        submitBtn.textContent = 'Konfirmasi Pembelian';
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Gagal terhubung ke server. Silakan coba lagi nanti.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Konfirmasi Pembelian';
    }
  });
});
