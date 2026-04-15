import { User, UserProgress, UserPreferences, ExamHistoryEntry } from './types';

// Type for D1 database
type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: <T>(statements: D1PreparedStatement[]) => Promise<D1Result<T>[]>;
};

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: <T>() => Promise<T | null>;
  all: <T>() => Promise<{ results: T[] }>;
  run: () => Promise<D1Result<unknown>>;
};

type D1Result<T> = {
  results: T[];
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
  };
};

// ============ USER OPERATIONS ============

export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  return db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<User>();
}

export async function getUserById(
  db: D1Database,
  userId: string
): Promise<User | null> {
  return db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first<User>();
}

export async function createUser(
  db: D1Database,
  id: string,
  email: string,
  passwordHash: string
): Promise<void> {
  await db
    .prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
    .bind(id, email, passwordHash)
    .run();
}

export async function updateUserPassword(
  db: D1Database,
  userId: string,
  newPasswordHash: string
): Promise<void> {
  await db
    .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(newPasswordHash, userId)
    .run();
}

// ============ USER PREFERENCES ============

export async function getUserPreferences(
  db: D1Database,
  userId: string
): Promise<UserPreferences> {
  const row = await db
    .prepare('SELECT * FROM user_preferences WHERE user_id = ?')
    .bind(userId)
    .first<{ user_id: string; preferred_language: string; prioritize_weak: number }>();

  if (!row) {
    // Return defaults if no preferences set
    return {
      preferredLanguage: 'en',
      prioritizeWeak: false,
    };
  }

  return {
    preferredLanguage: row.preferred_language as 'ka' | 'en' | 'ru',
    prioritizeWeak: row.prioritize_weak === 1,
  };
}

