import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { signJWT } from '@/lib/auth/jwt';

const acceptInvitationSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = acceptInvitationSchema.parse(body);

    // Find and validate invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token: data.token },
      include: { tenant: true },
    });

    if (!invitation || invitation.status !== 'pending' || invitation.expires_at < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const result = await withRLS(
      prisma,
      { tenantId: invitation.tenant_id, role: 'system', userId: 'system' },
      async (client) => {
        return await client.$transaction(async (tx) => {
          // Check if user already exists
          let user = await tx.user.findUnique({
            where: { email: invitation.email },
          });

          if (user) {
            // Update existing user with new role and tenant if not already in this tenant
            if (user.tenant_id !== invitation.tenant_id) {
              return NextResponse.json({ error: 'User belongs to different organization' }, { status: 409 });
            }
            
            // Update user with new role and password
            user = await tx.user.update({
              where: { id: user.id },
              data: {
                role: invitation.role,
                password_hash: hashedPassword,
                first_name: data.first_name || user.first_name,
                last_name: data.last_name || user.last_name,
                email_verified: true,
              },
            });
          } else {
            // Create new user
            user = await tx.user.create({
              data: {
                tenant_id: invitation.tenant_id,
                email: invitation.email,
                password_hash: hashedPassword,
                role: invitation.role,
                first_name: data.first_name || invitation.first_name || '',
                last_name: data.last_name || invitation.last_name || '',
                email_verified: true,
              },
            });
          }

          // Mark invitation as accepted
          await tx.invitation.update({
            where: { token: data.token },
            data: { 
              status: 'accepted',
              accepted_at: new Date(),
            },
          });

          // Audit log
          await tx.auditLog.create({
            data: {
              tenant_id: invitation.tenant_id,
              actor_user_id: user.id,
              entity_type: 'Invitation',
              entity_id: invitation.id,
              action: 'ACCEPT_INVITATION',
              before: { status: 'pending' },
              after: { 
                status: 'accepted', 
                user_id: user.id,
                timestamp: new Date() 
              },
            },
          });

          return { user, tenant: invitation.tenant };
        });
      }
    );

    // Generate JWT
    const jwtToken = await signJWT({
      sub: result.user.id,
      tenant_id: result.tenant.id,
      role: result.user.role,
      email: result.user.email,
    });

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
    console.error('Invitation acceptance error:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}

// GET method for invitation verification page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find and validate invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { tenant: true },
    });

    if (!invitation || invitation.status !== 'pending' || invitation.expires_at < new Date()) {
      return NextResponse.redirect(new URL('/invitation-expired', request.url));
    }

    // Redirect to invitation acceptance page with token
    return NextResponse.redirect(new URL(`/accept-invitation?token=${token}`, request.url));
  } catch (error) {
    console.error('Invitation verification error:', error);
    return NextResponse.json({ error: 'Failed to verify invitation' }, { status: 500 });
  }
}