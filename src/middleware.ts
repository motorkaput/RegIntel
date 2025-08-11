import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';

const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/magic-link',
  '/magic-link/verify',
];

const authApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/magic-link',
  '/api/auth/magic-link/verify',
  '/api/auth/logout',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and _next
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Allow public routes and auth API routes
  if (publicRoutes.includes(pathname) || 
      authApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get JWT token from cookies
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    // Redirect to login for protected routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/(dashboard)')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Return 401 for API routes
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { 'content-type': 'application/json' } 
        }
      );
    }
    
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify JWT token
  const payload = await verifyJWT(token);
  
  if (!payload) {
    // Clear invalid token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth-token', '', { 
      httpOnly: true, 
      maxAge: 0, 
      path: '/' 
    });
    return response;
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth-token', '', { 
      httpOnly: true, 
      maxAge: 0, 
      path: '/' 
    });
    return response;
  }

  // Add auth headers for server handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', payload.tenant_id);
  requestHeaders.set('x-user-id', payload.sub);
  requestHeaders.set('x-role', payload.role);
  requestHeaders.set('x-email', payload.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};