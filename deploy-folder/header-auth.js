document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  const profileBtn = document.getElementById('profile-btn');
  const authAction = document.getElementById('auth-action');
  if (authAction) authAction.classList.remove('hidden');
  const userId = localStorage.getItem('user_id');
  if (userId) {
    if (loginBtn) loginBtn.classList.add('hidden');
    if (profileBtn) profileBtn.classList.remove('hidden');
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (profileBtn) profileBtn.classList.add('hidden');
  }
});
