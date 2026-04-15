import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { getExcludedIds, toggleExclusion } from '@/lib/db';
import { getQuestionsByIds } from '@/lib/questions';
import { Language } from '@/lib/types';

export const runtime = 'edge';

// Get all excluded question IDs
export async function GET(request: NextRequest) {
  try {
    const token = getAuthCookie(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { env } = getRequestContext();
    const payload = await verifyToken(token, env.JWT_SECRET);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeQuestions = searchParams.get('includeQuestions') === 'true';
    const language = (searchParams.get('lang') || 'en') as Language;

    const excludedIds = await getExcludedIds(env.DB, payload.userId);

    if (includeQuestions) {
      const questions = getQuestionsByIds(excludedIds);
      const questionsWithPreview = questions.map((q) => ({
        ticketId: q.ticket_id,
        questionPreview: q.question[language].substring(0, 80) + (q.question[language].length > 80 ? '...' : ''),
      }));

      return NextResponse.json({
        success: true,
        data: {
          excludedIds,
          questions: questionsWithPreview,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { excludedIds },
    });
  } catch (error) {
    console.error('Error fetching exclusions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Toggle exclusion status
export async function POST(request: NextRequest) {
  try {
    const token = getAuthCookie(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { env } = getRequestContext();
    const payload = await verifyToken(token, env.JWT_SECRET);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ticketId } = body;

    if (typeof ticketId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'ticketId is required' },
        { status: 400 }
      );
    }

    const isExcluded = await toggleExclusion(env.DB, payload.userId, ticketId);

    return NextResponse.json({
      success: true,
      data: { ticketId, isExcluded },
    });
  } catch (error) {
    console.error('Error toggling exclusion:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
