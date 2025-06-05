console.log('DEBUG: pembayaran.js aktif');

function initPembayaran() {
  console.log("DEBUG: initPembayaran terpanggil");
  const form = document.getElementById('formPembayaran');
  if (!form) {
    alert('ERROR: formPembayaran tidak ditemukan di halaman!');
    console.error('ERROR: formPembayaran tidak ditemukan di halaman!');
    console.log("DEBUG: formPembayaran belum ditemukan, polling ulang...");
    setTimeout(initPembayaran, 100);
    return;
  }
  console.log('DEBUG: formPembayaran ditemukan, memasang event listener submit...');
  console.log("DEBUG: Elemen form ditemukan:", form);
  const emailInput = document.getElementById('email');
  const submitBtn = form.querySelector('button[type="submit"]');
  console.log("DEBUG: Tombol submit ditemukan:", submitBtn);
  submitBtn.disabled = true; // Disable tombol submit sampai login terdeteksi

  let currentUser = null;

  if (window.firebase && window.firebase.auth) {
    console.log("DEBUG: Firebase Auth ditemukan, memasang event listener onAuthStateChanged...");
    window.firebase.auth().onAuthStateChanged(function(user) {
      console.log("DEBUG: onAuthStateChanged terpanggil", user);
      if (!user) {
        alert('Anda harus login terlebih dahulu untuk melakukan pembayaran!');
        window.location.href = '/login';
      } else {
        currentUser = user;
        emailInput.value = user.email;
        emailInput.readOnly = true;
        submitBtn.disabled = false; // Enable tombol submit setelah login terdeteksi
        console.log("DEBUG: User login terdeteksi, tombol submit di-enable");
      }
    });
  }

  console.log("DEBUG: Memasang event listener submit pada form...");
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log("DEBUG: Form submit tertangkap");
    
    // Cek login ulang langsung dari Firebase Auth
    const user = window.firebase.auth().currentUser;
    if (!user) {
      alert('Anda harus login terlebih dahulu!');
      window.location.href = '/login';
      return;
    }
    const user_uid = user.uid;
    const email = user.email;
    const namaLengkap = document.getElementById('namaLengkap').value;
    const kursus = form.getAttribute('data-nama-kursus');
    const harga = parseInt(form.getAttribute('data-harga'));
    const waktu = new Date().toISOString();
    const supabaseUrl = 'https://jcfizceoycwdvpqpwhrj.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    console.log("DEBUG: Akan insert ke Supabase", {
      user_uid, namaLengkap, email, kursus, harga, waktu
    });

    try {
      const { data, error } = await supabase.from('pembelian_kursus').insert([
        {
          user_uid,
          nama_lengkap: namaLengkap,
          email,
          nama_kursus: kursus,
          harga,
          status_pembayaran: 'PAID',
          waktu_pembelian: waktu
        }
      ]);

      if (error) {
        alert('Gagal menyimpan data: ' + (error.message || JSON.stringify(error)));
        console.error('DEBUG: Error insert Supabase', error);
        return;
      }
      alert('Pembayaran berhasil!');
      console.log('DEBUG: Insert sukses Supabase', data);
      // Redirect atau reset form jika perlu
    } catch (err) {
      alert('Gagal (exception): ' + (err.message || err));
      console.error('DEBUG: Exception insert Supabase', err);
    }
  });
}

document.addEventListener('DOMContentLoaded', initPembayaran);