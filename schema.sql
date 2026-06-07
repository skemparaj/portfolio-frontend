-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS portfolio_db;
USE portfolio_db;

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Visitors Table (Tracks sessions and detailed analytics)
CREATE TABLE IF NOT EXISTS visitors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  city VARCHAR(100) DEFAULT 'Unknown',
  country VARCHAR(100) DEFAULT 'Unknown',
  device VARCHAR(50) DEFAULT 'Desktop',
  browser VARCHAR(50) DEFAULT 'Unknown',
  operating_system VARCHAR(50) DEFAULT 'Unknown',
  visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page_visited VARCHAR(255) NOT NULL,
  referrer VARCHAR(255) DEFAULT 'Direct',
  time_spent INT DEFAULT 0, -- Time spent in seconds
  heatmap_clicks TEXT DEFAULT NULL -- JSON or coordinate logs
);

-- 3. Resume Downloads Table
CREATE TABLE IF NOT EXISTS resume_downloads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  visitor_id INT,
  download_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_name VARCHAR(100) NOT NULL,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL
);

-- 4. Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(255) DEFAULT 'No Subject',
  message TEXT NOT NULL,
  sent_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE
);

-- 5. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  github_link VARCHAR(255) DEFAULT NULL,
  live_link VARCHAR(255) DEFAULT NULL,
  technologies VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Projects from the frontend portfolio
INSERT INTO projects (title, description, github_link, live_link, technologies) VALUES
('Nalam PHC', 'A comprehensive Healthcare Management System designed for Primary Health Centers. Streamlines patient registration, appointment scheduling, medical records management, and real-time analytics for healthcare providers.', 'https://github.com/skemparaj', '#', 'Java, Spring Boot, MySQL, HTML/CSS, JavaScript'),
('Marriage Booking Event Management', 'A full-featured Event Planning & Booking Platform for marriage venues. Enables seamless venue browsing, date availability checking, package customization, guest management, and online booking confirmations.', 'https://github.com/skemparaj', '#', 'Java, Spring MVC, MySQL, Bootstrap, Thymeleaf'),
('Cyber Security Awareness Game', 'An interactive educational game that teaches cybersecurity concepts through engaging challenges. Players learn to identify phishing attacks, secure passwords, detect social engineering, and navigate network security scenarios gamefully.', 'https://github.com/skemparaj', '#', 'Python, HTML5, CSS3, JavaScript, Game Design'),
('SafeHire AI', 'An AI-powered Fake Job & Internship Detection System that protects job seekers from fraudulent postings. Uses NLP and machine learning to analyze job listings, compute authenticity scores, and flag suspicious opportunities in real-time.', 'https://github.com/skemparaj', '#', 'Python, Machine Learning, NLP, scikit-learn, Flask');
