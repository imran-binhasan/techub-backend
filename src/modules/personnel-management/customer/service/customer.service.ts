import { Repository } from "typeorm";
import { Customer } from "../entity/customer.entity";
import { User } from "../../user/entity/user.entity";
import { CloudinaryService } from "src/core/upload/service/cloudinary.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly uploadService: CloudinaryService,
  ) {}
}