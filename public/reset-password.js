document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reset-password-form');
    const messageDiv = document.getElementById('message');
    const tokenInput = document.getElementById('token');
    const submitBtn = document.getElementById('submit-btn');

    // Ambil token dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        tokenInput.value = token;
    } else {
        messageDiv.textContent = 'Token reset tidak valid atau tidak ditemukan.';
        messageDiv.className = 'mb-4 text-center text-red-500';
        submitBtn.disabled = true;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = '';

        const password = document.getElementById('password').value;
        const confirm_password = document.getElementById('confirm_password').value;

        if (password !== confirm_password) {
            messageDiv.textContent = 'Password dan konfirmasi password tidak cocok.';
            messageDiv.className = 'mb-4 text-center text-red-500';
            return;
        }

        if (password.length < 6) {
            messageDiv.textContent = 'Password minimal harus 6 karakter.';
            messageDiv.className = 'mb-4 text-center text-red-500';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';

        try {
            // Sesuaikan URL ini dengan endpoint backend Anda
                        const response = await fetch('https://iniedu.id/reset_password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: tokenInput.value,
                    password: password
                }),
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.textContent = result.message + ' Anda akan diarahkan ke halaman login.';
                messageDiv.className = 'mb-4 text-center text-green-600';
                form.reset();
                submitBtn.disabled = true;
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else {
                messageDiv.textContent = result.message || 'Terjadi kesalahan. Silakan coba lagi.';
                messageDiv.className = 'mb-4 text-center text-red-500';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Reset Password';
            }
        } catch (error) {
            console.error('Error:', error);
            messageDiv.textContent = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
            messageDiv.className = 'mb-4 text-center text-red-500';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
        }
    });
});
