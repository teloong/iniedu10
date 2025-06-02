import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = window.firebaseConfig;
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const messageDiv = document.getElementById('message');
const form = document.getElementById('login-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const recaptchaResponse = grecaptcha.getResponse();
    if (!recaptchaResponse) {
      messageDiv.textContent = "Silakan centang reCAPTCHA terlebih dahulu!";
      return;
    }
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/";
    } catch (error) {
      messageDiv.textContent = "Login gagal: " + error.message;
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "/";
  }
});
