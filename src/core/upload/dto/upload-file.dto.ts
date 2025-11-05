import {
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { ImageCategory, UploaderType } from '../enum/upload.enum';

/**
 * DTO for uploading a file
 */
export class UploadFileDto {
  @IsEnum(ImageCategory)
  category: ImageCategory;

  @IsEnum(UploaderType)
  uploaderType: UploaderType;

  @IsOptional()
  @IsNumber()
  uploaderId?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for image transformation options
 */
export class ImageTransformDto {
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(4000)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(4000)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number;

  @IsOptional()
  @IsEnum(['jpeg', 'png', 'webp', 'gif'])
  format?: 'jpeg' | 'png' | 'webp' | 'gif';

  @IsOptional()
  crop?: boolean;
}
