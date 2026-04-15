import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export const runtime = 'edge';

export async function POST() {
  const response = NextResponse.json({
    success: true,
  });

  response.headers.set('Set-Cookie', clearAuthCookie());

  return response;
}
