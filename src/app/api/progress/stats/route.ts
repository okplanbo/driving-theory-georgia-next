import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { getUserStats, getWeakQuestionIds, getExamHistory, getAllUserProgress } from '@/lib/db';
import { getQuestionById, TOTAL_QUESTIONS } from '@/lib/questions';
import { Language, WeakQuestion } from '@/lib/types';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthCookie(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { env }: { env: any } = getRequestContext();
    const payload = await verifyToken(token, env.JWT_SECRET);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get language from query param for question previews
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get('lang') || 'en') as Language;

    // Get basic stats
    const stats = await getUserStats(env.DB, payload.userId);

    // Calculate correct rate
    const totalAnswers = stats.totalCorrect + stats.totalWrong;
    const correctRate = totalAnswers > 0 
      ? Math.round((stats.totalCorrect / totalAnswers) * 100) 
      : 0;

    // Get weak questions with previews
    const weakIds = await getWeakQuestionIds(env.DB, payload.userId, 20);
    const allProgress = await getAllUserProgress(env.DB, payload.userId);
    
    const weakQuestions: WeakQuestion[] = weakIds.map((ticketId) => {
      const question = getQuestionById(ticketId);
      const progress = allProgress.find((p) => p.ticketId === ticketId);
      
      return {
        ticketId,
        questionPreview: question 
          ? question.question[language].substring(0, 60) + '...'
          : `Question #${ticketId}`,
        wrongCount: progress?.wrongCount || 0,
        correctCount: progress?.correctCount || 0,
      };
    });

    // Get recent exam history
    const recentExams = await getExamHistory(env.DB, payload.userId, 5);

    return NextResponse.json({
      success: true,
      data: {
        totalPracticed: stats.totalPracticed,
        totalQuestions: TOTAL_QUESTIONS,
        correctRate,
        favoritesCount: stats.favoritesCount,
        excludedCount: stats.excludedCount,
        weakQuestions,
        recentExams,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
