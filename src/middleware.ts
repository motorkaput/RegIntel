import { NextRequest, NextResponse } from 'next/server';
import { generateRequestId, logger } from '@/lib/logging/logger';
import { createWAFMiddleware } from '@/lib/security/waf';
import { createRateLimitMiddleware } from '@/lib/security/rateLimit';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Generate request ID
  const requestId = generateRequestId();
  
  try {
    // Early WAF checks
    const wafMiddleware = createWAFMiddleware();
    const wafResult = await wafMiddleware(request);
    if (wafResult) {
      return wafResult; // Request was blocked
    }

    // Rate limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const rateLimitMiddleware = createRateLimitMiddleware();
      const rateLimitResult = await rateLimitMiddleware(request);
      if (rateLimitResult) {
        return rateLimitResult; // Rate limited
      }
    }

    // Continue to the next middleware/handler
    const response = NextResponse.next();

    // Add security headers
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // HSTS for production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Log the request
    const duration = Date.now() - startTime;
    logger.info('Request processed', {
      requestId,
      method: request.method,
      url: request.nextUrl.pathname,
      userAgent: request.headers.get('user-agent'),
      duration,
      status: response.status
    });

    return response;

  } catch (error) {
    logger.error('Middleware error', error as Error, { requestId });
    
    // Return a generic error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'X-Request-ID': requestId
        }
      }
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}