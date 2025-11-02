import { Injectable, ConflictException, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Vendor, VendorStatus } from '../entity/vendor.entity';
import { VendorRegisterDto } from '../dto/vendor-register.dto';
import { VendorLoginDto } from '../dto/vendor-login.dto';
import { VendorAuthResponseDto } from '../dto/vendor-auth-response.dto';
import { AuthBaseService } from 'src/core/auth/service/auth-base.service';
import { User, UserType } from '../../user/entity/user.entity';
import { TokenService } from 'src/core/auth/service/token-service';
import { RedisService } from 'src/core/redis/service/redis.service';
import { PasswordUtil } from 'src/shared/utils/password.util';

@Injectable()
export class VendorAuthService extends AuthBaseService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    private dataSource: DataSource,
    userRepository: Repository<User>,
    tokenService: TokenService,
    redisService: RedisService,
  ) {
    super(userRepository, tokenService, redisService);
  }

  async register(dto: VendorRegisterDto): Promise<VendorAuthResponseDto> {
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

      // Check shop slug uniqueness
      const existingVendor = await manager.findOne(Vendor, {
        where: { shopSlug: dto.shopSlug },
      });

      if (existingVendor) {
        throw new ConflictException('Shop slug already exists');
      }

      // Create user
      const user = manager.create(User, {
        email: dto.email.toLowerCase(),
        password: await PasswordUtil.hash(dto.password),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        userType: UserType.VENDOR,
        emailVerified: false,
      });
      await manager.save(user);

      // Create vendor profile
      const vendor = manager.create(Vendor, {
        userId: user.id,
        shopName: dto.shopName,
        shopSlug: dto.shopSlug.toLowerCase(),
        shopDescription: dto.shopDescription,
        businessEmail: dto.businessEmail,
        businessPhone: dto.businessPhone,
        status: VendorStatus.PENDING_VERIFICATION,
        commissionRate: 15.00, // Default platform commission
      });
      await manager.save(vendor);

      // Generate tokens
      const tokens = this.tokenService.generateTokenPair({
        sub: user.id.toString(),
        email: user.email!,
        type: 'vendor',
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
          id: vendor.id,
          email: user.email!,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          shopName: vendor.shopName,
          shopSlug: vendor.shopSlug,
          status: vendor.status,
          commissionRate: parseFloat(vendor.commissionRate.toString()),
          totalSales: parseFloat(vendor.totalSales.toString()),
          averageRating: vendor.averageRating ? parseFloat(vendor.averageRating.toString()) : undefined,
        },
        userType: 'vendor',
      };
    });
  }

  async login(dto: VendorLoginDto): Promise<VendorAuthResponseDto> {
    if (dto.email && dto.password) {
      return this.loginWithPassword(dto.email, dto.password);
    }

    if (dto.phone && dto.otpCode) {
      return this.loginWithOtp(dto.phone, dto.otpCode);
    }

    if ((dto.email || dto.phone) && dto.password) {
      return this.loginWithPassword((dto.email || dto.phone)!, dto.password);
    }

    throw new BadRequestException('Invalid login method. Provide email/phone with password or phone with OTP');
  }

  private async loginWithPassword(
    emailOrPhone: string,
    password: string,
  ): Promise<VendorAuthResponseDto> {
    await this.checkAccountLockout(emailOrPhone);

    const isEmail = emailOrPhone.includes('@');
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.vendor', 'vendor')
      .addSelect('user.password')
      .where(isEmail ? 'user.email = :emailOrPhone' : 'user.phone = :emailOrPhone', {
        emailOrPhone: isEmail ? emailOrPhone.toLowerCase() : emailOrPhone,
      })
      .andWhere('user.userType = :userType', { userType: UserType.VENDOR })
      .andWhere('user.deletedAt IS NULL')
      .getOne();

    if (!user || !user.vendor) {
      await this.handleFailedLogin(emailOrPhone);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if vendor is suspended or banned
    if ([VendorStatus.SUSPENDED, VendorStatus.BANNED].includes(user.vendor.status)) {
      throw new UnauthorizedException(`Account is ${user.vendor.status}. Please contact support`);
    }

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      await this.handleFailedLogin(emailOrPhone);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.resetFailedLoginAttempts(emailOrPhone);
    await this.updateLastLogin(user.id);

    const tokens = this.tokenService.generateTokenPair({
      sub: user.id.toString(),
      email: user.email!,
      type: 'vendor',
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
        id: user.vendor.id,
        email: user.email!,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        shopName: user.vendor.shopName,
        shopSlug: user.vendor.shopSlug,
        status: user.vendor.status,
        commissionRate: parseFloat(user.vendor.commissionRate.toString()),
        totalSales: parseFloat(user.vendor.totalSales.toString()),
        averageRating: user.vendor.averageRating ? parseFloat(user.vendor.averageRating.toString()) : undefined,
      },
      userType: 'vendor',
    };
  }

  private async loginWithOtp(
    phone: string,
    otpCode: string,
  ): Promise<VendorAuthResponseDto> {
    // TODO: Implement OTP verification logic with SMS service
    throw new BadRequestException('OTP login not yet implemented');
  }
}
