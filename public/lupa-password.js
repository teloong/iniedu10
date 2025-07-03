document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgot-password-form');
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';

        const email = document.getElementById('email').value;

        try {
            // Sesuaikan URL ini dengan endpoint backend Anda
                        const response = await fetch('https://iniedu.id/request_password_reset.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email }),
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = 'mb-4 text-center text-green-600';
                form.reset();
            } else {
                messageDiv.textContent = result.message || 'Terjadi kesalahan. Silakan coba lagi.';
                messageDiv.className = 'mb-4 text-center text-red-500';
            }
        } catch (error) {
            console.error('Error:', error);
            messageDiv.textContent = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
            messageDiv.className = 'mb-4 text-center text-red-500';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Tautan Reset';
        }
    });
});
