import { ServerClient } from 'postmark';

const postmarkClient = new ServerClient(process.env.POSTMARK_API_TOKEN!);

export interface EmailTemplate {
  to: string;
  from: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    await postmarkClient.sendEmail({
      From: template.from,
      To: template.to,
      Subject: template.subject,
      HtmlBody: template.htmlBody,
      TextBody: template.textBody,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

export function generateMagicLinkEmail(email: string, magicLink: string): EmailTemplate {
  return {
    to: email,
    from: 'noreply@permeate.enterprise',
    subject: 'Sign in to PerMeaTe Enterprise',
    htmlBody: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Sign in to PerMeaTe Enterprise</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">PerMeaTe Enterprise</h1>
          </div>
          
          <h2>Sign in to your account</h2>
          
          <p>Click the button below to sign in to your PerMeaTe Enterprise account:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Sign In</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${magicLink}</p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            This link will expire in 15 minutes. If you didn't request this email, you can safely ignore it.
          </p>
        </body>
      </html>
    `,
    textBody: `
      Sign in to PerMeaTe Enterprise
      
      Click this link to sign in to your account: ${magicLink}
      
      This link will expire in 15 minutes. If you didn't request this email, you can safely ignore it.
    `,
  };
}

export function generateInvitationEmail(inviterName: string, organizationName: string, inviteLink: string): EmailTemplate {
  return {
    to: '',
    from: 'noreply@permeate.enterprise',
    subject: `You've been invited to join ${organizationName}`,
    htmlBody: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invitation to ${organizationName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb;">PerMeaTe Enterprise</h1>
          </div>
          
          <h2>You've been invited!</h2>
          
          <p>${inviterName} has invited you to join <strong>${organizationName}</strong> on PerMeaTe Enterprise.</p>
          
          <p>PerMeaTe Enterprise helps teams transform strategic objectives into actionable results.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${inviteLink}</p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            This invitation will expire in 7 days. If you weren't expecting this invitation, you can safely ignore it.
          </p>
        </body>
      </html>
    `,
    textBody: `
      You've been invited to join ${organizationName}
      
      ${inviterName} has invited you to join ${organizationName} on PerMeaTe Enterprise.
      
      Click this link to accept the invitation: ${inviteLink}
      
      This invitation will expire in 7 days. If you weren't expecting this invitation, you can safely ignore it.
    `,
  };
}