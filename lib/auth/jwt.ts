import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');

export interface JWTPayload {
  sub: string;          // user_id
  tenant_id: string;    // tenant UUID
  role: string;         // UserRole
  email: string;
  iat: number;
  exp: number;
}

export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60), // 7 days
  };

  return await new SignJWT(fullPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(fullPayload.iat)
    .setExpirationTime(fullPayload.exp)
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function getTokenFromCookies(): string | null {
  try {
    const cookieStore = cookies();
    return cookieStore.get('auth-token')?.value || null;
  } catch (error) {
    return null;
  }
}

export function setTokenCookie(token: string): void {
  const cookieStore = cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export function clearTokenCookie(): void {
  const cookieStore = cookies();
  cookieStore.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export async function rotateToken(currentToken: string): Promise<string | null> {
  const payload = await verifyJWT(currentToken);
  if (!payload) return null;

  // Only rotate if token is more than 1 day old
  const now = Math.floor(Date.now() / 1000);
  if (now - payload.iat < 24 * 60 * 60) return currentToken;

  // Create new token with fresh iat/exp
  return await signJWT({
    sub: payload.sub,
    tenant_id: payload.tenant_id,
    role: payload.role,
    email: payload.email,
  });
}