const POSTMARK_API_TOKEN = process.env.POSTMARK_API_TOKEN;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@permeate.app';

interface PostmarkResponse {
  ErrorCode: number;
  Message: string;
}

export async function sendEmail(to: string, subject: string, htmlBody: string, textBody?: string) {
  if (!POSTMARK_API_TOKEN) {
    console.warn('POSTMARK_API_TOKEN not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': POSTMARK_API_TOKEN,
      },
      body: JSON.stringify({
        From: FROM_EMAIL,
        To: to,
        Subject: subject,
        HtmlBody: htmlBody,
        TextBody: textBody,
        MessageStream: 'outbound',
      }),
    });

    const result: PostmarkResponse = await response.json();

    if (result.ErrorCode === 0) {
      return { success: true };
    } else {
      console.error('Postmark error:', result);
      return { success: false, error: result.Message };
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendMagicLink(email: string, magicLinkUrl: string) {
  const subject = 'Your PerMeaTe Enterprise Magic Link';
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Magic Link - PerMeaTe Enterprise</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      background-color: #f9fafb;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #1f2937;
      color: white;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px;
    }
    .button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .footer {
      background-color: #f3f4f6;
      padding: 24px 32px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .warning {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PerMeaTe Enterprise</h1>
    </div>
    <div class="content">
      <h2>Sign in to your account</h2>
      <p>Click the button below to sign in to your PerMeaTe Enterprise account:</p>
      
      <div style="text-align: center;">
        <a href="${magicLinkUrl}" class="button">Sign In</a>
      </div>
      
      <div class="warning">
        <strong>Security Note:</strong> This link will expire in 15 minutes and can only be used once.
      </div>
      
      <p>If you didn't request this link, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>© 2024 PerMeaTe Enterprise. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `
Sign in to PerMeaTe Enterprise

Click this link to sign in to your account:
${magicLinkUrl}

This link will expire in 15 minutes and can only be used once.

If you didn't request this link, you can safely ignore this email.

© 2024 PerMeaTe Enterprise. All rights reserved.
`;

  return await sendEmail(email, subject, htmlBody, textBody);
}

export async function sendInvitation(email: string, inviteUrl: string, role: string, tenantName: string) {
  const subject = `You're invited to join ${tenantName} on PerMeaTe Enterprise`;
  
  const roleDisplayNames: Record<string, string> = {
    admin: 'Administrator',
    org_leader: 'Organization Leader',
    functional_leader: 'Functional Leader',
    project_lead: 'Project Lead',
    team_member: 'Team Member',
  };

  const roleDisplay = roleDisplayNames[role] || role;
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Team Invitation - PerMeaTe Enterprise</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      background-color: #f9fafb;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #1f2937;
      color: white;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px;
    }
    .button {
      display: inline-block;
      background-color: #10b981;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .role-badge {
      background-color: #e0f2fe;
      color: #0277bd;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    .footer {
      background-color: #f3f4f6;
      padding: 24px 32px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PerMeaTe Enterprise</h1>
    </div>
    <div class="content">
      <h2>You're invited to join ${tenantName}</h2>
      <p>You've been invited to join <strong>${tenantName}</strong> on PerMeaTe Enterprise with the role:</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <span class="role-badge">${roleDisplay}</span>
      </div>
      
      <p>Click the button below to accept the invitation and set up your account:</p>
      
      <div style="text-align: center;">
        <a href="${inviteUrl}" class="button">Accept Invitation</a>
      </div>
      
      <p><strong>What is PerMeaTe Enterprise?</strong></p>
      <p>PerMeaTe Enterprise is a goal-to-work breakdown platform that helps teams convert strategic objectives into actionable tasks with AI-powered insights.</p>
    </div>
    <div class="footer">
      <p>© 2024 PerMeaTe Enterprise. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `
You're invited to join ${tenantName} on PerMeaTe Enterprise

You've been invited to join ${tenantName} with the role: ${roleDisplay}

Accept the invitation by clicking this link:
${inviteUrl}

What is PerMeaTe Enterprise?
PerMeaTe Enterprise is a goal-to-work breakdown platform that helps teams convert strategic objectives into actionable tasks with AI-powered insights.

© 2024 PerMeaTe Enterprise. All rights reserved.
`;

  return await sendEmail(email, subject, htmlBody, textBody);
}