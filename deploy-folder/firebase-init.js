// Inisialisasi global Firebase hanya sekali setelah dependensi siap

// ISI KONFIGURASI FIREBASE ANDA DI SINI!
window.firebaseConfig = {
  apiKey: "AIzaSyAlxYWD4bCwpoKEErXDX1_4AZC9wzQTkwA",
  authDomain: "iniedu.firebaseapp.com",
  projectId: "iniedu",
  storageBucket: "iniedu.firebasestorage.app",
  messagingSenderId: "743403637628",
  appId: "1:743403637628:web:15b40396e94c8b91ce32f9",
  measurementId: "G-P2NBXXWM7T"
};

function tryInitFirebase() {
  // Pastikan dependensi sudah siap
  if (
    window.firebase &&
    window.firebaseConfig &&
    typeof window.firebase.auth === 'function' &&
    !window.firebase.apps?.length
  ) {
    window.firebase.initializeApp(window.firebaseConfig);
    window.firebase.auth().setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
    window._firebaseReady = true;
  } else {
    setTimeout(tryInitFirebase, 100);
  }
}

tryInitFirebase();

