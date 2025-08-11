import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { signJWT, setTokenCookie } from '@/lib/auth/jwt';

const prisma = new PrismaClient();

const registerSchema = z.object({
  tenant_name: z.string().min(1).max(100),
  domain: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  admin_email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  bootstrap_token: z.string().min(1), // For security validation
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Validate bootstrap token (simple check - in production use proper validation)
    if (validatedData.bootstrap_token !== process.env.BOOTSTRAP_TOKEN) {
      return NextResponse.json(
        { error: 'Invalid bootstrap token' },
        { status: 403 }
      );
    }

    // Check if domain already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { domain: validatedData.domain },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 409 }
      );
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: validatedData.admin_email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: validatedData.tenant_name,
          domain: validatedData.domain,
          subscription_tier: 'starter',
        },
      });

      // Create tenant settings
      await tx.tenantSettings.create({
        data: {
          tenant_id: tenant.id,
          payment_provider: 'razorpay',
          email_from: `noreply@${validatedData.domain}.local`,
          data_retention_days: 365,
          rate_limit_qph: 100,
        },
      });

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          tenant_id: tenant.id,
          email: validatedData.admin_email,
          password_hash: hashedPassword,
          role: 'admin',
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          email_verified: true,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          tenant_id: tenant.id,
          actor_user_id: adminUser.id,
          entity_type: 'User',
          entity_id: adminUser.id,
          action: 'REGISTER_ADMIN',
          before: {} as any,
          after: {
            email: adminUser.email,
            role: adminUser.role,
            tenant_domain: tenant.domain,
          },
        },
      });

      return { tenant, adminUser };
    });

    // Generate JWT
    const token = await signJWT({
      sub: result.adminUser.id,
      tenant_id: result.tenant.id,
      role: result.adminUser.role,
      email: result.adminUser.email,
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        role: result.adminUser.role,
        first_name: result.adminUser.first_name,
        last_name: result.adminUser.last_name,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        domain: result.tenant.domain,
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
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}