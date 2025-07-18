// VERSI AMAN dari profil.js - Perbaikan spesifik untuk kode IniEdu.id
const profileDiv = document.getElementById('profile-info');

// PERBAIKAN KRITIS: Jangan ambil data sensitif dari localStorage
// Sekarang data diambil dari server via API yang aman
async function loadUserProfile() {
  try {
    // Cek apakah user sudah login dari sessionStorage (bukan localStorage)
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn) {
      showLoginRequired();
      return;
    }
    
    // Ambil data user dari server (bukan dari localStorage)
    const response = await fetch('https://iniedu.id/get-profile.php', {
      method: 'GET',
      credentials: 'include', // Menggunakan session cookies
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Session expired
        showSessionExpired();
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const userData = await response.json();
    
    if (userData.success && userData.user) {
      displayUserProfile(userData.user);
    } else {
      showProfileError('Gagal memuat profil user');
    }
    
  } catch (error) {
    console.error('Error loading profile:', error);
    showProfileError('Terjadi error saat memuat profil');
  }
}

function displayUserProfile(user) {
  // Sanitasi data untuk mencegah XSS
  const sanitizedName = sanitizeHTML(user.nama || 'Pengguna');
  const sanitizedEmail = sanitizeHTML(user.email || '-');
  
  profileDiv.innerHTML = `
    <div class="space-y-2 text-left">
      <p><strong>Nama:</strong> ${sanitizedName}</p>
      <p><strong>Email:</strong> ${sanitizedEmail}</p>
      <p><strong>Member sejak:</strong> ${formatDate(user.created_at)}</p>
      <p><strong>Status:</strong> <span class="text-green-600">Aktif</span></p>
    </div>
  `;
  
  setupLogoutHandler();
}

function showLoginRequired() {
  profileDiv.innerHTML = `
    <div class="text-red-600 text-center">
      <p>Sesi tidak ditemukan. Anda akan diarahkan ke halaman login.</p>
    </div>
  `;
  setTimeout(() => {
    window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
  }, 2000);
}

function showSessionExpired() {
  profileDiv.innerHTML = `
    <div class="text-orange-600 text-center">
      <p>Sesi Anda telah berakhir. Silakan login kembali.</p>
    </div>
  `;
  
  // Bersihkan session storage
  sessionStorage.clear();
  
  setTimeout(() => {
    window.location.href = "/login?reason=expired";
  }, 2000);
}

function showProfileError(message) {
  profileDiv.innerHTML = `
    <div class="text-red-600 text-center">
      <p>${sanitizeHTML(message)}</p>
      <button onclick="loadUserProfile()" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Coba Lagi
      </button>
    </div>
  `;
}

function setupLogoutHandler() {
  const logoutButton = document.getElementById('logout-btn');
  
  if (logoutButton) {
    // Remove existing event listeners
    logoutButton.replaceWith(logoutButton.cloneNode(true));
    const newLogoutButton = document.getElementById('logout-btn');
    
    newLogoutButton.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Disable button during logout
      newLogoutButton.disabled = true;
      newLogoutButton.textContent = 'Logging out...';
      
      try {
        // Logout dari server
        const response = await fetch('https://iniedu.id/logout.php', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (!result.success) {
          console.warn('Server logout warning:', result.message);
        }
        
        // Log security event
        await logSecurityEvent('user_logout', {
          method: 'manual',
          success: result.success
        });
        
      } catch (error) {
        console.error('Error during logout:', error);
        
        // Log error event
        await logSecurityEvent('logout_error', {
          error: error.message
        });
      } finally {
        // PERBAIKAN: Bersihkan semua data session
        sessionStorage.clear();
        localStorage.removeItem('login_attempts');
        
        // Clear any other app-specific storage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('user_') || key.startsWith('iniedu_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Redirect to login
        window.location.href = "/login?reason=logout";
      }
    });
  }
}

// Utility functions
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '-';
  }
}

// Security event logging
async function logSecurityEvent(eventType, details) {
  try {
    await fetch('https://iniedu.id/security-log.php', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      body: JSON.stringify({
        event_type: eventType,
        details: details,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href
      })
    });
  } catch (err) {
    console.warn('Failed to log security event:', err);
  }
}

// Session validation
async function validateSession() {
  try {
    const response = await fetch('https://iniedu.id/validate-session.php', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (response.status === 401) {
      showSessionExpired();
      return false;
    }
    
    const data = await response.json();
    return data.valid === true;
    
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

// Auto session validation setiap 5 menit
setInterval(async () => {
  const isValid = await validateSession();
  if (!isValid) {
    showSessionExpired();
  }
}, 5 * 60 * 1000); // 5 menit

// Prevent page caching untuk security
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Page loaded from cache, reload to ensure fresh session check
    window.location.reload();
  }
});

// Initialize profile loading
document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
});

// Prevent right-click context menu on sensitive elements
profileDiv.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Detect if page is being viewed in developer tools
let devtools = {
  open: false,
  orientation: null
};

const threshold = 160;

setInterval(() => {
  if (window.outerHeight - window.innerHeight > threshold || 
      window.outerWidth - window.innerWidth > threshold) {
    if (!devtools.open) {
      devtools.open = true;
      logSecurityEvent('devtools_detected', {
        page: 'profile',
        action: 'opened'
      });
    }
  } else {
    if (devtools.open) {
      devtools.open = false;
      logSecurityEvent('devtools_detected', {
        page: 'profile', 
        action: 'closed'
      });
    }
  }
}, 500);

// Prevent copy/paste of sensitive data
document.addEventListener('copy', (e) => {
  const selection = window.getSelection().toString();
  if (selection && profileDiv.contains(window.getSelection().anchorNode)) {
    e.preventDefault();
    logSecurityEvent('copy_attempt', {
      page: 'profile',
      content_length: selection.length
    });
  }
});

// Keyboard shortcuts protection
document.addEventListener('keydown', (e) => {
  // Prevent F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
  if (e.key === 'F12' || 
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.key === 'u') ||
      (e.ctrlKey && e.key === 's')) {
    e.preventDefault();
    logSecurityEvent('keyboard_shortcut_blocked', {
      key: e.key,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey
    });
  }
});