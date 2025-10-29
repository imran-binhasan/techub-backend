import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Customer } from '../entity/customer.entity';
import { CustomerRegisterDto } from '../dto/customer-register.dto';
import { CustomerLoginDto } from '../dto/customer-login.dto';
import { CustomerAuthResponseDto } from '../dto/customer-auth-response.dto';
import { AuthBaseService } from 'src/core/auth/service/auth-base.service';
import { User, UserType } from '../../user/entity/user.entity';
import { TokenService } from 'src/core/auth/service/token-service';
import { RedisService } from 'src/core/redis/service/redis.service';
import { PasswordUtil } from 'src/shared/utils/password.util';

@Injectable()
export class CustomerAuthService extends AuthBaseService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private dataSource: DataSource,
    userRepository: Repository<User>,
    tokenService: TokenService,
    redisService: RedisService,
  ) {
    super(userRepository, tokenService, redisService);
  }

  async register(dto: CustomerRegisterDto): Promise<CustomerAuthResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      // Check uniqueness
      const existing = await manager.findOne(User, {
        where: [{ email: dto.email }, { phone: dto.phone }].filter(Boolean),
      });

      if (existing) {
        throw new ConflictException(
          existing.email === dto.email
            ? 'Email already exists'
            : 'Phone already exists',
        );
      }

      // Create user
      const user = manager.create(User, {
        email: dto.email.toLowerCase(),
        password: await PasswordUtil.hash(dto.password),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        userType: UserType.CUSTOMER,
        emailVerified: false,
      });
      await manager.save(user);

      // Create customer profile
      const customer = manager.create(Customer, {
        userId: user.id,
        preferredLanguage: dto.preferredLanguage || 'en',
        tier: 'bronze',
      });
      await manager.save(customer);

      // Generate tokens
      const tokens = this.tokenService.generateTokenPair({
        sub: user.id.toString(),
        email: user.email,
        type: 'customer',
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
          id: customer.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          rewardPoints: customer.rewardPoints,
          tier: customer.tier,
        },
        userType: 'customer',
      };
    });
  }

  async login(dto: CustomerLoginDto): Promise<CustomerAuthResponseDto> {
    if (dto.email && dto.password) {
      return this.loginWithPassword(dto.email, dto.password);
    }

    if (dto.phone && dto.otpCode) {
      return this.loginWithOtp(dto.phone, dto.otpCode);
    }

    throw new BadRequestException('Invalid login method');
  }

  private async loginWithPassword(
    email: string,
    password: string,
  ): Promise<CustomerAuthResponseDto> {
    await this.checkAccountLockout(email);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.customer', 'customer')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .andWhere('user.userType = :userType', { userType: UserType.CUSTOMER })
      .andWhere('user.deletedAt IS NULL')
      .getOne();

    if (!user || !user.customer) {
      await this.handleFailedLogin(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      await this.handleFailedLogin(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.resetFailedLoginAttempts(email);
    await this.updateLastLogin(user.id);

    const tokens = this.tokenService.generateTokenPair({
      sub: user.id.toString(),
      email: user.email,
      type: 'customer',
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
        id: user.customer.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        rewardPoints: user.customer.rewardPoints,
        tier: user.customer.tier,
      },
      userType: 'customer',
    };
  }

  private async loginWithOtp(
    phone: string,
    otpCode: string,
  ): Promise<CustomerAuthResponseDto> {
    // Implementation similar to password login
    throw new BadRequestException('OTP login not yet implemented');
  }
}