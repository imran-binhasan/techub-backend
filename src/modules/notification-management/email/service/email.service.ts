import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog } from '../entity/email_log.entity';
import { EmailProvider } from '../provider/email.provider';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailQueryDto } from '../dto/query-email.dto';


@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
    private readonly emailProvider: EmailProvider,
  ) {}

  async sendEmail(sendEmailDto: SendEmailDto): Promise<EmailLog> {
    try {
      // Validate email address
      if (!this.isValidEmail(sendEmailDto.recipient)) {
        throw new BadRequestException('Invalid email address format');
      }

      // Create email log entry
      const emailLog = this.emailLogRepository.create({
        recipient: sendEmailDto.recipient,
        subject: sendEmailDto.subject,
        body: sendEmailDto.body,
        htmlBody: sendEmailDto.htmlBody,
        reference: sendEmailDto.reference,
        attachments: sendEmailDto.attachments,
        status: 'pending',
      });

      // Save initial log
      await this.emailLogRepository.save(emailLog);

      // Send email using provider
      const emailResponse = await this.emailProvider.send({
        to: sendEmailDto.recipient,
        subject: sendEmailDto.subject,
        text: sendEmailDto.body,
        html: sendEmailDto.htmlBody,
        attachments: sendEmailDto.attachments,
      });

      // Update email log with response
      emailLog.responseData = JSON.stringify(emailResponse.rawResponse);

      if (emailResponse.success) {
        emailLog.status = 'sent';
        emailLog.messageId = emailResponse.messageId;
        emailLog.sentAt = new Date();
        this.logger.log(`Email sent successfully to ${sendEmailDto.recipient}`);
      } else {
        emailLog.status = 'failed';
        emailLog.errorMessage = emailResponse.error;
        emailLog.failedAt = new Date();
        this.logger.error(`Email sending failed: ${emailResponse.error}`);
      }

      return await this.emailLogRepository.save(emailLog);
    } catch (error) {
      this.logger.error(`Error in email service: ${error.message}`, error.stack);

      // Create failed log entry if it doesn't exist
      const failedEmailLog = this.emailLogRepository.create({
        recipient: sendEmailDto.recipient,
        subject: sendEmailDto.subject,
        body: sendEmailDto.body,
        htmlBody: sendEmailDto.htmlBody,
        reference: sendEmailDto.reference,
        attachments: sendEmailDto.attachments,
        status: 'failed',
        errorMessage: error.message,
        responseData: JSON.stringify({ error: error.message }),
        failedAt: new Date(),
      });

      await this.emailLogRepository.save(failedEmailLog);
      throw error;
    }
  }

  async sendBulkEmail(recipients: string[], emailData: any): Promise<void> {
    const promises = recipients.map((recipient) =>
      this.sendEmail({
        ...emailData,
        recipient,
      }).catch((error) => {
        this.logger.error(`Failed to send email to ${recipient}: ${error.message}`);
      }),
    );

    await Promise.all(promises);
  }

  async findAll(query: EmailQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      recipient,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.emailLogRepository
      .createQueryBuilder('email')
      .where('email.deletedAt IS NULL');

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(email.recipient ILIKE :search OR email.subject ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('email.status = :status', { status });
    }

    // Recipient filter
    if (recipient) {
      queryBuilder.andWhere('email.recipient ILIKE :recipient', {
        recipient: `%${recipient}%`,
      });
    }

    // Date range filter
    if (dateFrom) {
      queryBuilder.andWhere('email.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('email.createdAt <= :dateTo', { dateTo });
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'updatedAt', 'recipient', 'status'];
    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`email.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('email.createdAt', 'DESC');
    }

    // Pagination
    const skip = (page - 1) * limit;
    const [emails, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: emails,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<EmailLog> {
    const emailLog = await this.emailLogRepository.findOne({
      where: { id },
    });

    if (!emailLog) {
      throw new NotFoundException(`Email log with ID ${id} not found`);
    }

    return emailLog;
  }

  async remove(id: number): Promise<void> {
    const emailLog = await this.findOne(id);

    if (!emailLog) {
      throw new NotFoundException(`Email log with ID ${id} not found`);
    }

    await this.emailLogRepository.softDelete(id);
  }

  async restore(id: number): Promise<EmailLog> {
    const emailLog = await this.emailLogRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!emailLog) {
      throw new NotFoundException(`Email log with ID ${id} not found`);
    }

    if (!emailLog.deletedAt) {
      throw new BadRequestException('Email log is not deleted');
    }

    await this.emailLogRepository.restore(id);
    return this.findOne(id);
  }

  // Utility methods
  async getEmailCount(): Promise<number> {
    return this.emailLogRepository.count();
  }

  async getDeliveryRates() {
    const total = await this.emailLogRepository.count();
    const sent = await this.emailLogRepository.countBy({ status: 'sent' });
    const failed = await this.emailLogRepository.countBy({ status: 'failed' });
    const pending = await this.emailLogRepository.countBy({ status: 'pending' });

    return {
      total,
      sent,
      failed,
      pending,
      successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : 0,
      failureRate: total > 0 ? ((failed / total) * 100).toFixed(2) : 0,
    };
  }

  async getFailedEmails(query: EmailQueryDto) {
    const queryBuilder = this.emailLogRepository
      .createQueryBuilder('email')
      .where('email.status = :status', { status: 'failed' })
      .andWhere('email.deletedAt IS NULL');

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [emails, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('email.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: emails,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByRecipient(recipient: string, query: EmailQueryDto) {
    const queryBuilder = this.emailLogRepository
      .createQueryBuilder('email')
      .where('email.recipient ILIKE :recipient', { recipient: `%${recipient}%` })
      .andWhere('email.deletedAt IS NULL');

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } =
      query;
    const skip = (page - 1) * limit;

    const allowedSortFields = ['createdAt', 'updatedAt', 'status'];
    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`email.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('email.createdAt', 'DESC');
    }

    const [emails, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: emails,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async resendEmail(id: number): Promise<EmailLog> {
    const emailLog = await this.findOne(id);

    const resendDto: SendEmailDto = {
      recipient: emailLog.recipient,
      subject: emailLog.subject,
      body: emailLog.body,
      htmlBody: emailLog.htmlBody,
      attachments: emailLog.attachments,
      reference: emailLog.reference,
    };

    return this.sendEmail(resendDto);
  }

  async validateEmail(email: string): Promise<{ valid: boolean; reason?: string }> {
    if (!this.isValidEmail(email)) {
      return {
        valid: false,
        reason: 'Invalid email format',
      };
    }

    return { valid: true };
  }

  // Private helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
