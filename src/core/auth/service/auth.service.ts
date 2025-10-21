import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { PasswordUtil } from 'src/shared/utils/password.util';
import { User } from 'src/modules/personnel-management/user/entity/user.entity';
import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';
import { Vendor, VendorStatus } from 'src/modules/personnel-management/vendor/entity/vendor.entity';
import { Role } from 'src/modules/personnel-management/role/entity/role.entity';
import { CustomerRegisterDto } from '../dto/customer-register.dto';
import { VendorRegisterDto } from '../dto/vendor-register.dto';
import { AdminRegisterDto } from '../dto/admin-register.dto';
import { CustomerLoginDto } from '../dto/customer-login.dto';
import { VendorLoginDto } from '../dto/vendor-login.dto';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { Repository } from 'typeorm';
import { Admin } from 'src/modules/personnel-management/admin/entity/admin.entity';

@Injectable()
export class AuthService {
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
    private jwtService: JwtService,
  ) {}

  // ========== CUSTOMER ==========
  async registerCustomer(
    dto: CustomerRegisterDto,
  ): Promise<{ user: User; token: string }> {
    const passwordValidation = PasswordUtil.validateStrength(dto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.message);
    }

    await this.validateUserUniqueness(dto.email, dto.phone);

    const role = await this.roleRepository.findOne({ where: { name: 'CUSTOMER' } });
    if (!role) throw new NotFoundException('Customer role not found');

    const hashedPassword = await PasswordUtil.hash(dto.password);

    const user = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      roleId: role.id,
    });

    await this.userRepository.save(user);

    const customer = this.customerRepository.create({
      user,
      preferredLanguage: dto.preferredLanguage,
    });
    await this.customerRepository.save(customer);

    const token = this.generateToken(user, role.name);

    return { user, token };
  }

  async loginCustomer(dto: CustomerLoginDto): Promise<{ user: User; token: string }> {
    if (dto.email && dto.password) {
      return this.loginWithEmailPassword(dto.email, dto.password, 'CUSTOMER');
    }

    if (dto.phone && dto.otpCode) {
      return this.loginWithOtp(dto.phone, dto.otpCode, 'CUSTOMER');
    }

    throw new BadRequestException('Invalid login method');
  }

  // ========== VENDOR ==========
  async registerVendor(
    dto: VendorRegisterDto,
  ): Promise<{ user: User; token: string }> {
    const passwordValidation = PasswordUtil.validateStrength(dto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.message);
    }

    await this.validateUserUniqueness(dto.email, dto.phone);

    const role = await this.roleRepository.findOne({ where: { name: 'VENDOR' } });
    if (!role) throw new NotFoundException('Vendor role not found');

    const hashedPassword = await PasswordUtil.hash(dto.password);

    const user = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      roleId: role.id,
    });

    await this.userRepository.save(user);

    const vendor = this.vendorRepository.create({
      user,
      shopName: dto.shopName,
      shopSlug: dto.shopSlug,
      shopDescription: dto.shopDescription,
      businessEmail: dto.businessEmail,
      businessPhone: dto.businessPhone,
      status: VendorStatus.PENDING_VERIFICATION,
    });

    await this.vendorRepository.save(vendor);

    const token = this.generateToken(user, role.name);

    return { user, token };
  }

  async loginVendor(dto: VendorLoginDto): Promise<{ user: User; token: string }> {
    if (dto.email && dto.password) {
      return this.loginWithEmailPassword(dto.email, dto.password, 'VENDOR');
    }

    if (dto.phone && dto.otpCode) {
      return this.loginWithOtp(dto.phone, dto.otpCode, 'VENDOR');
    }

    throw new BadRequestException('Invalid login method');
  }

  // ========== ADMIN ==========
  async registerAdmin(
    dto: AdminRegisterDto,
  ): Promise<{ user: User; token: string }> {
    const passwordValidation = PasswordUtil.validateStrength(dto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.message);
    }

    await this.validateUserUniqueness(dto.email, dto.phone);

    const role = await this.roleRepository.findOne({ where: { name: 'ADMIN' } });
    if (!role) throw new NotFoundException('Admin role not found');

    const hashedPassword = await PasswordUtil.hash(dto.password);

    const user = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      roleId: role.id,
    });

    await this.userRepository.save(user);

    const admin = this.adminRepository.create({
      user,
      department: dto.department,
      employeeNumber: dto.employeeNumber,
    });

    await this.adminRepository.save(admin);

    const token = this.generateToken(user, role.name);

    return { user, token };
  }

  async loginAdmin(dto: AdminLoginDto): Promise<{ user: User; token: string }> {
    return this.loginWithEmailPassword(dto.email, dto.password, 'ADMIN');
  }

  // ========== HELPER METHODS ==========
  private async loginWithEmailPassword(
    email: string,
    password: string,
    roleName: string,
  ): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findOne({
      where: { email, role: { name: roleName } },
      relations: ['role'],
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await PasswordUtil.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.updateLastLogin(user.id);
    const token = this.generateToken(user, roleName);

    return { user, token };
  }

  private async loginWithOtp(
    phone: string,
    otpCode: string,
    roleName: string,
  ): Promise<{ user: User; token: string }> {
    // TODO: Implement OTP verification with cache/redis
    // For now, just a placeholder
    const user = await this.userRepository.findOne({
      where: { phone, role: { name: roleName } },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.updateLastLogin(user.id);
    const token = this.generateToken(user, roleName);

    return { user, token };
  }

  async sendOtp(phone: string, roleName: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { phone, role: { name: roleName } },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // TODO: Generate OTP and send via SMS
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // await this.smsService.sendOtp(phone, otp);

    return { message: 'OTP sent successfully' };
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

  private generateToken(user: User, roleName: string): string {
    return this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: roleName,
    });
  }

  private async updateLastLogin(userId: number): Promise<void> {
    await this.userRepository.update(userId, { lastLoginAt: new Date() });
  }
}