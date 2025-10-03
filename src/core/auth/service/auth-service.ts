import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { Admin } from 'src/user-management/admin/entity/admin.entity';
import { Customer } from 'src/user-management/customer/entity/customer.entity';
import { TokenService } from './token-service';
import { LoginDto } from '../dto/login.dto';
import { AuthResponse } from '../interface/token-response.interface';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { PermissionCacheService } from './permission-cache.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly tokenService: TokenService,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  async login(
    loginDto: LoginDto,
    userType: 'admin' | 'customer',
  ): Promise<AuthResponse> {
    if (userType === 'admin') {
      return this.adminLogin(loginDto);
    }
    return this.customerLogin(loginDto);
  }

  private async adminLogin(loginDto: LoginDto): Promise<AuthResponse> {
    const admin = await this.adminRepository.findOne({
      where: { email: loginDto.email, isActive: true },
      relations: ['role', 'role.permissions'],
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'password',
        'isActive',
        'roleId',
        'image',
      ],
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.verifyPassword(admin.password, loginDto.password);

    if (!admin.role) {
      throw new UnauthorizedException('Admin role not configured');
    }

    const permissions = admin.role.permissions.map(
      (p) => `${p.action}:${p.resource}`,
    );

    // Cache permissions for future use
    await this.permissionCacheService.setPermissions(
      admin.role.id,
      permissions,
    );

    const tokenPayload: Omit<JwtPayload, 'iat' | 'exp' | 'tokenType'> = {
      sub: admin.id,
      email: admin.email,
      type: 'admin',
      role: `${admin.role.resource}:${admin.role.action}`,
      roleId: admin.role.id,
      permissions,
    };

    const tokens = this.tokenService.generateTokenPair(tokenPayload);
    const { password, ...userResult } = admin;

    return {
      ...tokens,
      user: userResult,
      user_type: 'admin',
    };
  }

  private async customerLogin(loginDto: LoginDto): Promise<AuthResponse> {
    const customer = await this.customerRepository.findOne({
      where: { email: loginDto.email, isActive: true },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'password',
        'phone',
        'isActive',
        'image',
      ],
    });

    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.verifyPassword(customer.password, loginDto.password);

    const tokenPayload: Omit<JwtPayload, 'iat' | 'exp' | 'tokenType'> = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    };

    const tokens = this.tokenService.generateTokenPair(tokenPayload);
    const { password, ...userResult } = customer;

    return {
      ...tokens,
      user: userResult,
      user_type: 'customer',
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    const { userId, userType } = refreshTokenDto;

    if (userType === 'admin') {
      return this.refreshAdminToken(userId);
    }
    return this.refreshCustomerToken(userId);
  }

  private async refreshAdminToken(adminId: string): Promise<AuthResponse> {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId, isActive: true },
      relations: ['role', 'role.permissions'],
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'isActive',
        'roleId',
        'image',
      ],
    });

    if (!admin || !admin.role) {
      throw new NotFoundException('Admin not found or role not configured');
    }

    const permissions = admin.role.permissions.map(
      (p) => `${p.action}:${p.resource}`,
    );

    // Update cache with fresh permissions
    await this.permissionCacheService.setPermissions(
      admin.role.id,
      permissions,
    );

    const tokenPayload: Omit<JwtPayload, 'iat' | 'exp' | 'tokenType'> = {
      sub: admin.id,
      email: admin.email,
      type: 'admin',
      role: `${admin.role.resource}:${admin.role.action}`,
      roleId: admin.role.id,
      permissions,
    };

    const tokens = this.tokenService.generateTokenPair(tokenPayload);

    return {
      ...tokens,
      user: admin,
      user_type: 'admin',
    };
  }

  private async refreshCustomerToken(
    customerId: string,
  ): Promise<AuthResponse> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, isActive: true },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'isActive',
        'image',
      ],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const tokenPayload: Omit<JwtPayload, 'iat' | 'exp' | 'tokenType'> = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    };

    const tokens = this.tokenService.generateTokenPair(tokenPayload);

    return {
      ...tokens,
      user: customer,
      user_type: 'customer',
    };
  }

  async logout(userId: string): Promise<void> {
    // Implement token blacklisting if needed
    // For now, we'll just invalidate permissions cache
    await this.permissionCacheService.invalidateAllPermissions();
  }

  async validateUser(payload: JwtPayload): Promise<any> {
    if (payload.type === 'admin') {
      return this.validateAdmin(payload.sub);
    }
    return this.validateCustomer(payload.sub);
  }

  private async validateAdmin(adminId: string): Promise<Admin | null> {
    return this.adminRepository.findOne({
      where: { id: adminId, isActive: true },
      relations: ['role', 'role.permissions'],
    });
  }

  private async validateCustomer(customerId: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { id: customerId, isActive: true },
    });
  }

  private async verifyPassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<void> {
    const isValid = await argon2.verify(hashedPassword, plainPassword);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
