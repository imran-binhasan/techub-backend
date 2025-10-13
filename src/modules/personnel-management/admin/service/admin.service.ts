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
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { Role } from '../../role/entity/role.entity';

@Injectable()
export class AdminService {
}
