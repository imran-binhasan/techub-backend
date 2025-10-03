import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { TokenResponse } from '../interface/token-response.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokenPair(
    payload: Omit<JwtPayload, 'iat' | 'exp' | 'tokenType'>,
  ): TokenResponse {
    const accessPayload: JwtPayload = { ...payload, tokenType: 'access' };
    const refreshPayload: JwtPayload = { ...payload, tokenType: 'refresh' };

    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 minutes
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
