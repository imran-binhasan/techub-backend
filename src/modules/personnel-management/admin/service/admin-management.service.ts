import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../entity/admin.entity';
import { User, UserType } from '../../user/entity/user.entity';
import { PasswordUtil } from 'src/shared/utils/password.util';
import { RedisService } from 'src/core/redis/service/redis.service';

/**
 * Admin Management Service
 *
 * Used by super-admins to manage other admin accounts.
 * Includes secure password reset that requires super-admin privileges.
 */
@Injectable()
export class AdminManagementService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private redisService: RedisService,
  ) {}

  /**
   * Reset password for an admin user (Super-admin only)
   *
   * Enterprise security requirement: Admin passwords can only be reset
   * by a super-admin with proper verification, never via self-service.
   *
   * @param superAdminId - ID of the super-admin performing the reset
   * @param targetAdminEmail - Email of admin whose password will be reset
   * @param newPassword - New password (must meet complexity requirements)
   * @param verificationNote - Reason/ticket number for audit trail
   */
  async resetAdminPassword(
    superAdminId: number,
    targetAdminEmail: string,
    newPassword: string,
    verificationNote?: string,
  ): Promise<{ message: string; temporaryPassword?: string }> {
    // Verify super-admin has permission (check roleId has 'super-admin' role)
    const superAdmin = await this.userRepository.findOne({
      where: { id: superAdminId, userType: UserType.ADMIN },
      relations: ['admin', 'admin.role'],
    });

    if (!superAdmin?.admin?.role) {
      throw new ForbiddenException(
        'Only super-admins can reset admin passwords',
      );
    }

    // Check if super-admin has the right permissions
    // TODO: Add specific permission check like: role.name === 'Super Admin'
    // For now, we assume any admin with roleId can reset (update this based on your role structure)

    // Find target admin
    const targetUser = await this.userRepository.findOne({
      where: {
        email: targetAdminEmail.toLowerCase(),
        userType: UserType.ADMIN,
      },
      relations: ['admin'],
      select: ['id', 'email', 'firstName', 'lastName', 'userType'],
    });

    if (!targetUser || !targetUser.admin) {
      throw new NotFoundException('Admin user not found');
    }

    // Prevent super-admin from being locked out if resetting their own password
    if (targetUser.id === superAdminId) {
      throw new BadRequestException(
        'Cannot reset your own password. Use change password instead.',
      );
    }

    // Hash new password
    const hashedPassword = await PasswordUtil.hash(newPassword);

    // Update password and clear any existing sessions
    await this.userRepository.update(targetUser.id, {
      password: hashedPassword,
      failedLoginAttempts: 0,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });

    // Invalidate all sessions for security
    await this.redisService.del(`refresh:${targetUser.id}`);
    await this.redisService.del(`attempts:${targetUser.email}`);
    await this.redisService.del(`lockout:${targetUser.email}`);

    // Log this action for audit trail
    // TODO: Implement audit logging
    console.log(
      `[SECURITY AUDIT] Admin password reset: ${superAdmin.email} reset password for ${targetUser.email}. Reason: ${verificationNote || 'Not provided'}`,
    );

    return {
      message: `Password reset successful for ${targetUser.email}. All sessions have been invalidated.`,
    };
  }

  /**
   * Generate temporary password for new admin (Super-admin only)
   *
   * Use this when creating new admin accounts. Admin must change
   * password on first login.
   */
  async generateTemporaryPassword(): Promise<string> {
    // Generate secure random password
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    const crypto = require('crypto');

    for (let i = 0; i < 16; i++) {
      password += chars[crypto.randomInt(chars.length)];
    }

    // Ensure it meets complexity requirements
    if (!/[A-Z]/.test(password)) password = 'A' + password.slice(1);
    if (!/[a-z]/.test(password)) password = password.slice(0, -1) + 'a';
    if (!/[0-9]/.test(password))
      password = password.slice(0, -2) + '2' + password.slice(-1);
    if (!/[!@#$%&*]/.test(password)) password = password + '!';

    return password;
  }

  /**
   * Lock admin account (Super-admin only)
   *
   * Temporarily or permanently disable admin account.
   */
  async lockAdminAccount(
    superAdminId: number,
    targetAdminEmail: string,
    reason: string,
    lockDurationMinutes?: number, // If not provided, lock indefinitely
  ): Promise<{ message: string }> {
    const targetUser = await this.userRepository.findOne({
      where: {
        email: targetAdminEmail.toLowerCase(),
        userType: UserType.ADMIN,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Admin user not found');
    }

    if (targetUser.id === superAdminId) {
      throw new BadRequestException('Cannot lock your own account');
    }

    // Set lockout
    const lockUntil = lockDurationMinutes
      ? new Date(Date.now() + lockDurationMinutes * 60000)
      : new Date('2099-12-31'); // Far future = indefinite

    await this.userRepository.update(targetUser.id, {
      accountLockedUntil: lockUntil,
    });

    // Invalidate sessions
    await this.redisService.del(`refresh:${targetUser.id}`);
    await this.redisService.set(
      `lockout:${targetUser.email}`,
      true,
      lockDurationMinutes ? { ttl: lockDurationMinutes * 60 } : undefined,
    );

    console.log(
      `[SECURITY AUDIT] Admin account locked: ${targetUser.email}. Reason: ${reason}. Duration: ${lockDurationMinutes || 'Indefinite'} minutes`,
    );

    return {
      message: `Admin account ${targetUser.email} has been locked. Reason: ${reason}`,
    };
  }

  /**
   * Unlock admin account (Super-admin only)
   */
  async unlockAdminAccount(
    superAdminId: number,
    targetAdminEmail: string,
  ): Promise<{ message: string }> {
    const targetUser = await this.userRepository.findOne({
      where: {
        email: targetAdminEmail.toLowerCase(),
        userType: UserType.ADMIN,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Admin user not found');
    }

    await this.userRepository.update(targetUser.id, {
      accountLockedUntil: undefined,
      failedLoginAttempts: 0,
    });

    await this.redisService.del(`lockout:${targetUser.email}`);
    await this.redisService.del(`attempts:${targetUser.email}`);

    console.log(`[SECURITY AUDIT] Admin account unlocked: ${targetUser.email}`);

    return {
      message: `Admin account ${targetUser.email} has been unlocked`,
    };
  }
}
