import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from '../controller/auth.controller';
import { TokenService } from '../service/token-service';
import { PermissionCacheService } from '../service/permission-cache.service';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { UserTypeGuard } from '../guard/user-type.guard';
import { DynamicRbacGuard } from '../guard/dynamic-rbac.guard';
import { Admin } from 'src/modules/personnel-management/admin/entity/admin.entity';
import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';
import { Role } from 'src/modules/personnel-management/role/entity/role.entity';
import { Permission } from 'src/modules/personnel-management/permission/entity/permission.entity';
import { AuthService } from '../service/auth.service';
import { PermissionService } from 'src/modules/personnel-management/permission/service/permission.service';
import { RoleService } from 'src/modules/personnel-management/role/service/role.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Admin, Customer, Role, Permission]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    PermissionCacheService,
    PermissionService,
    RoleService,
    JwtAuthGuard,
    UserTypeGuard,
    DynamicRbacGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    JwtAuthGuard,
    UserTypeGuard,
    DynamicRbacGuard,
    PermissionService,
    RoleService,
    PermissionCacheService,
  ],
})
export class AuthModule {}
