CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS task_db;

USE auth_db;
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

INSERT INTO users (username, email, password, role) VALUES
('rishi', 'rishi@taskapp.com', 'password', 'MANAGER'),
('manager', 'manager@taskapp.com', 'password', 'MANAGER'),
('user1', 'user1@taskapp.com', 'password', 'USER'),
('employee1', 'emp1@taskapp.com', 'password', 'USER');

USE task_db;
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    created_date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL,
    assigned_user VARCHAR(255),
    priority VARCHAR(50) DEFAULT 'Medium',
    -- IDEMPOTENCY: Prevents duplicate tasks
    CONSTRAINT unique_task_entry UNIQUE (title, assigned_user, created_date)
);

INSERT INTO tasks (title, description, created_date, status, assigned_user, priority) VALUES
('Fix Login Bug', 'Resolve Enum error', NOW(), 'PENDING', 'user1', 'High'),
('Update React', 'Migration to v18', NOW(), 'APPROVED', 'rishi', 'Medium');
