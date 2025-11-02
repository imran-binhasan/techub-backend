import { SetMetadata } from '@nestjs/common';
import {
  PERMISSION_KEY,
  PermissionOptions,
} from '../guard/scope-permission.guard';

/**
 * Require specific permission with optional scope restrictions
 * @example @RequirePermission({ action: 'read', resource: 'attendance', allowedScopes: ['own', 'all'] })
 */
export const RequirePermission = (options: PermissionOptions) =>
  SetMetadata(PERMISSION_KEY, options);

/**
 * Require permission with 'own' scope only
 * Workers can only access their own data
 * @example @RequireOwn('read', 'attendance')
 */
export const RequireOwn = (action: string, resource: string) =>
  RequirePermission({ action, resource, allowedScopes: ['own'] });

/**
 * Require permission with 'all' scope only
 * Admin/Manager can access all data
 * @example @RequireAll('read', 'attendance')
 */
export const RequireAll = (action: string, resource: string) =>
  RequirePermission({ action, resource, allowedScopes: ['all'] });

/**
 * Require permission with either 'own' or 'all' scope
 * Most common use case - user can access own data or all if they have permission
 * @example @RequireOwnOrAll('read', 'attendance')
 */
export const RequireOwnOrAll = (action: string, resource: string) =>
  RequirePermission({ action, resource, allowedScopes: ['own', 'all'] });

/**
 * Require permission with 'department' or 'all' scope
 * Supervisor can access department data or all if they have permission
 * @example @RequireDepartmentOrAll('read', 'attendance')
 */
export const RequireDepartmentOrAll = (action: string, resource: string) =>
  RequirePermission({
    action,
    resource,
    allowedScopes: ['department', 'all'],
  });

/**
 * Require permission with 'assigned' or 'all' scope
 * Can access specifically assigned items or all
 * @example @RequireAssignedOrAll('read', 'task')
 */
export const RequireAssignedOrAll = (action: string, resource: string) =>
  RequirePermission({ action, resource, allowedScopes: ['assigned', 'all'] });

/**
 * Require permission with custom scopes
 * @example @RequireScopes('read', 'report', ['own', 'department', 'all'])
 */
export const RequireScopes = (
  action: string,
  resource: string,
  scopes: string[],
) => RequirePermission({ action, resource, allowedScopes: scopes });

/**
 * Require permission allowing all scope types
 * Most permissive - allows own, assigned, department, or all access
 * @example @RequireAnyScope('read', 'user')
 */
export const RequireAnyScope = (action: string, resource: string) =>
  RequirePermission({
    action,
    resource,
    allowedScopes: ['own', 'assigned', 'department', 'all'],
  });
