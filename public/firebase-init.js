// Inisialisasi global Firebase hanya sekali setelah dependensi siap
console.log('DEBUG: firebase-init.js aktif');

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
    console.log('DEBUG: Firebase berhasil diinisialisasi');
  } else {
    // Debug status polling
    console.log('DEBUG: Menunggu dependensi Firebase siap...', {
      firebase: window.firebase,
      firebaseConfig: window.firebaseConfig,
      authType: typeof window.firebase?.auth,
      apps: window.firebase?.apps
    });
    setTimeout(tryInitFirebase, 100);
  }
}

tryInitFirebase();

