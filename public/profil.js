import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = window.firebaseConfig;
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const profileDiv = document.getElementById('profile-info');

onAuthStateChanged(auth, async (user) => {
  if (user && user.email) {
    try {
      // Ambil data user dari Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        profileDiv.innerHTML = `
          <div class="mb-2"><b>Email:</b> ${user.email}</div>
          <div class="mb-2"><b>Nama:</b> ${data.nama || '-'} </div>
          <div class="mb-2"><b>Role:</b> ${data.role || '-'} </div>
          <button id="logout-btn" class="mt-4 px-6 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-bold transition-all">Logout</button>
        `;
      } else {
        // Nama otomatis dari email sebelum @, role '-'
        let namaAuto = '-';
        if (typeof user.email === 'string' && user.email.includes('@')) {
          namaAuto = user.email.split('@')[0];
        }
        profileDiv.innerHTML = `
          <div class="mb-2"><b>Email:</b> ${user.email}</div>
          <div class="mb-2"><b>Nama:</b> ${namaAuto}</div>
          <div class="mb-2"><b>Role:</b> -</div>
          <button id="logout-btn" class="mt-4 px-6 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-bold transition-all">Logout</button>
        `;
      }
      document.getElementById('logout-btn').onclick = async () => {
        await auth.signOut();
        window.location.href = "/login";
      };
    } catch (err) {
      profileDiv.innerHTML = '<div class="text-red-600">Terjadi error saat memuat profil.</div>';
      console.error('Error load profil:', err);
    }
  } else {
    profileDiv.innerHTML = '<div class="text-red-600">User belum login atau data user tidak valid.</div>';
    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  }
});
