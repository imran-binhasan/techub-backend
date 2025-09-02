import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_TYPE_KEY } from '../decorator/auth.decorator';
import {
  AuthenticatedUser,
  isAdmin,
  isCustomer,
} from '../interface/auth-user.interface';

@Injectable()
export class UserTypeGuard implements CanActivate {
  private readonly logger = new Logger(UserTypeGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredUserType = this.reflector.getAllAndOverride<
      'admin' | 'customer'
    >(USER_TYPE_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredUserType) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasAccess = user.type === requiredUserType;

    if (!hasAccess) {
      this.logger.warn(
        `Access denied: User ${user.id} (${user.type}) tried to access ${requiredUserType}-only resource`,
      );
      throw new ForbiddenException(
        `Access denied. ${requiredUserType} privileges required.`,
      );
    }

    return true;
  }
}
