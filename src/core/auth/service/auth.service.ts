import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PasswordUtil } from 'src/shared/utils/password.util';
import { TokenService } from './token-service';
import { RedisService } from 'src/core/redis/service/redis.service';
import { User } from 'src/modules/personnel-management/user/entity/user.entity';
import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';
import { Vendor, VendorStatus } from 'src/modules/personnel-management/vendor/entity/vendor.entity';
import { Admin } from 'src/modules/personnel-management/admin/entity/admin.entity';
import { Role } from 'src/modules/personnel-management/role/entity/role.entity';
import { CustomerRegisterDto } from '../dto/customer-register.dto';
import { VendorRegisterDto } from '../dto/vendor-register.dto';
import { AdminRegisterDto } from '../dto/admin-register.dto';
import { CustomerLoginDto } from '../dto/customer-login.dto';
import { VendorLoginDto } from '../dto/vendor-login.dto';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { AuthResponse } from '../interface/token-response.interface';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 900; // 15 minutes

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private tokenService: TokenService,
    private redisService: RedisService,
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  // ========== CUSTOMER ==========
  async registerCustomer(dto: CustomerRegisterDto): Promise<AuthResponse<Customer>> {
    const passwordValidation = PasswordUtil.validateStrength(dto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.message);
    }

    // Use transaction for atomicity
    return await this.dataSource.transaction(async (manager) => {
      await this.validateUserUniqueness(dto.email, dto.phone);

      const role = await manager.findOne(Role, { where: { name: 'CUSTOMER' } });
      if (!role) throw new NotFoundException('Customer role not found');

      const hashedPassword = await PasswordUtil.hash(dto.password);

      const user = manager.create(User, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        roleId: role.id,
      });

      await manager.save(user);

      const customer = manager.create(Customer, {
        user,
        preferredLanguage: dto.preferredLanguage || 'en',
      });
      await manager.save(customer);

      const tokens = this.tokenService.generateTokenPair({
        sub: user.id.toString(),
        email: user.email,
        type: 'customer',
      });

      // Store refresh token
      await this.storeRefreshToken(user.id, tokens.refresh_token);

      return {
        ...tokens,
        user: customer,
        user_type: 'customer',
      };
    });
  }

  async loginCustomer(dto: CustomerLoginDto): Promise<AuthResponse<Customer>> {
    if (dto.email && dto.password) {
      return this.loginWithEmailPassword(dto.email, dto.password, 'CUSTOMER');
    }

    if (dto.phone && dto.otpCode) {
      return this.loginWithOtp(dto.phone, dto.otpCode, 'CUSTOMER');
    }

    if (dto.googleToken) {
      return this.loginWithGoogle(dto.googleToken, 'CUSTOMER');
    }

    throw new BadRequestException('Invalid login method');
  }

  // ========== VENDOR ==========
  async registerVendor(dto: VendorRegisterDto): Promise<AuthResponse<Vendor>> {
    const passwordValidation = PasswordUtil.validateStrength(dto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.message);
    }

    return await this.dataSource.transaction(async (manager) => {
      await this.validateUserUniqueness(dto.email, dto.phone);

      // Check shop slug uniqueness
      const existingVendor = await manager.findOne(Vendor, {
        where: { shopSlug: dto.shopSlug },
      });
      if (existingVendor) {
        throw new ConflictException('Shop slug already taken');
      }

      const role = await manager.findOne(Role, { where: { name: 'VENDOR' } });
      if (!role) throw new NotFoundException('Vendor role not found');

      const hashedPassword = await PasswordUtil.hash(dto.password);

      const user = manager.create(User, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        roleId: role.id,
      });

      await manager.save(user);

      const vendor = manager.create(Vendor, {
        user,
        userId: user.id,
        shopName: dto.shopName,
        shopSlug: dto.shopSlug,
        shopDescription: dto.shopDescription,
        businessEmail: dto.businessEmail,
        businessPhone: dto.businessPhone,
        status: VendorStatus.PENDING_VERIFICATION,
      });

      await manager.save(vendor);

      const tokens = this.tokenService.generateTokenPair({
        sub: user.id.toString(),
        email: user.email,
        type: 'vendor',
      });

      await this.storeRefreshToken(user.id, tokens.refresh_token);

      return {
        ...tokens,
        user: vendor,
        user_type: 'vendor',
      };
    });
  }

  async loginVendor(dto: VendorLoginDto): Promise<AuthResponse<Vendor>> {
    if (dto.email && dto.password) {
      return this.loginWithEmailPassword(dto.email, dto.password, 'VENDOR');
    }

    if (dto.phone && dto.otpCode) {
      return this.loginWithOtp(dto.phone, dto.otpCode, 'VENDOR');
    }

    throw new BadRequestException('Invalid login method');
  }

  // ========== ADMIN ==========
  async registerAdmin(dto: AdminRegisterDto): Promise<AuthResponse<Admin>> {
    const passwordValidation = PasswordUtil.validateStrength(dto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.message);
    }

    return await this.dataSource.transaction(async (manager) => {
      await this.validateUserUniqueness(dto.email, dto.phone);

      const role = await manager.findOne(Role, { where: { name: 'ADMIN' } });
      if (!role) throw new NotFoundException('Admin role not found');

      const hashedPassword = await PasswordUtil.hash(dto.password);

      const user = manager.create(User, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        roleId: role.id,
      });

      await manager.save(user);

      const admin = manager.create(Admin, {
        user,
        department: dto.department,
        employeeNumber: dto.employeeNumber,
      });

      await manager.save(admin);

      const tokens = this.tokenService.generateTokenPair({
        sub: user.id.toString(),
        email: user.email,
        type: 'admin',
        role: role.name,
        roleId: role.id,
      });

      await this.storeRefreshToken(user.id, tokens.refresh_token);

      return {
        ...tokens,
        user: admin,
        user_type: 'admin',
      };
    });
  }

  async loginAdmin(dto: AdminLoginDto): Promise<AuthResponse<Admin>> {
    return this.loginWithEmailPassword(dto.email, dto.password, 'ADMIN');
  }

  // ========== HELPER METHODS ==========
  private async loginWithEmailPassword<T>(
    email: string,
    password: string,
    roleName: string,
  ): Promise<AuthResponse<T>> {
    // Check if account is locked
    await this.checkAccountLockout(email);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.customer', 'customer')
      .leftJoinAndSelect('user.vendor', 'vendor')
      .leftJoinAndSelect('user.admin', 'admin')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .andWhere('role.name = :roleName', { roleName })
      .getOne();

    if (!user) {
      await this.handleFailedLogin(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await PasswordUtil.compare(password, user.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts
    await this.resetFailedLoginAttempts(user.id);
    await this.updateLastLogin(user.id);

    const tokens = this.tokenService.generateTokenPair({
      sub: user.id.toString(),
      email: user.email,
      type: roleName.toLowerCase() as 'admin' | 'customer' | 'vendor',
      ...(roleName === 'ADMIN' && {
        role: user.role.name,
        roleId: user.roleId,
      }),
    });

    await this.storeRefreshToken(user.id, tokens.refresh_token);

    // Get profile based on role
    const profile = user.customer || user.vendor || user.admin;

    return {
      ...tokens,
      user: profile as T,
      user_type: roleName.toLowerCase() as 'admin' | 'customer' | 'vendor',
    };
  }

  private async loginWithOtp<T>(
    phone: string,
    otpCode: string,
    roleName: string,
  ): Promise<AuthResponse<T>> {
    // Verify OTP from Redis
    const storedOtp = await this.redisService.get<string>(`otp:${phone}`);
    
    if (!storedOtp || storedOtp !== otpCode) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.userRepository.findOne({
      where: { phone, role: { name: roleName } },
      relations: ['role', 'customer', 'vendor', 'admin'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete OTP after successful verification
    await this.redisService.del(`otp:${phone}`);

    await this.updateLastLogin(user.id);

    const tokens = this.tokenService.generateTokenPair({
      sub: user.id.toString(),
      email: user.email,
      type: roleName.toLowerCase() as 'admin' | 'customer' | 'vendor',
    });

    await this.storeRefreshToken(user.id, tokens.refresh_token);

    const profile = user.customer || user.vendor || user.admin;

    return {
      ...tokens,
      user: profile as T,
      user_type: roleName.toLowerCase() as 'admin' | 'customer' | 'vendor',
    };
  }

  private async loginWithGoogle<T>(
    googleToken: string,
    roleName: string,
  ): Promise<AuthResponse<T>> {
    // TODO: Implement Google OAuth verification
    // Use google-auth-library to verify token
    throw new BadRequestException('Google login not yet implemented');
  }

  async sendOtp(phone: string, roleName: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { phone, role: { name: roleName } },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store in Redis with 5-minute expiry
    await this.redisService.set(`otp:${phone}`, otp, { ttl: 300 });

    // TODO: Send via SMS service (Twilio, AWS SNS, etc.)
    // await this.smsService.sendOtp(phone, otp);

    // In development, log OTP
    if (this.configService.get('NODE_ENV') === 'development') {
      console.log(`OTP for ${phone}: ${otp}`);
    }

    return { message: 'OTP sent successfully' };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    // Verify refresh token in Redis
    const storedToken = await this.redisService.get<string>(
      `refresh:${payload.sub}`,
    );

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: parseInt(payload.sub) },
      relations: ['role', 'customer', 'vendor', 'admin'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = this.tokenService.generateTokenPair({
      sub: user.id.toString(),
      email: user.email,
      type: payload.type,
      ...(payload.role && { role: payload.role, roleId: payload.roleId }),
    });

    await this.storeRefreshToken(user.id, tokens.refresh_token);

    const profile = user.customer || user.vendor || user.admin;

    return {
      ...tokens,
      user: profile,
      user_type: payload.type,
    };
  }

  async logout(userId: number): Promise<void> {
    await this.redisService.del(`refresh:${userId}`);
  }

  private async validateUserUniqueness(email: string, phone?: string): Promise<void> {
    const existing = await this.userRepository.findOne({
      where: [{ email }, ...(phone ? [{ phone }] : [])],
    });

    if (existing?.email === email) {
      throw new ConflictException('Email already exists');
    }

    if (existing?.phone === phone) {
      throw new ConflictException('Phone already exists');
    }
  }

  private async storeRefreshToken(userId: number, token: string): Promise<void> {
    const ttl = 7 * 24 * 60 * 60; // 7 days
    await this.redisService.set(`refresh:${userId}`, token, { ttl });
  }

  private async updateLastLogin(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
    });
  }

  private async checkAccountLockout(email: string): Promise<void> {
    const lockoutKey = `lockout:${email}`;
    const isLocked = await this.redisService.exists(lockoutKey);

    if (isLocked) {
      const ttl = await this.redisService.ttl(lockoutKey);
      throw new UnauthorizedException(
        `Account locked. Try again in ${Math.ceil(ttl / 60)} minutes`,
      );
    }
  }

  private async handleFailedLogin(email: string): Promise<void> {
    const attemptsKey = `attempts:${email}`;
    const attempts = (await this.redisService.get<number>(attemptsKey)) || 0;
    const newAttempts = attempts + 1;

    await this.redisService.set(attemptsKey, newAttempts, { ttl: 900 });

    if (newAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      await this.redisService.set(`lockout:${email}`, true, {
        ttl: this.LOCKOUT_DURATION,
      });
      await this.redisService.del(attemptsKey);
    }
  }

  private async resetFailedLoginAttempts(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      await this.redisService.del(`attempts:${user.email}`);
    }
  }
}