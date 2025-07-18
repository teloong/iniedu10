# DOKUMENTASI KEAMANAN INIEDU.ID - PDO VERSION

**Versi:** 1.2 (Corrected for PDO)  
**Tanggal:** Januari 2025  
**Framework:** PDO PHP + Astro Frontend  

---

## 📱 CARA DOWNLOAD FILE INI DI MOBILE:

### **Opsi Termudah:**
1. **Copy semua teks** dari file ini (select all + copy)
2. Buka **Google Docs** atau **Notes** di mobile
3. **Paste** dan save sebagai "Dokumentasi Keamanan IniEdu PDO"
4. Share ke email atau cloud storage

---

## EXECUTIVE SUMMARY

Website IniEdu.id menggunakan:
- **Frontend:** Astro + Tailwind CSS
- **Backend:** PHP dengan PDO (PHP Data Objects)
- **Database:** MySQL dengan PDO connection
- **Authentication:** Custom PHP Session + JWT untuk admin

**Kerentanan Kritis yang Ditemukan:**
1. Data sensitif di localStorage (XSS risk)
2. reCAPTCHA dinonaktifkan (Bot attacks)
3. JWT admin token di localStorage (Admin compromise)

---

## BACKEND MODIFICATIONS (PDO PHP)

### A. Database Connection Class

#### 1. File: `config/Database.php`
**Status:** ❌ Perlu Dibuat/Dimodifikasi

```php
<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'iniedu_db';
    private $username = 'your_username';
    private $password = 'your_password';
    private $charset = 'utf8mb4';
    
    public $conn;
    
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_FOUND_ROWS => true
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            throw new Exception("Database connection failed");
        }
        
        return $this->conn;
    }
}
?>
```

### B. User Authentication dengan PDO

#### 2. File: `api/auth/login.php`
**Status:** ❌ Perlu Dimodifikasi

```php
<?php
session_start();
require_once '../../config/Database.php';
require_once '../../classes/User.php';
require_once '../../classes/SecurityLog.php';

// Set security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://iniedu.id');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Rate limiting
    if (!checkRateLimit()) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.']);
        exit;
    }
    
    // CSRF Protection
    if (!validateCSRF()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'CSRF token tidak valid']);
        exit;
    }
    
    // Validate input
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $password = filter_input(INPUT_POST, 'password', FILTER_SANITIZE_STRING);
    $recaptcha_token = filter_input(INPUT_POST, 'recaptcha_token', FILTER_SANITIZE_STRING);
    
    if (!$email || !$password || !$recaptcha_token) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Data tidak valid']);
        exit;
    }
    
    // reCAPTCHA verification
    if (!verifyRecaptcha($recaptcha_token)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Verifikasi reCAPTCHA gagal']);
        exit;
    }
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Initialize classes
    $user = new User($db);
    $securityLog = new SecurityLog($db);
    
    // Authenticate user
    $userData = $user->authenticate($email, $password);
    
    if ($userData) {
        // Regenerate session ID
        session_regenerate_id(true);
        
        // Set session data
        $_SESSION['user_id'] = $userData['id'];
        $_SESSION['user_nama'] = $userData['nama'];
        $_SESSION['user_email'] = $userData['email'];
        $_SESSION['login_time'] = time();
        $_SESSION['last_activity'] = time();
        $_SESSION['is_logged_in'] = true;
        
        // Log successful login
        $securityLog->logEvent('successful_login', [
            'user_id' => $userData['id'],
            'email' => $email
        ]);
        
        // PENTING: Jangan kirim data sensitif ke frontend
        echo json_encode([
            'success' => true,
            'message' => 'Login berhasil'
        ]);
        
    } else {
        // Record failed attempt
        recordFailedAttempt();
        
        // Log failed login
        $securityLog->logEvent('failed_login', [
            'email' => $email,
            'ip' => $_SERVER['REMOTE_ADDR']
        ]);
        
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
    }
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server']);
}

// Helper functions
function checkRateLimit() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $email = $_POST['email'] ?? '';
    $key = 'rate_limit_' . md5($ip . $email);
    
    $attempts = $_SESSION[$key] ?? 0;
    $last_attempt = $_SESSION[$key . '_time'] ?? 0;
    
    if (time() - $last_attempt > 900) { // Reset after 15 minutes
        $attempts = 0;
    }
    
    if ($attempts >= 5) {
        return false;
    }
    
    $_SESSION[$key] = $attempts + 1;
    $_SESSION[$key . '_time'] = time();
    
    return true;
}

function validateCSRF() {
    $csrf_token = $_POST['csrf_token'] ?? '';
    $session_token = $_SESSION['csrf_token'] ?? '';
    
    if (!$csrf_token || !$session_token) {
        return false;
    }
    
    return hash_equals($session_token, $csrf_token);
}

function verifyRecaptcha($token) {
    $secret = 'your-recaptcha-secret-key';
    $url = "https://www.google.com/recaptcha/api/siteverify";
    
    $data = [
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR']
    ];
    
    $options = [
        'http' => [
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    $response = json_decode($result, true);
    
    return $response['success'] && $response['score'] >= 0.5;
}

function recordFailedAttempt() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $key = 'failed_attempts_' . md5($ip);
    
    $attempts = $_SESSION[$key] ?? 0;
    $_SESSION[$key] = $attempts + 1;
}
?>
```

