import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SslCommerzService } from '../service/ssl-commerz.service';
import {
  SSLCommerzPaymentDto,
  SSLCommerzValidationDto,
} from '../dto/ssl-commerz-payment.dto';
import { Public } from 'src/auth/decorator/auth.decorator';

@Controller('payment-gateway/ssl-commerz')
export class SslCommerzController {
  constructor(private readonly sslCommerzService: SslCommerzService) {}

  @Post('initiate')
  async initiatePayment(@Body() paymentData: SSLCommerzPaymentDto) {
    const result = await this.sslCommerzService.initiatePayment(paymentData);
    return {
      success: true,
      message: 'Payment initiation successful',
      data: result,
    };
  }

  @Post('validate')
  async validatePayment(@Body() validationData: SSLCommerzValidationDto) {
    const result = await this.sslCommerzService.validatePayment(validationData);
    return {
      success: true,
      message: 'Payment validation successful',
      data: result,
    };
  }

  @Post('refund')
  async initiateRefund(
    @Body()
    refundData: {
      bankTransId: string;
      refundAmount: number;
      refundRemarks?: string;
    }
  ) {
    const result = await this.sslCommerzService.initiateRefund(
      refundData.bankTransId,
      refundData.refundAmount,
      refundData.refundRemarks
    );
    return {
      success: true,
      message: 'Refund initiation successful',
      data: result,
    };
  }

  @Get('transaction')
  async queryTransaction(@Query('transactionId') transactionId: string) {
    const result = await this.sslCommerzService.queryTransaction(transactionId);
    return {
      success: true,
      message: 'Transaction query successful',
      data: result,
    };
  }

  @Get('status')
  getPaymentStatus() {
    const result = this.sslCommerzService.getPaymentStatus();
    return {
      success: true,
      message: 'SSL Commerz status retrieved successfully',
      data: result,
    };
  }

  // Webhook endpoints
  @Public()
  @Post('success')
  @HttpCode(HttpStatus.OK)
  async handleSuccess(@Body() data: any, @Res() res: Response) {
    try {
      // Log the success callback
      console.log('SSL Commerz Success Callback:', data);
      
      // Validate the payment
      if (data.val_id) {
        const validation = await this.sslCommerzService.validatePayment({
          valId: data.val_id,
          storeId: data.store_id,
          storePassword: '', // This will be handled by the service
        });

        // Here you would typically update your order status
        // and trigger any necessary business logic
        
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?orderId=${data.tran_id}`);
      }

      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/error`);
    } catch (error) {
      console.error('Error in SSL Commerz success handler:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/error`);
    }
  }

  @Public()
  @Post('fail')
  @HttpCode(HttpStatus.OK)
  async handleFailure(@Body() data: any, @Res() res: Response) {
    console.log('SSL Commerz Failure Callback:', data);
    
    // Here you would typically update your order status to failed
    
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?orderId=${data.tran_id}`);
  }

  @Public()
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async handleCancel(@Body() data: any, @Res() res: Response) {
    console.log('SSL Commerz Cancel Callback:', data);
    
    // Here you would typically update your order status to cancelled
    
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancelled?orderId=${data.tran_id}`);
  }

  @Public()
  @Post('ipn')
  @HttpCode(HttpStatus.OK)
  async handleIPN(@Body() data: any, @Res() res: Response) {
    try {
      console.log('SSL Commerz IPN Callback:', data);
      
      // Validate the IPN data
      if (data.val_id && data.status === 'VALID') {
        const validation = await this.sslCommerzService.validatePayment({
          valId: data.val_id,
          storeId: data.store_id,
          storePassword: '', // This will be handled by the service
        });

        if (validation.status === 'VALID') {
          // Here you would typically:
          // 1. Update order status to paid
          // 2. Update inventory
          // 3. Send confirmation emails
          // 4. Trigger any other business logic
          
          console.log('Payment validated successfully via IPN:', validation);
        }
      }

      return res.status(200).send('OK');
    } catch (error) {
      console.error('Error in SSL Commerz IPN handler:', error);
      return res.status(200).send('OK'); // Always return OK to prevent retries
    }
  }
}
