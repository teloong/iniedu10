import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Fungsi untuk load konfigurasi dari /firebaseConfig.js
async function loadFirebaseConfig() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = '/firebaseConfig.js'; // <- perbaiki di sini!
    script.onload = () => resolve(window.firebaseConfig);
    document.head.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const firebaseConfig = await loadFirebaseConfig();
  console.log("Config di protect.js:", firebaseConfig);

  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  const auth = getAuth(app);

  onAuthStateChanged(auth, (user) => {
    console.log("User di protect.js:", user);
    if (!user) {
      window.location.href = "/login";
    }
  });
});