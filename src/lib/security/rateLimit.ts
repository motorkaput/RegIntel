import { prisma } from '@/lib/db';

interface RateLimitConfig {
  tenant_id: string;
  qph_limit: number; // Queries per hour
  strict_mode: boolean;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_time: Date;
  current_usage: number;
}

// In-memory store for development (Redis replacement)
class InMemoryRateLimitStore {
  private store = new Map<string, { count: number; window_start: number }>();
  private readonly WINDOW_SIZE = 60 * 60 * 1000; // 1 hour in milliseconds

  get(key: string): { count: number; window_start: number } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if window has expired
    const now = Date.now();
    if (now - entry.window_start >= this.WINDOW_SIZE) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  increment(key: string): number {
    const now = Date.now();
    const existing = this.get(key);

    if (!existing) {
      // Create new window
      this.store.set(key, { count: 1, window_start: now });
      return 1;
    }

    // Increment existing window
    existing.count += 1;
    this.store.set(key, existing);
    return existing.count;
  }

  getRemainingTime(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return 0;

    const elapsed = Date.now() - entry.window_start;
    return Math.max(0, this.WINDOW_SIZE - elapsed);
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.window_start >= this.WINDOW_SIZE) {
        this.store.delete(key);
      }
    }
  }
}

// Global store instance
const rateLimitStore = new InMemoryRateLimitStore();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  rateLimitStore.cleanup();
}, 5 * 60 * 1000);

export async function checkRateLimit(
  tenantId: string,
  identifier: string = 'default'
): Promise<RateLimitResult> {
  try {
    // Get tenant rate limit configuration
    const config = await getRateLimitConfig(tenantId);
    const key = `rate_limit:${tenantId}:${identifier}`;
    
    // Get current usage
    const currentEntry = rateLimitStore.get(key);
    const currentUsage = currentEntry?.count || 0;
    
    // Check if limit exceeded
    const allowed = currentUsage < config.qph_limit;
    
    // Calculate remaining requests
    const remaining = Math.max(0, config.qph_limit - currentUsage);
    
    // Calculate reset time
    const resetTime = currentEntry 
      ? new Date(currentEntry.window_start + 60 * 60 * 1000) // 1 hour from window start
      : new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    return {
      allowed,
      remaining,
      reset_time: resetTime,
      current_usage: currentUsage
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if rate limit check fails
    return {
      allowed: true,
      remaining: 1000,
      reset_time: new Date(Date.now() + 60 * 60 * 1000),
      current_usage: 0
    };
  }
}

export async function incrementRateLimit(
  tenantId: string,
  identifier: string = 'default'
): Promise<RateLimitResult> {
  try {
    const key = `rate_limit:${tenantId}:${identifier}`;
    
    // Increment counter
    const newCount = rateLimitStore.increment(key);
    
    // Get configuration
    const config = await getRateLimitConfig(tenantId);
    
    // Calculate remaining
    const remaining = Math.max(0, config.qph_limit - newCount);
    
    // Get reset time
    const remainingTime = rateLimitStore.getRemainingTime(key);
    const resetTime = new Date(Date.now() + remainingTime);
    
    return {
      allowed: newCount <= config.qph_limit,
      remaining,
      reset_time: resetTime,
      current_usage: newCount
    };
  } catch (error) {
    console.error('Rate limit increment failed:', error);
    // Fail open
    return {
      allowed: true,
      remaining: 1000,
      reset_time: new Date(Date.now() + 60 * 60 * 1000),
      current_usage: 1
    };
  }
}

export async function getRateLimitStatus(
  tenantId: string,
  identifier: string = 'default'
): Promise<{
  current_usage: number;
  limit: number;
  remaining: number;
  window_start: Date;
  window_end: Date;
  percentage_used: number;
}> {
  try {
    const config = await getRateLimitConfig(tenantId);
    const key = `rate_limit:${tenantId}:${identifier}`;
    const entry = rateLimitStore.get(key);
    
    const currentUsage = entry?.count || 0;
    const remaining = Math.max(0, config.qph_limit - currentUsage);
    const percentageUsed = Math.round((currentUsage / config.qph_limit) * 100);
    
    const windowStart = entry 
      ? new Date(entry.window_start)
      : new Date();
    const windowEnd = new Date(windowStart.getTime() + 60 * 60 * 1000);
    
    return {
      current_usage: currentUsage,
      limit: config.qph_limit,
      remaining,
      window_start: windowStart,
      window_end: windowEnd,
      percentage_used: percentageUsed
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return {
      current_usage: 0,
      limit: 1000,
      remaining: 1000,
      window_start: new Date(),
      window_end: new Date(Date.now() + 60 * 60 * 1000),
      percentage_used: 0
    };
  }
}

async function getRateLimitConfig(tenantId: string): Promise<RateLimitConfig> {
  try {
    // Get tenant settings
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenant_id: tenantId },
      select: {
        rate_limit_qph: true,
        strict_mode: true
      }
    });

    if (settings) {
      return {
        tenant_id: tenantId,
        qph_limit: settings.rate_limit_qph || 1000,
        strict_mode: settings.strict_mode || false
      };
    }

    // Fallback to environment or default
    const defaultLimit = parseInt(process.env.DEFAULT_RATE_LIMIT_QPH || '1000');
    
    return {
      tenant_id: tenantId,
      qph_limit: defaultLimit,
      strict_mode: false
    };
  } catch (error) {
    console.error('Failed to get rate limit config:', error);
    return {
      tenant_id: tenantId,
      qph_limit: 1000,
      strict_mode: false
    };
  }
}

export function createRateLimitMiddleware() {
  return async (req: any, res: any, next: any) => {
    try {
      // Skip rate limiting for GET requests in non-strict mode
      if (req.method === 'GET') {
        return next();
      }

      // Get tenant ID from JWT or other auth mechanism
      const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];
      
      if (!tenantId) {
        return next(); // Skip if no tenant context
      }

      // Create identifier from IP + user
      const identifier = `${req.ip || 'unknown'}_${req.user?.id || 'anonymous'}`;
      
      // Check current rate limit
      const result = await checkRateLimit(tenantId, identifier);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': result.current_usage.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(result.reset_time.getTime() / 1000).toString()
      });

      if (!result.allowed) {
        const config = await getRateLimitConfig(tenantId);
        
        if (config.strict_mode) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please upgrade your plan or try again later.',
            retry_after: Math.ceil((result.reset_time.getTime() - Date.now()) / 1000),
            upgrade_url: '/dashboard/settings/billing'
          });
        } else {
          // In non-strict mode, log but allow the request
          console.warn(`Rate limit exceeded for tenant ${tenantId}, but strict mode is disabled`);
        }
      }

      // Increment counter for allowed requests
      await incrementRateLimit(tenantId, identifier);
      
      next();
    } catch (error) {
      console.error('Rate limiting middleware error:', error);
      next(); // Fail open
    }
  };
}

export async function resetRateLimit(
  tenantId: string,
  identifier: string = 'default'
): Promise<void> {
  const key = `rate_limit:${tenantId}:${identifier}`;
  rateLimitStore.store.delete(key);
}