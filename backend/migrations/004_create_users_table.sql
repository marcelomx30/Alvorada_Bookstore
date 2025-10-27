-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for fast lookup
CREATE INDEX idx_users_email ON users(email);

-- Create system_config table for configurable settings
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO system_config (key, value, description) VALUES
('max_books_per_user', '3', 'Maximum books a user can rent at once'),
('rental_period_days', '30', 'Default rental period in days'),
('reservation_hold_days', '3', 'Days to hold reserved book for user');

-- Create a default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (name, email, phone, password_hash, role) VALUES
('Administrator', 'admin@alvorada.com', '(85) 99999-9999', 
 '$2a$10$XJYXIrMf8BEVWgs56jKPI.9ADpI3BMgGM0t760/4wY3nHy0cOvn8q', 'admin');
