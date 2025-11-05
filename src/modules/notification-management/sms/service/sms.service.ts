import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { SmsLog } from '../entity/sms_log.entity';
import { SmsProvider } from '../provider/sms.provider';
import { SendSmsDto } from '../dto/send-sms.dto';
import { SmsQueryDto } from '../dto/query-sms.dto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @InjectRepository(SmsLog)
    private readonly smsLogRepository: Repository<SmsLog>,
    private readonly smsProvider: SmsProvider,
  ) {}

  async sendSms(sendSmsDto: SendSmsDto): Promise<SmsLog> {
    try {
      // Validate phone number
      const formattedRecipient = this.formatPhoneNumber(sendSmsDto.recipient);

      if (!this.isValidPhoneNumber(formattedRecipient)) {
        throw new BadRequestException('Invalid phone number format');
      }

      // Create SMS log entry
      const smsLog = this.smsLogRepository.create({
        recipient: formattedRecipient,
        message: sendSmsDto.message,
        reference: sendSmsDto.reference || null,
        status: 'pending',
      });

      // Save initial log
      await this.smsLogRepository.save(smsLog);

      // Send SMS using provider
      const smsResponse = await this.smsProvider.send(
        formattedRecipient,
        sendSmsDto.message,
      );

      // Update SMS log with response
      smsLog.responseData = JSON.stringify(smsResponse.rawResponse);

      if (smsResponse.success) {
        smsLog.status = 'sent';
        smsLog.messageId = smsResponse.messageId || null;
        this.logger.log(`SMS sent successfully to ${formattedRecipient}`);
      } else {
        smsLog.status = 'failed';
        smsLog.errorMessage = smsResponse.error ?? null;
        this.logger.error(`SMS sending failed: ${smsResponse.error}`);
      }

      return await this.smsLogRepository.save(smsLog);
    } catch (error) {
      this.logger.error(`Error in SMS service: ${error.message}`, error.stack);

      // Create failed log entry if it doesn't exist
      const failedSmsLog = this.smsLogRepository.create({
        recipient: sendSmsDto.recipient,
        message: sendSmsDto.message,
        reference: sendSmsDto.reference || null,
        status: 'failed',
        errorMessage: error.message,
        responseData: JSON.stringify({ error: error.message }),
      });

      await this.smsLogRepository.save(failedSmsLog);
      throw error;
    }
  }

  async findAll(query: SmsQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      recipient,
      delivered,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.smsLogRepository
      .createQueryBuilder('sms')
      .where('sms.deletedAt IS NULL');

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(sms.recipient ILIKE :search OR sms.message ILIKE :search OR sms.reference ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere('sms.status = :status', { status });
    }

    // Filter by recipient
    if (recipient) {
      queryBuilder.andWhere('sms.recipient = :recipient', { recipient });
    }

    // Filter by delivery status
    if (delivered !== undefined) {
      queryBuilder.andWhere('sms.delivered = :delivered', { delivered });
    }

    // Date range filtering
    if (dateFrom) {
      queryBuilder.andWhere('sms.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('sms.createdAt <= :dateTo', { dateTo });
    }

    // Sorting
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'status',
      'recipient',
      'deliveredAt',
    ];
    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`sms.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('sms.createdAt', 'DESC');
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [smsLogs, total] = await queryBuilder.getManyAndCount();

    return {
      data: smsLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<SmsLog> {
    const smsLog = await this.smsLogRepository.findOne({
      where: { id },
    });

    if (!smsLog) {
      throw new NotFoundException('SMS log not found');
    }

    return smsLog;
  }

  async remove(id: number): Promise<void> {
    const smsLog = await this.findOne(id);
    await this.smsLogRepository.softDelete(smsLog.id);
  }

  async restore(id: number): Promise<SmsLog> {
    const result = await this.smsLogRepository.restore(id);

    if (result.affected === 0) {
      throw new NotFoundException('SMS log not found or not deleted');
    }

    return await this.findOne(id);
  }

  async updateDeliveryStatus(
    messageId: string,
    status: string,
  ): Promise<SmsLog> {
    const smsLog = await this.smsLogRepository.findOne({
      where: { messageId },
    });

    if (!smsLog) {
      throw new NotFoundException('SMS log not found');
    }

    smsLog.status = status;

    if (status === 'delivered') {
      smsLog.delivered = true;
      smsLog.deliveredAt = new Date();
    }

    return await this.smsLogRepository.save(smsLog);
  }

  async resendSms(id: number): Promise<SmsLog> {
    const originalSms = await this.findOne(id);

    if (originalSms.status === 'sent' && originalSms.delivered) {
      throw new BadRequestException('SMS was already successfully delivered');
    }

    const sendSmsDto: SendSmsDto = {
      recipient: originalSms.recipient,
      message: originalSms.message,
      reference: originalSms.reference ?? undefined,
    };

    return await this.sendSms(sendSmsDto);
  }

  async findByRecipient(recipient: string, query: SmsQueryDto) {
    const formattedRecipient = this.formatPhoneNumber(recipient);
    return await this.findAll({ ...query, recipient: formattedRecipient });
  }

  async getSmsCount(): Promise<number> {
    return await this.smsLogRepository.count({
      where: { deletedAt: IsNull() },
    });
  }

  async getDeliveryRates(): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    successRate: number;
  }> {
    const total = await this.smsLogRepository.count({
      where: { deletedAt: IsNull() },
    });
    const sent = await this.smsLogRepository.count({
      where: { status: 'sent', deletedAt: IsNull() },
    });
    const delivered = await this.smsLogRepository.count({
      where: { delivered: true, deletedAt: IsNull() },
    });
    const failed = await this.smsLogRepository.count({
      where: { status: 'failed', deletedAt: IsNull() },
    });

    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    const successRate = total > 0 ? (sent / total) * 100 : 0;

    return {
      total,
      sent,
      delivered,
      failed,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  async getFailedSms(query: SmsQueryDto) {
    return await this.findAll({ ...query, status: 'failed' });
  }

  async validatePhone(
    phone: string,
  ): Promise<{ isValid: boolean; formatted: string; message: string }> {
    try {
      const formatted = this.formatPhoneNumber(phone);
      const isValid = this.isValidPhoneNumber(formatted);

      return {
        isValid,
        formatted,
        message: isValid ? 'Valid phone number' : 'Invalid phone number format',
      };
    } catch (error) {
      return {
        isValid: false,
        formatted: phone,
        message: 'Invalid phone number format',
      };
    }
  }

  // Utility methods
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    // For Bangladesh numbers
    if (cleaned.startsWith('0')) {
      cleaned = '88' + cleaned;
    } else if (!cleaned.startsWith('88') && cleaned.length === 11) {
      cleaned = '88' + cleaned;
    } else if (!cleaned.startsWith('88') && cleaned.length === 10) {
      cleaned = '880' + cleaned;
    }

    return cleaned;
  }

  private isValidPhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return /^88\d{11}$/.test(formatted);
  }
}
