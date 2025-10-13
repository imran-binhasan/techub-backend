import { ConflictException, Injectable } from "@nestjs/common";
import { CreateUserData } from "../interface/create-user.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entity/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}



}
