import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { CustomerGuard } from '../guard/customer.guard';
import { VendorGuard } from '../guard/vendor.guard';
import { AdminGuard } from '../guard/admin.guard';
import { DynamicRbacGuard } from '../guard/dynamic-rbac.guard';
import { ScopePermissionGuard } from '../guard/scope-permission.guard';

export const IS_PUBLIC_KEY = 'isPublic';
export const USER_TYPE_KEY = 'userType';
export const PERMISSIONS_KEY = 'permissions';
export const RESOURCE_KEY = 'resource';
export const REQUIRE_ALL_PERMISSIONS_KEY = 'requireAllPermissions';
export const MINIMUM_LEVEL_KEY = 'minimumLevel';

// ==================== BASE DECORATORS ====================

/**
 * Base authentication - just checks if user has valid JWT token
 * Use this for any authenticated endpoint regardless of user type
 * @example @Auth()
 */
export const Auth = () => applyDecorators(UseGuards(JwtAuthGuard));

/**
 * Public endpoint - no authentication required
 * @example @Public()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ==================== SIMPLE USER TYPE GUARDS (No RBAC) ====================

/**
 * Customer-only access - Simple type check, no RBAC
 * Use for customer profile, orders, wishlist, etc.
 * @example @CustomerOnly()
 */
export const CustomerOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, CustomerGuard));

/**
 * Vendor-only access - Simple type check, no RBAC
 * Use for vendor dashboard, products, inventory, etc.
 * @example @VendorOnly()
 */
export const VendorOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, VendorGuard));

// ==================== ADMIN WITH RBAC ====================

/**
 * Admin-only access with simple type check (no permission check)
 * Use this sparingly - prefer AdminWithPermission for specific actions
 * @example @AdminOnly()
 */
export const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, AdminGuard));

/**
 * Admin with scope-based permission check
 * This is the main decorator for admin endpoints
 * @example @AdminWithPermission() @RequireAll('read', 'order')
 */
export const AdminWithPermission = () =>
  applyDecorators(UseGuards(JwtAuthGuard, AdminGuard, ScopePermissionGuard));

// ==================== LEGACY RBAC (Deprecated - Use ScopePermissionGuard) ====================

/**
 * @deprecated Use @AdminWithPermission() with @RequireAll() instead
 */
export const RequirePermissions = (...permissions: string[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, AdminGuard, DynamicRbacGuard),
    SetMetadata(PERMISSIONS_KEY, permissions),
  );

/**
 * @deprecated Use @AdminWithPermission() with @RequireAll() instead
 */
export const RequireResource = (resource: string, action: string) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, AdminGuard, DynamicRbacGuard),
    SetMetadata(RESOURCE_KEY, { resource, action }),
  );

/**
 * @deprecated Use @AdminWithPermission() with @RequireAll() instead
 */
export const RequireAllPermissions = (...permissions: string[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, AdminGuard, DynamicRbacGuard),
    SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, permissions),
  );

/**
 * @deprecated Use @AdminWithPermission() with @RequireAll() instead
 */
export const RequireMinimumLevel = (
  resource: string,
  level: 'read' | 'write' | 'admin',
) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, AdminGuard, DynamicRbacGuard),
    SetMetadata(MINIMUM_LEVEL_KEY, { resource, level }),
  );
