import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  RESOURCE_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
  MINIMUM_LEVEL_KEY,
} from '../decorator/auth.decorator';
import { PermissionCacheService } from '../service/permission-cache.service';
import { PermissionService } from 'src/modules/personnel-management/permission/service/permission.service';
import { AuthenticatedUser, isAdmin } from '../interface/auth-user.interface';

@Injectable()
export class DynamicRbacGuard implements CanActivate {
  private readonly logger = new Logger(DynamicRbacGuard.name);

  private readonly permissionHierarchy = {
    read: 1,
    write: 2,
    admin: 3,
  };

  constructor(
    private reflector: Reflector,
    private permissionCacheService: PermissionCacheService,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user || !isAdmin(user)) {
      throw new ForbiddenException('Admin access required');
    }

    // Check for required permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions) {
      return this.checkPermissions(user, requiredPermissions, false);
    }

    // Check for required ALL permissions
    const requireAll = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_ALL_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requireAll) {
      return this.checkPermissions(user, requireAll, true);
    }

    // Check for resource-based permission
    const resourceConfig = this.reflector.getAllAndOverride<{
      resource: string;
      action: string;
    }>(RESOURCE_KEY, [context.getHandler(), context.getClass()]);

    if (resourceConfig) {
      return this.checkResourcePermission(
        user,
        resourceConfig.resource,
        resourceConfig.action,
      );
    }

    // Check for minimum level
    const minimumLevel = this.reflector.getAllAndOverride<{
      resource: string;
      level: 'read' | 'write' | 'admin';
    }>(MINIMUM_LEVEL_KEY, [context.getHandler(), context.getClass()]);

    if (minimumLevel) {
      return this.checkMinimumLevel(
        user,
        minimumLevel.resource,
        minimumLevel.level,
      );
    }

    return true;
  }

  private async checkPermissions(
    user: AuthenticatedUser,
    requiredPermissions: string[],
    requireAll: boolean,
  ): Promise<boolean> {
    if (!isAdmin(user)) {
      throw new ForbiddenException('Admin access required');
    }

    // Try cache first
    let userPermissions = await this.permissionCacheService.getPermissions(
      user.roleId,
    );

    // Fallback to database
    if (!userPermissions) {
      userPermissions = await this.permissionService.getUserPermissions(
        user.roleId,
      );
      await this.permissionCacheService.setPermissions(
        user.roleId,
        userPermissions,
      );
    }

    const hasPermissions = requireAll
      ? requiredPermissions.every((perm) => userPermissions.includes(perm))
      : requiredPermissions.some((perm) => userPermissions.includes(perm));

    if (!hasPermissions) {
      this.logger.warn(
        `User ${user.id} denied access. Required: [${requiredPermissions.join(', ')}], Has: [${userPermissions.join(', ')}]`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private async checkResourcePermission(
    user: AuthenticatedUser,
    resource: string,
    action: string,
  ): Promise<boolean> {
    if (!isAdmin(user)) {
      throw new ForbiddenException('Admin access required');
    }

    const requiredPermission = `${action}:${resource}`;

    let userPermissions = await this.permissionCacheService.getPermissions(
      user.roleId,
    );

    if (!userPermissions) {
      userPermissions = await this.permissionService.getUserPermissions(
        user.roleId,
      );
      await this.permissionCacheService.setPermissions(
        user.roleId,
        userPermissions,
      );
    }

    if (!userPermissions.includes(requiredPermission)) {
      this.logger.warn(`User ${user.id} denied ${action} on ${resource}`);
      throw new ForbiddenException(
        `Permission denied: ${action} on ${resource}`,
      );
    }

    return true;
  }

  private async checkMinimumLevel(
    user: AuthenticatedUser,
    resource: string,
    level: 'read' | 'write' | 'admin',
  ): Promise<boolean> {
    if (!isAdmin(user)) {
      throw new ForbiddenException('Admin access required');
    }

    const requiredLevel = this.permissionHierarchy[level];

    let userPermissions = await this.permissionCacheService.getPermissions(
      user.roleId,
    );

    if (!userPermissions) {
      userPermissions = await this.permissionService.getUserPermissions(
        user.roleId,
      );
      await this.permissionCacheService.setPermissions(
        user.roleId,
        userPermissions,
      );
    }

    // Check if user has any permission level for this resource
    const resourcePermissions = userPermissions.filter((perm) =>
      perm.endsWith(`:${resource}`),
    );

    const userLevel = Math.max(
      ...resourcePermissions.map((perm) => {
        const action = perm.split(':')[0];
        return this.permissionHierarchy[action] || 0;
      }),
      0,
    );

    if (userLevel < requiredLevel) {
      this.logger.warn(
        `User ${user.id} has level ${userLevel} but requires ${requiredLevel} for ${resource}`,
      );
      throw new ForbiddenException(
        `Minimum ${level} permission required for ${resource}`,
      );
    }

    return true;
  }
}
