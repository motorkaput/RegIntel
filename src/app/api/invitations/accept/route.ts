import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { signJWT } from '@/lib/auth/jwt';

const prisma = new PrismaClient();

const acceptSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, first_name, last_name, password } = acceptSchema.parse(body);

    // Find valid invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        email,
        token,
        expires_at: {
          gt: new Date(), // Not expired
        },
        accepted_at: null, // Not already accepted
      },
      include: {
        tenant: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      // Check if user already exists
      let user = await tx.user.findUnique({
        where: { email },
      });

      if (user) {
        // User exists but not in this tenant - update their details
        if (user.tenant_id !== invitation.tenant_id) {
          return {
            error: 'Email already registered in another organization',
            status: 409,
          };
        }

        // Update existing user
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            password_hash: hashedPassword,
            role: invitation.role,
            first_name,
            last_name,
            email_verified: true,
          },
        });
      } else {
        // Create new user
        user = await tx.user.create({
          data: {
            tenant_id: invitation.tenant_id,
            email,
            password_hash: hashedPassword,
            role: invitation.role,
            first_name,
            last_name,
            email_verified: true,
          },
        });
      }

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          accepted_at: new Date(),
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          tenant_id: invitation.tenant_id,
          actor_user_id: user.id,
          entity_type: 'User',
          entity_id: user.id,
          action: 'INVITE_ACCEPTED',
          before: {} as any,
          after: {
            email,
            role: invitation.role,
            invitation_id: invitation.id,
          },
        },
      });

      return { user, tenant: invitation.tenant };
    });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // Generate JWT
    const jwtToken = await signJWT({
      sub: result.user.id,
      tenant_id: result.tenant.id,
      role: result.user.role,
      email: result.user.email,
    });

    // Set cookie and return response
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

    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Invitation acceptance error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}