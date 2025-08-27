import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from 'src/permission/service/permission.service';
import { PermissionCacheService } from '../service/permission-cache.service';
import {
  PERMISSIONS_KEY,
  RESOURCE_KEY,
  REQUIRE_ALL_PERMISSIONS_KEY,
  MINIMUM_LEVEL_KEY,
} from '../decorator/auth.decorator';
import { AuthenticatedUser, isAdmin } from '../interface/auth-user.interface';

interface ResourceAction {
  resource: string;
  action: string;
}

interface MinimumLevel {
  resource: string;
  level: 'read' | 'write' | 'admin';
}

@Injectable()
export class DynamicRbacGuard implements CanActivate {
  private readonly logger = new Logger(DynamicRbacGuard.name);
  private readonly levelHierarchy = ['read', 'write', 'admin'];

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
    private readonly permissionCacheService: PermissionCacheService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const resourceAction = this.reflector.getAllAndOverride<ResourceAction>(RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const allPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_ALL_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    const minimumLevel = this.reflector.getAllAndOverride<MinimumLevel>(MINIMUM_LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no RBAC requirements, allow access
    if (!permissions && !resourceAction && !allPermissions && !minimumLevel) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!isAdmin(user)) {
      throw new ForbiddenException('Access denied. Admin privileges required.');
    }

    const userPermissions = await this.getUserPermissions(user.roleId);

    try {
      if (resourceAction) {
        return this.checkResourcePermission(userPermissions, resourceAction);
      }

      if (permissions) {
        return this.checkOrPermissions(userPermissions, permissions);
      }

      if (allPermissions) {
        return this.checkAndPermissions(userPermissions, allPermissions);
      }

      if (minimumLevel) {
        return this.checkMinimumLevel(userPermissions, minimumLevel);
      }
    } catch (error) {
      this.logger.error(`RBAC check failed for user ${user.id}: ${error.message}`);
      throw error;
    }

    return false;
  }

  private async getUserPermissions(roleId: string): Promise<string[]> {
    // Try cache first
    let permissions = await this.permissionCacheService.getPermissions(roleId);
    
    if (!permissions) {
      // Fallback to database
      permissions = await this.permissionService.getUserPermissions(roleId);
      // Cache for future use
      await this.permissionCacheService.setPermissions(roleId, permissions);
    }

    return permissions;
  }

  private checkResourcePermission(
    userPermissions: string[],
    resourceAction: ResourceAction
  ): boolean {
    const requiredPermission = `${resourceAction.action}:${resourceAction.resource}`;
    
    if (!this.hasPermission(userPermissions, requiredPermission)) {
      throw new ForbiddenException(`Access denied. Required permission: ${requiredPermission}`);
    }

    return true;
  }

  private checkOrPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    const hasAnyPermission = requiredPermissions.some(permission =>
      this.hasPermission(userPermissions, permission)
    );

    if (!hasAnyPermission) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(' OR ')}`
      );
    }

    return true;
  }

  private checkAndPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    const missingPermissions = requiredPermissions.filter(
      permission => !this.hasPermission(userPermissions, permission)
    );

    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Access denied. Missing permissions: ${missingPermissions.join(', ')}`
      );
    }

    return true;
  }

  private checkMinimumLevel(userPermissions: string[], minimumLevel: MinimumLevel): boolean {
    const requiredLevelIndex = this.levelHierarchy.indexOf(minimumLevel.level);
    
    if (requiredLevelIndex === -1) {
      throw new ForbiddenException('Invalid permission level specified');
    }

    // Check if user has required level or higher
    for (let i = requiredLevelIndex; i < this.levelHierarchy.length; i++) {
      const permission = `${this.levelHierarchy[i]}:${minimumLevel.resource}`;
      if (this.hasPermission(userPermissions, permission)) {
        return true;
      }
    }

    throw new ForbiddenException(
      `Access denied. Minimum ${minimumLevel.level} level required for ${minimumLevel.resource}`
    );
  }

  private hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    // Super admin wildcard
    if (userPermissions.includes('*:*')) {
      return true;
    }

    // Exact match
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    const [action, resource] = requiredPermission.split(':');
    if (!action || !resource) {
      return false;
    }

    // Wildcard matches
    return (
      userPermissions.includes(`*:${resource}`) || // Resource wildcard
      userPermissions.includes(`${action}:*`)      // Action wildcard
    );
  }
}