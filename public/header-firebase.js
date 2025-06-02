// Pastikan di layout sudah ada CDN berikut sebelum script ini:
// <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>

async function loadFirebaseConfig() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = '/firebaseConfig.js'; // Pastikan nama file config benar
    script.onload = () => resolve(window.firebaseConfig);
    document.head.appendChild(script);
  });
}

(async () => {
  const firebaseConfig = await loadFirebaseConfig();
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const auth = firebase.auth();
  const loginBtn = document.getElementById('login-btn');
  const profileBtn = document.getElementById('profile-btn');
  auth.onAuthStateChanged((user) => {
    const authAction = document.getElementById('auth-action');
    if (authAction) authAction.classList.remove('hidden');
    if (user) {
      if (loginBtn) loginBtn.classList.add('hidden');
      if (profileBtn) profileBtn.classList.remove('hidden');
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (profileBtn) profileBtn.classList.add('hidden');
    }
  });
})();
