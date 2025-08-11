import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { signJWT } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find and validate magic link token
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
      include: { user: { include: { tenant: true } } },
    });

    if (!magicLink || magicLink.used || magicLink.expires_at < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired magic link' }, { status: 400 });
    }

    const user = magicLink.user;

    // Mark magic link as used and create audit log using RLS
    await withRLS(
      prisma,
      { tenantId: user.tenant_id, role: user.role, userId: user.id },
      async (client) => {
        await client.magicLink.update({
          where: { token },
          data: { used: true },
        });

        // Audit log
        await client.auditLog.create({
          data: {
            tenant_id: user.tenant_id,
            actor_user_id: user.id,
            entity_type: 'User',
            entity_id: user.id,
            action: 'MAGIC_LINK_LOGIN',
            before: {} as any,
            after: { email: user.email, timestamp: new Date() },
          },
        });
      }
    );

    // Generate JWT
    const jwtToken = await signJWT({
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      email: user.email,
    });

    // Create response with cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.json({ error: 'Failed to verify magic link' }, { status: 500 });
  }
}