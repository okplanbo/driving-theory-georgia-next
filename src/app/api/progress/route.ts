import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { recordAnswer, getUserProgress } from '@/lib/db';

export const runtime = 'edge';

// Record an answer
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
    const { ticketId, isCorrect } = body;

    if (typeof ticketId !== 'number' || typeof isCorrect !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    await recordAnswer(env.DB, payload.userId, ticketId, isCorrect);

    // Return updated progress for this question
    const progress = await getUserProgress(env.DB, payload.userId, ticketId);

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Error recording answer:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get progress for a specific question
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
    const ticketId = parseInt(searchParams.get('ticketId') || '', 10);

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { success: false, error: 'ticketId parameter required' },
        { status: 400 }
      );
    }

    const progress = await getUserProgress(env.DB, payload.userId, ticketId);

    return NextResponse.json({
      success: true,
      data: progress || {
        ticketId,
        correctCount: 0,
        wrongCount: 0,
        isExcluded: false,
        isFavorite: false,
        lastAnsweredAt: null,
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
