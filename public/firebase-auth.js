import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = window.firebaseConfig;
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
window.auth = auth; // Expose ke global agar bisa diakses dari console

const formContainer = document.getElementById("firebase-auth-form");
const messageDiv = document.getElementById("firebase-auth-message");

function renderForm() {
  formContainer.innerHTML = `
    <form id="login-form" class="flex flex-col gap-4">
      <input type="email" id="email" required placeholder="Email" class="border rounded p-2" />
      <input type="password" id="password" required placeholder="Password" class="border rounded p-2" />
      <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-all">Masuk</button>
      <button type="button" id="register-btn" class="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-2 rounded transition-all">Daftar Baru</button>
    </form>
    <button id="logout-btn" class="hidden mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded w-full">Keluar</button>
  `;

  document.getElementById("login-form").onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      messageDiv.textContent = "Login berhasil!";
      setTimeout(() => {
        window.location.href = "/profil";
      }, 800);
    } catch (err) {
      messageDiv.textContent = err.message;
    }
  };

  document.getElementById("register-btn").onclick = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      messageDiv.textContent = "Registrasi berhasil!";
      setTimeout(() => {
        window.location.href = "/profil";
      }, 800);
    } catch (err) {
      messageDiv.textContent = err.message;
    }
  };

  document.getElementById("logout-btn").onclick = async () => {
    await signOut(auth);
    window.location.href = "/";
  };
}

// Fungsi global untuk ambil JWT Firebase dari console browser
window.getFirebaseToken = async function() {
  if (auth && auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    console.log("JWT Firebase:", token);
    return token;
  } else {
    console.log("User belum login atau auth tidak tersedia");
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    formContainer.innerHTML = `<div class='text-green-600 font-semibold text-center'>Halo, ${user.email}<br>Anda sudah login.</div><button id=\"logout-btn\" class=\"mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded w-full\">Keluar</button>`;
    document.getElementById("logout-btn").onclick = async () => {
      await signOut(auth);
      window.location.href = "/";
    };
  } else {
    renderForm();
  }
});
