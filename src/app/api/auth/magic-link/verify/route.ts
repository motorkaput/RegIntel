import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { signJWT } from '@/lib/auth/jwt';

const prisma = new PrismaClient();

const verifySchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = verifySchema.parse(body);

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        email,
        magic_link_token: token,
        magic_link_expires: {
          gt: new Date(), // Token must not be expired
        },
      },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired magic link' },
        { status: 400 }
      );
    }

    // Clear magic link token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        magic_link_token: null,
        magic_link_expires: null,
        email_verified: true, // Mark email as verified
      },
    });

    // Generate JWT
    const jwtToken = await signJWT({
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      email: user.email,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenant_id: user.tenant_id,
        actor_user_id: user.id,
        entity_type: 'User',
        entity_id: user.id,
        action: 'LOGIN_SUCCESS',
        before: {} as any,
        after: { email, login_method: 'magic_link' },
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

    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Magic link verification error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}