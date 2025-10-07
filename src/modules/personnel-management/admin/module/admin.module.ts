import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../role/entity/role.entity';
import { User } from '../../user/entity/user.entity';
import { CloudinaryService } from 'src/core/upload/service/cloudinary.service';
import { Admin } from '../entity/admin.entity';
import { AdminController } from '../controller/admin.controller';
import { AdminService } from '../service/admin.service';
import { AuthModule } from 'src/core/auth/module/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, User, Role]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService, CloudinaryService],
  exports: [AdminService],
})
export class AdminModule {}
