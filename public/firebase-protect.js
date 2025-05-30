import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Konfigurasi Firebase Anda, pastikan nilai-nilainya sesuai dengan project Firebase Anda
document.addEventListener('DOMContentLoaded', () => {
  const firebaseConfig = {
    apiKey: "AIzaSyAlxYWD4bCwpoKEErXDX1_4AZC9wzQTkwA",
    authDomain: "iniedu.firebaseapp.com",
    projectId: "iniedu",
    storageBucket: "iniedu.firebasestorage.app",
    messagingSenderId: "743403637628",
    appId: "1:743403637628:web:15b40396e94c8b91ce32f9",
    measurementId: "G-P2NBXXWM7T"
  };

  // Cegah inisialisasi ulang
  let app;
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    app = initializeApp(firebaseConfig);
  }
  const auth = getAuth(app);
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "/login";
    }
  });
});
