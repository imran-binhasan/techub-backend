import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/role/entity/role.entity';
import { CloudinaryService } from 'src/upload/service/cloudinary.service';
import { Admin } from '../entity/admin.entity';
import { AdminController } from '../controller/admin.controller';
import { AdminService } from '../service/admin.service';
import { AuthModule } from 'src/auth/module/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, Role]),AuthModule
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    CloudinaryService,
  ],
  exports: [AdminService],
})
export class AdminModule {}