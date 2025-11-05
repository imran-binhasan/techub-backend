import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailController } from '../controller/email.controller';
import { EmailService } from '../service/email.service';
import { EmailProvider } from '../provider/email.provider';
import { EmailLog } from '../entity/email_log.entity';
import { AuthModule } from 'src/core/auth/module/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmailLog]), AuthModule],
  controllers: [EmailController],
  providers: [EmailService, EmailProvider],
  exports: [EmailService, EmailProvider],
})
export class EmailModule {}
