const messageDiv = document.getElementById('message');
const form = document.getElementById('login-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Hapus/komentar baris ini:
    // const recaptchaResponse = grecaptcha.getResponse();
    // if (!recaptchaResponse) {
    //   messageDiv.textContent = "Silakan centang reCAPTCHA terlebih dahulu!";
    //   return;
    // }
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
            const res = await fetch('https://iniedu.id/login.php', { // Diarahkan ke server produksi
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include', // WAJIB untuk session/cookie
        body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user_nama', data.nama);
        localStorage.setItem('user_id', data.id);
        localStorage.setItem('user_email', email); // Simpan email user
        window.location.href = '/';
      } else {
        messageDiv.textContent = data.message;
      }
    } catch (err) {
      messageDiv.textContent = 'Terjadi error koneksi.';
    }
  });
}
