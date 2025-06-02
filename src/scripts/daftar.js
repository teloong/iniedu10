import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

async function loadFirebaseConfig() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = '/firebase-config.js';
    script.onload = () => resolve(window.firebaseConfig);
    document.head.appendChild(script);
  });
}

(async () => {
  const firebaseConfig = await loadFirebaseConfig();
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const messageDiv = document.getElementById('message');
  const form = document.getElementById('register-form');
  if (!form) return;
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
      await createUserWithEmailAndPassword(auth, email, password);
      window.location.href = "/";
    } catch (error) {
      messageDiv.textContent = "Registrasi gagal: " + error.message;
    }
  });
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "/";
    }
  });
})();
