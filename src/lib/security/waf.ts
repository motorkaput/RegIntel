import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

// Basic WAF patterns for common attacks
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
  /(OR|AND)\s+\d+\s*=\s*\d+/i,
  /['";]\s*(OR|AND|UNION)/i,
  /--\s/,
  /\/\*.*\*\//
];

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i
];

const SUSPICIOUS_PATTERNS = [
  /\.\./,  // Directory traversal
  /\/etc\/passwd/i,
  /\/proc\/self/i,
  /\x00/,  // Null bytes
  /%00/,   // URL encoded null bytes
];

interface WAFResult {
  blocked: boolean;
  reason?: string;
  pattern?: string;
}

class WebApplicationFirewall {
  private maxBodySize: number;
  private blockedIPs: Set<string>;
  private rateLimitMap: Map<string, { count: number; resetTime: number }>;

  constructor() {
    this.maxBodySize = 10 * 1024 * 1024; // 10MB default
    this.blockedIPs = new Set();
    this.rateLimitMap = new Map();
  }

  checkSQLInjection(input: string): WAFResult {
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        return {
          blocked: true,
          reason: 'SQL injection attempt detected',
          pattern: pattern.toString()
        };
      }
    }
    return { blocked: false };
  }

  checkXSS(input: string): WAFResult {
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(input)) {
        return {
          blocked: true,
          reason: 'XSS attempt detected',
          pattern: pattern.toString()
        };
      }
    }
    return { blocked: false };
  }

  checkSuspiciousPatterns(input: string): WAFResult {
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(input)) {
        return {
          blocked: true,
          reason: 'Suspicious pattern detected',
          pattern: pattern.toString()
        };
      }
    }
    return { blocked: false };
  }

  checkContentType(request: NextRequest): WAFResult {
    const method = request.method;
    const contentType = request.headers.get('content-type');

    // Only check POST/PUT/PATCH requests
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      return { blocked: false };
    }

    // Require content-type for requests with body
    if (!contentType) {
      return {
        blocked: true,
        reason: 'Missing Content-Type header'
      };
    }

    // Allow specific content types
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain'
    ];

    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().startsWith(type)
    );

    if (!isAllowed) {
      return {
        blocked: true,
        reason: `Unsupported Content-Type: ${contentType}`
      };
    }

    return { blocked: false };
  }

  checkBodySize(contentLength: string | null): WAFResult {
    if (!contentLength) return { blocked: false };

    const size = parseInt(contentLength, 10);
    if (isNaN(size)) return { blocked: false };

    if (size > this.maxBodySize) {
      return {
        blocked: true,
        reason: `Request body too large: ${size} bytes (max: ${this.maxBodySize})`
      };
    }

    return { blocked: false };
  }

  checkBlacklist(ip: string): WAFResult {
    if (this.blockedIPs.has(ip)) {
      return {
        blocked: true,
        reason: 'IP address is blacklisted'
      };
    }
    return { blocked: false };
  }

  // Simple rate limiting (basic implementation)
  checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): WAFResult {
    const now = Date.now();
    const key = ip;
    const record = this.rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { blocked: false };
    }

    record.count++;

    if (record.count > limit) {
      return {
        blocked: true,
        reason: `Rate limit exceeded: ${record.count}/${limit} requests`
      };
    }

    return { blocked: false };
  }

  checkRequest(request: NextRequest): WAFResult {
    const ip = this.getClientIP(request);
    const url = request.url;
    const userAgent = request.headers.get('user-agent') || '';

    // Check IP blacklist
    const blacklistCheck = this.checkBlacklist(ip);
    if (blacklistCheck.blocked) return blacklistCheck;

    // Check rate limiting
    const rateLimitCheck = this.checkRateLimit(ip);
    if (rateLimitCheck.blocked) return rateLimitCheck;

    // Check content type
    const contentTypeCheck = this.checkContentType(request);
    if (contentTypeCheck.blocked) return contentTypeCheck;

    // Check body size
    const contentLength = request.headers.get('content-length');
    const bodySizeCheck = this.checkBodySize(contentLength);
    if (bodySizeCheck.blocked) return bodySizeCheck;

    // Check URL for malicious patterns
    const urlCheck = this.checkSuspiciousPatterns(url);
    if (urlCheck.blocked) return urlCheck;

    const xssUrlCheck = this.checkXSS(url);
    if (xssUrlCheck.blocked) return xssUrlCheck;

    const sqlUrlCheck = this.checkSQLInjection(url);
    if (sqlUrlCheck.blocked) return sqlUrlCheck;

    // Check User-Agent
    const userAgentCheck = this.checkSuspiciousPatterns(userAgent);
    if (userAgentCheck.blocked) return userAgentCheck;

    return { blocked: false };
  }

  private getClientIP(request: NextRequest): string {
    // Check various headers for the real IP
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (cfConnectingIP) return cfConnectingIP;
    if (xRealIP) return xRealIP;
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    return 'unknown';
  }

  blockIP(ip: string): void {
    this.blockedIPs.add(ip);
    logger.warn('IP address blocked', { ip, reason: 'Manual block' });
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    logger.info('IP address unblocked', { ip });
  }
}

export const waf = new WebApplicationFirewall();

export function createWAFMiddleware() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const requestId = request.headers.get('x-request-id') || 'unknown';
    const ip = waf['getClientIP'](request);

    try {
      const result = waf.checkRequest(request);

      if (result.blocked) {
        logger.warn('WAF blocked request', {
          requestId,
          ip,
          url: request.url,
          method: request.method,
          reason: result.reason,
          pattern: result.pattern
        });

        return NextResponse.json(
          {
            error: 'Request blocked by security policy',
            code: 'WAF_BLOCKED'
          },
          { status: 403 }
        );
      }

      // Request passed WAF checks
      return null;
    } catch (error) {
      logger.error('WAF middleware error', error as Error, { requestId, ip });
      // Fail open - allow request if WAF fails
      return null;
    }
  };
}