-- Migration: 0001_initial
-- Description: Create initial schema for driving theory app

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- User progress per question
CREATE TABLE IF NOT EXISTS user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ticket_id INTEGER NOT NULL,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  is_excluded INTEGER DEFAULT 0,
  is_favorite INTEGER DEFAULT 0,
  last_answered_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, ticket_id)
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  preferred_language TEXT DEFAULT 'en',
  prioritize_weak INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Exam history
CREATE TABLE IF NOT EXISTS exam_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER DEFAULT 30,
  passed INTEGER NOT NULL,
  duration_seconds INTEGER,
  taken_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_ticket ON user_progress(ticket_id);
CREATE INDEX IF NOT EXISTS idx_progress_excluded ON user_progress(user_id, is_excluded);
CREATE INDEX IF NOT EXISTS idx_progress_favorite ON user_progress(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_exam_user ON exam_history(user_id);
