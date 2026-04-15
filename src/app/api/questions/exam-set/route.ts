import { NextResponse } from 'next/server';
import { getExamQuestions } from '@/lib/questions';

export const runtime = 'edge';

const EXAM_QUESTION_COUNT = 30;

export async function GET() {
  try {
    const questions = getExamQuestions(EXAM_QUESTION_COUNT);

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No questions available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        questions,
        totalCount: questions.length,
        passingScore: Math.ceil(questions.length * 0.9), // 90% to pass
        timeLimitMinutes: 30,
      },
    });
  } catch (error) {
    console.error('Error fetching exam questions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
