import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Admin } from '../entity/admin.entity';
import { AdminRegisterDto } from '../dto/admin-register.dto';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { AdminAuthResponseDto } from '../dto/admin-auth-response.dto';
import { AuthBaseService } from 'src/core/auth/service/auth-base.service';
import { User, UserType } from '../../user/entity/user.entity';
import { Role } from '../../role/entity/role.entity';
import { TokenService } from 'src/core/auth/service/token-service';
import { RedisService } from 'src/core/redis/service/redis.service';
import { PasswordUtil } from 'src/shared/utils/password.util';

@Injectable()
export class AdminAuthService extends AuthBaseService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private dataSource: DataSource,
    userRepository: Repository<User>,
    tokenService: TokenService,
    redisService: RedisService,
  ) {
    super(userRepository, tokenService, redisService);
  }

  async register(dto: AdminRegisterDto): Promise<AdminAuthResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      // Check uniqueness
      const existing = await manager.findOne(User, {
        where: [
          { email: dto.email },
          { phone: dto.phone },
        ].filter(Boolean),
      });

      if (existing) {
        throw new ConflictException(
          existing.email === dto.email
            ? 'Email already exists'
            : 'Phone already exists',
        );
      }

      // Verify role exists
      const role = await manager.findOne(Role, {
        where: { id: dto.roleId },
        relations: ['permissions'],
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Create user
      const user = manager.create(User, {
        email: dto.email.toLowerCase(),
        password: await PasswordUtil.hash(dto.password),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        userType: UserType.ADMIN,
        emailVerified: true, // Admins are pre-verified
      });
      await manager.save(user);

      // Create admin profile
      const admin = manager.create(Admin, {
        userId: user.id,
        roleId: dto.roleId,
        department: dto.department,
        employeeNumber: dto.employeeNumber,
      });
      await manager.save(admin);

      const permissions = role.permissions.map((p) => `${p.action}:${p.resource}`);

      // Generate tokens
      const tokens = this.tokenService.generateTokenPair({
        sub: user.id.toString(),
        email: user.email!,
        type: 'admin',
        roleId: dto.roleId,
        permissions,
      });

      await this.storeRefreshToken(user.id, tokens.refresh_token);

      return {
        tokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenType: 'Bearer',
          expiresIn: tokens.expires_in,
        },
        user: {
          id: admin.id,
          email: user.email!,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          roleId: admin.roleId,
          roleName: role.name,
          department: admin.department,
          employeeNumber: admin.employeeNumber,
          permissions,
        },
        userType: 'admin',
      };
    });
  }

  async login(dto: AdminLoginDto): Promise<AdminAuthResponseDto> {
    await this.checkAccountLockout(dto.email);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.admin', 'admin')
      .leftJoinAndSelect('admin.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .addSelect('user.password')
      .where('user.email = :email', { email: dto.email.toLowerCase() })
      .andWhere('user.userType = :userType', { userType: UserType.ADMIN })
      .andWhere('user.deletedAt IS NULL')
      .getOne();

    if (!user || !user.admin) {
      await this.handleFailedLogin(dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.verifyPassword(dto.password, user.password);
    if (!isValid) {
      await this.handleFailedLogin(dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // TODO: Implement 2FA validation if twoFactorCode is provided
    if (dto.twoFactorCode) {
      // Validate 2FA code here
      throw new BadRequestException('2FA not yet implemented');
    }

    await this.resetFailedLoginAttempts(dto.email);
    await this.updateLastLogin(user.id);

    const permissions = user.admin.role.permissions.map(
      (p) => `${p.action}:${p.resource}`,
    );

    const tokens = this.tokenService.generateTokenPair({
      sub: user.id.toString(),
      email: user.email!,
      type: 'admin',
      roleId: user.admin.roleId,
      permissions,
    });

    await this.storeRefreshToken(user.id, tokens.refresh_token);

    return {
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: 'Bearer',
        expiresIn: tokens.expires_in,
      },
      user: {
        id: user.admin.id,
        email: user.email!,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roleId: user.admin.roleId,
        roleName: user.admin.role.name,
        department: user.admin.department,
        employeeNumber: user.admin.employeeNumber,
        permissions,
      },
      userType: 'admin',
    };
  }
}
