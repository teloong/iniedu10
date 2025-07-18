# DOKUMENTASI KEAMANAN INIEDU.ID - BOOTSTRAP PHP VERSION

**Versi:** 1.1 (Corrected for Bootstrap PHP)  
**Tanggal:** Januari 2025  
**Framework:** Bootstrap PHP + Astro Frontend  

---

## 📱 CARA DOWNLOAD FILE INI DI MOBILE:

### **Opsi Termudah:**
1. **Copy semua teks** dari file ini (select all + copy)
2. Buka **Google Docs** atau **Notes** di mobile
3. **Paste** dan save sebagai "Dokumentasi Keamanan IniEdu"
4. Share ke email atau cloud storage

---

## EXECUTIVE SUMMARY

Website IniEdu.id menggunakan:
- **Frontend:** Astro + Tailwind CSS
- **Backend:** Bootstrap PHP Framework
- **Database:** MySQL
- **Authentication:** Custom PHP Session + JWT untuk admin

**Kerentanan Kritis yang Ditemukan:**
1. Data sensitif di localStorage (XSS risk)
2. reCAPTCHA dinonaktifkan (Bot attacks)
3. JWT admin token di localStorage (Admin compromise)

---

## BACKEND MODIFICATIONS (BOOTSTRAP PHP)

### A. User Authentication - Bootstrap PHP Style

