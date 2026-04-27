-- Civic Issue Reporting System Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    first_name VARCHAR(150) DEFAULT '',
    last_name VARCHAR(150) DEFAULT '',
    password VARCHAR(255) NOT NULL,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    phone_number VARCHAR(15),
    profile_picture VARCHAR(255),
    is_department_staff BOOLEAN DEFAULT FALSE,
    department_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Authentication Tokens
CREATE TABLE IF NOT EXISTS authtoken_token (
    key VARCHAR(40) PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users_user(id),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments_department (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(254),
    phone VARCHAR(15),
    address TEXT,
    description TEXT,
    contact_person VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issues Table
CREATE TABLE IF NOT EXISTS issues_issue (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(100),
    location VARCHAR(255),
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    reported_by_id INTEGER NOT NULL REFERENCES users_user(id),
    assigned_to_id INTEGER REFERENCES users_user(id),
    department_id INTEGER REFERENCES departments_department(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Issue Attachments Table
CREATE TABLE IF NOT EXISTS issues_issueattachment (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues_issue(id),
    file VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issue Comments Table
CREATE TABLE IF NOT EXISTS issues_issuecomment (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues_issue(id),
    author_id INTEGER NOT NULL REFERENCES users_user(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications_notification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users_user(id),
    notification_type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    related_issue_id INTEGER REFERENCES issues_issue(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Better Performance
CREATE INDEX idx_issues_reported_by ON issues_issue(reported_by_id);
CREATE INDEX idx_issues_assigned_to ON issues_issue(assigned_to_id);
CREATE INDEX idx_issues_department ON issues_issue(department_id);
CREATE INDEX idx_issues_status ON issues_issue(status);
CREATE INDEX idx_notifications_user ON notifications_notification(user_id);
CREATE INDEX idx_notifications_read ON notifications_notification(is_read);
CREATE INDEX idx_comments_issue ON issues_issuecomment(issue_id);
