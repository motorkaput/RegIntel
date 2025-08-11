import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getJWTFromCookies } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { sendEmail, generateInvitationEmail } from '@/lib/email';

const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'org_leader', 'functional_leader', 'project_lead', 'team_member']),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await getJWTFromCookies();
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and org_leaders can create invitations
    if (!['admin', 'org_leader'].includes(payload.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const data = createInvitationSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser && existingUser.tenant_id === payload.tenant_id) {
      return NextResponse.json({ error: 'User already exists in this organization' }, { status: 409 });
    }

    const invitation = await withRLS(
      prisma,
      { tenantId: payload.tenant_id, role: payload.role, userId: payload.sub },
      async (client) => {
        // Generate invitation token
        const token = nanoid(32);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create invitation
        const invitation = await client.invitation.create({
          data: {
            token,
            tenant_id: payload.tenant_id,
            email: data.email,
            role: data.role,
            first_name: data.first_name,
            last_name: data.last_name,
            invited_by: payload.sub,
            expires_at: expiresAt,
            status: 'pending',
          },
        });

        // Get inviter and tenant info
        const inviter = await client.user.findUnique({
          where: { id: payload.sub },
          include: { tenant: true },
        });

        // Audit log
        await client.auditLog.create({
          data: {
            tenant_id: payload.tenant_id,
            actor_user_id: payload.sub,
            entity_type: 'Invitation',
            entity_id: invitation.id,
            action: 'CREATE_INVITATION',
            before: {} as any,
            after: { 
              email: data.email, 
              role: data.role, 
              expires_at: expiresAt 
            },
          },
        });

        return { invitation, inviter };
      }
    );

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/api/invitations/accept?token=${invitation.invitation.token}`;

    // Send invitation email
    const emailTemplate = generateInvitationEmail(
      `${invitation.inviter?.first_name} ${invitation.inviter?.last_name}`,
      invitation.inviter?.tenant.name || 'Organization',
      inviteLink
    );
    emailTemplate.to = data.email;

    const emailSent = await sendEmail(emailTemplate);

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.invitation.id,
        email: invitation.invitation.email,
        role: invitation.invitation.role,
        status: invitation.invitation.status,
        expires_at: invitation.invitation.expires_at,
      },
    });
  } catch (error) {
    console.error('Invitation creation error:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}