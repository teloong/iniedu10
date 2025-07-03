document.addEventListener('DOMContentLoaded', () => {
    const dashboardDiv = document.getElementById('dashboard-content');

    function formatRupiah(angka) {
        return angka == null ? '-' : parseInt(angka).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    }

    function renderPembelianList(pembelian) {
        if (!dashboardDiv) return;
        if (!pembelian || !pembelian.length) {
            dashboardDiv.innerHTML = '<div class="text-gray-400 italic">Selamat datang! Anda belum memiliki riwayat pembelian kursus.</div>';
            return;
        }
        dashboardDiv.innerHTML = `
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Riwayat Pembelian Anda</h2>
            ${pembelian.map(item => `
                <div class="bg-blue-50 border border-blue-200 rounded-xl shadow p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-transform transform hover:scale-105">
                    <div class="flex-1 text-left">
                        <div class="font-bold text-blue-800 text-lg mb-1">${item.nama_kursus || '-'}</div>
                        <div class="text-gray-600 text-sm mb-1">Tanggal: <span class="font-medium">${item.waktu_pembelian ? new Date(item.waktu_pembelian).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '-'}</span></div>
                        <div class="text-gray-600 text-sm mb-1">Harga: <span class="font-bold text-gray-800">${formatRupiah(item.harga)}</span></div>
                        <div class="text-gray-600 text-sm mb-1">Metode: <span class="font-medium">${item.payment_method || '-'}</span></div>
                        <div class="text-gray-600 text-sm mb-1">Status: <span class="font-bold text-green-600">${item.status_pembayaran}</span></div>
                    </div>
                    <a href="/kursus/${item.slug}" class="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-300 text-center">
                        Akses Materi
                    </a>
                </div>
            `).join('')}
        `;
    }

    async function fetchPembelian() {
        if (!dashboardDiv) return;
        dashboardDiv.innerHTML = '<div class="text-gray-400 italic">Memuat riwayat pembelian...</div>';
        try {
            const response = await fetch('https://iniedu.id/get_pembelian_user.php', { credentials: 'include' });
            if (!response.ok) {
                // TES: Redirect dinonaktifkan sementara untuk melihat error sebenarnya.

                // window.location.href = '/login?redirect=/dashboard';
                throw new Error('Sesi tidak ditemukan atau tidak valid.');
            }
            const result = await response.json();
            if (result.success) {
                renderPembelianList(result.data);
            } else {
                throw new Error(result.message || 'Gagal memuat data.');
            }
        } catch (error) {
            dashboardDiv.innerHTML = `<div class="text-red-500">Gagal memuat data pembelian. Silakan coba lagi nanti.</div>`;
        }
    }

    fetchPembelian();
});
