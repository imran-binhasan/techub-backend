// src/sms/controller/sms.controller.ts
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
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/auth/decorator/auth.decorator';
import { SmsService } from '../service/sms.service';
import { SendSmsDto } from '../dto/send-sms.dto';
import { SmsQueryDto } from '../dto/query-sms.dto';
import { DeliveryStatusDto } from '../dto/delivery-status.dto';


@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @RequireResource('sms', 'create')
  @Post('send')
  async sendSms(@Body() sendSmsDto: SendSmsDto) {
    const result = await this.smsService.sendSms(sendSmsDto);
    return {
      success: true,
      message: 'SMS sent successfully',
      data: result,
    };
  }

  @RequirePermissions('read:sms')
  @Get()
  async findAll(@Query() query: SmsQueryDto) {
    const result = await this.smsService.findAll(query);
    return {
      success: true,
      message: 'SMS logs retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:sms')
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.smsService.findOne(id);
    return {
      success: true,
      message: 'SMS log retrieved successfully',
      data: result,
    };
  }

  @RequireResource('sms', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.smsService.remove(id);
    return {
      success: true,
      message: 'SMS log deleted successfully',
    };
  }

  @RequireResource('sms', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.smsService.restore(id);
    return {
      success: true,
      message: 'SMS log restored successfully',
      data: result,
    };
  }

  // Webhook endpoint for delivery status updates (public)
  @Public()
  @Post('webhook/delivery-status')
  @HttpCode(HttpStatus.OK)
  async deliveryStatusWebhook(@Body() deliveryStatusDto: DeliveryStatusDto) {
    const result = await this.smsService.updateDeliveryStatus(
      deliveryStatusDto.message_id,
      deliveryStatusDto.status,
    );
    return {
      success: true,
      message: 'Delivery status updated successfully',
      data: result,
    };
  }

  // Resend failed SMS
  @RequireResource('sms', 'create')
  @Post(':id/resend')
  async resendSms(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.smsService.resendSms(id);
    return {
      success: true,
      message: 'SMS resent successfully',
      data: result,
    };
  }

  // Utility endpoints
  @RequirePermissions('read:sms')
  @Get('recipient/:recipient')
  async findByRecipient(@Param('recipient') recipient: string, @Query() query: SmsQueryDto) {
    const result = await this.smsService.findByRecipient(recipient, query);
    return {
      success: true,
      message: 'SMS logs by recipient retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:sms')
  @Get('stats/count')
  async getSmsCount() {
    const result = await this.smsService.getSmsCount();
    return {
      success: true,
      message: 'SMS count retrieved successfully',
      data: { count: result },
    };
  }

  @RequirePermissions('read:sms')
  @Get('stats/delivery-rates')
  async getDeliveryRates() {
    const result = await this.smsService.getDeliveryRates();
    return {
      success: true,
      message: 'SMS delivery rates retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:sms')
  @Get('stats/failed')
  async getFailedSms(@Query() query: SmsQueryDto) {
    const result = await this.smsService.getFailedSms(query);
    return {
      success: true,
      message: 'Failed SMS logs retrieved successfully',
      data: result,
    };
  }

  // Phone number validation
  @Public()
  @Post('validate-phone')
  async validatePhone(@Body('phone') phone: string) {
    const result = await this.smsService.validatePhone(phone);
    return {
      success: true,
      message: 'Phone number validation completed',
      data: result,
    };
  }
}