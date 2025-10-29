import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/personnel-management/user/entity/user.entity';
import { RedisService } from 'src/core/redis/service/redis.service';
import { PasswordUtil } from 'src/shared/utils/password.util';
import { TokenService } from './token-service';


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
}