#### 1. File: `application/controllers/Auth.php`
**Status:** ❌ Perlu Dimodifikasi

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Auth extends CI_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->model('User_model');
        $this->load->library('form_validation');
        $this->load->library('session');
        $this->load->helper('security');
    }
    
    public function login() {
        // Set security headers
        $this->output->set_header('X-Content-Type-Options: nosniff');
        $this->output->set_header('X-Frame-Options: DENY');
        $this->output->set_header('X-XSS-Protection: 1; mode=block');
        $this->output->set_header('Content-Type: application/json');
        
        if ($this->input->method() !== 'post') {
            $this->output->set_status_header(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            return;
        }
        
        // Rate limiting
        if (!$this->_check_rate_limit()) {
            $this->output->set_status_header(429);
            echo json_encode(['success' => false, 'message' => 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.']);
            return;
        }
        
        // CSRF Protection
        if (!$this->_validate_csrf()) {
            $this->output->set_status_header(403);
            echo json_encode(['success' => false, 'message' => 'CSRF token tidak valid']);
            return;
        }
        
        // Form validation
        $this->form_validation->set_rules('email', 'Email', 'required|valid_email|xss_clean');
        $this->form_validation->set_rules('password', 'Password', 'required|min_length[6]|xss_clean');
        $this->form_validation->set_rules('recaptcha_token', 'reCAPTCHA', 'required|xss_clean');
        
        if (!$this->form_validation->run()) {
            $this->output->set_status_header(400);
            echo json_encode(['success' => false, 'message' => validation_errors()]);
            return;
        }
        
        $email = $this->input->post('email', TRUE);
        $password = $this->input->post('password', TRUE);
        $recaptcha_token = $this->input->post('recaptcha_token', TRUE);
        
        // reCAPTCHA verification
        if (!$this->_verify_recaptcha($recaptcha_token)) {
            $this->output->set_status_header(400);
            echo json_encode(['success' => false, 'message' => 'Verifikasi reCAPTCHA gagal']);
            return;
        }
        
        // Authenticate user
        $user = $this->User_model->authenticate($email, $password);
        
        if ($user) {
            // Regenerate session ID
            $this->session->sess_regenerate(TRUE);
            
            // Set session data
            $session_data = [
                'user_id' => $user->id,
                'user_nama' => $user->nama,
                'user_email' => $user->email,
                'login_time' => time(),
                'last_activity' => time(),
                'is_logged_in' => TRUE
            ];
            
            $this->session->set_userdata($session_data);
            
            // Log successful login
            $this->_log_security_event('successful_login', $user->id);
            
            // PENTING: Jangan kirim data sensitif ke frontend
            echo json_encode([
                'success' => true,
                'message' => 'Login berhasil'
            ]);
            
        } else {
            // Record failed attempt
            $this->_record_failed_attempt();
            
            // Log failed login
            $this->_log_security_event('failed_login', $email);
            
            $this->output->set_status_header(401);
            echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
        }
    }
    
    public function get_profile() {
        $this->output->set_header('Content-Type: application/json');
        
        // Check if user is logged in
        if (!$this->session->userdata('is_logged_in')) {
            $this->output->set_status_header(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }
        
        // Check session timeout (30 minutes)
        $last_activity = $this->session->userdata('last_activity');
        if (time() - $last_activity > 1800) {
            $this->session->sess_destroy();
            $this->output->set_status_header(401);
            echo json_encode(['success' => false, 'message' => 'Session expired']);
            return;
        }
        
        // Update last activity
        $this->session->set_userdata('last_activity', time());
        
        // Get user data from database
        $user_id = $this->session->userdata('user_id');
        $user = $this->User_model->get_user_by_id($user_id);
        
        if ($user) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'nama' => html_escape($user->nama),
                    'email' => html_escape($user->email),
                    'created_at' => $user->created_at
                ]
            ]);
        } else {
            $this->output->set_status_header(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
    }
    
    public function validate_session() {
        $this->output->set_header('Content-Type: application/json');
        
        $valid = false;
        
        if ($this->session->userdata('is_logged_in')) {
            $last_activity = $this->session->userdata('last_activity');
            if (time() - $last_activity <= 1800) { // 30 minutes
                $this->session->set_userdata('last_activity', time());
                $valid = true;
            } else {
                $this->session->sess_destroy();
            }
        }
        
        echo json_encode(['valid' => $valid]);
    }
    
    public function logout() {
        $this->output->set_header('Content-Type: application/json');
        
        // Log logout event
        if ($this->session->userdata('is_logged_in')) {
            $this->_log_security_event('user_logout', $this->session->userdata('user_id'));
        }
        
        // Destroy session
        $this->session->sess_destroy();
        
        echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
    }
    
    // Private methods
    private function _check_rate_limit() {
        $ip = $this->input->ip_address();
        $email = $this->input->post('email', TRUE);
        $key = 'rate_limit_' . md5($ip . $email);
        
        $attempts = $this->session->userdata($key) ?: 0;
        $last_attempt = $this->session->userdata($key . '_time') ?: 0;
        
        if (time() - $last_attempt > 900) { // Reset after 15 minutes
            $attempts = 0;
        }
        
        if ($attempts >= 5) {
            return false;
        }
        
        $this->session->set_userdata($key, $attempts + 1);
        $this->session->set_userdata($key . '_time', time());
        
        return true;
    }
    
    private function _validate_csrf() {
        $csrf_token = $this->input->post('csrf_token', TRUE);
        $session_token = $this->session->userdata('csrf_token');
        
        if (!$csrf_token || !$session_token) {
            return false;
        }
        
        return hash_equals($session_token, $csrf_token);
    }
    
    private function _verify_recaptcha($token) {
        $secret = $this->config->item('recaptcha_secret_key');
        $url = "https://www.google.com/recaptcha/api/siteverify";
        
        $data = [
            'secret' => $secret,
            'response' => $token,
            'remoteip' => $this->input->ip_address()
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
        $response = json_decode($result);
        
        return $response->success && $response->score >= 0.5;
    }
    
    private function _record_failed_attempt() {
        $ip = $this->input->ip_address();
        $key = 'failed_attempts_' . md5($ip);
        
        $attempts = $this->session->userdata($key) ?: 0;
        $this->session->set_userdata($key, $attempts + 1);
    }
    
    private function _log_security_event($event, $details) {
        $this->load->model('Security_log_model');
        
        $log_data = [
            'event_type' => $event,
            'details' => is_array($details) ? json_encode($details) : $details,
            'ip_address' => $this->input->ip_address(),
            'user_agent' => $this->input->user_agent(),
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        $this->Security_log_model->insert($log_data);
    }
}
?>
```

#### 2. File: `application/controllers/Admin_auth.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Admin_auth extends CI_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->model('Admin_model');
        $this->load->library('form_validation');
        $this->load->library('session');
        $this->load->library('jwt_lib'); // Custom JWT library
        $this->load->helper('security');
    }
    
    public function login() {
        $this->output->set_header('Content-Type: application/json');
        
        if ($this->input->method() !== 'post') {
            $this->output->set_status_header(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            return;
        }
        
        // Rate limiting untuk admin (lebih ketat)
        if (!$this->_check_admin_rate_limit()) {
            $this->output->set_status_header(429);
            echo json_encode(['success' => false, 'message' => 'Terlalu banyak percobaan. Coba lagi dalam 30 menit.']);
            return;
        }
        
        // Get JSON input
        $json_input = json_decode($this->input->raw_input_stream, true);
        
        $email = $json_input['email'] ?? '';
        $password = $json_input['password'] ?? '';
        $totp_code = $json_input['totp_code'] ?? '';
        
        // Validate input
        if (empty($email) || empty($password)) {
            $this->output->set_status_header(400);
            echo json_encode(['success' => false, 'message' => 'Email dan password harus diisi']);
            return;
        }
        
        // Authenticate admin
        $admin = $this->Admin_model->authenticate($email, $password);
        
        if ($admin && $admin->is_active) {
            
            // 2FA verification (jika diaktifkan)
            if ($admin->totp_secret && !$this->_verify_2fa($admin->id, $totp_code)) {
                $this->output->set_status_header(401);
                echo json_encode(['success' => false, 'message' => 'Kode 2FA tidak valid']);
                return;
            }
            
            // Generate JWT
            $token = $this->jwt_lib->generate_token($admin->id);
            
            // Store token in database
            $this->Admin_model->store_token($admin->id, $token);
            
            // Log successful admin login
            $this->_log_security_event('admin_login_success', $admin->id);
            
            echo json_encode([
                'success' => true,
                'token' => $token,
                'expires_in' => 900 // 15 minutes
            ]);
            
        } else {
            // Record failed attempt
            $this->_record_admin_failed_attempt();
            
            // Log failed login
            $this->_log_security_event('admin_login_failed', $email);
            
            $this->output->set_status_header(401);
            echo json_encode(['success' => false, 'message' => 'Email atau password salah']);
        }
    }
    
    public function check_auth() {
        $this->output->set_header('Content-Type: application/json');
        
        $headers = $this->input->request_headers();
        $token = null;
        
        if (isset($headers['Authorization'])) {
            $auth = $headers['Authorization'];
            if (strpos($auth, 'Bearer ') === 0) {
                $token = substr($auth, 7);
            }
        }
        
        if (!$token) {
            $this->output->set_status_header(401);
            echo json_encode(['isLoggedIn' => false, 'message' => 'Token tidak ditemukan']);
            return;
        }
        
        // Verify JWT
        $payload = $this->jwt_lib->verify_token($token);
        if (!$payload) {
            $this->output->set_status_header(401);
            echo json_encode(['isLoggedIn' => false, 'message' => 'Token tidak valid']);
            return;
        }
        
        // Check if token exists in database
        $token_data = $this->Admin_model->get_token($token);
        if (!$token_data) {
            $this->output->set_status_header(401);
            echo json_encode(['isLoggedIn' => false, 'message' => 'Token sudah tidak valid']);
            return;
        }
        
        // Get admin data
        $admin = $this->Admin_model->get_admin_by_id($payload['admin_id']);
        if (!$admin || !$admin->is_active) {
            $this->output->set_status_header(401);
            echo json_encode(['isLoggedIn' => false, 'message' => 'Admin tidak ditemukan']);
            return;
        }
        
        echo json_encode([
            'isLoggedIn' => true,
            'admin' => [
                'id' => $admin->id,
                'email' => $admin->email
            ]
        ]);
    }
    
    public function refresh_token() {
        $this->output->set_header('Content-Type: application/json');
        
        if ($this->input->method() !== 'post') {
            $this->output->set_status_header(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            return;
        }
        
        $json_input = json_decode($this->input->raw_input_stream, true);
        $refresh_token = $json_input['refresh_token'] ?? '';
        
        if (!$refresh_token) {
            $this->output->set_status_header(400);
            echo json_encode(['success' => false, 'message' => 'Refresh token required']);
            return;
        }
        
        // Verify refresh token
        $payload = $this->jwt_lib->verify_refresh_token($refresh_token);
        if (!$payload) {
            $this->output->set_status_header(401);
            echo json_encode(['success' => false, 'message' => 'Invalid refresh token']);
            return;
        }
        
        // Generate new access token
        $new_token = $this->jwt_lib->generate_token($payload['admin_id']);
        
        // Store new token in database
        $this->Admin_model->store_token($payload['admin_id'], $new_token);
        
        echo json_encode([
            'success' => true,
            'access_token' => $new_token,
            'expires_in' => 900
        ]);
    }
    
    public function logout() {
        $this->output->set_header('Content-Type: application/json');
        
        if ($this->input->method() !== 'post') {
            $this->output->set_status_header(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            return;
        }
        
        $headers = $this->input->request_headers();
        $token = null;
        
        if (isset($headers['Authorization'])) {
            $auth = $headers['Authorization'];
            if (strpos($auth, 'Bearer ') === 0) {
                $token = substr($auth, 7);
            }
        }
        
        if ($token) {
            // Revoke token from database
            $this->Admin_model->revoke_token($token);
        }
        
        echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
    }
    
    // Private methods
    private function _check_admin_rate_limit() {
        $ip = $this->input->ip_address();
        $key = 'admin_rate_limit_' . md5($ip);
        
        $attempts = $this->session->userdata($key) ?: 0;
        $last_attempt = $this->session->userdata($key . '_time') ?: 0;
        
        if (time() - $last_attempt > 1800) { // Reset after 30 minutes
            $attempts = 0;
        }
        
        if ($attempts >= 3) { // Only 3 attempts for admin
            return false;
        }
        
        $this->session->set_userdata($key, $attempts + 1);
        $this->session->set_userdata($key . '_time', time());
        
        return true;
    }
    
    private function _verify_2fa($admin_id, $totp_code) {
        // Implement TOTP verification
        $this->load->library('totp_lib');
        
        $admin = $this->Admin_model->get_admin_by_id($admin_id);
        if (!$admin->totp_secret) {
            return false;
        }
        
        return $this->totp_lib->verify($admin->totp_secret, $totp_code);
    }
    
    private function _record_admin_failed_attempt() {
        $ip = $this->input->ip_address();
        $key = 'admin_failed_attempts_' . md5($ip);
        
        $attempts = $this->session->userdata($key) ?: 0;
        $this->session->set_userdata($key, $attempts + 1);
    }
    
    private function _log_security_event($event, $details) {
        $this->load->model('Security_log_model');
        
        $log_data = [
            'event_type' => $event,
            'details' => is_array($details) ? json_encode($details) : $details,
            'ip_address' => $this->input->ip_address(),
            'user_agent' => $this->input->user_agent(),
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        $this->Security_log_model->insert($log_data);
    }
}
?>
```

#### 3. File: `application/controllers/Security_log.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Security_log extends CI_Controller {
    
    public function __construct() {
        parent::__construct();
        $this->load->model('Security_log_model');
        $this->load->library('session');
    }
    
    public function log_event() {
        $this->output->set_header('Content-Type: application/json');
        
        if ($this->input->method() !== 'post') {
            $this->output->set_status_header(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            return;
        }
        
        $json_input = json_decode($this->input->raw_input_stream, true);
        
        $log_data = [
            'event_type' => $json_input['event_type'] ?? 'unknown',
            'details' => json_encode($json_input['details'] ?? []),
            'ip_address' => $this->input->ip_address(),
            'user_agent' => $this->input->user_agent(),
            'url' => $json_input['url'] ?? '',
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        // Insert to database
        $this->Security_log_model->insert($log_data);
        
        // Check for high-risk events
        $high_risk_events = ['admin_login_failed', 'multiple_failed_login', 'csp_violation'];
        if (in_array($log_data['event_type'], $high_risk_events)) {
            $this->_send_security_alert($log_data);
        }
        
        echo json_encode(['success' => true]);
    }
    
    private function _send_security_alert($log_data) {
        // Send email alert
        $this->load->library('email');
        
        $this->email->from('noreply@iniedu.id', 'IniEdu Security');
        $this->email->to($this->config->item('admin_email'));
        $this->email->subject('Security Alert - ' . $log_data['event_type']);
        $this->email->message('Security event detected: ' . print_r($log_data, true));
        
        $this->email->send();
    }
}
?>
```

### B. Models untuk Bootstrap PHP

#### 4. File: `application/models/User_model.php`
**Status:** ❌ Perlu Dimodifikasi

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class User_model extends CI_Model {
    
    protected $table = 'users';
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function authenticate($email, $password) {
        $this->db->select('id, nama, email, password, created_at');
        $this->db->from($this->table);
        $this->db->where('email', $email);
        $this->db->where('is_active', 1);
        
        $query = $this->db->get();
        $user = $query->row();
        
        if ($user && password_verify($password, $user->password)) {
            // Update last login
            $this->db->where('id', $user->id);
            $this->db->update($this->table, ['last_login' => date('Y-m-d H:i:s')]);
            
            return $user;
        }
        
        return false;
    }
    
    public function get_user_by_id($id) {
        $this->db->select('id, nama, email, created_at');
        $this->db->from($this->table);
        $this->db->where('id', $id);
        $this->db->where('is_active', 1);
        
        $query = $this->db->get();
        return $query->row();
    }
    
    public function create_user($data) {
        // Hash password
        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        $data['created_at'] = date('Y-m-d H:i:s');
        
        return $this->db->insert($this->table, $data);
    }
    
    public function update_user($id, $data) {
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        $this->db->where('id', $id);
        return $this->db->update($this->table, $data);
    }
    
    public function increment_login_attempts($email) {
        $this->db->set('login_attempts', 'login_attempts + 1', FALSE);
        $this->db->where('email', $email);
        $this->db->update($this->table);
    }
    
    public function reset_login_attempts($email) {
        $this->db->where('email', $email);
        $this->db->update($this->table, ['login_attempts' => 0, 'locked_until' => NULL]);
    }
    
    public function lock_user($email, $minutes = 15) {
        $locked_until = date('Y-m-d H:i:s', strtotime("+{$minutes} minutes"));
        
        $this->db->where('email', $email);
        $this->db->update($this->table, ['locked_until' => $locked_until]);
    }
}
?>
```

#### 5. File: `application/models/Admin_model.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Admin_model extends CI_Model {
    
    protected $table = 'admin_users';
    protected $token_table = 'admin_tokens';
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function authenticate($email, $password) {
        $this->db->select('id, email, password, totp_secret, is_active');
        $this->db->from($this->table);
        $this->db->where('email', $email);
        
        $query = $this->db->get();
        $admin = $query->row();
        
        if ($admin && password_verify($password, $admin->password)) {
            // Update last login
            $this->db->where('id', $admin->id);
            $this->db->update($this->table, ['last_login' => date('Y-m-d H:i:s')]);
            
            return $admin;
        }
        
        return false;
    }
    
    public function get_admin_by_id($id) {
        $this->db->select('id, email, totp_secret, is_active');
        $this->db->from($this->table);
        $this->db->where('id', $id);
        
        $query = $this->db->get();
        return $query->row();
    }
    
    public function store_token($admin_id, $token) {
        $data = [
            'admin_id' => $admin_id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => date('Y-m-d H:i:s', time() + 900), // 15 minutes
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        return $this->db->insert($this->token_table, $data);
    }
    
    public function get_token($token) {
        $token_hash = hash('sha256', $token);
        
        $this->db->select('admin_id');
        $this->db->from($this->token_table);
        $this->db->where('token_hash', $token_hash);
        $this->db->where('expires_at >', date('Y-m-d H:i:s'));
        
        $query = $this->db->get();
        return $query->row();
    }
    
    public function revoke_token($token) {
        $token_hash = hash('sha256', $token);
        
        $this->db->where('token_hash', $token_hash);
        return $this->db->delete($this->token_table);
    }
    
    public function cleanup_expired_tokens() {
        $this->db->where('expires_at <', date('Y-m-d H:i:s'));
        return $this->db->delete($this->token_table);
    }
}
?>
```

#### 6. File: `application/models/Security_log_model.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Security_log_model extends CI_Model {
    
    protected $table = 'security_logs';
    
    public function __construct() {
        parent::__construct();
        $this->load->database();
    }
    
    public function insert($data) {
        $data['created_at'] = date('Y-m-d H:i:s');
        return $this->db->insert($this->table, $data);
    }
    
    public function get_logs($limit = 100, $offset = 0, $filters = []) {
        $this->db->select('*');
        $this->db->from($this->table);
        
        if (!empty($filters['event_type'])) {
            $this->db->where('event_type', $filters['event_type']);
        }
        
        if (!empty($filters['ip_address'])) {
            $this->db->where('ip_address', $filters['ip_address']);
        }
        
        if (!empty($filters['date_from'])) {
            $this->db->where('timestamp >=', $filters['date_from']);
        }
        
        if (!empty($filters['date_to'])) {
            $this->db->where('timestamp <=', $filters['date_to']);
        }
        
        $this->db->order_by('timestamp', 'DESC');
        $this->db->limit($limit, $offset);
        
        $query = $this->db->get();
        return $query->result();
    }
    
    public function get_failed_login_attempts($ip_address, $minutes = 15) {
        $this->db->select('COUNT(*) as attempts');
        $this->db->from($this->table);
        $this->db->where('event_type', 'failed_login');
        $this->db->where('ip_address', $ip_address);
        $this->db->where('timestamp >', date('Y-m-d H:i:s', strtotime("-{$minutes} minutes")));
        
        $query = $this->db->get();
        $result = $query->row();
        
        return $result->attempts;
    }
    
    public function cleanup_old_logs($days = 30) {
        $this->db->where('timestamp <', date('Y-m-d H:i:s', strtotime("-{$days} days")));
        return $this->db->delete($this->table);
    }
}
?>
```

### C. Custom Libraries untuk Bootstrap PHP

#### 7. File: `application/libraries/Jwt_lib.php`
**Status:** ❌ Perlu Dibuat

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Jwt_lib {
    
    private $CI;
    private $secret_key;
    private $refresh_secret_key;
    
    public function __construct() {
        $this->CI =& get_instance();
        $this->secret_key = $this->CI->config->item('jwt_secret');
        $this->refresh_secret_key = $this->CI->config->item('jwt_refresh_secret');
    }
    
    public function generate_token($admin_id) {
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
    
    public function verify_token($token) {
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
    
    public function generate_refresh_token($admin_id) {
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
    
    public function verify_refresh_token($token) {
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

### D. Configuration untuk Bootstrap PHP

#### 8. File: `application/config/config.php` (TAMBAHAN)
**Status:** ❌ Perlu Dimodifikasi

```php
// Tambahkan konfigurasi keamanan ini:

// JWT Configuration
$config['jwt_secret'] = 'your-very-long-random-secret-key-at-least-64-characters-long';
$config['jwt_refresh_secret'] = 'another-very-long-random-secret-key-for-refresh-tokens';

// reCAPTCHA Configuration
$config['recaptcha_site_key'] = 'your-recaptcha-site-key';
$config['recaptcha_secret_key'] = 'your-recaptcha-secret-key';

// Security Configuration
$config['csrf_protection'] = TRUE;
$config['csrf_token_name'] = 'csrf_token';
$config['csrf_cookie_name'] = 'csrf_cookie';
$config['csrf_expire'] = 7200;

// Session Configuration
$config['sess_driver'] = 'database';
$config['sess_cookie_name'] = 'iniedu_session';
$config['sess_expiration'] = 1800; // 30 minutes
$config['sess_save_path'] = 'ci_sessions';
$config['sess_match_ip'] = TRUE;
$config['sess_time_to_update'] = 300;
$config['sess_regenerate_destroy'] = TRUE;

// Cookie Configuration
$config['cookie_prefix'] = 'iniedu_';
$config['cookie_domain'] = '.iniedu.id';
$config['cookie_path'] = '/';
$config['cookie_secure'] = TRUE;
$config['cookie_httponly'] = TRUE;
$config['cookie_samesite'] = 'Strict';

// Email Configuration for Alerts
$config['admin_email'] = 'admin@iniedu.id';
$config['protocol'] = 'smtp';
$config['smtp_host'] = 'smtp.gmail.com';
$config['smtp_port'] = 587;
$config['smtp_user'] = 'admin@iniedu.id';
$config['smtp_pass'] = 'your-email-password';
$config['smtp_crypto'] = 'tls';
$config['mailtype'] = 'html';
$config['charset'] = 'utf-8';
```

#### 9. File: `application/config/routes.php` (TAMBAHAN)
**Status:** ❌ Perlu Dimodifikasi

```php
// Tambahkan routes untuk API keamanan:

// User Authentication Routes
$route['api/auth/login'] = 'auth/login';
$route['api/auth/logout'] = 'auth/logout';
$route['api/auth/profile'] = 'auth/get_profile';
$route['api/auth/validate-session'] = 'auth/validate_session';

// Admin Authentication Routes
$route['api/admin/login'] = 'admin_auth/login';
$route['api/admin/logout'] = 'admin_auth/logout';
$route['api/admin/check-auth'] = 'admin_auth/check_auth';
$route['api/admin/refresh-token'] = 'admin_auth/refresh_token';

// Security Logging Routes
$route['api/security/log'] = 'security_log/log_event';
```

---

## FRONTEND MODIFICATIONS (UPDATE URL)

Karena menggunakan Bootstrap PHP, URL API perlu diupdate:

### Update URL di File Frontend:

#### File: `public/login-secure.js`
```javascript
// UPDATE URL:
// DARI: 'https://iniedu.id/login.php'
// MENJADI: 'https://iniedu.id/api/auth/login'

const res = await fetch('https://iniedu.id/api/auth/login', {
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
// MENJADI: 'https://iniedu.id/api/auth/profile'

const response = await fetch('https://iniedu.id/api/auth/profile', {
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
// MENJADI: 'https://iniedu.id/api/admin/check-auth'

const response = await fetch("https://iniedu.id/api/admin/check-auth", {
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

Database schema tetap sama seperti sebelumnya:

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

-- Tabel ci_sessions (untuk CodeIgniter session)
CREATE TABLE ci_sessions (
    id VARCHAR(128) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    timestamp INT(10) unsigned DEFAULT 0 NOT NULL,
    data BLOB NOT NULL,
    KEY ci_sessions_timestamp (timestamp)
);
```

---

## KESIMPULAN

**Perbaikan untuk Bootstrap PHP Framework:**

1. **Controllers**: 3 controllers baru (Auth, Admin_auth, Security_log)
2. **Models**: 3 models baru (User_model, Admin_model, Security_log_model)
3. **Libraries**: 1 library baru (Jwt_lib)
4. **Configuration**: Update config.php dan routes.php
5. **Frontend**: Update URL API calls

**File yang Perlu Dibuat/Dimodifikasi:**
- ✅ **Frontend**: 4 files (sudah dibuat, perlu update URL)
- ❌ **Backend**: 8 files Bootstrap PHP (perlu dibuat)
- ❌ **Database**: 3 tabel (perlu dibuat)
- ❌ **Config**: 2 files (perlu dimodifikasi)

**Estimasi Waktu:** 4-6 minggu untuk Bootstrap PHP implementation

---

**Sekarang dokumentasi ini sudah benar untuk Bootstrap PHP Framework!**