export async function upsertUserPreferences(
  db: D1Database,
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  const existing = await db
    .prepare('SELECT * FROM user_preferences WHERE user_id = ?')
    .bind(userId)
    .first();

  if (existing) {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (preferences.preferredLanguage !== undefined) {
      updates.push('preferred_language = ?');
      values.push(preferences.preferredLanguage);
    }
    if (preferences.prioritizeWeak !== undefined) {
      updates.push('prioritize_weak = ?');
      values.push(preferences.prioritizeWeak ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(userId);
      await db
        .prepare(`UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`)
        .bind(...values)
        .run();
    }
  } else {
    await db
      .prepare(
        'INSERT INTO user_preferences (user_id, preferred_language, prioritize_weak) VALUES (?, ?, ?)'
      )
      .bind(
        userId,
        preferences.preferredLanguage || 'en',
        preferences.prioritizeWeak ? 1 : 0
      )
      .run();
  }
}

// ============ USER PROGRESS ============

export async function getUserProgress(
  db: D1Database,
  userId: string,
  ticketId: number
): Promise<UserProgress | null> {
  const row = await db
    .prepare('SELECT * FROM user_progress WHERE user_id = ? AND ticket_id = ?')
    .bind(userId, ticketId)
    .first<{
      ticket_id: number;
      correct_count: number;
      wrong_count: number;
      is_excluded: number;
      is_favorite: number;
      last_answered_at: string | null;
    }>();

  if (!row) return null;

  return {
    ticketId: row.ticket_id,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    isExcluded: row.is_excluded === 1,
    isFavorite: row.is_favorite === 1,
    lastAnsweredAt: row.last_answered_at,
  };
}

export async function recordAnswer(
  db: D1Database,
  userId: string,
  ticketId: number,
  isCorrect: boolean
): Promise<void> {
  const existing = await getUserProgress(db, userId, ticketId);
  const now = new Date().toISOString();

  if (existing) {
    if (isCorrect) {
      await db
        .prepare(
          'UPDATE user_progress SET correct_count = correct_count + 1, last_answered_at = ? WHERE user_id = ? AND ticket_id = ?'
        )
        .bind(now, userId, ticketId)
        .run();
    } else {
      await db
        .prepare(
          'UPDATE user_progress SET wrong_count = wrong_count + 1, last_answered_at = ? WHERE user_id = ? AND ticket_id = ?'
        )
        .bind(now, userId, ticketId)
        .run();
    }
  } else {
    await db
      .prepare(
        'INSERT INTO user_progress (user_id, ticket_id, correct_count, wrong_count, last_answered_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(userId, ticketId, isCorrect ? 1 : 0, isCorrect ? 0 : 1, now)
      .run();
  }
}

export async function toggleFavorite(
  db: D1Database,
  userId: string,
  ticketId: number
): Promise<boolean> {
  const existing = await getUserProgress(db, userId, ticketId);

  if (existing) {
    const newValue = existing.isFavorite ? 0 : 1;
    await db
      .prepare(
        'UPDATE user_progress SET is_favorite = ? WHERE user_id = ? AND ticket_id = ?'
      )
      .bind(newValue, userId, ticketId)
      .run();
    return newValue === 1;
  } else {
    await db
      .prepare(
        'INSERT INTO user_progress (user_id, ticket_id, is_favorite) VALUES (?, ?, 1)'
      )
      .bind(userId, ticketId)
      .run();
    return true;
  }
}

export async function toggleExclusion(
  db: D1Database,
  userId: string,
  ticketId: number
): Promise<boolean> {
  const existing = await getUserProgress(db, userId, ticketId);

  if (existing) {
    const newValue = existing.isExcluded ? 0 : 1;
    await db
      .prepare(
        'UPDATE user_progress SET is_excluded = ? WHERE user_id = ? AND ticket_id = ?'
      )
      .bind(newValue, userId, ticketId)
      .run();
    return newValue === 1;
  } else {
    await db
      .prepare(
        'INSERT INTO user_progress (user_id, ticket_id, is_excluded) VALUES (?, ?, 1)'
      )
      .bind(userId, ticketId)
      .run();
    return true;
  }
}

export async function getFavoriteIds(
  db: D1Database,
  userId: string
): Promise<number[]> {
  const { results } = await db
    .prepare('SELECT ticket_id FROM user_progress WHERE user_id = ? AND is_favorite = 1')
    .bind(userId)
    .all<{ ticket_id: number }>();

  return results.map((r) => r.ticket_id);
}

export async function getExcludedIds(
  db: D1Database,
  userId: string
): Promise<number[]> {
  const { results } = await db
    .prepare('SELECT ticket_id FROM user_progress WHERE user_id = ? AND is_excluded = 1')
    .bind(userId)
    .all<{ ticket_id: number }>();

  return results.map((r) => r.ticket_id);
}

export async function getWeakQuestionIds(
  db: D1Database,
  userId: string,
  limit: number = 50
): Promise<number[]> {
  const { results } = await db
    .prepare(
      `SELECT ticket_id FROM user_progress 
       WHERE user_id = ? AND wrong_count > 0 
       ORDER BY wrong_count DESC, correct_count ASC 
       LIMIT ?`
    )
    .bind(userId, limit)
    .all<{ ticket_id: number }>();

  return results.map((r) => r.ticket_id);
}

export async function getAllUserProgress(
  db: D1Database,
  userId: string
): Promise<UserProgress[]> {
  const { results } = await db
    .prepare('SELECT * FROM user_progress WHERE user_id = ?')
    .bind(userId)
    .all<{
      ticket_id: number;
      correct_count: number;
      wrong_count: number;
      is_excluded: number;
      is_favorite: number;
      last_answered_at: string | null;
    }>();

  return results.map((row) => ({
    ticketId: row.ticket_id,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    isExcluded: row.is_excluded === 1,
    isFavorite: row.is_favorite === 1,
    lastAnsweredAt: row.last_answered_at,
  }));
}

// ============ EXAM HISTORY ============

export async function recordExamResult(
  db: D1Database,
  userId: string,
  correctCount: number,
  totalCount: number,
  durationSeconds: number
): Promise<void> {
  const passed = correctCount >= Math.ceil(totalCount * 0.9) ? 1 : 0;

  await db
    .prepare(
      'INSERT INTO exam_history (user_id, correct_count, total_count, passed, duration_seconds) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(userId, correctCount, totalCount, passed, durationSeconds)
    .run();
}

export async function getExamHistory(
  db: D1Database,
  userId: string,
  limit: number = 10
): Promise<ExamHistoryEntry[]> {
  const { results } = await db
    .prepare(
      'SELECT * FROM exam_history WHERE user_id = ? ORDER BY taken_at DESC LIMIT ?'
    )
    .bind(userId, limit)
    .all<{
      id: number;
      correct_count: number;
      total_count: number;
      passed: number;
      duration_seconds: number;
      taken_at: string;
    }>();

  return results.map((row) => ({
    id: row.id,
    correctCount: row.correct_count,
    totalCount: row.total_count,
    passed: row.passed === 1,
    durationSeconds: row.duration_seconds,
    takenAt: row.taken_at,
  }));
}

// ============ STATS ============

export async function getUserStats(
  db: D1Database,
  userId: string
): Promise<{
  totalPracticed: number;
  totalCorrect: number;
  totalWrong: number;
  favoritesCount: number;
  excludedCount: number;
}> {
  const row = await db
    .prepare(
      `SELECT 
        COUNT(*) as total_practiced,
        SUM(correct_count) as total_correct,
        SUM(wrong_count) as total_wrong,
        SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorites_count,
        SUM(CASE WHEN is_excluded = 1 THEN 1 ELSE 0 END) as excluded_count
       FROM user_progress WHERE user_id = ?`
    )
    .bind(userId)
    .first<{
      total_practiced: number;
      total_correct: number;
      total_wrong: number;
      favorites_count: number;
      excluded_count: number;
    }>();

  return {
    totalPracticed: row?.total_practiced || 0,
    totalCorrect: row?.total_correct || 0,
    totalWrong: row?.total_wrong || 0,
    favoritesCount: row?.favorites_count || 0,
    excludedCount: row?.excluded_count || 0,
  };
}
