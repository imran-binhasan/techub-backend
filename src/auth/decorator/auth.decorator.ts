import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { UserTypeGuard } from '../guard/user-type.guard';
import { DynamicRbacGuard } from '../guard/dynamic-rbac.guard';

export const IS_PUBLIC_KEY = 'isPublic';
export const USER_TYPE_KEY = 'userType';
export const PERMISSIONS_KEY = 'permissions';
export const RESOURCE_KEY = 'resource';
export const REQUIRE_ALL_PERMISSIONS_KEY = 'requireAllPermissions';
export const MINIMUM_LEVEL_KEY = 'minimumLevel';

// Base auth decorator
export const Auth = () => applyDecorators(UseGuards(JwtAuthGuard));

// Public endpoints
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// User type restrictions
export const AdminOnly = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, UserTypeGuard),
    SetMetadata(USER_TYPE_KEY, 'admin')
  );

export const CustomerOnly = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, UserTypeGuard),
    SetMetadata(USER_TYPE_KEY, 'customer')
  );

// RBAC decorators
export const RequirePermissions = (...permissions: string[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, UserTypeGuard, DynamicRbacGuard),
    SetMetadata(PERMISSIONS_KEY, permissions)
  );

export const RequireResource = (resource: string, action: string) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, UserTypeGuard, DynamicRbacGuard),
    SetMetadata(RESOURCE_KEY, { resource, action })
  );

export const RequireAllPermissions = (...permissions: string[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, UserTypeGuard, DynamicRbacGuard),
    SetMetadata(REQUIRE_ALL_PERMISSIONS_KEY, permissions)
  );

export const RequireMinimumLevel = (resource: string, level: 'read' | 'write' | 'admin') =>
  applyDecorators(
    UseGuards(JwtAuthGuard, UserTypeGuard, DynamicRbacGuard),
    SetMetadata(MINIMUM_LEVEL_KEY, { resource, level })
  );