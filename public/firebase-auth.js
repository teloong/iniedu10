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

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://jcfizceoycwdvpqpwhrj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function syncUserToSupabase(user) {
  if (!user) return;
  const { uid, email, displayName } = user;
  let namaAuto = displayName;
  if (!namaAuto) {
    if (typeof email === 'string' && email.includes('@')) {
      namaAuto = email.split('@')[0];
    } else {
      namaAuto = '-';
    }
  }
  const { error } = await supabase
    .from('users')
    .upsert([
      {
        uid,
        email,
        display_name: namaAuto
      }
    ], { onConflict: ['uid'] });
  if (error) {
    console.error('Gagal sync user ke Supabase:', error);
  } else {
    console.log('User berhasil di-sync ke Supabase');
  }
}


onAuthStateChanged(auth, (user) => {
  if (user) {
    syncUserToSupabase(user);
    if (formContainer) {
      formContainer.innerHTML = `<div class='text-green-600 font-semibold text-center'>Halo, ${user.email}<br>Anda sudah login.</div><button id=\"logout-btn\" class=\"mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded w-full\">Keluar</button>`;
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.onclick = async () => {
          await signOut(auth);
          window.location.href = "/";
        };
      }
    }
  } else {
    renderForm();
  }
});
