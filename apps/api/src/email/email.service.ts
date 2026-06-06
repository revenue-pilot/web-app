import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { QueueService } from '../jobs/queue.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey = process.env.RESEND_API_KEY;
  private readonly fromEmail = process.env.EMAIL_FROM || 'RevenuePilot <noreply@resend.dev>';

  constructor(
    @Inject(forwardRef(() => QueueService))
    private queueService: QueueService,
  ) {}

  /**
   * High-level sendEmail queues the dispatch asynchronously.
   * Decouples the HTTP request/response loop from Resend's API latency.
   */
  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    await this.queueService.queueEmail(to, subject, htmlContent);
    return true;
  }

  /**
   * Low-level sendEmailDirect makes the actual API call to Resend.
   * Called by the BullMQ worker or fallback scheduler.
   */
  async sendEmailDirect(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.log(`[Simulated Email] Sent to: ${to} | Subject: ${subject}`);
      return true;
    }

    const maxRetries = 3;
    let delay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Attempting direct email dispatch to ${to} (Attempt ${attempt}/${maxRetries})...`);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to,
            subject,
            html: htmlContent,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          this.logger.log(`Email successfully sent to ${to}. ID: ${data.id}`);
          return true;
        } else {
          this.logger.warn(`Resend API returned error: ${JSON.stringify(data)}`);
        }
      } catch (e) {
        this.logger.error(`Failed to send email on attempt ${attempt}: ${e.message}`);
      }

      if (attempt < maxRetries) {
        this.logger.log(`Waiting ${delay}ms before retrying email dispatch...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    this.logger.error(`All attempts to send email to ${to} failed.`);
    return false;
  }

  async sendWelcomeEmail(to: string, name: string) {
    const subject = 'Welcome to RevenuePilot!';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #10b981;">Welcome to RevenuePilot, ${name}!</h2>
        <p>Your enterprise ad optimization workspace has been created successfully.</p>
        <p>You can now connect your Google Ads, Meta Ads, and launch high-conversion AI campaigns in seconds.</p>
        <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">Login to Dashboard</a>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendVerificationEmail(to: string, token: string) {
    const subject = 'Verify Your Email Address';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2>Verify Your Email</h2>
        <p>Please click the link below to confirm your email address and activate your account:</p>
        <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">Verify Email</a>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const subject = 'Reset Your Password';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2>Reset Password Request</h2>
        <p>You requested a password reset. Click the button below to choose a new password:</p>
        <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}" style="display: inline-block; background-color: #ef4444; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">Reset Password</a>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  async sendMagicLinkEmail(to: string, token: string) {
    const subject = 'Your RevenuePilot Magic Login Link';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #10b981;">Log In to RevenuePilot</h2>
        <p>Click the button below to log in to your account instantly without a password. This link is valid for 15 minutes:</p>
        <a href="${process.env.FRONTEND_URL}/login/verify?token=${token}" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">Log In Instantly</a>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }
}
