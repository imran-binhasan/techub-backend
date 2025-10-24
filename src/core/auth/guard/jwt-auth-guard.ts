import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/auth.decorator';
import { TokenService } from '../service/token-service';
import { AuthService } from '../service/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token required');
    }

    try {
      const payload = this.tokenService.verifyAccessToken(token);

      if (payload.tokenType !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      // const user = await this.authService.validateUser(payload);
      // if (!user) {
      //   throw new UnauthorizedException('User not found or inactive');
      // }

      // request.user = this.buildUserContext(payload);
      return true;
    } catch (error) {
      this.logger.warn(`Authentication failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private buildUserContext(payload: any): any {
    const baseUser = {
      id: payload.sub,
      email: payload.email,
      type: payload.type,
    };

    if (payload.type === 'admin') {
      return {
        ...baseUser,
        role: payload.role,
        roleId: payload.roleId,
        permissions: payload.permissions || [],
      };
    }

    return baseUser;
  }
}
