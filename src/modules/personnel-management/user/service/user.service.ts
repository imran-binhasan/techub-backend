import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserData } from '../interface/create-user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Role } from '../../role/entity/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

async createUser(data: CreateUserData): Promise<User> {
  // --- Check email or phone uniqueness ---
  const whereConditions: FindOptionsWhere<User>[] = [];

  if (data.email) whereConditions.push({ email: data.email });
  if (data.phone) whereConditions.push({ phone: data.phone });

  if (whereConditions.length > 0) {
    const existingUser = await this.userRepository.findOne({
      where: whereConditions, // OR logic
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.phone === data.phone) {
        throw new ConflictException('Phone number already exists');
      }
    }
  }

  if (data.roleId) {
    const roleExists = await this.roleRepository.findOne({
      where: { id: data.roleId },
    });

    if (!roleExists) {
      throw new NotFoundException('Role not found');
    }
  }

  const user = this.userRepository.create(data);
  return await this.userRepository.save(user);
}

async deleteUser(id: number): Promise<void> {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException('User not found');
  }
  await this.userRepository.softRemove(user);
}

async getSingleUser(id: number): Promise<User> {
  const user = await this.userRepository.findOne({ where: { id }, relations: ['role'] });
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return user;
}

async getAllUsers(): Promise<User[]> {
  return await this.userRepository.find({ relations: ['role'] });
}

}
