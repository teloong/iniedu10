import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
