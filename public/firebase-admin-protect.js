import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

// Fungsi untuk load konfigurasi dari /firebase-config.js
async function loadFirebaseConfig() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = '/firebaseConfig.js';
    script.onload = () => resolve(window.firebaseConfig);
    document.head.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const firebaseConfig = await loadFirebaseConfig();

  let app;
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    app = initializeApp(firebaseConfig);
  }
  const auth = getAuth(app);
  const db = getFirestore(app);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/login";
    } else {
      // Cek role admin di Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists() || userSnap.data().role !== "admin") {
        alert("Anda tidak memiliki akses admin!");
        window.location.href = "/";
      }
    }
  });
});