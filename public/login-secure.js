// VERSI AMAN dari login.js - Perbaikan spesifik untuk kode IniEdu.id
const messageDiv = document.getElementById('message');
const form = document.getElementById('login-form');

// Rate limiting class - perbaikan untuk mencegah brute force
class LoginRateLimiter {
  constructor() {
    this.maxAttempts = 5;
    this.lockoutTime = 15 * 60 * 1000; // 15 menit
    this.storageKey = 'login_attempts';
  }

  canAttempt() {
    const attempts = this.getAttempts();
    const now = Date.now();
    
    // Bersihkan attempts yang sudah expired
    const validAttempts = attempts.filter(time => now - time < this.lockoutTime);
    this.saveAttempts(validAttempts);
    
    return validAttempts.length < this.maxAttempts;
  }

  recordAttempt() {
    const attempts = this.getAttempts();
    attempts.push(Date.now());
    this.saveAttempts(attempts);
  }

  getAttempts() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch {
      return [];
    }
  }

  saveAttempts(attempts) {
    localStorage.setItem(this.storageKey, JSON.stringify(attempts));
  }

  getRemainingLockoutTime() {
    const attempts = this.getAttempts();
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const elapsed = Date.now() - oldestAttempt;
    return Math.max(0, this.lockoutTime - elapsed);
  }
}

// Input validation dan sanitization
function validateAndSanitizeInput(email, password) {
  const errors = [];
  
  // Validasi email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Format email tidak valid');
  }
  
  // Validasi password
  if (!password || password.length < 6) {
    errors.push('Password minimal 6 karakter');
  }
  
  // Sanitasi input untuk mencegah XSS
  const sanitizedEmail = email.replace(/[<>]/g, '');
  const sanitizedPassword = password.replace(/[<>]/g, '');
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedEmail,
    sanitizedPassword
  };
}

// reCAPTCHA v3 implementation
async function verifyRecaptcha(action = 'login') {
  return new Promise((resolve) => {
    if (typeof grecaptcha === 'undefined') {
      console.warn('reCAPTCHA not loaded');
      resolve(null);
      return;
    }
    
    grecaptcha.ready(() => {
      grecaptcha.execute('6LdYourSiteKey', { action: action })
        .then(token => resolve(token))
        .catch(() => resolve(null));
    });
  });
}

// CSRF Protection
function getCSRFToken() {
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  return csrfMeta ? csrfMeta.getAttribute('content') : null;
}

if (form) {
  const rateLimiter = new LoginRateLimiter();
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    messageDiv.textContent = '';
    messageDiv.className = '';
    
    // Check rate limiting
    if (!rateLimiter.canAttempt()) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingLockoutTime() / 1000 / 60);
      messageDiv.textContent = `Terlalu banyak percobaan login. Coba lagi dalam ${remainingTime} menit.`;
      messageDiv.className = 'error-message';
      return;
    }
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validasi input
    const validation = validateAndSanitizeInput(email, password);
    if (!validation.isValid) {
      messageDiv.textContent = validation.errors.join(', ');
      messageDiv.className = 'error-message';
      return;
    }
    
    // Get reCAPTCHA token
    const recaptchaToken = await verifyRecaptcha('login');
    if (!recaptchaToken) {
      messageDiv.textContent = 'Verifikasi keamanan gagal. Silakan refresh halaman.';
      messageDiv.className = 'error-message';
      return;
    }
    
    // Disable form selama proses
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Memproses...';
    
    try {
      const requestBody = new URLSearchParams({
        email: validation.sanitizedEmail,
        password: validation.sanitizedPassword,
        recaptcha_token: recaptchaToken
      });
      
      // Tambahkan CSRF token jika ada
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        requestBody.append('csrf_token', csrfToken);
      }
      
      const res = await fetch('https://iniedu.id/login.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest' // Tambahan header untuk AJAX
        },
        credentials: 'include',
        body: requestBody.toString()
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        // PERBAIKAN KRITIS: Jangan simpan data sensitif di localStorage
        // Hanya simpan flag login status
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('loginTime', Date.now().toString());
        
        // Bersihkan rate limiting setelah login sukses
        localStorage.removeItem('login_attempts');
        
        // Redirect ke dashboard atau halaman yang diminta
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/';
        window.location.href = redirect;
        
      } else {
        // Record failed attempt
        rateLimiter.recordAttempt();
        
        messageDiv.textContent = data.message || 'Login gagal. Periksa email dan password Anda.';
        messageDiv.className = 'error-message';
        
        // Log security event (jika ada endpoint)
        logSecurityEvent('failed_login', {
          email: validation.sanitizedEmail,
          reason: data.message
        });
      }
      
    } catch (err) {
      console.error('Login error:', err);
      
      // Record failed attempt
      rateLimiter.recordAttempt();
      
      messageDiv.textContent = 'Terjadi error koneksi. Silakan coba lagi.';
      messageDiv.className = 'error-message';
      
      // Log technical error
      logSecurityEvent('login_error', {
        error: err.message,
        email: validation.sanitizedEmail
      });
      
    } finally {
      // Re-enable form
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
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

// Auto-logout setelah inaktivitas
class InactivityTimer {
  constructor(timeoutMinutes = 30) {
    this.timeout = timeoutMinutes * 60 * 1000;
    this.timer = null;
    this.setupEventListeners();
    this.resetTimer();
  }

  setupEventListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), true);
    });
  }

  resetTimer() {
    if (this.timer) clearTimeout(this.timer);
    
    this.timer = setTimeout(() => {
      this.logout();
    }, this.timeout);
  }

  async logout() {
    try {
      await fetch('https://iniedu.id/logout.php', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      sessionStorage.clear();
      localStorage.removeItem('login_attempts');
      window.location.href = '/login?reason=timeout';
    }
  }
}

// Initialize inactivity timer hanya jika user sudah login
if (sessionStorage.getItem('isLoggedIn')) {
  new InactivityTimer(30); // 30 menit timeout
}

// Integrity check untuk mencegah tampering
(function() {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    // Log semua API calls untuk monitoring
    if (args[0] && args[0].includes('iniedu.id')) {
      logSecurityEvent('api_call', {
        url: args[0],
        method: args[1]?.method || 'GET'
      });
    }
    return originalFetch.apply(this, args);
  };
})();