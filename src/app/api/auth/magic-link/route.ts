import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db';
import { withRLS } from '@/lib/db/rls';
import { sendEmail, generateMagicLinkEmail } from '@/lib/email';

const magicLinkSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = magicLinkSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate magic link token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store magic link token using RLS
    await withRLS(
      prisma,
      { tenantId: user.tenant_id, role: user.role, userId: user.id },
      async (client) => {
        await client.magicLink.create({
          data: {
            token,
            user_id: user.id,
            expires_at: expiresAt,
            used: false,
          },
        });

        // Audit log
        await client.auditLog.create({
          data: {
            tenant_id: user.tenant_id,
            actor_user_id: user.id,
            entity_type: 'MagicLink',
            entity_id: token,
            action: 'CREATE_MAGIC_LINK',
            before: {} as any,
            after: { email: data.email, expires_at: expiresAt },
          },
        });
      }
    );

    // Generate magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/api/auth/magic-link/verify?token=${token}`;

    // Send magic link email
    const emailTemplate = generateMagicLinkEmail(data.email, magicLink);
    const emailSent = await sendEmail(emailTemplate);

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send magic link email' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Magic link sent to your email' 
    });
  } catch (error) {
    console.error('Magic link generation error:', error);
    return NextResponse.json({ error: 'Failed to generate magic link' }, { status: 500 });
  }
}