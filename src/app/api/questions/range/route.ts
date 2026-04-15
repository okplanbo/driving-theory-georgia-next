import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsInRange, TOTAL_QUESTIONS } from '@/lib/questions';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = parseInt(searchParams.get('start') || '1', 10);
    const end = parseInt(searchParams.get('end') || '50', 10);

    // Validate parameters
    if (isNaN(start) || isNaN(end)) {
      return NextResponse.json(
        { success: false, error: 'Invalid start or end parameter' },
        { status: 400 }
      );
    }

    if (start < 1 || end < start) {
      return NextResponse.json(
        { success: false, error: 'Invalid range: start must be >= 1 and end must be >= start' },
        { status: 400 }
      );
    }

    // Limit range to prevent large responses
    const maxRange = 100;
    if (end - start + 1 > maxRange) {
      return NextResponse.json(
        { success: false, error: `Range too large. Maximum ${maxRange} questions per request.` },
        { status: 400 }
      );
    }

    const questions = getQuestionsInRange(start, end);

    return NextResponse.json({
      success: true,
      data: {
        questions,
        total: TOTAL_QUESTIONS,
        range: { start, end },
      },
    });
  } catch (error) {
    console.error('Error fetching question range:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
