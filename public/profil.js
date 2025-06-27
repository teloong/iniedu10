const profileDiv = document.getElementById('profile-info');
const userId = localStorage.getItem('user_id');
const userNama = localStorage.getItem('user_nama');
const userEmail = localStorage.getItem('user_email'); // Pastikan email juga disimpan saat login

function getNamaFromEmail(email) {
  if (!email) return '-';
  return email.split('@')[0];
}

if (!userId) {
  profileDiv.innerHTML = '<div class="text-red-600">User belum login atau data user tidak valid.</div>';
  setTimeout(() => window.location.href = "/login", 1200);
} else {
  const namaFinal = userNama && userNama !== '-' ? userNama : getNamaFromEmail(userEmail);
  profileDiv.innerHTML = `
    <div class="mb-2"><b>Nama:</b> ${namaFinal} </div>
    <button id="logout-btn" class="mt-4 px-6 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-bold transition-all">Logout</button>
  `;
  document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_nama');
    localStorage.removeItem('user_email');
    window.location.href = "/login";
  };
}

let isLoggingOut = false;

onAuthStateChanged(auth, async (user) => {
  if (isLoggingOut) return; // Jangan tampilkan alert jika sedang logout
  if (user && user.email) {
    await renderProfile(user);
    // Subscribe realtime ke tabel users milik user login
    const channel = supabase.channel('public:users')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `uid=eq.${user.uid}`
      }, payload => {
        ('Realtime perubahan profil user:', payload);
        renderProfile(user);
      })
      .subscribe();
  } else {
    profileDiv.innerHTML = '<div class="text-red-600">User belum login atau data user tidak valid.</div>';
    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  }
});

// Ubah handler logout
function setLogoutHandler() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.onclick = async () => {
      isLoggingOut = true;
      await auth.signOut();
      window.location.href = "/login";
    };
  }
}
// Panggil setLogoutHandler setiap kali renderProfile
// Tambahkan di akhir renderProfile:
// setLogoutHandler();
