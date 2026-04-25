import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const secret = process.env.JWT_SECRET ?? '';
    const payload = await verifyToken(token, secret);
    return !!payload;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const authenticated = await isValidSession(token);

  if (['/', '/login'].includes(pathname) && authenticated) {
    return NextResponse.redirect(new URL('/practice', request.url));
  }

  if (pathname === '/signup' && authenticated) {
    return NextResponse.redirect(new URL('/settings', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup'],
}
