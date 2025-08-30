import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductImageDto {
    @IsOptional()
    @IsString()
    url?: string;

    @IsOptional()
    @IsString()
    altText?: string;

    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    sortOrder?: number;
}