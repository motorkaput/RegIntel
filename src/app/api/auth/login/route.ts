import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { signJWT } from '@/lib/auth/jwt';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Simple rate limiting (in-memory)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const attemptKey = `${email}:${clientIP}`;
    
    // Check rate limiting
    const attempts = loginAttempts.get(attemptKey);
    const now = Date.now();
    
    if (attempts && attempts.count >= MAX_ATTEMPTS) {
      const timeSinceLastAttempt = now - attempts.lastAttempt;
      if (timeSinceLastAttempt < LOCKOUT_DURATION) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429 }
        );
      } else {
        // Reset attempts after lockout period
        loginAttempts.delete(attemptKey);
      }
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
      },
    });

    if (!user || !user.password_hash) {
      // Increment failed attempts
      const currentAttempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
      loginAttempts.set(attemptKey, {
        count: currentAttempts.count + 1,
        lastAttempt: now,
      });

      // Audit log failed attempt
      if (user) {
        await prisma.auditLog.create({
          data: {
            tenant_id: user.tenant_id,
            actor_user_id: null,
            entity_type: 'User',
            entity_id: user.id,
            action: 'LOGIN_FAILED',
            before: {} as any,
            after: { reason: 'invalid_credentials', email },
          },
        });
      }

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      // Increment failed attempts
      const currentAttempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
      loginAttempts.set(attemptKey, {
        count: currentAttempts.count + 1,
        lastAttempt: now,
      });

      // Audit log failed attempt
      await prisma.auditLog.create({
        data: {
          tenant_id: user.tenant_id,
          actor_user_id: user.id,
          entity_type: 'User',
          entity_id: user.id,
          action: 'LOGIN_FAILED',
          before: {} as any,
          after: { reason: 'invalid_password', email },
        },
      });

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(attemptKey);

    // Generate JWT
    const token = await signJWT({
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      email: user.email,
    });

    // Audit log successful login
    await prisma.auditLog.create({
      data: {
        tenant_id: user.tenant_id,
        actor_user_id: user.id,
        entity_type: 'User',
        entity_id: user.id,
        action: 'LOGIN_SUCCESS',
        before: {} as any,
        after: { email, login_method: 'password' },
      },
    });

    // Set cookie and return response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        domain: user.tenant.domain,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}