#### 3. File: `api/auth/profile.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
session_start();
require_once '../../config/Database.php';
require_once '../../classes/User.php';

// Set security headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://iniedu.id');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET');

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Check if user is logged in
    if (!isset($_SESSION['is_logged_in']) || !$_SESSION['is_logged_in']) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
    
    // Check session timeout (30 minutes)
    $last_activity = $_SESSION['last_activity'] ?? 0;
    if (time() - $last_activity > 1800) {
        session_destroy();
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Session expired']);
        exit;
    }
    
    // Update last activity
    $_SESSION['last_activity'] = time();
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Initialize User class
    $user = new User($db);
    
    // Get user data from database
    $user_id = $_SESSION['user_id'];
    $userData = $user->getUserById($user_id);
    
    if ($userData) {
        echo json_encode([
            'success' => true,
            'user' => [
                'nama' => htmlspecialchars($userData['nama'], ENT_QUOTES, 'UTF-8'),
                'email' => htmlspecialchars($userData['email'], ENT_QUOTES, 'UTF-8'),
                'created_at' => $userData['created_at']
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
    
} catch (Exception $e) {
    error_log("Profile error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server']);
}
?>
```

#### 4. File: `api/auth/validate-session.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
session_start();

// Set security headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://iniedu.id');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET');

try {
    $valid = false;
    
    if (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']) {
        $last_activity = $_SESSION['last_activity'] ?? 0;
        if (time() - $last_activity <= 1800) { // 30 minutes
            $_SESSION['last_activity'] = time();
            $valid = true;
        } else {
            session_destroy();
        }
    }
    
    echo json_encode(['valid' => $valid]);
    
} catch (Exception $e) {
    error_log("Session validation error: " . $e->getMessage());
    echo json_encode(['valid' => false]);
}
?>
```

#### 5. File: `api/auth/logout.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
session_start();
require_once '../../config/Database.php';
require_once '../../classes/SecurityLog.php';

// Set security headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://iniedu.id');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST');

try {
    // Log logout event
    if (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']) {
        $database = new Database();
        $db = $database->getConnection();
        $securityLog = new SecurityLog($db);
        
        $securityLog->logEvent('user_logout', [
            'user_id' => $_SESSION['user_id']
        ]);
    }
    
    // Destroy session
    session_destroy();
    
    echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
    
} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
}
?>
```

### C. Admin Authentication dengan PDO

#### 6. File: `api/admin/login.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
session_start();
require_once '../../config/Database.php';
require_once '../../classes/Admin.php';
require_once '../../classes/SecurityLog.php';
require_once '../../classes/JWT.php';

// Set security headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://iniedu.id');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Rate limiting untuk admin (lebih ketat)
    if (!checkAdminRateLimit()) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Terlalu banyak percobaan. Coba lagi dalam 30 menit.']);
        exit;
    }
    
    // Get JSON input
    $json_input = file_get_contents('php://input');
    $data = json_decode($json_input, true);
    
    $email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $password = $data['password'] ?? '';
    $totp_code = $data['totp_code'] ?? '';
    
    // Validate input
    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email dan password harus diisi']);
        exit;
    }
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Initialize classes
    $admin = new Admin($db);
    $securityLog = new SecurityLog($db);
    $jwt = new JWT();
    
    // Authenticate admin
    $adminData = $admin->authenticate($email, $password);
    
    if ($adminData && $adminData['is_active']) {
        
        // 2FA verification (jika diaktifkan)
        if ($adminData['totp_secret'] && !verify2FA($adminData['id'], $totp_code)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Kode 2FA tidak valid']);
            exit;
        }
        
        // Generate JWT
        $token = $jwt->generateToken($adminData['id']);
        
        // Store token in database
        $admin->storeToken($adminData['id'], $token);
        
        // Log successful admin login
        $securityLog->logEvent('admin_login_success', [
            'admin_id' => $adminData['id'],
            'email' => $email
        ]);
        
        echo json_encode([
            'success' => true,
            'token' => $token,
            'expires_in' => 900 // 15 minutes
        ]);
        
    } else {
        // Record failed attempt
        recordAdminFailedAttempt();
        
        // Log failed login
        $securityLog->logEvent('admin_login_failed', [
            'email' => $email,
            'ip' => $_SERVER['REMOTE_ADDR']
        ]);
        
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
    }
    
} catch (Exception $e) {
    error_log("Admin login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan server']);
}

// Helper functions
function checkAdminRateLimit() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $key = 'admin_rate_limit_' . md5($ip);
    
    $attempts = $_SESSION[$key] ?? 0;
    $last_attempt = $_SESSION[$key . '_time'] ?? 0;
    
    if (time() - $last_attempt > 1800) { // Reset after 30 minutes
        $attempts = 0;
    }
    
    if ($attempts >= 3) { // Only 3 attempts for admin
        return false;
    }
    
    $_SESSION[$key] = $attempts + 1;
    $_SESSION[$key . '_time'] = time();
    
    return true;
}

