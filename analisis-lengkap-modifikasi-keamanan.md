# Analisis LENGKAP Modifikasi Keamanan IniEdu.id

## 🚨 TIDAK HANYA FRONTEND! Inilah Semua yang Perlu Dimodifikasi:

### **A. FRONTEND MODIFICATIONS (Yang Sudah Saya Buat)**

#### **1. User Authentication Files**
- ✅ `public/login-secure.js` - Perbaikan login user
- ✅ `public/profil-secure.js` - Perbaikan profil user  
- ✅ `src/layouts/Layout-secure.astro` - Security headers & CSP

#### **2. Admin Authentication Files (BELUM DIBUAT - AKAN SAYA BUAT)**
- ❌ `src/components/JwtAuth-secure.astro` - Perbaikan admin auth
- ❌ `src/pages/admin-login-secure.astro` - Perbaikan admin login
- ❌ `public/admin-blog-secure.js` - Perbaikan admin blog
- ❌ Dan 10+ file admin lainnya yang menggunakan localStorage

---

## **B. BACKEND MODIFICATIONS (Yang Perlu Anda Buat)**

### **1. User Authentication Backend**

#### **🔧 MODIFIKASI login.php**
```php
<?php
session_start();
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Rate limiting
function checkRateLimit($ip, $email) {
    $key = "rate_limit_" . md5($ip . $email);
    $attempts = (int)($_SESSION[$key] ?? 0);
    $last_attempt = $_SESSION[$key . '_time'] ?? 0;
    
    if (time() - $last_attempt > 900) { // Reset setelah 15 menit
        $attempts = 0;
    }
    
    if ($attempts >= 5) {
        http_response_code(429);
        die(json_encode(['success' => false, 'message' => 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.']));
    }
    
    $_SESSION[$key] = $attempts + 1;
    $_SESSION[$key . '_time'] = time();
}

// CSRF Protection
function validateCSRFToken() {
    if (!isset($_POST['csrf_token']) || !isset($_SESSION['csrf_token'])) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $_POST['csrf_token']);
}

// reCAPTCHA Verification
function verifyRecaptcha($token) {
    $secret = 'YOUR_RECAPTCHA_SECRET_KEY';
    $response = file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret={$secret}&response={$token}");
    $data = json_decode($response);
    return $data->success && $data->score >= 0.5;
}

// Input validation dan sanitization
function validateInput($email, $password) {
    $errors = [];
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Format email tidak valid';
    }
    
    if (strlen($password) < 6) {
        $errors[] = 'Password minimal 6 karakter';
    }
    
    return $errors;
}

// Main login logic
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ip = $_SERVER['REMOTE_ADDR'];
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $recaptcha_token = $_POST['recaptcha_token'] ?? '';
    
    // Rate limiting
    checkRateLimit($ip, $email);
    
    // CSRF validation
    if (!validateCSRFToken()) {
        http_response_code(403);
        die(json_encode(['success' => false, 'message' => 'CSRF token tidak valid']));
    }
    
    // reCAPTCHA verification
    if (!verifyRecaptcha($recaptcha_token)) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Verifikasi reCAPTCHA gagal']));
    }
    
    // Input validation
    $errors = validateInput($email, $password);
    if (!empty($errors)) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => implode(', ', $errors)]));
    }
    
    // Database query dengan prepared statement
    try {
        $stmt = $pdo->prepare("SELECT id, nama, email, password, created_at FROM users WHERE email = ? AND active = 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            // Regenerate session ID untuk security
            session_regenerate_id(true);
            
            // Set session data
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_nama'] = $user['nama'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['login_time'] = time();
            $_SESSION['last_activity'] = time();
            
            // Set HTTP-only cookie
            setcookie('user_session', session_id(), [
                'expires' => time() + 3600,
                'path' => '/',
                'domain' => '.iniedu.id',
                'secure' => true,
                'httponly' => true,
                'samesite' => 'Strict'
            ]);
            
            // Log successful login
            logSecurityEvent('successful_login', $user['id'], $ip);
            
            // PENTING: Jangan kirim data sensitif ke frontend
            echo json_encode([
                'success' => true,
                'message' => 'Login berhasil'
            ]);
            
        } else {
            // Log failed login
            logSecurityEvent('failed_login', $email, $ip);
            
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
        }
        
    } catch (PDOException $e) {
        logSecurityEvent('login_error', $e->getMessage(), $ip);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server']);
    }
}

function logSecurityEvent($event, $details, $ip) {
    // Log ke database dan file
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event' => $event,
        'details' => $details,
        'ip' => $ip,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
    ];
    
    error_log(json_encode($log_entry), 3, '/var/log/iniedu_security.log');
}
?>
```

