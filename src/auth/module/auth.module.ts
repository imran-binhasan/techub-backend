import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Admin } from 'src/admin/entity/admin.entity';
import { Customer } from 'src/customer/entity/customer.entity';
import { Role } from 'src/role/entity/role.entity';
import { Permission } from 'src/permission/entity/permission.entity';

import { RoleService } from 'src/role/service/role.service';
import { AuthController } from '../controller/auth.controller';
import { AuthService } from '../service/auth-service';
import { TokenService } from '../service/token-service';
import { PermissionCacheService } from '../service/permission-cache.service';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { UserTypeGuard } from '../guard/user-type.guard';
import { DynamicRbacGuard } from '../guard/dynamic-rbac.guard';
import { PermissionService } from 'src/permission/service/permission.service';

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
