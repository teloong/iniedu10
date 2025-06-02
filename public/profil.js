import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = window.firebaseConfig;
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
    document.getElementById('logout-btn').onclick = async () => {
      await auth.signOut();
      window.location.href = "/login";
    };
  } else {
    window.location.href = "/login";
  }
});
