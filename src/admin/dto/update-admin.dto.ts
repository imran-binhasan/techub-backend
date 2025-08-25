import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateAdminDto } from "./create-admin.dto";
import { IsOptional, MinLength } from "class-validator";

export class UpdateAdminDto extends PartialType(OmitType(CreateAdminDto, ['roleId'] as const)){
    
    @IsOptional()
    @MinLength(6)
    password?: string;
}