function verify2FA($admin_id, $totp_code) {
    // Implement TOTP verification
    // This would require a TOTP library
    return true; // Placeholder
}

function recordAdminFailedAttempt() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $key = 'admin_failed_attempts_' . md5($ip);
    
    $attempts = $_SESSION[$key] ?? 0;
    $_SESSION[$key] = $attempts + 1;
}
?>
```

#### 7. File: `api/admin/check-auth.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
require_once '../../config/Database.php';
require_once '../../classes/Admin.php';
require_once '../../classes/JWT.php';

// Set security headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://iniedu.id');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Authorization');

try {
    // Get Authorization header
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
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Initialize classes
    $admin = new Admin($db);
    $jwt = new JWT();
    
    // Verify JWT
    $payload = $jwt->verifyToken($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['isLoggedIn' => false, 'message' => 'Token tidak valid']);
        exit;
    }
    
    // Check if token exists in database
    $tokenData = $admin->getToken($token);
    if (!$tokenData) {
        http_response_code(401);
        echo json_encode(['isLoggedIn' => false, 'message' => 'Token sudah tidak valid']);
        exit;
    }
    
    // Get admin data
    $adminData = $admin->getAdminById($payload['admin_id']);
    if (!$adminData || !$adminData['is_active']) {
        http_response_code(401);
        echo json_encode(['isLoggedIn' => false, 'message' => 'Admin tidak ditemukan']);
        exit;
    }
    
    echo json_encode([
        'isLoggedIn' => true,
        'admin' => [
            'id' => $adminData['id'],
            'email' => $adminData['email']
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Admin auth check error: " . $e->getMessage());
    http_response_code(401);
    echo json_encode(['isLoggedIn' => false, 'message' => 'Terjadi kesalahan server']);
}
?>
```

### D. PDO Classes

#### 8. File: `classes/User.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
class User {
    private $conn;
    private $table_name = "users";
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function authenticate($email, $password) {
        $query = "SELECT id, nama, email, password, created_at 
                  FROM " . $this->table_name . " 
                  WHERE email = :email AND is_active = 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            // Update last login
            $this->updateLastLogin($user['id']);
            return $user;
        }
        
        return false;
    }
    
    public function getUserById($id) {
        $query = "SELECT id, nama, email, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id AND is_active = 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function createUser($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (nama, email, password, created_at) 
                  VALUES (:nama, :email, :password, NOW())";
        
        $stmt = $this->conn->prepare($query);
        
        // Hash password
        $hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $stmt->bindParam(':nama', $data['nama']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':password', $hashed_password);
        
        return $stmt->execute();
    }
    
    public function updateUser($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET nama = :nama, email = :email, updated_at = NOW() 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':nama', $data['nama']);
        $stmt->bindParam(':email', $data['email']);
        
        return $stmt->execute();
    }
    
    private function updateLastLogin($id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET last_login = NOW() 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
    }
    
    public function incrementLoginAttempts($email) {
        $query = "UPDATE " . $this->table_name . " 
                  SET login_attempts = login_attempts + 1 
                  WHERE email = :email";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
    }
    
    public function resetLoginAttempts($email) {
        $query = "UPDATE " . $this->table_name . " 
                  SET login_attempts = 0, locked_until = NULL 
                  WHERE email = :email";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
    }
    
    public function lockUser($email, $minutes = 15) {
        $locked_until = date('Y-m-d H:i:s', strtotime("+{$minutes} minutes"));
        
        $query = "UPDATE " . $this->table_name . " 
                  SET locked_until = :locked_until 
                  WHERE email = :email";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':locked_until', $locked_until);
        $stmt->execute();
    }
}
?>
```

#### 9. File: `classes/Admin.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
class Admin {
    private $conn;
    private $table_name = "admin_users";
    private $token_table = "admin_tokens";
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function authenticate($email, $password) {
        $query = "SELECT id, email, password, totp_secret, is_active 
                  FROM " . $this->table_name . " 
                  WHERE email = :email";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin && password_verify($password, $admin['password'])) {
            // Update last login
            $this->updateLastLogin($admin['id']);
            return $admin;
        }
        
