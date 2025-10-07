import * as argon2 from 'argon2';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from '../entity/admin.entity';
import { Repository } from 'typeorm';
import { CloudinaryService } from 'src/core/upload/service/cloudinary.service';
import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';
import { Role } from '../../role/entity/role.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly uploadService: CloudinaryService,
  ) {}

  async create(
    createAdminDto: CreateAdminDto,
    image?: Express.Multer.File,
  ): Promise<Omit<Admin, 'password'>> {
    // Check if email already exists
    const existingAdmin = await this.adminRepository.findOne({
      where: { email: createAdminDto.email },
      withDeleted: true,
    });

    if (existingAdmin) {
      throw new ConflictException('Admin with this email already exists');
    }

    // Validate role exists
    const role = await this.roleRepository.findOne({
      where: { id: createAdminDto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Hash password
    const hashedPassword = await argon2.hash(createAdminDto.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    // Create admin
    const admin = this.adminRepository.create({
      ...createAdminDto,
      password: hashedPassword,
      roleId: role.id,
    });

    const savedAdmin = await this.adminRepository.save(admin);

    // Handle image upload
    if (image) {
      try {
        const uploadedImage = await this.uploadService.uploadAdminImage(
          image,
          savedAdmin.id,
        );
        savedAdmin.image = uploadedImage;
        await this.adminRepository.save(savedAdmin);
      } catch (error) {
        // Rollback admin creation if image upload fails
        await this.adminRepository.delete(savedAdmin.id);
        throw error;
      }
    }

    // Return admin without password
    const { password, ...result } = savedAdmin;
    return result;
  }

  async findAll(
    query: PaginationQuery & { isActive?: boolean; roleId?: string },
  ): Promise<PaginatedServiceResponse<Admin>> {
    const { page = 1, limit = 10, search, isActive, roleId } = query;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.adminRepository
      .createQueryBuilder('admin')
      .leftJoinAndSelect('admin.role', 'role')
      .select([
        'admin.id',
        'admin.firstName',
        'admin.lastName',
        'admin.email',
        'admin.image',
        'admin.isActive',
        'admin.createdAt',
        'admin.updatedAt',
        'role.id',
        'role.resource',
        'role.action',
      ]);

    // Apply search filter
    if (search?.trim()) {
      queryBuilder.where(
        '(admin.firstName ILIKE :search OR admin.lastName ILIKE :search OR admin.email ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    // Apply status filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('admin.isActive = :isActive', { isActive });
    }

    // Apply role filter
    if (roleId) {
      queryBuilder.andWhere('admin.roleId = :roleId', { roleId });
    }

    // Apply pagination
    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('admin.createdAt', 'DESC')
      .getManyAndCount();

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['role'],
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'image',
        'isActive',
        'createdAt',
        'updatedAt',
        'roleId',
      ],
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }
  async update(
    id: string,
    updateAdminDto: UpdateAdminDto,
    image?: Express.Multer.File,
  ): Promise<Admin> {
    const existingAdmin = await this.adminRepository.findOne({
      where: { id },
    });

    if (!existingAdmin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // Check email uniqueness if email is being updated
    if (updateAdminDto.email && updateAdminDto.email !== existingAdmin.email) {
      const adminWithEmail = await this.adminRepository.findOne({
        where: { email: updateAdminDto.email },
        withDeleted: true,
      });

      if (adminWithEmail && adminWithEmail.id !== id) {
        throw new ConflictException(
          `Admin with email ${updateAdminDto.email} already exists`,
        );
      }
    }

    // Prepare update data
    const updateData: Partial<Admin> = { ...updateAdminDto };

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await argon2.hash(updateData.password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
    }

    // Handle image upload
    if (image) {
      const uploadedImage = await this.uploadService.uploadAdminImage(
        image,
        id,
      );
      updateData.image = uploadedImage;
    }

    // Update admin
    await this.adminRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updateRole(adminId: string, roleId: string): Promise<Admin> {
    const admin = await this.findOne(adminId);

    // Validate role exists
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    await this.adminRepository.update(adminId, { roleId });
    return this.findOne(adminId);
  }

  async toggleStatus(id: number): Promise<Admin> {
    const admin = await this.findOne(id);
    const newStatus = !admin.isActive;

    await this.adminRepository.update(id, { isActive: newStatus });
    return { ...admin, isActive: newStatus };
  }

  async softDelete(id: number): Promise<void> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    await this.adminRepository.softDelete(id);
  }

  async restore(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    if (!admin.deletedAt) {
      throw new BadRequestException('Admin is not deleted');
    }

    await this.adminRepository.restore(id);
    return this.findOne(id);
  }

  // Utility methods
  async findWithRelations(
    id: string,
    relations: string[] = [],
  ): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['role', ...relations],
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'image',
        'isActive',
        'createdAt',
        'updatedAt',
        'roleId',
      ],
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  async countByRole(roleId: string): Promise<number> {
    return this.adminRepository.count({
      where: { roleId, isActive: true },
    });
  }

  async findActiveAdmins(): Promise<Admin[]> {
    return this.adminRepository.find({
      where: { isActive: true },
      relations: ['role'],
      select: ['id', 'firstName', 'lastName', 'email', 'image', 'createdAt'],
    });
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return this.adminRepository.findOne({
      where: { email },
      relations: ['role', 'role.permissions'],
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'image',
        'isActive',
        'password', // Include password for authentication
        'roleId',
      ],
    });
  }

  async countActiveAdmins(): Promise<number> {
    return this.adminRepository.count({
      where: { isActive: true },
    });
  }

  async findRecentAdmins(limit: number = 10): Promise<Admin[]> {
    return this.adminRepository.find({
      where: { isActive: true },
      relations: ['role'],
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['id', 'firstName', 'lastName', 'email', 'image', 'createdAt'],
    });
  }
}
