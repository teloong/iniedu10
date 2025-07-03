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
    const nama = email.split('@')[0]; // Ambil nama dari email

    try {
      const res = await fetch('https://iniedu.id/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include', // WAJIB untuk session/cookie
        body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&nama=${encodeURIComponent(nama)}`
      });
      const data = await res.json();
      // Tampilkan pesan dari server, baik sukses maupun gagal
      messageDiv.textContent = data.message;
      
      // Jika sukses, ubah warna pesan menjadi hijau dan reset form
      if (data.success) {
        messageDiv.style.color = 'green';
        form.reset();
      } else {
        messageDiv.style.color = 'red';
      }
    } catch (err) {
      messageDiv.textContent = 'Terjadi error koneksi.';
    }
  });
}
