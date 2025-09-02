import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entity/role.entity';
import { Permission } from 'src/permission/entity/permission.entity';
import { PermissionCacheService } from 'src/auth/service/permission-cache.service';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly permissionCacheService: PermissionCacheService,
  ) {}

  async createRole(
    resource: string,
    action: string,
    permissionIds: string[],
  ): Promise<Role> {
    // Check if role already exists
    const existingRole = await this.roleRepository.findOne({
      where: { resource, action },
    });

    if (existingRole) {
      throw new ConflictException(`Role ${resource}:${action} already exists`);
    }

    // Fetch permissions
    const permissions =
      await this.permissionRepository.findByIds(permissionIds);

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Create role
    const role = this.roleRepository.create({
      resource,
      action,
      permissions,
    });

    const savedRole = await this.roleRepository.save(role);
    this.logger.log(
      `Created role: ${resource}:${action} with ${permissions.length} permissions`,
    );

    return savedRole;
  }

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find({
      relations: ['permissions'],
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async updateRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    const role = await this.findById(roleId);

    // Fetch new permissions
    const permissions =
      await this.permissionRepository.findByIds(permissionIds);

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Update permissions
    role.permissions = permissions;
    const updatedRole = await this.roleRepository.save(role);

    // Invalidate cache for this role
    await this.permissionCacheService.invalidatePermissions(roleId);

    this.logger.log(
      `Updated permissions for role ${roleId}: ${permissions.length} permissions`,
    );

    return updatedRole;
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findById(id);

    // Check if role has any admins
    const adminCount = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.admins', 'admin')
      .where('role.id = :id', { id })
      .getCount();

    if (adminCount > 0) {
      throw new ConflictException(
        'Cannot delete role that has assigned admins',
      );
    }

    await this.roleRepository.remove(role);

    // Invalidate cache for this role
    await this.permissionCacheService.invalidatePermissions(id);

    this.logger.log(`Deleted role ${id}`);
  }

  async addPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    const role = await this.findById(roleId);
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(
        `Permission with ID ${permissionId} not found`,
      );
    }

    // Check if permission already exists
    const hasPermission = role.permissions.some((p) => p.id === permissionId);
    if (hasPermission) {
      throw new ConflictException('Permission already assigned to role');
    }

    role.permissions.push(permission);
    const updatedRole = await this.roleRepository.save(role);

    // Invalidate cache
    await this.permissionCacheService.invalidatePermissions(roleId);

    return updatedRole;
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<Role> {
    const role = await this.findById(roleId);

    role.permissions = role.permissions.filter((p) => p.id !== permissionId);
    const updatedRole = await this.roleRepository.save(role);

    // Invalidate cache
    await this.permissionCacheService.invalidatePermissions(roleId);

    return updatedRole;
  }
}
