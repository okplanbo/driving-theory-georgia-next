import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import {
  hashPassword,
  generateToken,
  generateUUID,
  isValidEmail,
  isValidPassword,
  createAuthCookie,
} from '@/lib/auth';
import { getUserByEmail, createUser } from '@/lib/db';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.message },
        { status: 400 }
      );
    }

    const { env } = getRequestContext();

    // Check if user already exists
    const existingUser = await getUserByEmail(env.DB, email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const userId = generateUUID();
    const passwordHash = await hashPassword(password);
    
    await createUser(env.DB, userId, email.toLowerCase(), passwordHash);

    // Generate token and set cookie
    const token = await generateToken(userId, email.toLowerCase(), env.JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      data: {
        userId,
        email: email.toLowerCase(),
      },
    });

    response.headers.set('Set-Cookie', createAuthCookie(token));

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
