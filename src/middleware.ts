import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and auth routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/invitations/accept') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/accept-invitation') ||
    pathname.startsWith('/invitation-expired') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for authentication on protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.sub);
      requestHeaders.set('x-tenant-id', payload.tenant_id);
      requestHeaders.set('x-user-role', payload.role);
      requestHeaders.set('x-user-email', payload.email);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};