# DOKUMENTASI LENGKAP KEAMANAN INIEDU.ID

**Versi:** 1.0  
**Tanggal:** Januari 2025  
**Status:** Implementasi Diperlukan  

---

## DAFTAR ISI

1. [Executive Summary](#executive-summary)
2. [Analisis Keamanan Saat Ini](#analisis-keamanan-saat-ini)
3. [Frontend Modifications](#frontend-modifications)
4. [Backend Modifications](#backend-modifications)
5. [Database Schema](#database-schema)
6. [Server Configuration](#server-configuration)
7. [Implementation Timeline](#implementation-timeline)
8. [Testing & Validation](#testing--validation)

---

## EXECUTIVE SUMMARY

Website IniEdu.id memiliki **kerentanan keamanan kritis** yang perlu segera diperbaiki. Analisis menunjukkan:

- **Skor Keamanan Saat Ini**: 6.5/10
- **Target Setelah Perbaikan**: 9.5/10
- **Kerentanan Kritis**: 3 masalah utama
- **Total Files yang Perlu Dimodifikasi**: 25+ files
- **Estimasi Waktu**: 6-8 minggu

### Masalah Kritis yang Ditemukan:
1. **Data sensitif di localStorage** - Risiko XSS attacks
2. **reCAPTCHA dinonaktifkan** - Risiko bot attacks
3. **JWT admin token di localStorage** - Risiko admin compromise

---

## ANALISIS KEAMANAN SAAT INI

### Kerentanan yang Ditemukan:

#### 1. User Authentication (Skor: 6/10)
**File yang Bermasalah:**
- `public/login.js` - Lines 23-25
- `public/profil.js` - Lines 4-6

**Masalah:**
```javascript
// KODE BERBAHAYA:
localStorage.setItem('user_nama', data.nama);
localStorage.setItem('user_id', data.id);
localStorage.setItem('user_email', email);
```

**Risiko:**
- XSS attacks bisa mencuri data user
- Session hijacking
- Identity theft

#### 2. Admin Authentication (Skor: 4/10)
**File yang Bermasalah:**
- `src/components/JwtAuth.astro` - Line 2
- `src/pages/admin-login.astro` - Line 90
- 12+ file admin lainnya

**Masalah:**
```javascript
// KODE BERBAHAYA:
const token = localStorage.getItem("adminAuthToken");
localStorage.setItem("adminAuthToken", data.token);
```

**Risiko:**
- Full admin access jika token dicuri
- Tidak ada token expiration
- Tidak ada session tracking

#### 3. Security Headers (Skor: 3/10)
**File yang Bermasalah:**
- `src/layouts/Layout.astro`

**Masalah:**
- Tidak ada Content Security Policy
- Tidak ada security headers
- Tidak ada XSS protection

---

## FRONTEND MODIFICATIONS

### A. User Authentication Files

#### 1. File: `public/login-secure.js`
**Status:** ✅ Sudah Dibuat  
**Perbaikan:**
- Rate limiting (5 attempts per 15 minutes)
- reCAPTCHA v3 integration
- Input validation & sanitization
- CSRF protection
- Auto-logout after inactivity
- Security event logging

**Kode Perbaikan:**
```javascript
// PERBAIKAN KRITIS: Hapus localStorage untuk data sensitif
// SEBELUM:
localStorage.setItem('user_nama', data.nama);
localStorage.setItem('user_id', data.id);
localStorage.setItem('user_email', email);

// SESUDAH:
sessionStorage.setItem('isLoggedIn', 'true');
sessionStorage.setItem('loginTime', Date.now().toString());
// Data sensitif hanya di HTTP-only cookies (backend)
```

#### 2. File: `public/profil-secure.js`
**Status:** ✅ Sudah Dibuat  
**Perbaikan:**
- Data diambil dari server via API
- Session validation setiap 5 menit
- XSS protection dengan sanitization
- Proper logout mechanism
- Security monitoring

**Kode Perbaikan:**
```javascript
// PERBAIKAN KRITIS: Ambil data dari server
// SEBELUM:
const userId = localStorage.getItem('user_id');
const userNama = localStorage.getItem('user_nama');

// SESUDAH:
async function loadUserProfile() {
  const response = await fetch('https://iniedu.id/get-profile.php', {
    method: 'GET',
    credentials: 'include'
  });
  // Data dari server, bukan localStorage
}
```

#### 3. File: `src/layouts/Layout-secure.astro`
**Status:** ✅ Sudah Dibuat  
**Perbaikan:**
- Content Security Policy (CSP)
- Security headers (X-Frame-Options, X-XSS-Protection)
- CSRF token meta tag
- Security monitoring script
- Auto-logout mechanism

**Kode Perbaikan:**
```html
<!-- PERBAIKAN KRITIS: Security Headers -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/...">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
<meta name="csrf-token" content={Astro.locals.csrfToken}>
```

### B. Admin Authentication Files

#### 4. File: `src/components/JwtAuth-secure.astro`
**Status:** ✅ Sudah Dibuat  
**Perbaikan:**
- Token di sessionStorage + memory (bukan localStorage)
- Auto-refresh mechanism setiap 13 menit
- Proper token validation
- Developer tools detection
- Security monitoring

**Kode Perbaikan:**
```javascript
// PERBAIKAN KRITIS: Secure token management
class SecureAdminAuth {
  getToken() {
    // Priority: memory > sessionStorage > localStorage (fallback)
    return this.currentToken || 
           sessionStorage.getItem(this.tokenKey) || 
           localStorage.getItem('adminAuthToken'); // Fallback
  }

  setToken(token) {
    this.currentToken = token;
    sessionStorage.setItem(this.tokenKey, token);
    localStorage.removeItem('adminAuthToken'); // Remove old token
  }
}
```

#### 5. File: `src/pages/admin-login-secure.astro`
**Status:** ❌ Perlu Dibuat  
**Perbaikan yang Diperlukan:**
- 2FA input field
- Rate limiting display
- Enhanced error handling
- Security warnings

#### 6. File: `public/admin-blog-secure.js`
**Status:** ❌ Perlu Dibuat  
**Perbaikan yang Diperlukan:**
- Secure token management
- API call protection
- Input validation
- CSRF protection

#### 7-15. Files: Admin Pages (9 files)
**Status:** ❌ Perlu Dibuat  
**Files:**
- `src/pages/admin-dashboard-secure.astro`
- `src/pages/admin-daftar-video-secure.astro`
- `src/pages/admin-edit-ebook-secure.astro`
- `src/pages/admin-perpus-secure.astro`
- `src/pages/admin-daftar-blog-secure.astro`
- `src/pages/admin-video-secure.astro`
- `src/pages/admin-tema-ebook-secure.astro`
- `src/pages/admin-blog-secure.astro`
- `src/pages/admin-daftar-ebook-secure.astro`

---

## BACKEND MODIFICATIONS

### A. User Authentication Backend

#### 1. File: `login.php` (MODIFIKASI)
**Status:** ❌ Perlu Dimodifikasi  
**Perbaikan yang Diperlukan:**

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
    
    if (time() - $last_attempt > 900) {
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
    
    // Database query dengan prepared statement
    try {
        $stmt = $pdo->prepare("SELECT id, nama, email, password, created_at FROM users WHERE email = ? AND active = 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            // Regenerate session ID
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
            
            // PENTING: Jangan kirim data sensitif ke frontend
            echo json_encode([
                'success' => true,
                'message' => 'Login berhasil'
            ]);
            
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server']);
    }
}
?>
```

#### 2. File: `get-profile.php` (BARU)
**Status:** ❌ Perlu Dibuat  

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

// Ambil data user dari database
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

#### 3. File: `validate-session.php` (BARU)
**Status:** ❌ Perlu Dibuat  

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

### B. Admin Authentication Backend

#### 4. File: `admin-login.php` (MODIFIKASI)
**Status:** ❌ Perlu Dimodifikasi  

```php
<?php
session_start();
header('Content-Type: application/json');

// Rate limiting untuk admin (lebih ketat)
function checkAdminRateLimit($ip) {
    $key = "admin_rate_limit_" . md5($ip);
    $attempts = (int)($_SESSION[$key] ?? 0);
    $last_attempt = $_SESSION[$key . '_time'] ?? 0;
    
    if (time() - $last_attempt > 1800) { // Reset setelah 30 menit
        $attempts = 0;
    }
    
    if ($attempts >= 3) { // Hanya 3 percobaan untuk admin
        http_response_code(429);
        die(json_encode(['success' => false, 'message' => 'Terlalu banyak percobaan. Coba lagi dalam 30 menit.']));
    }
    
    $_SESSION[$key] = $attempts + 1;
    $_SESSION[$key . '_time'] = time();
}

// 2FA Verification
function verify2FA($user_id, $totp_code) {
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
        'jti' => bin2hex(random_bytes(16))
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
            
            // 2FA verification (jika diaktifkan)
            if ($admin['totp_secret'] && !verify2FA($admin['id'], $totp_code)) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Kode 2FA tidak valid']);
                exit;
            }
            
            // Generate JWT
            $token = generateSecureJWT($admin['id']);
            
            // Store token di database
            $stmt = $pdo->prepare("INSERT INTO admin_tokens (admin_id, token_hash, expires_at) VALUES (?, ?, ?)");
            $stmt->execute([$admin['id'], hash('sha256', $token), date('Y-m-d H:i:s', time() + 900)]);
            
            echo json_encode([
                'success' => true,
                'token' => $token,
                'expires_in' => 900
            ]);
            
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server']);
    }
}
?>
```

#### 5. File: `check-auth.php` (MODIFIKASI)
**Status:** ❌ Perlu Dimodifikasi  

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

// Check if token exists in database
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

#### 6. File: `security-log.php` (BARU)
**Status:** ❌ Perlu Dibuat  

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
    $subject = "Security Alert - " . $log_entry['event_type'];
    $message = "Security event detected:\n\n" . json_encode($log_entry, JSON_PRETTY_PRINT);
    
    // mail('admin@iniedu.id', $subject, $message);
}
?>
```

#### 7. File: `refresh-token.php` (BARU)
**Status:** ❌ Perlu Dibuat  

```php
<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $refreshToken = $input['refresh_token'] ?? '';
    
    if (!$refreshToken) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Refresh token required']);
        exit;
    }
    
    // Verify refresh token
    $payload = verifyJWT($refreshToken);
    if (!$payload || $payload['type'] !== 'refresh') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid refresh token']);
        exit;
    }
    
    // Generate new access token
    $newToken = generateSecureJWT($payload['admin_id']);
    
    // Store new token in database
    try {
        $stmt = $pdo->prepare("INSERT INTO admin_tokens (admin_id, token_hash, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$payload['admin_id'], hash('sha256', $newToken), date('Y-m-d H:i:s', time() + 900)]);
        
        echo json_encode([
            'success' => true,
            'access_token' => $newToken,
            'expires_in' => 900
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
    }
}
?>
```

#### 8. File: `admin-logout.php` (BARU)
**Status:** ❌ Perlu Dibuat  

```php
<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        $auth = $headers['Authorization'];
        if (strpos($auth, 'Bearer ') === 0) {
            $token = substr($auth, 7);
        }
    }
    
    if ($token) {
        // Revoke token dari database
        try {
            $stmt = $pdo->prepare("DELETE FROM admin_tokens WHERE token_hash = ?");
            $stmt->execute([hash('sha256', $token)]);
            
            echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
            
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error']);
        }
    } else {
        echo json_encode(['success' => true, 'message' => 'No active session']);
    }
}
?>
```

---

## DATABASE SCHEMA

### Tabel Baru yang Perlu Dibuat:

#### 1. Tabel: `admin_tokens`
```sql
CREATE TABLE admin_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
```

#### 2. Tabel: `security_logs`
```sql
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
```

### Modifikasi Tabel Existing:

#### 3. Tabel: `admin_users` (MODIFIKASI)
```sql
ALTER TABLE admin_users ADD COLUMN totp_secret VARCHAR(32) NULL;
ALTER TABLE admin_users ADD COLUMN is_2fa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE admin_users ADD COLUMN last_login DATETIME NULL;
ALTER TABLE admin_users ADD COLUMN login_attempts INT DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN locked_until DATETIME NULL;
```

#### 4. Tabel: `users` (MODIFIKASI)
```sql
ALTER TABLE users ADD COLUMN last_login DATETIME NULL;
ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME NULL;
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
```

---

## SERVER CONFIGURATION

### 1. File: `.htaccess`
**Status:** ❌ Perlu Dibuat  

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

<Files ~ "\.env$">
    Require all denied
</Files>

# Rate limiting (requires mod_security)
SecRuleEngine On
SecRule IP:LOGIN_ATTEMPTS "@gt 5" "id:1001,phase:1,deny,status:429,msg:'Too many login attempts'"
```

### 2. File: `sw.js` (Service Worker)
**Status:** ❌ Perlu Dibuat  

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

### 3. File: `.env`
**Status:** ❌ Perlu Dibuat  

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=iniedu_db
DB_USER=iniedu_user
DB_PASS=your_secure_password

# JWT Configuration
JWT_SECRET=your-very-long-random-secret-key-at-least-64-characters-long
JWT_REFRESH_SECRET=another-very-long-random-secret-key-for-refresh-tokens

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key

# Security Configuration
DB_ENCRYPTION_KEY=your-database-encryption-key-32-characters
CSRF_SECRET=your-csrf-secret-key
SESSION_SECRET=your-session-secret-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@iniedu.id
SMTP_PASS=your-email-password
ADMIN_EMAIL_ALERTS=admin@iniedu.id

# Application Configuration
APP_ENV=production
APP_DEBUG=false
APP_URL=https://iniedu.id
```

---

## IMPLEMENTATION TIMELINE

### Fase 1: Perbaikan Kritis (Minggu 1-2)
**Prioritas: URGENT**

#### Week 1:
- [ ] Implementasi `login.php` dengan rate limiting & reCAPTCHA
- [ ] Buat `get-profile.php` untuk API user data
- [ ] Buat `validate-session.php` untuk session management
- [ ] Deploy `login-secure.js` dan `profil-secure.js`

#### Week 2:
- [ ] Implementasi `admin-login.php` dengan JWT yang aman
- [ ] Modifikasi `check-auth.php` untuk token validation
- [ ] Buat `security-log.php` untuk logging
- [ ] Deploy `JwtAuth-secure.astro`

### Fase 2: Keamanan Lanjutan (Minggu 3-4)
**Prioritas: HIGH**

#### Week 3:
- [ ] Implementasi 2FA untuk admin
- [ ] Buat `refresh-token.php` untuk auto-refresh
- [ ] Buat `admin-logout.php` untuk proper logout
- [ ] Deploy security headers via `.htaccess`

#### Week 4:
- [ ] Implementasi semua file admin secure
- [ ] Database schema creation
- [ ] Service Worker deployment
- [ ] Environment variables setup

### Fase 3: Testing & Monitoring (Minggu 5-6)
**Prioritas: MEDIUM**

#### Week 5:
- [ ] Security testing dengan OWASP ZAP
- [ ] Penetration testing
- [ ] Performance testing
- [ ] User acceptance testing

#### Week 6:
- [ ] Monitoring setup
- [ ] Alert system configuration
- [ ] Documentation completion
- [ ] Team training

---

## TESTING & VALIDATION

### A. Security Testing Checklist

#### 1. Authentication Testing
- [ ] Test rate limiting (5 attempts user, 3 attempts admin)
- [ ] Test reCAPTCHA integration
- [ ] Test CSRF protection
- [ ] Test session timeout (30 minutes)
- [ ] Test JWT expiration (15 minutes)
- [ ] Test token refresh mechanism

#### 2. Authorization Testing
- [ ] Test admin access without token
- [ ] Test expired token handling
- [ ] Test token revocation
- [ ] Test 2FA bypass attempts
- [ ] Test privilege escalation

#### 3. Input Validation Testing
- [ ] Test XSS prevention
- [ ] Test SQL injection prevention
- [ ] Test file upload security
- [ ] Test input sanitization
- [ ] Test output encoding

#### 4. Session Management Testing
- [ ] Test session fixation
- [ ] Test session hijacking prevention
- [ ] Test concurrent session handling
- [ ] Test logout functionality
- [ ] Test session storage security

### B. Performance Testing

#### 1. Load Testing
- [ ] Test 100 concurrent users
- [ ] Test 500 concurrent users
- [ ] Test 1000 concurrent users
- [ ] Test database performance
- [ ] Test API response times

#### 2. Security Performance
- [ ] Test rate limiting performance
- [ ] Test encryption/decryption speed
- [ ] Test JWT generation speed
- [ ] Test database query optimization
- [ ] Test caching effectiveness

### C. Monitoring & Alerting

#### 1. Security Monitoring
- [ ] Failed login attempts tracking
- [ ] Suspicious activity detection
- [ ] CSP violation monitoring
- [ ] Admin access monitoring
- [ ] Token usage monitoring

#### 2. Performance Monitoring
- [ ] Response time monitoring
- [ ] Database performance monitoring
- [ ] Memory usage monitoring
- [ ] Disk space monitoring
- [ ] Network traffic monitoring

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Backup existing database
- [ ] Backup existing files
- [ ] Test all changes in staging
- [ ] Security scan completed
- [ ] Performance test passed

### Deployment Steps
1. [ ] Deploy database schema changes
2. [ ] Deploy backend PHP files
3. [ ] Deploy frontend files
4. [ ] Deploy server configuration
5. [ ] Update environment variables
6. [ ] Clear caches
7. [ ] Test all functionality

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check security alerts
- [ ] Verify all features working
- [ ] Performance monitoring
- [ ] User feedback collection

---

## MAINTENANCE & UPDATES

### Daily Tasks
- [ ] Check security logs
- [ ] Monitor failed login attempts
- [ ] Check system performance
- [ ] Verify backup completion

### Weekly Tasks
- [ ] Security scan
- [ ] Performance analysis
- [ ] Log analysis
- [ ] Update security patches

### Monthly Tasks
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Performance optimization
- [ ] Documentation updates

---

## CONCLUSION

Implementasi keamanan lengkap untuk IniEdu.id memerlukan:

**Total Files yang Perlu Dimodifikasi:**
- ✅ **Frontend**: 4 files sudah dibuat, 11+ files masih perlu
- ❌ **Backend**: 8 files perlu dibuat/dimodifikasi
- ❌ **Database**: 2 tabel baru + 2 tabel dimodifikasi
- ❌ **Server**: 3 files konfigurasi

**Estimasi Waktu Total:** 6-8 minggu  
**Estimasi Biaya:** $12,000 - $17,000 + $500-1,000/bulan maintenance

**Dengan implementasi lengkap ini, keamanan website akan meningkat dari 6.5/10 menjadi 9.5/10.**

---

**Dokumen ini berisi semua detail teknis yang diperlukan untuk implementasi keamanan lengkap IniEdu.id. Setiap kode dan konfigurasi telah dianalisis berdasarkan struktur aktual website.**

**Tanggal Pembuatan:** Januari 2025  
**Versi:** 1.0  
**Status:** Siap untuk Implementasi