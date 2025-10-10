import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class BaseUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}



// admin/dto/create-admin.dto.ts
export class CreateAdminDto extends BaseUserDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  employeeNumber?: string;
}