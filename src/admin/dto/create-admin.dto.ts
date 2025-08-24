import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateAdminDto {

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsOptional()
    image?: Express.Multer.File;

    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsNotEmpty()
    roleId:string;

}