-- Inicialización de la base de datos de entorno


-- Tabla de usuarios/clientes
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    s3_bucket_name VARCHAR(255) UNIQUE NOT NULL,
    storage_quota BIGINT DEFAULT 16106127360, -- 15 GB en bytes
    storage_used BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_bucket (s3_bucket_name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de archivos/metadatos
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_name VARCHAR(512) NOT NULL,
    file_path VARCHAR(1024) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT NOT NULL,
    s3_key VARCHAR(1024) NOT NULL,
    s3_etag VARCHAR(255),
    mime_type VARCHAR(255),
    is_folder BOOLEAN DEFAULT FALSE,
    parent_folder_id INT NULL,
    is_starred BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    antivirus_status ENUM('pending', 'scanning', 'clean', 'infected', 'error') DEFAULT 'pending',
    antivirus_scanned_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_folder_id) REFERENCES files(id) ON DELETE CASCADE,
    INDEX idx_user_files (user_id, is_deleted),
    INDEX idx_s3_key (s3_key),
    INDEX idx_parent (parent_folder_id),
    INDEX idx_starred (user_id, is_starred),
    INDEX idx_antivirus (antivirus_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de compartidos
CREATE TABLE IF NOT EXISTS shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NULL,
    shared_by_user_id INT NOT NULL,
    shared_with_user_id INT NULL, -- NULL = compartido públicamente
    share_token VARCHAR(255) UNIQUE,
    permission ENUM('view', 'download', 'edit') DEFAULT 'view',
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (share_token),
    INDEX idx_file (file_id),
    INDEX idx_shared_with (shared_with_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de logs de antivirus
CREATE TABLE IF NOT EXISTS antivirus_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NULL,
    user_id INT NOT NULL,
    scan_status ENUM('clean', 'infected', 'error') NOT NULL,
    threat_name VARCHAR(255) NULL,
    scan_details TEXT,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_file (file_id),
    INDEX idx_status (scan_status),
    INDEX idx_date (scanned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear usuario de prueba (password: demo123)
-- Hash bcrypt para 'demo123': $2b$10$XvxPYXq0Y8N4rJ5G9Z4Yz.M7dK8aL4rJ5G9Z4YzM7dK8aL4rJ5G9Z
INSERT INTO users (email, password_hash, full_name, s3_bucket_name, storage_quota) 
VALUES (
    'demo@drivecloud.com',
    '$2b$10$XvxPYXq0Y8N4rJ5G9Z4Yz.M7dK8aL4rJ5G9Z4YzM7dK8aL4rJ5G9Z',
    'Usuario Demo',
    'demo-drivecloud-com',
    16106127360
) ON DUPLICATE KEY UPDATE email=email;
