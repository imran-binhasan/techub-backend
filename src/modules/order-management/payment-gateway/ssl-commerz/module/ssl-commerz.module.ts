import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SslCommerzService } from '../service/ssl-commerz.service';
import { SslCommerzController } from '../controller/ssl-commerz.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SslCommerzController],
  providers: [SslCommerzService],
  exports: [SslCommerzService],
})
export class SslCommerzModule {}
