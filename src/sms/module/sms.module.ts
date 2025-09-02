import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsController } from '../controller/sms.controller';
import { SmsService } from '../service/sms.service';
import { SmsProvider } from '../provider/sms.provider';
import { SmsLog } from '../entity/sms_log.entity';
import { AuthModule } from 'src/auth/module/auth.module';


@Module({
  imports: [TypeOrmModule.forFeature([SmsLog]),AuthModule],
  controllers: [SmsController],
  providers: [SmsService, SmsProvider],
  exports: [SmsService, SmsProvider],
})
export class SmsModule {}