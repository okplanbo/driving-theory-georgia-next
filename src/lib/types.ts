// Localized text for Georgian, English, Russian
export interface LocalizedText {
  ka: string;
  en: string;
  ru: string;
}

// Answer option for a question
export interface Answer {
  index: number;
  text: LocalizedText;
  is_correct: boolean;
}

// Single question/ticket
export interface Question {
  ticket_id: number;
  question: LocalizedText;
  img: string | null;
  answers: Answer[];
  explanation: LocalizedText;
}

// Supported languages
export type Language = 'ka' | 'en' | 'ru';

// User from database
export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

// User progress for a single question
export interface UserProgress {
  ticketId: number;
  correctCount: number;
  wrongCount: number;
  isExcluded: boolean;
  isFavorite: boolean;
  lastAnsweredAt: string | null;
}

// User preferences
export interface UserPreferences {
  preferredLanguage: Language;
  prioritizeWeak: boolean;
  authenticated?: boolean;
}

// Exam history entry
export interface ExamHistoryEntry {
  id: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  durationSeconds: number;
  takenAt: string;
}

// Exam answer submission
export interface ExamAnswer {
  ticketId: number;
  selectedIndex: number;
  isCorrect: boolean;
}

// Stats summary
export interface UserStats {
  totalPracticed: number;
  totalQuestions: number;
  correctRate: number;
  favoritesCount: number;
  excludedCount: number;
  weakQuestions: WeakQuestion[];
  recentExams: ExamHistoryEntry[];
}

// Weak question for stats page
export interface WeakQuestion {
  ticketId: number;
  questionPreview: string;
  wrongCount: number;
  correctCount: number;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth types
export interface AuthPayload {
  userId: string;
  email: string;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
}

// Progress update request
export interface ProgressUpdateRequest {
  ticketId: number;
  isCorrect: boolean;
}

// Cloudflare context for API routes
export interface CloudflareContext {
  env: {
    DB: D1Database;
    JWT_SECRET: string;
  };
}
