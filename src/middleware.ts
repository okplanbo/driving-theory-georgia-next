import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

function getJwtSecret(): string {
  try {
    const { env }: { env: any } = getRequestContext();
    if (env.JWT_SECRET) return env.JWT_SECRET;
  } catch {
    // not in Cloudflare context, fall back to process.env
  }
  return process.env.JWT_SECRET ?? '';
}

async function isValidSession(token: string | undefined): Promise<boolean> {
    if (!token) {
        return false;
    }

    try {
        const payload = await verifyToken(token, getJwtSecret());
        return !!payload;
    } catch {
        return false;
    }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value
  const authenticated = await isValidSession(token);

  if (pathname === '/' && authenticated) {
    return NextResponse.redirect(new URL('/practice', request.url))
  }

  if ((pathname === '/login' || pathname === '/signup') && authenticated) {
    return NextResponse.redirect(new URL('/settings', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/signup'],
}
