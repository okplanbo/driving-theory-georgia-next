import { NextRequest, NextResponse } from 'next/server';
import { getRandomQuestion, getWeightedRandomQuestion } from '@/lib/questions';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { getExcludedIds, getWeakQuestionIds, getUserPreferences } from '@/lib/db';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    let excludeIds: number[] = [];
    let priorityIds: number[] = [];
    let usePriority = false;

    // Try to get user context for personalized random
    const token = getAuthCookie(request);
    
    if (token) {
      try {
        const { env }: { env: any } = getRequestContext();
        const payload = await verifyToken(token, env.JWT_SECRET);
        
        if (payload) {
          // Get user's excluded questions
          excludeIds = await getExcludedIds(env.DB, payload.userId);
          
          // Check if user wants to prioritize weak questions
          const prefs = await getUserPreferences(env.DB, payload.userId);
          
          if (prefs.prioritizeWeak) {
            usePriority = true;
            priorityIds = await getWeakQuestionIds(env.DB, payload.userId);
          }
        }
      } catch {
        // Continue without user context
      }
    }

    // Get random question
    const question = usePriority
      ? getWeightedRandomQuestion(excludeIds, priorityIds, 3)
      : getRandomQuestion(excludeIds);

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'No questions available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Error fetching random question:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
