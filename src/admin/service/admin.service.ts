import * as argon2 from 'argon2'
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Admin } from "../entity/admin.entity";
import { Repository } from "typeorm";
import { Role } from "src/role/entity/role.entity";
import { AuthService } from "src/auth/service/auth.service";
import { CloudinaryService } from "src/upload/service/cloudinary.service";
import { CreateAdminDto } from "../dto/create-admin.dto";

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Admin)
        private adminRepository: Repository<Admin>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
        private authService: AuthService,
        private uploadService: CloudinaryService

    ) { }

    async create(
        createAdminDto: CreateAdminDto,
        image?: Express.Multer.File
    ): Promise<any> {
        const existingAdmin = await this.adminRepository.findOne({
            where: { email: createAdminDto.email },
        });

        if (existingAdmin) {
            throw new ConflictException('Email already exists')
        }

        const hashedPassword = await argon2.hash(createAdminDto.password, { type: argon2.argon2id });

        const role = createAdminDto.roleId && await this.roleRepository.findOneBy({ id: createAdminDto.roleId })

        if (!role) {
            throw new NotFoundException('Role not found')
        }

        const { image: imageFile, ...withoutImage } = createAdminDto;
        const admin = this.adminRepository.create({
            ...withoutImage,
            password: hashedPassword,
            role: role,
            roleId: role.id
        })

        const savedAdmin = await this.adminRepository.save(admin)

        // if (image) {
        //     const uploadedImageUrl = await this.uploadService.uploadAdminImage(image, savedAdmin.id)
        //     savedAdmin.image = uploadedImageUrl
        // }
        // await this.adminRepository.save(savedAdmin)

        const token = this.authService.generateToken({
            sub: savedAdmin.id,
            email:savedAdmin.email,
            role:role.name,
            type:'admin'
        })


         const {password:_, ...result} = savedAdmin;
         return {
            access_token: token,
            admin:result
         }
    }
}