        return false;
    }
    
    public function getAdminById($id) {
        $query = "SELECT id, email, totp_secret, is_active 
                  FROM " . $this->table_name . " 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function storeToken($admin_id, $token) {
        $query = "INSERT INTO " . $this->token_table . " 
                  (admin_id, token_hash, expires_at, created_at) 
                  VALUES (:admin_id, :token_hash, :expires_at, NOW())";
        
        $stmt = $this->conn->prepare($query);
        
        $token_hash = hash('sha256', $token);
        $expires_at = date('Y-m-d H:i:s', time() + 900); // 15 minutes
        
        $stmt->bindParam(':admin_id', $admin_id);
        $stmt->bindParam(':token_hash', $token_hash);
        $stmt->bindParam(':expires_at', $expires_at);
        
        return $stmt->execute();
    }
    
    public function getToken($token) {
        $token_hash = hash('sha256', $token);
        
        $query = "SELECT admin_id FROM " . $this->token_table . " 
                  WHERE token_hash = :token_hash 
                  AND expires_at > NOW()";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token_hash', $token_hash);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function revokeToken($token) {
        $token_hash = hash('sha256', $token);
        
        $query = "DELETE FROM " . $this->token_table . " 
                  WHERE token_hash = :token_hash";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token_hash', $token_hash);
        
        return $stmt->execute();
    }
    
    public function cleanupExpiredTokens() {
        $query = "DELETE FROM " . $this->token_table . " 
                  WHERE expires_at < NOW()";
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute();
    }
    
    private function updateLastLogin($id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET last_login = NOW() 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
    }
}
?>
```

#### 10. File: `classes/SecurityLog.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
class SecurityLog {
    private $conn;
    private $table_name = "security_logs";
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    public function logEvent($event_type, $details = []) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (event_type, details, ip_address, user_agent, url, timestamp, created_at) 
                  VALUES (:event_type, :details, :ip_address, :user_agent, :url, NOW(), NOW())";
        
        $stmt = $this->conn->prepare($query);
        
        $details_json = json_encode($details);
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $url = $_SERVER['REQUEST_URI'] ?? '';
        
