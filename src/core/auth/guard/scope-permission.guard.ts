import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/modules/personnel-management/role/entity/role.entity';
import { Permission } from 'src/modules/personnel-management/permission/entity/permission.entity';
import { PermissionCacheService } from '../service/permission-cache.service';

export const PERMISSION_KEY = 'permission';

export interface PermissionOptions {
  action: string;
  resource: string;
  allowedScopes?: string[]; // ['own', 'all', 'department', 'assigned']
}

export interface UserScope {
  hasAllAccess: boolean;
  hasOwnAccess: boolean;
  hasDepartmentAccess: boolean;
  hasAssignedAccess: boolean;
  maxScope: 'all' | 'department' | 'assigned' | 'own' | null;
  allowedScopes: string[];
  permissions: Permission[];
}

@Injectable()
export class ScopePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private permissionCacheService: PermissionCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionOptions = this.reflector.getAllAndOverride<PermissionOptions>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permission decorator, allow access (handled by other guards)
    if (!permissionOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User authentication required');
    }

    // Only admins have roleId - customers/vendors don't use RBAC
    if (!user.roleId) {
      throw new ForbiddenException('This endpoint requires admin privileges');
    }

    // Try to get cached permissions first
    let permissions: Permission[] | null =
      await this.permissionCacheService.getUserPermissions(user.id);

    // If not cached, fetch from database
    if (!permissions || permissions.length === 0) {
      const role = await this.roleRepository.findOne({
        where: { id: user.roleId },
        relations: ['permissions'],
      });

      if (!role || !role.permissions) {
        throw new ForbiddenException('Role not found or has no permissions');
      }

      permissions = role.permissions;

      // Cache for future requests
      await this.permissionCacheService.cacheUserPermissions(
        user.id,
        user.roleId,
        permissions,
      );
    }

    // Find matching permissions for the requested action and resource
    const matchingPermissions = permissions.filter(
      (p) =>
        p.action === permissionOptions.action &&
        p.resource === permissionOptions.resource,
    );

    if (matchingPermissions.length === 0) {
      throw new ForbiddenException(
        `Missing permission: ${permissionOptions.action}:${permissionOptions.resource}`,
      );
    }

    // Determine user's scope capabilities
    const userScope = this.determineUserScope(
      matchingPermissions,
      permissionOptions,
    );

    // Check if user has any allowed scope
    if (
      !userScope.hasAllAccess &&
      !userScope.hasOwnAccess &&
      !userScope.hasDepartmentAccess &&
      !userScope.hasAssignedAccess
    ) {
      throw new ForbiddenException(
        `Insufficient scope for ${permissionOptions.action}:${permissionOptions.resource}`,
      );
    }

    // Attach scope information to request for use in controllers/services
    request.userScope = userScope;
    request.user.scope = userScope; // Also attach to user object

    return true;
  }

  private determineUserScope(
    userPermissions: Permission[],
    options: PermissionOptions,
  ): UserScope {
    const allowedScopes = options.allowedScopes || ['all', 'own'];
    const userScopes = userPermissions.map((p) => p.scope);

    const hasAllAccess =
      userScopes.includes('all') && allowedScopes.includes('all');
    const hasOwnAccess =
      userScopes.includes('own') && allowedScopes.includes('own');
    const hasDepartmentAccess =
      userScopes.includes('department') && allowedScopes.includes('department');
    const hasAssignedAccess =
      userScopes.includes('assigned') && allowedScopes.includes('assigned');

    // Determine max scope (priority: all > department > assigned > own)
    let maxScope: 'all' | 'department' | 'assigned' | 'own' | null = null;
    if (hasAllAccess) maxScope = 'all';
    else if (hasDepartmentAccess) maxScope = 'department';
    else if (hasAssignedAccess) maxScope = 'assigned';
    else if (hasOwnAccess) maxScope = 'own';

    return {
      hasAllAccess,
      hasOwnAccess,
      hasDepartmentAccess,
      hasAssignedAccess,
      maxScope,
      allowedScopes: userScopes.filter((s) => allowedScopes.includes(s)),
      permissions: userPermissions,
    };
  }
}
