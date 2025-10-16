import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserData } from '../interface/create-user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Role } from '../../role/entity/role.entity';
import { UpdateUserData } from '../interface/update-user.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async createUser(data: CreateUserData): Promise<User> {
    const whereConditions: FindOptionsWhere<User>[] = [];

    const existingUser = await this.userRepository.findOne({
      where: [{ email: data.email }, { phone: data.phone }],
    });

    if (existingUser?.email === data.email)
      throw new ConflictException('Email already exists');
    if (existingUser?.phone === data.phone)
      throw new ConflictException('Phone number already exists');

    if (data.roleId) {
      const roleExists = await this.roleRepository.exist({
        where: { id: data.roleId },
      });
      if (!roleExists) throw new NotFoundException('Role not found');
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
    try {
      return await this.userRepository.findOneOrFail({
        where: { id },
        relations: ['role'],
      });
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find({ relations: ['role'] });
  }

  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const user = await this.userRepository.preload({ id, ...data });
    if (!user) throw new NotFoundException('User not found');
    return await this.userRepository.save(user);
  }
}
