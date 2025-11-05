import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/core/auth/decorator/auth.decorator';
import { EmailService } from '../service/email.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailQueryDto } from '../dto/query-email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @RequireResource('email', 'create')
  @Post('send')
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    const result = await this.emailService.sendEmail(sendEmailDto);
    return {
      success: true,
      message: 'Email sent successfully',
      data: result,
    };
  }

  @RequireResource('email', 'create')
  @Post('send-bulk')
  async sendBulkEmail(
    @Body() body: { recipients: string[]; email: SendEmailDto },
  ) {
    await this.emailService.sendBulkEmail(body.recipients, body.email);
    return {
      success: true,
      message: 'Bulk emails sent successfully',
    };
  }

  @RequirePermissions('read:email')
  @Get()
  async findAll(@Query() query: EmailQueryDto) {
    const result = await this.emailService.findAll(query);
    return {
      success: true,
      message: 'Email logs retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:email')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.emailService.findOne(id);
    return {
      success: true,
      message: 'Email log retrieved successfully',
      data: result,
    };
  }

  @RequireResource('email', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.emailService.remove(id);
    return {
      success: true,
      message: 'Email log deleted successfully',
    };
  }

  @RequireResource('email', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.emailService.restore(id);
    return {
      success: true,
      message: 'Email log restored successfully',
      data: result,
    };
  }

  // Resend failed email
  @RequireResource('email', 'create')
  @Post(':id/resend')
  async resendEmail(@Param('id', ParseIntPipe) id: number) {
    const result = await this.emailService.resendEmail(id);
    return {
      success: true,
      message: 'Email resent successfully',
      data: result,
    };
  }

  // Utility endpoints
  @RequirePermissions('read:email')
  @Get('recipient/:recipient')
  async findByRecipient(
    @Param('recipient') recipient: string,
    @Query() query: EmailQueryDto,
  ) {
    const result = await this.emailService.findByRecipient(recipient, query);
    return {
      success: true,
      message: 'Email logs by recipient retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:email')
  @Get('stats/count')
  async getEmailCount() {
    const result = await this.emailService.getEmailCount();
    return {
      success: true,
      message: 'Email count retrieved successfully',
      data: { count: result },
    };
  }

  @RequirePermissions('read:email')
  @Get('stats/delivery-rates')
  async getDeliveryRates() {
    const result = await this.emailService.getDeliveryRates();
    return {
      success: true,
      message: 'Email delivery rates retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:email')
  @Get('stats/failed')
  async getFailedEmails(@Query() query: EmailQueryDto) {
    const result = await this.emailService.getFailedEmails(query);
    return {
      success: true,
      message: 'Failed email logs retrieved successfully',
      data: result,
    };
  }

  // Email validation
  @Public()
  @Post('validate')
  async validateEmail(@Body('email') email: string) {
    const result = await this.emailService.validateEmail(email);
    return {
      success: true,
      message: 'Email validation completed',
      data: result,
    };
  }
}
