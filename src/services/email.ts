import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import logger from '../utils/logger';
import { onboardingInviteTemplate } from '../templates/onboardingInvite';
import { paymentReceiptTemplate } from '../templates/paymentReceipt';
import { paymentFailureTemplate } from '../templates/paymentFailure';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    if (env.SENDGRID_API_KEY) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: { user: 'apikey', pass: env.SENDGRID_API_KEY },
      });
    } else if (env.NODE_ENV !== 'production') {
      // Ethereal fake SMTP for development and test
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: 'ethereal_test_user', pass: 'ethereal_test_pass' },
      });
    } else {
      throw new Error('Email provider not configured. Set SENDGRID_API_KEY.');
    }

    return this.transporter;
  }

  async send(options: SendEmailOptions): Promise<void> {
    try {
      const info = await this.getTransporter().sendMail({
        from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info('Email sent', { to: options.to, subject: options.subject, messageId: info.messageId });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Email send failed', { to: options.to, subject: options.subject, error: msg });
      throw new Error(`Failed to send email: ${msg}`);
    }
  }

  async sendOnboardingInvite(data: {
    accountName: string;
    hostEmail: string;
    onboardingUrl: string;
    invoiceAmount: number;
    dueDate: string;
    opportunityName: string;
  }): Promise<void> {
    const { subject, html, text } = onboardingInviteTemplate(data);
    await this.send({ to: data.hostEmail, subject, html, text });
  }

  async sendPaymentReceipt(data: {
    accountName: string;
    hostEmail: string;
    opportunityName: string;
    amount: number;
    paymentIntentId: string;
    paidAt: Date;
  }): Promise<void> {
    const { subject, html, text } = paymentReceiptTemplate(data);
    await this.send({ to: data.hostEmail, subject, html, text });
  }

  async sendPaymentFailureAlert(data: {
    accountName: string;
    hostEmail: string;
    opportunityName: string;
    amount: number;
    failureReason: string;
    retryCount: number;
    maxRetries: number;
  }): Promise<void> {
    const { subject, html, text } = paymentFailureTemplate(data);
    await this.send({ to: data.hostEmail, subject, html, text });
  }
}

export const emailService = new EmailService();
