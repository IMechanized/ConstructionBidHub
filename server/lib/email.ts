/**
 * Email sending utilities using Mailjet
 */
import Mailjet from 'node-mailjet';

if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
  console.error("Mailjet API keys are missing. Email functionality will not work.");
}

// Initialize Mailjet client
const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY || '',
  apiSecret: process.env.MAILJET_SECRET_KEY || '',
});

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromEmail?: string;
  fromName?: string;
}

/**
 * Send an email using Mailjet
 * 
 * @param params Email parameters (to, subject, htmlContent, etc.)
 * @returns Success status
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const { to, subject, htmlContent, textContent, fromEmail, fromName } = params;
    
    console.log(`[Mailjet] Attempting to send email to: ${to}, subject: "${subject}"`);
    console.log(`[Mailjet] From: ${fromEmail || 'info@findconstructionbids.com'}`);
    
    const response = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: fromEmail || 'info@findconstructionbids.com',
            Name: fromName || 'FindConstructionBids',
          },
          To: [
            {
              Email: to,
            },
          ],
          Subject: subject,
          TextPart: textContent || stripHtml(htmlContent),
          HTMLPart: htmlContent,
        },
      ],
    });
    
    const responseBody = response.body as {
      Messages?: Array<{
        Status?: string;
        To?: Array<{ Email?: string; MessageUUID?: string; MessageID?: number; MessageHref?: string }>;
        Errors?: Array<{ ErrorIdentifier?: string; ErrorCode?: string; StatusCode?: number; ErrorMessage?: string; ErrorRelatedTo?: string[] }>;
      }>;
    };
    
    console.log(`[Mailjet] Full API Response:`, JSON.stringify(responseBody, null, 2));
    
    if (responseBody.Messages && responseBody.Messages.length > 0) {
      const message = responseBody.Messages[0];
      const status = message.Status;
      const messageInfo = message.To?.[0];
      const errors = message.Errors;
      
      console.log(`[Mailjet] Message Status: ${status}`);
      
      if (messageInfo) {
        console.log(`[Mailjet] MessageID: ${messageInfo.MessageID}`);
        console.log(`[Mailjet] MessageUUID: ${messageInfo.MessageUUID}`);
        console.log(`[Mailjet] MessageHref: ${messageInfo.MessageHref}`);
      }
      
      if (errors && errors.length > 0) {
        console.error(`[Mailjet] Errors in response:`, JSON.stringify(errors, null, 2));
        return false;
      }
      
      if (status === 'success') {
        console.log(`[Mailjet] Email sent successfully to ${to}`);
        return true;
      } else {
        console.error(`[Mailjet] Unexpected status: ${status}`);
        return false;
      }
    }
    
    console.log(`[Mailjet] Email request completed for ${to}`);
    return true;
  } catch (error: any) {
    console.error('[Mailjet] Error sending email:', error);
    if (error.response) {
      console.error('[Mailjet] Error response status:', error.response.status);
      console.error('[Mailjet] Error response body:', JSON.stringify(error.response.body || error.response.data, null, 2));
    }
    if (error.statusCode) {
      console.error('[Mailjet] Error status code:', error.statusCode);
    }
    if (error.message) {
      console.error('[Mailjet] Error message:', error.message);
    }
    return false;
  }
}

/**
 * Send a verification email to a new user
 * 
 * @param email User's email address
 * @param token Verification token
 * @param companyName User's company name
 * @returns Success status
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  companyName: string
): Promise<boolean> {
  const verificationUrl = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to FindConstructionBids!</h2>
      <p>Hello ${companyName},</p>
      <p>Thank you for registering with FindConstructionBids. To complete your registration and verify your email address, please click the button below:</p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="${verificationUrl}" style="background-color: #4a7aff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
      </p>
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This verification link will expire in 24 hours.</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
      <p>Best regards,<br>The FindConstructionBids Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email Address - FindConstructionBids',
    htmlContent,
  });
}

/**
 * Send a password reset email to a user
 * 
 * @param email User's email address
 * @param token Reset token
 * @param companyName User's company name
 * @returns Success status
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  companyName: string
): Promise<boolean> {
  const resetUrl = `${process.env.PUBLIC_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Hello ${companyName},</p>
      <p>We received a request to reset your password for your FindConstructionBids account. To proceed with resetting your password, please click the button below:</p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" style="background-color: #4a7aff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </p>
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This password reset link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      <p>Best regards,<br>The FindConstructionBids Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - FindConstructionBids',
    htmlContent,
  });
}

/**
 * Simple function to strip HTML tags for text-only email content
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}