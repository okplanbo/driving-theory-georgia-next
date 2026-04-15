import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getAuthCookie, verifyToken } from '@/lib/auth';
import { getUserById, getUserPreferences } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthCookie(request);

    if (!token) {
      return NextResponse.json({
        success: true,
        data: { authenticated: false },
      });
    }

    const { env } = getRequestContext();
    const payload = await verifyToken(token, env.JWT_SECRET);

    if (!payload) {
      return NextResponse.json({
        success: true,
        data: { authenticated: false },
      });
    }

    // Verify user still exists
    const user = await getUserById(env.DB, payload.userId);
    if (!user) {
      return NextResponse.json({
        success: true,
        data: { authenticated: false },
      });
    }

    // Get preferences
    const preferences = await getUserPreferences(env.DB, payload.userId);

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
        },
        preferences,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      success: true,
      data: { authenticated: false },
    });
  }
}
