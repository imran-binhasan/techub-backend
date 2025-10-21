import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import {  Repository } from 'typeorm';
import { BaseRegisterDto } from 'src/core/auth/dto/base-register.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from 'src/core/auth/dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(data: BaseRegisterDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: data.email }, { phone: data.phone }],
    });

    if (existingUser?.email === data.email)
      throw new ConflictException('Email already exists');
    if (existingUser?.phone === data.phone)
      throw new ConflictException('Phone already exists');

    const user = this.userRepository.create(data);
    return await this.userRepository.save(user);
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.preload({ id, ...data });
    if (!user) throw new NotFoundException('User not found');
    return await this.userRepository.save(user);
  }

  async changePassword(id: number, data: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
  }
}
