import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  rawResponse?: any;
}

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: nodemailer.Transporter;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private readonly configService: ConfigService) {
    this.senderEmail = this.configService.get<string>(
      'EMAIL_SENDER',
      'noreply@techub.com',
    );
    this.senderName = this.configService.get<string>(
      'EMAIL_SENDER_NAME',
      'Techub',
    );

    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailProvider = this.configService.get<string>(
      'EMAIL_PROVIDER',
      'smtp',
    );

    switch (emailProvider.toLowerCase()) {
      case 'gmail':
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: this.configService.get<string>('GMAIL_USER'),
            pass: this.configService.get<string>('GMAIL_PASSWORD'),
          },
        });
        break;

      case 'sendgrid':
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
        // Create a wrapper that mimics nodemailer's interface
        this.transporter = {
          sendMail: (mailOptions: any) =>
            new Promise((resolve, reject) => {
              sgMail
                .send(mailOptions)
                .then(() => resolve({ accepted: [mailOptions.to] }))
                .catch((error: any) => reject(error));
            }),
        } as any;
        break;

      case 'aws-ses':
        const AWS = require('aws-sdk');
        this.transporter = nodemailer.createTransport({
          SES: new AWS.SES({
            accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get<string>(
              'AWS_SECRET_ACCESS_KEY',
            ),
            region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
          }),
        });
        break;

      case 'smtp':
      default:
        this.transporter = nodemailer.createTransport({
          host: this.configService.get<string>('SMTP_HOST'),
          port: this.configService.get<number>('SMTP_PORT', 587),
          secure: this.configService.get<boolean>('SMTP_SECURE', false),
          auth: {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASSWORD'),
          },
        });
    }

    this.logger.log(
      `Email provider initialized: ${emailProvider.toLowerCase()}`,
    );
  }

  async send(mailOptions: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: any;
  }): Promise<EmailResponse> {
    try {
      const result = await this.transporter.sendMail({
        from: `${this.senderName} <${this.senderEmail}>`,
        ...mailOptions,
      });

      this.logger.log(`Email sent successfully to ${mailOptions.to}`);
      return {
        success: true,
        messageId: result.messageId,
        rawResponse: result,
      };
    } catch (error: any) {
      this.logger.error(
        `Error sending email to ${mailOptions.to}: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        error: error.message,
        rawResponse: { error: error.message },
      };
    }
  }

  async sendBulk(
    recipients: string[],
    mailOptions: {
      subject: string;
      text?: string;
      html?: string;
      attachments?: any;
    },
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const recipient of recipients) {
      try {
        await this.send({
          to: recipient,
          ...mailOptions,
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          recipient,
          error: error.message,
        });
      }
    }

    return results;
  }

  async sendTemplate(
    to: string,
    template: string,
    data: Record<string, any>,
  ): Promise<EmailResponse> {
    // This is a placeholder for template rendering
    // In a real implementation, you'd use a template engine like handlebars or ejs
    const htmlContent = this.renderTemplate(template, data);

    return this.send({
      to,
      subject: data.subject || 'Notification',
      html: htmlContent,
      text: data.text,
    });
  }

  private renderTemplate(
    template: string,
    data: Record<string, any>,
  ): string {
    let rendered = template;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    return rendered;
  }

  isConfigured(): boolean {
    return !!this.transporter;
  }

  getConfiguration(): {
    configured: boolean;
    provider: string;
    senderEmail: string;
  } {
    return {
      configured: this.isConfigured(),
      provider: this.configService.get<string>('EMAIL_PROVIDER', 'smtp'),
      senderEmail: this.senderEmail,
    };
  }
}
