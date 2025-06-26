import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = window.firebaseConfig;
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const formContainer = document.getElementById("firebase-login-form");
const messageDiv = document.getElementById("firebase-login-message");

function renderLoginForm() {
  formContainer.innerHTML = `
    <form id="login-form" class="flex flex-col gap-4">
      <input type="email" id="email" required placeholder="Email" class="border rounded p-2" />
      <input type="password" id="password" required placeholder="Password" class="border rounded p-2" />
      <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-all">Login</button>
    </form>
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
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "/profil";
  } else {
    renderLoginForm();
  }
});
