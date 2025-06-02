import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig } from '../lib/firebaseConfig';

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginBtn = document.getElementById('login-btn');
const profileBtn = document.getElementById('profile-btn');

onAuthStateChanged(auth, (user) => {
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