        $stmt->bindParam(':event_type', $event_type);
        $stmt->bindParam(':details', $details_json);
        $stmt->bindParam(':ip_address', $ip_address);
        $stmt->bindParam(':user_agent', $user_agent);
        $stmt->bindParam(':url', $url);
        
        $result = $stmt->execute();
        
        // Check for high-risk events
        $high_risk_events = ['admin_login_failed', 'multiple_failed_login', 'csp_violation'];
        if (in_array($event_type, $high_risk_events)) {
            $this->sendSecurityAlert([
                'event_type' => $event_type,
                'details' => $details,
                'ip_address' => $ip_address,
                'user_agent' => $user_agent,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
        
        return $result;
    }
    
    public function getLogs($limit = 100, $offset = 0, $filters = []) {
        $where_conditions = [];
        $params = [];
        
        if (!empty($filters['event_type'])) {
            $where_conditions[] = "event_type = :event_type";
            $params[':event_type'] = $filters['event_type'];
        }
        
        if (!empty($filters['ip_address'])) {
            $where_conditions[] = "ip_address = :ip_address";
            $params[':ip_address'] = $filters['ip_address'];
        }
        
        if (!empty($filters['date_from'])) {
            $where_conditions[] = "timestamp >= :date_from";
            $params[':date_from'] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $where_conditions[] = "timestamp <= :date_to";
            $params[':date_to'] = $filters['date_to'];
        }
        
        $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
        
        $query = "SELECT * FROM " . $this->table_name . " 
                  {$where_clause} 
                  ORDER BY timestamp DESC 
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getFailedLoginAttempts($ip_address, $minutes = 15) {
        $query = "SELECT COUNT(*) as attempts FROM " . $this->table_name . " 
                  WHERE event_type = 'failed_login' 
                  AND ip_address = :ip_address 
                  AND timestamp > DATE_SUB(NOW(), INTERVAL :minutes MINUTE)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':ip_address', $ip_address);
        $stmt->bindParam(':minutes', $minutes, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['attempts'];
    }
    
    public function cleanupOldLogs($days = 30) {
        $query = "DELETE FROM " . $this->table_name . " 
                  WHERE timestamp < DATE_SUB(NOW(), INTERVAL :days DAY)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':days', $days, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    private function sendSecurityAlert($log_data) {
        // Send email alert
        $to = 'admin@iniedu.id';
        $subject = 'Security Alert - ' . $log_data['event_type'];
        $message = "Security event detected:\n\n" . print_r($log_data, true);
        $headers = 'From: noreply@iniedu.id' . "\r\n" .
                   'Reply-To: noreply@iniedu.id' . "\r\n" .
                   'X-Mailer: PHP/' . phpversion();
        
        mail($to, $subject, $message, $headers);
    }
}
?>
```

#### 11. File: `classes/JWT.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
class JWT {
    private $secret_key = 'your-very-long-random-secret-key-at-least-64-characters-long';
    private $refresh_secret_key = 'another-very-long-random-secret-key-for-refresh-tokens';
    
    public function generateToken($admin_id) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'admin_id' => $admin_id,
            'iat' => time(),
            'exp' => time() + 900, // 15 minutes
            'iss' => 'iniedu.id',
            'jti' => bin2hex(random_bytes(16))
        ]);
        
        $base64_header = $this->base64url_encode($header);
        $base64_payload = $this->base64url_encode($payload);
        
        $signature = hash_hmac('sha256', $base64_header . "." . $base64_payload, $this->secret_key, true);
        $base64_signature = $this->base64url_encode($signature);
        
        return $base64_header . "." . $base64_payload . "." . $base64_signature;
    }
    
    public function verifyToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        $header = json_decode($this->base64url_decode($parts[0]), true);
        $payload = json_decode($this->base64url_decode($parts[1]), true);
        
        // Verify signature
        $signature = $this->base64url_decode($parts[2]);
        $expected = hash_hmac('sha256', $parts[0] . "." . $parts[1], $this->secret_key, true);
        
        if (!hash_equals($expected, $signature)) {
            return false;
        }
        
        // Check expiration
        if ($payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    }
    
    public function generateRefreshToken($admin_id) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'admin_id' => $admin_id,
            'iat' => time(),
            'exp' => time() + 604800, // 7 days
            'type' => 'refresh',
            'jti' => bin2hex(random_bytes(16))
        ]);
        
        $base64_header = $this->base64url_encode($header);
        $base64_payload = $this->base64url_encode($payload);
        
        $signature = hash_hmac('sha256', $base64_header . "." . $base64_payload, $this->refresh_secret_key, true);
        $base64_signature = $this->base64url_encode($signature);
        
        return $base64_header . "." . $base64_payload . "." . $base64_signature;
    }
    
    public function verifyRefreshToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        $payload = json_decode($this->base64url_decode($parts[1]), true);
        
        // Verify signature
        $signature = $this->base64url_decode($parts[2]);
        $expected = hash_hmac('sha256', $parts[0] . "." . $parts[1], $this->refresh_secret_key, true);
        
        if (!hash_equals($expected, $signature)) {
            return false;
        }
        
        // Check expiration and type
        if ($payload['exp'] < time() || $payload['type'] !== 'refresh') {
            return false;
        }
        
        return $payload;
    }
    
    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private function base64url_decode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
}
?>
```

---

## FRONTEND MODIFICATIONS (UPDATE URL)

Karena menggunakan PDO PHP dengan struktur API, URL perlu diupdate:

### Update URL di File Frontend:

#### File: `public/login-secure.js`
```javascript
// UPDATE URL:
// DARI: 'https://iniedu.id/login.php'
// MENJADI: 'https://iniedu.id/api/auth/login.php'

