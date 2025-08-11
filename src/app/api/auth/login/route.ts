import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { signJWT } from '@/lib/auth/jwt';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { tenant: true },
    });

    if (!user || !await bcrypt.compare(data.password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const jwtToken = await signJWT({
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      email: user.email,
    });

    // Audit log using RLS
    await withRLS(
      prisma,
      { tenantId: user.tenant_id, role: user.role, userId: user.id },
      async (client) => {
        await client.auditLog.create({
          data: {
            tenant_id: user.tenant_id,
            actor_user_id: user.id,
            entity_type: 'User',
            entity_id: user.id,
            action: 'LOGIN_SUCCESS',
            before: {} as any,
            after: { email: data.email, timestamp: new Date() },
          },
        });
      }
    );

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

    // Set httpOnly cookie
    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('PerMeaTe login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}