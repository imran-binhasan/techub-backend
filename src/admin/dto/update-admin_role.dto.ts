import { PartialType } from "@nestjs/mapped-types";
import { CreateAdminDto } from "./create-admin.dto";
import { IsOptional } from "class-validator";

export class UpdateAdminRoleDto{
    
    @IsOptional()
    roleId?: string;
}