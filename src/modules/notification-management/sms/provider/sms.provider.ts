// src/sms/provider/sms.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

export interface SmsResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  rawResponse?: any;
}

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly sendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SMS_API_KEY') ?? '';
    this.senderId = this.configService.get<string>('SMS_SENDER_ID') ?? '';
    this.sendUrl = this.configService.get<string>('SMS_SEND_URL') ?? '';

    if (!this.apiKey || !this.senderId || !this.sendUrl) {
      this.logger.error(
        'SMS configuration is incomplete. Please check environment variables.',
      );
    }
  }

  private readonly responseMessages: Record<string, string> = {
    '445000': 'Message sent successfully',
    '445010': 'Missing API key',
    '445020': 'Missing contact number',
    '445030': 'Missing sender ID',
    '445040': 'Invalid API key',
    '445050': 'Account suspended',
    '445060': 'Account expired',
    '445070': 'Only users can send SMS',
    '445080': 'Invalid sender ID',
    '445090': 'No access to this sender ID',
    '445110': 'All numbers are invalid',
    '445120': 'Insufficient balance',
    '445130': 'Reseller insufficient balance',
    '445170': 'You are not a user',
  };

  async send(recipient: string, message: string): Promise<SmsResponse> {
    return new Promise((resolve) => {
      try {
        const params = new URLSearchParams({
          api_key: this.apiKey,
          senderid: this.senderId,
          contacts: recipient,
          msg: message,
        });

        const postData = params.toString();
        const url = new URL(this.sendUrl);
        const httpModule = url.protocol === 'https:' ? https : http;

        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
          },
        };

        const req = httpModule.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            let responseData: any;
            try {
              responseData = JSON.parse(data);
            } catch {
              responseData = { raw: data };
            }

            const code = responseData?.code || responseData?.status_code;
            const message =
              this.responseMessages[code] ||
              responseData?.message ||
              'Unknown response';

            if (code === '445000' || responseData?.status === 'success') {
              this.logger.log(`SMS sent successfully to ${recipient}`);
              resolve({
                success: true,
                status: 'sent',
                messageId: responseData?.message_id || responseData?.id || null,
                rawResponse: responseData,
              });
            } else {
              this.logger.warn(`SMS sending failed: ${code} - ${message}`);
              resolve({
                success: false,
                status: 'failed',
                error: message,
                rawResponse: responseData,
              });
            }
          });
        });

        req.on('error', (error) => {
          this.logger.error(
            `HTTP request error: ${error.message}`,
            error.stack,
          );
          resolve({
            success: false,
            status: 'error',
            error: error.message,
            rawResponse: { error: error.message },
          });
        });

        req.write(postData);
        req.end();
      } catch (error) {
        this.logger.error(
          `Exception in SMS provider: ${error.message}`,
          error.stack,
        );
        resolve({
          success: false,
          status: 'error',
          error: error.message,
          rawResponse: { error: error.message },
        });
      }
    });
  }

  // Health check method
  isConfigured(): boolean {
    return !!(this.apiKey && this.senderId && this.sendUrl);
  }

  getConfiguration(): {
    configured: boolean;
    hasApiKey: boolean;
    hasSenderId: boolean;
    hasUrl: boolean;
  } {
    return {
      configured: this.isConfigured(),
      hasApiKey: !!this.apiKey,
      hasSenderId: !!this.senderId,
      hasUrl: !!this.sendUrl,
    };
  }
}
