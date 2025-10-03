import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entity/permission.entity';
import { Role } from 'src/user-management/role/entity/role.entity';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async getUserPermissions(roleId: string): Promise<string[]> {
    try {
      const role = await this.roleRepository.findOne({
        where: { id: roleId },
        relations: ['permissions'],
      });

      if (!role) {
        this.logger.warn(`Role not found: ${roleId}`);
        return [];
      }

      const permissions = role.permissions.map(
        (permission) => `${permission.action}:${permission.resource}`,
      );

      this.logger.debug(
        `Retrieved ${permissions.length} permissions for role ${roleId}: ${permissions.join(', ')}`,
      );

      return permissions;
    } catch (error) {
      this.logger.error(`Failed to get permissions for role ${roleId}:`, error);
      return [];
    }
  }

  async createPermission(
    resource: string,
    action: string,
  ): Promise<Permission> {
    const permission = this.permissionRepository.create({ resource, action });
    return await this.permissionRepository.save(permission);
  }

  async findAll(): Promise<Permission[]> {
    return await this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async findByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<Permission | null> {
    return await this.permissionRepository.findOne({
      where: { resource, action },
    });
  }

  async deletePermission(id: string): Promise<void> {
    await this.permissionRepository.delete(id);
  }

  // Utility method to check if a permission string is valid
  validatePermissionFormat(permission: string): boolean {
    const parts = permission.split(':');
    return (
      parts.length === 2 && parts[0].trim() !== '' && parts[1].trim() !== ''
    );
  }

  // Get all unique resources
  async getUniqueResources(): Promise<string[]> {
    const result = await this.permissionRepository
      .createQueryBuilder('permission')
      .select('DISTINCT permission.resource', 'resource')
      .getRawMany();

    return result.map((r) => r.resource);
  }

  // Get all unique actions
  async getUniqueActions(): Promise<string[]> {
    const result = await this.permissionRepository
      .createQueryBuilder('permission')
      .select('DISTINCT permission.action', 'action')
      .getRawMany();

    return result.map((r) => r.action);
  }
}
