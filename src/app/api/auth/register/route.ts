import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { signJWT } from '@/lib/auth/jwt';

const registerSchema = z.object({
  tenant_name: z.string().min(1),
  domain: z.string().min(1),
  admin_email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  bootstrap_token: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Verify bootstrap token
    if (data.bootstrap_token !== process.env.BOOTSTRAP_TOKEN) {
      return NextResponse.json({ error: 'Invalid bootstrap token' }, { status: 403 });
    }

    // Check if tenant domain already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { domain: data.domain }
    });

    if (existingTenant) {
      return NextResponse.json({ error: 'Domain already exists' }, { status: 409 });
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.admin_email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create tenant and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenant_name,
          domain: data.domain,
          settings: {},
        },
      });

      // Create admin user (using withRLS for consistency, though not required for initial setup)
      const user = await withRLS(
        tx as any,
        { tenantId: tenant.id, role: 'admin', userId: 'system' },
        async (client) => {
          return await client.user.create({
            data: {
              tenant_id: tenant.id,
              email: data.admin_email,
              password_hash: hashedPassword,
              role: 'admin',
              first_name: data.first_name,
              last_name: data.last_name,
              email_verified: true,
            },
          });
        }
      );

      // Create billing subscription
      await withRLS(
        tx as any,
        { tenantId: tenant.id, role: 'admin', userId: user.id },
        async (client) => {
          await client.billingSubscription.create({
            data: {
              tenant_id: tenant.id,
              plan_name: 'starter',
              status: 'active',
              provider: 'razorpay',
              starts_at: new Date(),
              ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          });
        }
      );

      // Audit log
      await withRLS(
        tx as any,
        { tenantId: tenant.id, role: 'admin', userId: user.id },
        async (client) => {
          await client.auditLog.create({
            data: {
              tenant_id: tenant.id,
              actor_user_id: user.id,
              entity_type: 'Tenant',
              entity_id: tenant.id,
              action: 'REGISTER_ADMIN',
              before: {} as any,
              after: { tenant_name: data.tenant_name, admin_email: data.admin_email, role: 'admin' },
            },
          });
        }
      );

      return { user, tenant };
    });

    // Generate JWT
    const jwtToken = await signJWT({
      sub: result.user.id,
      tenant_id: result.tenant.id,
      role: result.user.role,
      email: result.user.email,
    });

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        first_name: result.user.first_name,
        last_name: result.user.last_name,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        domain: result.tenant.domain,
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
    console.error('PerMeaTe registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}