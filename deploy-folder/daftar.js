const messageDiv = document.getElementById('message');
const form = document.getElementById('register-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Jika ingin tanpa reCAPTCHA, cukup komentar baris di bawah
    // const recaptchaResponse = grecaptcha.getResponse();
    // if (!recaptchaResponse) {
    //   messageDiv.textContent = "Silakan centang reCAPTCHA terlebih dahulu!";
    //   return;
    // }
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const nama = "User"; // Atau ambil dari input jika ada field nama

    try {
      const res = await fetch('https://iniedu.id/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&nama=${encodeURIComponent(nama)}`
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/login'; // Redirect ke login setelah daftar
      } else {
        messageDiv.textContent = data.message;
      }
    } catch (err) {
      messageDiv.textContent = 'Terjadi error koneksi.';
    }
  });
}
