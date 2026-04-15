import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { recordExamResult, recordAnswer } from '@/lib/db';
import { ExamAnswer } from '@/lib/types';

export const runtime = 'edge';

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

    const body = await request.json();
    const { answers, durationSeconds } = body as {
      answers: ExamAnswer[];
      durationSeconds: number;
    };

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'answers array is required' },
        { status: 400 }
      );
    }

    if (typeof durationSeconds !== 'number' || durationSeconds < 0) {
      return NextResponse.json(
        { success: false, error: 'valid durationSeconds is required' },
        { status: 400 }
      );
    }

    // Calculate results
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalCount = answers.length;
    const passingScore = Math.ceil(totalCount * 0.9);
    const passed = correctCount >= passingScore;

    // Record exam result
    await recordExamResult(
      env.DB,
      payload.userId,
      correctCount,
      totalCount,
      durationSeconds
    );

    // Also record individual answers for progress tracking
    for (const answer of answers) {
      await recordAnswer(
        env.DB,
        payload.userId,
        answer.ticketId,
        answer.isCorrect
      );
    }

    // Find wrong answers for review
    const wrongAnswers = answers
      .filter((a) => !a.isCorrect)
      .map((a) => a.ticketId);

    return NextResponse.json({
      success: true,
      data: {
        correctCount,
        totalCount,
        passingScore,
        passed,
        durationSeconds,
        wrongAnswerIds: wrongAnswers,
      },
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
