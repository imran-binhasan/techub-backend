import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordUtil } from 'src/shared/utils/password.util';
import { TokenService } from './token-service';
import {
  User,
  UserType,
} from 'src/modules/personnel-management/user/entity/user.entity';
import { Customer } from 'src/modules/personnel-management/customer/entity/customer.entity';
import { Vendor } from 'src/modules/personnel-management/vendor/entity/vendor.entity';
import { Admin } from 'src/modules/personnel-management/admin/entity/admin.entity';
import { AuthResponse } from '../interface/token-response.interface';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private tokenService: TokenService,
  ) {}

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .andWhere('user.deleted_at IS NULL')
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await PasswordUtil.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Step 2: Load type-specific data based on userType
    let profile;
    let permissions: string[] = [];

    switch (user.userType) {
      case UserType.CUSTOMER:
        profile = await this.customerRepository.findOne({
          where: { userId: user.id },
        });
        break;

      case UserType.VENDOR:
        profile = await this.vendorRepository.findOne({
          where: { userId: user.id },
        });
        if(!profile) {
        break;

      case UserType.ADMIN:
        const admin = await this.adminRepository.findOne({
          where: { userId: user.id },
          relations: ['role', 'role.permissions'],
        });
        profile = admin;
        permissions = admin.role.permissions.map(
          (p) => `${p.action}:${p.resource}`,
        );
        break;
    }

    // Step 3: Generate tokens
    const tokens = this.tokenService.generateTokenPair({
      sub: user.id.toString(),
      email: user.email,
      type: user.userType,
      ...(user.userType === 'admin' && {
        roleId: (profile as Admin).roleId,
        permissions,
      }),
    });

    return {
      tokens,
      user: { ...user, ...profile },
      userType: user.userType,
    };
  }
}
