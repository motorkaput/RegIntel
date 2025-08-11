import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { withRLSFromRequest } from '@/lib/db/rls';
import { canInviteUsers } from '@/lib/auth/rbac';
import { getServerSession } from '@/lib/auth/session';
import { sendInvitation } from '@/lib/email/postmark';

const prisma = new PrismaClient();

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'org_leader', 'functional_leader', 'project_lead', 'team_member']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check permissions
    if (!canInviteUsers(session.role as any)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = inviteSchema.parse(body);

    const result = await withRLSFromRequest(prisma, request, async () => {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.tenant_id === session.tenantId) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 409 }
        );
      }

      // Check if invitation already exists
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          email,
          tenant_id: session.tenantId,
          accepted_at: null,
        },
      });

      if (existingInvitation) {
        return NextResponse.json(
          { error: 'Invitation already sent to this email' },
          { status: 409 }
        );
      }

      // Generate invitation token
      const token = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          tenant_id: session.tenantId,
          email,
          role,
          token,
          expires_at: expires,
        },
        include: {
          tenant: true,
        },
      });

      // Create invite URL
      const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
      const inviteUrl = `${baseUrl}/invitations/accept?token=${token}&email=${encodeURIComponent(email)}`;

      // Send invitation email
      await sendInvitation(email, inviteUrl, role, invitation.tenant.name);

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenant_id: session.tenantId,
          actor_user_id: session.userId,
          entity_type: 'Invitation',
          entity_id: invitation.id,
          action: 'INVITE_CREATED',
          before: {} as any,
          after: {
            email,
            role,
            invited_by: session.email,
            expires_at: expires,
          },
        },
      });

      return NextResponse.json({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.expires_at,
        },
      });
    });

    return result;
  } catch (error) {
    console.error('Invitation creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}