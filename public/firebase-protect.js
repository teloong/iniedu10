import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Fungsi untuk load konfigurasi dari /firebase-config.js
async function loadFirebaseConfig() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = '/firebase-config.js';
    script.onload = () => resolve(window.firebaseConfig);
    document.head.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Ambil konfigurasi dari endpoint dinamis
  const firebaseConfig = await loadFirebaseConfig();
  console.log("Config di protect.js:", firebaseConfig);

  // Cegah inisialisasi ulang
  let app;
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    app = initializeApp(firebaseConfig);
  }
  const auth = getAuth(app);

  onAuthStateChanged(auth, (user) => {
    console.log("User di protect.js:", user);
    if (!user) {
      window.location.href = "/login";
    }
  });
});