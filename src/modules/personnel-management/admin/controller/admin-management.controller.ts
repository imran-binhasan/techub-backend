import { Body, Controller, Post, Patch, UseGuards } from '@nestjs/common';
import { AdminManagementService } from '../service/admin-management.service';
import { JwtAuthGuard } from 'src/core/auth/guard/jwt-auth-guard';
import { AdminGuard } from 'src/core/auth/guard/admin.guard';
import { ScopePermissionGuard } from 'src/core/auth/guard/scope-permission.guard';
import { RequirePermission } from 'src/core/auth/decorator/permission.decorator';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';
import { IsEmail, IsString, MinLength, IsOptional, IsNumber, Min } from 'class-validator';

// DTOs
class ResetAdminPasswordDto {
  @IsEmail()
  targetAdminEmail: string;

  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsOptional()
  @IsString()
  verificationNote?: string;
}

class LockAdminAccountDto {
  @IsEmail()
  targetAdminEmail: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  lockDurationMinutes?: number;
}

class UnlockAdminAccountDto {
  @IsEmail()
  targetAdminEmail: string;
}

/**
 * Super Admin Controller
 * 
 * Endpoints for super-admins to manage other admin accounts.
 * All endpoints require 'manage:admins' permission with 'all' scope.
 */
@Controller({ path: 'admin-management', version: '1' })
@UseGuards(JwtAuthGuard, AdminGuard, ScopePermissionGuard)
export class AdminManagementController {
  constructor(
    private readonly adminManagementService: AdminManagementService,
  ) {}

  /**
   * Reset another admin's password (Super-admin only)
   * 
   * Enterprise security: Admin passwords can only be reset by super-admins
   * with proper verification. This prevents self-service password reset
   * which could be exploited if an admin's email is compromised.
   * 
   * @security Requires: 'manage:admins' permission with 'all' scope
   */
  @Post('reset-password')
  @RequirePermission({ action: 'manage', resource: 'admins', allowedScopes: ['all'] })
  async resetAdminPassword(
    @CurrentUser('id') superAdminId: number,
    @Body() dto: ResetAdminPasswordDto,
  ) {
    return this.adminManagementService.resetAdminPassword(
      superAdminId,
      dto.targetAdminEmail,
      dto.newPassword,
      dto.verificationNote,
    );
  }

  /**
   * Lock an admin account (Super-admin only)
   * 
   * Temporarily or permanently disable an admin account for security reasons.
   * All active sessions are immediately invalidated.
   */
  @Patch('lock-account')
  @RequirePermission({ action: 'manage', resource: 'admins', allowedScopes: ['all'] })
  async lockAdminAccount(
    @CurrentUser('id') superAdminId: number,
    @Body() dto: LockAdminAccountDto,
  ) {
    return this.adminManagementService.lockAdminAccount(
      superAdminId,
      dto.targetAdminEmail,
      dto.reason,
      dto.lockDurationMinutes,
    );
  }

  /**
   * Unlock an admin account (Super-admin only)
   */
  @Patch('unlock-account')
  @RequirePermission({ action: 'manage', resource: 'admins', allowedScopes: ['all'] })
  async unlockAdminAccount(
    @CurrentUser('id') superAdminId: number,
    @Body() dto: UnlockAdminAccountDto,
  ) {
    return this.adminManagementService.unlockAdminAccount(
      superAdminId,
      dto.targetAdminEmail,
    );
  }
}
