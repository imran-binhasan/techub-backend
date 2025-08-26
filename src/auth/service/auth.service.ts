import { Injectable, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "../guard/jwt.strategy";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Admin } from "src/admin/entity/admin.entity";
import { Customer } from "src/customer/entity/customer.entity";
import { Role } from "src/role/entity/role.entity";
import * as argon2 from 'argon2';

export interface LoginDto {
    email: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
}

export interface AdminLoginResponse extends TokenResponse {
    admin: Partial<Admin>;
    user_type: 'admin';
}

export interface CustomerLoginResponse extends TokenResponse {
    customer: Partial<Customer>;
    user_type: 'customer';
}

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        @InjectRepository(Admin)
        private adminRepository: Repository<Admin>,
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
    ) {}

    async adminLogin(loginDto: LoginDto): Promise<AdminLoginResponse> {
        const admin = await this.adminRepository.findOne({
            where: { email: loginDto.email, isActive: true },
            relations: ['role', 'role.permissions'],
            select: ['id', 'firstName', 'lastName', 'email', 'password', 'isActive', 'roleId', 'image']
        });

        if (!admin) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await argon2.verify(admin.password, loginDto.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!admin.role) {
            throw new UnauthorizedException('Admin role not found');
        }

        const tokenResponse = await this.generateAdminTokenResponse(admin);
        const { password: _, ...adminResult } = admin;

        return {
            ...tokenResponse,
            admin: adminResult,
            user_type: 'admin'
        };
    }

    async customerLogin(loginDto: LoginDto): Promise<CustomerLoginResponse> {
        const customer = await this.customerRepository.findOne({
            where: { email: loginDto.email, isActive: true },
            select: ['id', 'firstName', 'lastName', 'email', 'password', 'phone', 'isActive', 'image']
        });

        if (!customer) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await argon2.verify(customer.password, loginDto.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokenResponse = await this.generateCustomerTokenResponse(customer);
        const { password: _, ...customerResult } = customer;

        return {
            ...tokenResponse,
            customer: customerResult,
            user_type: 'customer'
        };
    }

    async generateAdminTokenResponse(admin: Admin): Promise<TokenResponse> {
        // Ensure role and permissions are loaded
        if (!admin.role || !admin.role.permissions) {
            const adminWithRole = await this.adminRepository.findOne({
                where: { id: admin.id },
                relations: ['role', 'role.permissions']
            });
            
            if (!adminWithRole?.role) {
                throw new NotFoundException('Admin role not found');
            }
            
            admin.role = adminWithRole.role;
        }

        const payload: JwtPayload = {
            sub: admin.id,
            email: admin.email,
            type: 'admin',
            role: admin.role.name,
            roleId: admin.role.id,
            permissions: admin.role.permissions ? admin.role.permissions.map(p => p.resource) : []
        };

        const token = this.generateToken(payload);
        
        return {
            access_token: token,
            token_type: 'Bearer',
            expires_in: 86400 // 24 hours
        };
    }

    async generateCustomerTokenResponse(customer: Customer): Promise<TokenResponse> {
        const payload: JwtPayload = {
            sub: customer.id,
            email: customer.email,
            type: 'customer'
            // No role, roleId, or permissions for customers
        };

        const token = this.generateToken(payload);
        
        return {
            access_token: token,
            token_type: 'Bearer',
            expires_in: 86400 // 24 hours
        };
    }

    generateToken(payload: JwtPayload): string {
        return this.jwtService.sign(payload);
    }

    verifyToken(token: string): JwtPayload {
        return this.jwtService.verify<JwtPayload>(token);
    }

    async validateAdmin(id: string): Promise<Admin | null> {
        return await this.adminRepository.findOne({
            where: { id, isActive: true },
            relations: ['role', 'role.permissions']
        });
    }

    async validateCustomer(id: string): Promise<Customer | null> {
        return await this.customerRepository.findOne({
            where: { id, isActive: true }
        });
    }

    async refreshAdminPermissions(adminId: string): Promise<TokenResponse> {
        const admin = await this.adminRepository.findOne({
            where: { id: adminId, isActive: true },
            relations: ['role', 'role.permissions']
        });

        if (!admin) {
            throw new NotFoundException('Admin not found');
        }

        return await this.generateAdminTokenResponse(admin);
    }

    async refreshCustomerToken(customerId: string): Promise<TokenResponse> {
        const customer = await this.customerRepository.findOne({
            where: { id: customerId, isActive: true }
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        return await this.generateCustomerTokenResponse(customer);
    }
}
       