import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from '../entity/vendor.entity';
import { VendorController } from '../controller/vendor.controller';
import { VendorService } from '../service/vendor.service';
import { AuthModule } from 'src/core/auth/module/auth.module';
import { User } from '../../user/entity/user.entity';
import { CloudinaryService } from 'src/core/upload/service/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor, User]), AuthModule],
  controllers: [VendorController],
  providers: [VendorService, CloudinaryService],
  exports: [VendorService],
})
export class VendorModule {}
