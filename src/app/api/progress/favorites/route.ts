import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { getFavoriteIds, toggleFavorite } from '@/lib/db';
import { getQuestionsByIds } from '@/lib/questions';
import { Language, UserProgress } from '@/lib/types';

export const runtime = 'edge';

// Get all favorite question IDs
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

    const { searchParams } = new URL(request.url);
    const includeQuestions = searchParams.get('includeQuestions') === 'true';
    const language = (searchParams.get('lang') || 'en') as Language;

    const favoriteIds = await getFavoriteIds(env.DB, payload.userId);

    if (includeQuestions) {
      const questions = getQuestionsByIds(favoriteIds);
      const questionsWithPreview = questions.map((q) => ({
        ticketId: q.ticket_id,
        questionPreview: q.question[language].substring(0, 80) + (q.question[language].length > 80 ? '...' : ''),
        imageUrl: q.img,
      }));

      return NextResponse.json({
        success: true,
        data: {
          favoriteIds,
          questions: questionsWithPreview,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { favoriteIds },
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Toggle favorite status
export async function POST(request: NextRequest) {
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

    const body: UserProgress = await request.json();
    const { ticketId } = body;

    if (typeof ticketId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'ticketId is required' },
        { status: 400 }
      );
    }

    const isFavorite = await toggleFavorite(env.DB, payload.userId, ticketId);

    return NextResponse.json({
      success: true,
      data: { ticketId, isFavorite },
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
