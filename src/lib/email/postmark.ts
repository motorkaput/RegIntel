import { ServerClient } from 'postmark';

interface EmailResult {
  success: boolean;
  devUrl?: string;
  error?: string;
}

const isDevMode = process.env.DEV_EMAIL_MODE === 'console';
const postmarkClient = process.env.POSTMARK_TOKEN ? new ServerClient(process.env.POSTMARK_TOKEN) : null;

function logEmailToConsole(subject: string, to: string, url: string): void {
  console.log('='.repeat(60));
  console.log('📧 EMAIL (DEV MODE)');
  console.log('='.repeat(60));
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Action URL: ${url}`);
  console.log('='.repeat(60));
}

export async function sendMagicLink(email: string, magicLinkUrl: string): Promise<EmailResult> {
  const subject = 'Sign in to PerMeaTe Enterprise';
  
  if (isDevMode) {
    logEmailToConsole(subject, email, magicLinkUrl);
    return { success: true, devUrl: magicLinkUrl };
  }

  if (!postmarkClient) {
    return { success: false, error: 'Postmark not configured' };
  }

  try {
    await postmarkClient.sendEmail({
      From: process.env.EMAIL_FROM || 'no-reply@permeate.local',
      To: email,
      Subject: subject,
      HtmlBody: generateMagicLinkEmailHtml(email, magicLinkUrl),
      TextBody: generateMagicLinkEmailText(email, magicLinkUrl),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Postmark email error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendInvitation(
  email: string, 
  inviteUrl: string, 
  role: string,
  inviterName: string,
  organizationName: string
): Promise<EmailResult> {
  const subject = `You've been invited to join ${organizationName}`;
  
  if (isDevMode) {
    logEmailToConsole(subject, email, inviteUrl);
    return { success: true, devUrl: inviteUrl };
  }

  if (!postmarkClient) {
    return { success: false, error: 'Postmark not configured' };
  }

  try {
    await postmarkClient.sendEmail({
      From: process.env.EMAIL_FROM || 'no-reply@permeate.local',
      To: email,
      Subject: subject,
      HtmlBody: generateInvitationEmailHtml(email, inviteUrl, role, inviterName, organizationName),
      TextBody: generateInvitationEmailText(email, inviteUrl, role, inviterName, organizationName),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Postmark email error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

function generateMagicLinkEmailHtml(email: string, magicLink: string): string {
  return `
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
  `;
}

function generateMagicLinkEmailText(email: string, magicLink: string): string {
  return `
    Sign in to PerMeaTe Enterprise
    
    Click this link to sign in to your account: ${magicLink}
    
    This link will expire in 15 minutes. If you didn't request this email, you can safely ignore it.
  `;
}

function generateInvitationEmailHtml(
  email: string,
  inviteLink: string,
  role: string,
  inviterName: string,
  organizationName: string
): string {
  return `
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
        
        <p>${inviterName} has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.</p>
        
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
  `;
}

function generateInvitationEmailText(
  email: string,
  inviteLink: string,
  role: string,
  inviterName: string,
  organizationName: string
): string {
  return `
    You've been invited to join ${organizationName}
    
    ${inviterName} has invited you to join ${organizationName} as a ${role} on PerMeaTe Enterprise.
    
    Click this link to accept the invitation: ${inviteLink}
    
    This invitation will expire in 7 days. If you weren't expecting this invitation, you can safely ignore it.
  `;
}