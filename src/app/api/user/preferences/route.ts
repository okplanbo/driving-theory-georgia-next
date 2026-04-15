import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { getUserPreferences, upsertUserPreferences } from '@/lib/db';
import { Language } from '@/lib/types';

export const runtime = 'edge';

// Get user preferences
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

    const preferences = await getUserPreferences(env.DB, payload.userId);

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user preferences
export async function PUT(request: NextRequest) {
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
    const { preferredLanguage, prioritizeWeak } = body;

    // Validate language if provided
    if (preferredLanguage !== undefined) {
      const validLanguages: Language[] = ['ka', 'en', 'ru'];
      if (!validLanguages.includes(preferredLanguage)) {
        return NextResponse.json(
          { success: false, error: 'Invalid language. Must be ka, en, or ru' },
          { status: 400 }
        );
      }
    }

    await upsertUserPreferences(env.DB, payload.userId, {
      preferredLanguage,
      prioritizeWeak: prioritizeWeak !== undefined ? Boolean(prioritizeWeak) : undefined,
    });

    const updatedPreferences = await getUserPreferences(env.DB, payload.userId);

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