#### **🔧 BUAT get-profile.php (BARU)**
```php
<?php
session_start();
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

// Session validation
if (!isset($_SESSION['user_id']) || !isset($_SESSION['login_time'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Check session timeout (30 menit)
if (time() - $_SESSION['last_activity'] > 1800) {
    session_destroy();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Session expired']);
    exit;
}

// Update last activity
$_SESSION['last_activity'] = time();

// Ambil data user dari database (bukan dari session)
try {
    $stmt = $pdo->prepare("SELECT id, nama, email, created_at FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    
    if ($user) {
        echo json_encode([
            'success' => true,
            'user' => [
                'nama' => htmlspecialchars($user['nama'], ENT_QUOTES, 'UTF-8'),
                'email' => htmlspecialchars($user['email'], ENT_QUOTES, 'UTF-8'),
                'created_at' => $user['created_at']
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
?>
```

#### **🔧 BUAT validate-session.php (BARU)**
```php
<?php
session_start();
header('Content-Type: application/json');

$valid = false;

if (isset($_SESSION['user_id']) && isset($_SESSION['login_time'])) {
    // Check session timeout
    if (time() - $_SESSION['last_activity'] <= 1800) { // 30 menit
        $_SESSION['last_activity'] = time();
        $valid = true;
    } else {
        session_destroy();
    }
}

echo json_encode(['valid' => $valid]);
?>
```

#### **🔧 MODIFIKASI logout.php**
```php
<?php
session_start();
header('Content-Type: application/json');

// Log logout event
if (isset($_SESSION['user_id'])) {
    logSecurityEvent('user_logout', $_SESSION['user_id'], $_SERVER['REMOTE_ADDR']);
}

// Destroy session
session_destroy();

// Clear session cookie
setcookie('user_session', '', [
    'expires' => time() - 3600,
    'path' => '/',
    'domain' => '.iniedu.id',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict'
]);

echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
?>
```

### **2. Admin Authentication Backend**

#### **🔧 MODIFIKASI admin-login.php**
```php
<?php
session_start();
header('Content-Type: application/json');

// Rate limiting untuk admin
function checkAdminRateLimit($ip) {
    $key = "admin_rate_limit_" . md5($ip);
    $attempts = (int)($_SESSION[$key] ?? 0);
    $last_attempt = $_SESSION[$key . '_time'] ?? 0;
    
    if (time() - $last_attempt > 1800) { // Reset setelah 30 menit
        $attempts = 0;
    }
    
    if ($attempts >= 3) { // Lebih ketat untuk admin
        http_response_code(429);
        die(json_encode(['success' => false, 'message' => 'Terlalu banyak percobaan. Coba lagi dalam 30 menit.']));
    }
    
    $_SESSION[$key] = $attempts + 1;
    $_SESSION[$key . '_time'] = time();
}

// 2FA Verification
function verify2FA($user_id, $totp_code) {
    // Implementasi TOTP verification
    require_once 'vendor/autoload.php';
    
    $stmt = $pdo->prepare("SELECT totp_secret FROM admin_users WHERE id = ?");
    $stmt->execute([$user_id]);
    $secret = $stmt->fetchColumn();
    
    if (!$secret) return false;
    
    $totp = OTPHP\TOTP::create($secret);
    return $totp->verify($totp_code);
}

// JWT Token generation yang aman
function generateSecureJWT($admin_id) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'admin_id' => $admin_id,
        'iat' => time(),
        'exp' => time() + 900, // 15 menit
        'iss' => 'iniedu.id',
        'jti' => bin2hex(random_bytes(16)) // Unique token ID
    ]);
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64Header . "." . $base64Payload . "." . $base64Signature;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ip = $_SERVER['REMOTE_ADDR'];
    
    // Rate limiting
    checkAdminRateLimit($ip);
    
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $totp_code = $input['totp_code'] ?? '';
    
    try {
        $stmt = $pdo->prepare("SELECT id, email, password, totp_secret, is_active FROM admin_users WHERE email = ?");
        $stmt->execute([$email]);
        $admin = $stmt->fetch();
        
        if ($admin && password_verify($password, $admin['password']) && $admin['is_active']) {
            
            // 2FA verification (jika sudah diaktifkan)
            if ($admin['totp_secret'] && !verify2FA($admin['id'], $totp_code)) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Kode 2FA tidak valid']);
                exit;
            }
            
            // Generate JWT
            $token = generateSecureJWT($admin['id']);
            
            // Store token di database untuk tracking
            $stmt = $pdo->prepare("INSERT INTO admin_tokens (admin_id, token_hash, expires_at) VALUES (?, ?, ?)");
            $stmt->execute([$admin['id'], hash('sha256', $token), date('Y-m-d H:i:s', time() + 900)]);
            
            // Log successful admin login
            logSecurityEvent('admin_login_success', $admin['id'], $ip);
            
            echo json_encode([
                'success' => true,
                'token' => $token,
                'expires_in' => 900
            ]);
            
        } else {
            logSecurityEvent('admin_login_failed', $email, $ip);
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
        }
        
    } catch (PDOException $e) {
        logSecurityEvent('admin_login_error', $e->getMessage(), $ip);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server']);
    }
}
?>
```

