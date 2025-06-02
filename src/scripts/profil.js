import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

async function loadFirebaseConfig() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = '/firebase-config.js';
    script.onload = () => resolve(window.firebaseConfig);
    document.head.appendChild(script);
  });
}

(async () => {
  const firebaseConfig = await loadFirebaseConfig();
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const profileDiv = document.getElementById('profile-info');
  onAuthStateChanged(auth, async (user) => {
    if (user) {
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
        const namaAuto = user.email.split('@')[0];
        profileDiv.innerHTML = `
          <div class="mb-2"><b>Email:</b> ${user.email}</div>
          <div class="mb-2"><b>Nama:</b> ${namaAuto}</div>
          <div class="mb-2"><b>Role:</b> -</div>
          <button id="logout-btn" class="mt-4 px-6 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-bold transition-all">Logout</button>
        `;
      }
      // Tambahkan event logout
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.onclick = async () => {
          await auth.signOut();
          window.location.href = "/login";
        };
      }
    } else {
      window.location.href = "/login";
    }
  });
})();