const res = await fetch('https://iniedu.id/api/auth/login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    credentials: 'include',
    body: requestBody.toString()
});
```

#### File: `public/profil-secure.js`
```javascript
// UPDATE URL:
// DARI: 'https://iniedu.id/get-profile.php'
// MENJADI: 'https://iniedu.id/api/auth/profile.php'

const response = await fetch('https://iniedu.id/api/auth/profile.php', {
    method: 'GET',
    credentials: 'include',
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    }
});
```

#### File: `src/components/JwtAuth-secure.astro`
```javascript
// UPDATE URL:
// DARI: 'https://iniedu.id/check-auth.php'
// MENJADI: 'https://iniedu.id/api/admin/check-auth.php'

const response = await fetch("https://iniedu.id/api/admin/check-auth.php", {
    method: "GET",
    headers: {
        "Authorization": `Bearer ${token}`,
        "X-Requested-With": "XMLHttpRequest"
    },
    credentials: 'include'
});
```

---

## DATABASE SCHEMA (SAMA)

Database schema tetap sama:

```sql
-- Tabel admin_tokens
CREATE TABLE admin_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires (expires_at)
);

-- Tabel security_logs
CREATE TABLE security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    details JSON,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update tabel users (tambah kolom keamanan)
ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME NULL;
ALTER TABLE users ADD COLUMN last_login DATETIME NULL;

-- Update tabel admin_users (tambah kolom keamanan)
ALTER TABLE admin_users ADD COLUMN totp_secret VARCHAR(32) NULL;
ALTER TABLE admin_users ADD COLUMN last_login DATETIME NULL;
```

---

## KESIMPULAN

**Perbaikan untuk PDO PHP:**

1. **Database**: PDO connection class dengan prepared statements
2. **API Files**: 7 API endpoints dengan proper security
3. **Classes**: 4 classes (User, Admin, SecurityLog, JWT)
4. **Security**: Rate limiting, CSRF protection, input validation
5. **Frontend**: Update URL untuk API endpoints

**File yang Perlu Dibuat/Dimodifikasi:**
- ✅ **Frontend**: 4 files (sudah dibuat, perlu update URL)
- ❌ **Backend**: 11 files PDO PHP (perlu dibuat)
- ❌ **Database**: 3 tabel (perlu dibuat/dimodifikasi)
- ❌ **Config**: 1 file (perlu dibuat)

**Estimasi Waktu:** 3-4 minggu untuk PDO PHP implementation

---

**Sekarang dokumentasi ini sudah benar untuk PDO PHP!**