#### **🔧 MODIFIKASI check-auth.php**
```php
<?php
header('Content-Type: application/json');

function verifyJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    
    $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0])), true);
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
    
    // Verify signature
    $signature = str_replace(['-', '_'], ['+', '/'], $parts[2]);
    $expected = hash_hmac('sha256', $parts[0] . "." . $parts[1], JWT_SECRET, true);
    
    if (!hash_equals($expected, base64_decode($signature))) return false;
    
    // Check expiration
    if ($payload['exp'] < time()) return false;
    
    return $payload;
}

$headers = getallheaders();
$token = null;

if (isset($headers['Authorization'])) {
    $auth = $headers['Authorization'];
    if (strpos($auth, 'Bearer ') === 0) {
        $token = substr($auth, 7);
    }
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['isLoggedIn' => false, 'message' => 'Token tidak ditemukan']);
    exit;
}

$payload = verifyJWT($token);
if (!$payload) {
    http_response_code(401);
    echo json_encode(['isLoggedIn' => false, 'message' => 'Token tidak valid']);
    exit;
}

// Check if token exists in database (untuk revocation)
try {
    $stmt = $pdo->prepare("SELECT admin_id FROM admin_tokens WHERE token_hash = ? AND expires_at > NOW()");
    $stmt->execute([hash('sha256', $token)]);
    $tokenData = $stmt->fetch();
    
    if (!$tokenData) {
        http_response_code(401);
        echo json_encode(['isLoggedIn' => false, 'message' => 'Token sudah tidak valid']);
        exit;
    }
    
    // Get admin data
    $stmt = $pdo->prepare("SELECT id, email FROM admin_users WHERE id = ? AND is_active = 1");
    $stmt->execute([$payload['admin_id']]);
    $admin = $stmt->fetch();
    
    if (!$admin) {
        http_response_code(401);
        echo json_encode(['isLoggedIn' => false, 'message' => 'Admin tidak ditemukan']);
        exit;
    }
    
    echo json_encode([
        'isLoggedIn' => true,
        'admin' => [
            'id' => $admin['id'],
            'email' => $admin['email']
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['isLoggedIn' => false, 'message' => 'Database error']);
}
?>
```

#### **🔧 BUAT security-log.php (BARU)**
```php
<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event_type' => $input['event_type'] ?? 'unknown',
        'details' => $input['details'] ?? [],
        'ip_address' => $_SERVER['REMOTE_ADDR'],
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'url' => $input['url'] ?? '',
        'session_id' => session_id()
    ];
    
    // Log ke file
    error_log(json_encode($log_entry), 3, '/var/log/iniedu_security.log');
    
    // Log ke database
    try {
        $stmt = $pdo->prepare("INSERT INTO security_logs (timestamp, event_type, details, ip_address, user_agent, url) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $log_entry['timestamp'],
            $log_entry['event_type'],
            json_encode($log_entry['details']),
            $log_entry['ip_address'],
            $log_entry['user_agent'],
            $log_entry['url']
        ]);
        
        // Alert untuk high-risk events
        if (in_array($input['event_type'], ['admin_login_failed', 'multiple_failed_login', 'csp_violation'])) {
            sendSecurityAlert($log_entry);
        }
        
    } catch (PDOException $e) {
        error_log("Security log database error: " . $e->getMessage());
    }
    
    echo json_encode(['success' => true]);
}

function sendSecurityAlert($log_entry) {
    // Kirim email alert atau notification
    $subject = "Security Alert - " . $log_entry['event_type'];
    $message = "Security event detected:\n\n" . json_encode($log_entry, JSON_PRETTY_PRINT);
    
    // mail('admin@iniedu.id', $subject, $message);
}
?>
```

