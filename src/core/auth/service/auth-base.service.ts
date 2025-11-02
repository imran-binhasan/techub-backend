import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/personnel-management/user/entity/user.entity';
import { RedisService } from 'src/core/redis/service/redis.service';
import { PasswordUtil } from 'src/shared/utils/password.util';
import { TokenService } from './token-service';
import { randomBytes } from 'crypto';


@Injectable()
export abstract class AuthBaseService {
  protected readonly MAX_LOGIN_ATTEMPTS = 10;
  protected readonly LOCKOUT_DURATION = 1500; 

  constructor(
    @InjectRepository(User)
    protected userRepository: Repository<User>,
    protected tokenService: TokenService,
    protected redisService: RedisService,
  ) {}


  protected async checkAccountLockout(email: string): Promise<void> {
    const lockoutKey = `lockout:${email}`;
    const ttl = await this.redisService.ttl(lockoutKey);
    
    if (ttl > 0) {
      throw new UnauthorizedException(
        `Account locked. Try again in ${Math.ceil(ttl / 60)} minutes`,
      );
    }
  }

  protected async handleFailedLogin(email: string): Promise<void> {
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

  protected async resetFailedLoginAttempts(email: string): Promise<void> {
    await this.redisService.del(`attempts:${email}`);
  }

  protected async storeRefreshToken(userId: number, token: string): Promise<void> {
    const ttl = 7 * 24 * 60 * 60; // 7 days
    await this.redisService.set(`refresh:${userId}`, token, { ttl });
  }

  protected async updateLastLogin(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
    });
  }

  protected async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return PasswordUtil.compare(password, hashedPassword);
  }

  /**
   * Generate a secure reset password token and store it with expiration
   * @param email User's email
   * @returns Reset token (to be sent via email)
   */
  protected async generateResetToken(email: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'emailVerified'],
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      throw new NotFoundException('If the email exists, a reset link will be sent');
    }

    // Generate cryptographically secure token
    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = await PasswordUtil.hash(resetToken);

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.userRepository.update(user.id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expiresAt,
    });

    // Store in Redis for fast validation (1 hour TTL)
    await this.redisService.set(
      `reset:${user.id}`,
      hashedToken,
      { ttl: 3600 }
    );

    return resetToken; // Return plain token to send via email
  }

  /**
   * Reset password using valid token
   * @param token Reset token from email
   * @param newPassword New password
   */
  protected async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<void> {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and new password are required');
    }

    // Hash the token to find the user (we store hashed tokens)
    const hashedToken = await PasswordUtil.hash(token);

    // Find user with valid reset token
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect(['user.resetPasswordToken', 'user.resetPasswordExpires', 'user.password', 'user.email'])
      .where('user.resetPasswordExpires > :now', { now: new Date() })
      .andWhere('user.deletedAt IS NULL')
      .getMany(); // Get all valid tokens, we'll verify in code

    if (!user || user.length === 0) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Find matching user by comparing tokens
    let matchedUser: User | null = null;
    for (const u of user) {
      if (u.resetPasswordToken) {
        const isMatch = await PasswordUtil.compare(token, u.resetPasswordToken);
        if (isMatch) {
          matchedUser = u;
          break;
        }
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Ensure new password is different from old one
    const isSamePassword = await PasswordUtil.compare(newPassword, matchedUser.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    // Hash new password and clear reset token
    const hashedPassword = await PasswordUtil.hash(newPassword);

    await this.userRepository.update(matchedUser.id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
      failedLoginAttempts: 0, // Reset failed attempts on successful password reset
    });

    // Clear Redis cache
    await this.redisService.del(`reset:${matchedUser.id}`);
    await this.redisService.del(`attempts:${matchedUser.email}`);
    await this.redisService.del(`lockout:${matchedUser.email}`);

    // Invalidate all existing refresh tokens for security
    await this.redisService.del(`refresh:${matchedUser.id}`);
  }
}
