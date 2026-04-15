import { SignJWT, jwtVerify } from 'jose';
import { AuthPayload } from './types';

// JWT expiration time (7 days)
const JWT_EXPIRATION = '7d';

// Cookie name for JWT token
export const AUTH_COOKIE_NAME = 'auth_token';

// Generate a secure random salt
async function generateSalt(length: number = 16): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(length));
}

// Hash password using PBKDF2 (Web Crypto API compatible with Cloudflare Workers)
export async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt(16);
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  // Convert to hex string
  const hashArray = new Uint8Array(derivedBits);
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Combine salt and hash, separated by ':'
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${saltHex}:${hashHex}`;
}

// Verify password against stored hash
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [saltHex, originalHash] = storedHash.split(':');
  
  if (!saltHex || !originalHash) {
    return false;
  }

  // Convert salt from hex to Uint8Array
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive bits using same parameters
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  // Convert to hex and compare
  const hashArray = new Uint8Array(derivedBits);
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex === originalHash;
}

// Generate JWT token
export async function generateToken(
  userId: string,
  email: string,
  secret: string
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secretKey);

  return token;
}

// Verify JWT token
export async function verifyToken(
  token: string,
  secret: string
): Promise<AuthPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

// Generate UUID v4
export function generateUUID(): string {
  return crypto.randomUUID();
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength (min 8 characters)
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  return { valid: true };
}

// Parse auth cookie from request
export function getAuthCookie(request: Request): string | null {
  const cookies = request.headers.get('cookie');
  if (!cookies) return null;

  const authCookie = cookies
    .split(';')
    .find((c) => c.trim().startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!authCookie) return null;

  return authCookie.split('=')[1].trim();
}

// Create auth cookie header value
export function createAuthCookie(token: string, maxAge: number = 60 * 60 * 24 * 7): string {
  return `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

// Create cookie to clear auth
export function clearAuthCookie(): string {
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