### **3. Database Schema Additions**

```sql
-- Tabel untuk admin tokens
CREATE TABLE admin_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires (expires_at)
);

-- Tabel untuk security logs
CREATE TABLE security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    details JSON,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_event_type (event_type),
    INDEX idx_ip (ip_address)
);

-- Tambah kolom untuk 2FA di admin_users
ALTER TABLE admin_users ADD COLUMN totp_secret VARCHAR(32) NULL;
ALTER TABLE admin_users ADD COLUMN is_2fa_enabled BOOLEAN DEFAULT FALSE;
```

---

## **C. FRONTEND ADMIN MODIFICATIONS (Yang Akan Saya Buat)**

Saya akan membuat perbaikan untuk SEMUA file admin yang menggunakan localStorage:

### **File-file yang Perlu Diperbaiki:**
1. `src/components/JwtAuth-secure.astro`
2. `src/pages/admin-login-secure.astro`
3. `public/admin-blog-secure.js`
4. `src/pages/admin-dashboard-secure.astro`
5. `src/pages/admin-daftar-video-secure.astro`
6. `src/pages/admin-edit-ebook-secure.astro`
7. `src/pages/admin-perpus-secure.astro`
8. `src/pages/admin-daftar-blog-secure.astro`
9. `src/pages/admin-video-secure.astro`
10. `src/pages/admin-tema-ebook-secure.astro`
11. `src/pages/admin-blog-secure.astro`
12. `src/pages/admin-daftar-ebook-secure.astro`

---

## **D. ADDITIONAL SECURITY FILES**

### **1. Service Worker (sw.js)**
```javascript
// Service Worker untuk security dan offline capability
const CACHE_NAME = 'iniedu-secure-v1';
const urlsToCache = [
  '/',
  '/login',
  '/styles/global.css',
  '/fonts/roboto-slab-v35-latin-regular.woff2'
];

// Security headers untuk cached responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Add security headers to cached responses
          const newHeaders = new Headers(response.headers);
          Object.entries(securityHeaders).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        }
        return fetch(event.request);
      })
  );
});
```

### **2. .htaccess untuk Apache**
```apache
# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"

# HSTS
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

# CSP
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://iniedu.id; frame-src https://www.google.com/recaptcha/; object-src 'none'; base-uri 'self';"

# Prevent access to sensitive files
<Files ~ "^\.">
    Require all denied
</Files>

<Files ~ "\.md$">
    Require all denied
</Files>

# Rate limiting (requires mod_security)
SecRuleEngine On
SecRule IP:LOGIN_ATTEMPTS "@gt 5" "id:1001,phase:1,deny,status:429,msg:'Too many login attempts'"
```

---

## **E. DEPLOYMENT CHECKLIST**

### **Server Configuration:**
- [ ] PHP 8.0+ dengan security extensions
- [ ] MySQL 8.0+ dengan proper user permissions
- [ ] SSL/TLS certificate yang valid
- [ ] Firewall rules untuk admin IP whitelisting
- [ ] Log rotation untuk security logs
- [ ] Backup encryption
- [ ] Monitoring dan alerting

### **Environment Variables:**
```env
# .env file
JWT_SECRET=your-very-long-random-secret-key-here
JWT_REFRESH_SECRET=another-very-long-random-secret-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
DB_ENCRYPTION_KEY=your-database-encryption-key
ADMIN_EMAIL_ALERTS=admin@iniedu.id
```

---

## **F. TESTING & VALIDATION**

### **Security Testing:**
1. **Penetration Testing** dengan OWASP ZAP
2. **Vulnerability Scanning** dengan Snyk
3. **SQL Injection Testing**
4. **XSS Testing**
5. **CSRF Testing**
6. **Rate Limiting Testing**
7. **Session Management Testing**

---

## **KESIMPULAN**

**Total Modifikasi yang Diperlukan:**
- ✅ **Frontend**: 15+ files (3 sudah dibuat, 12+ akan dibuat)
- ❌ **Backend**: 8+ files (semua perlu dibuat/dimodifikasi)
- ❌ **Database**: 2 tabel baru + modifikasi existing
- ❌ **Server Config**: .htaccess, sw.js, environment setup
- ❌ **Security Infrastructure**: Monitoring, logging, alerting

**Apakah Anda siap untuk implementasi lengkap ini?** Saya bisa membuat semua file frontend admin yang secure, tapi backend harus Anda implementasikan sesuai spesifikasi yang saya berikan.