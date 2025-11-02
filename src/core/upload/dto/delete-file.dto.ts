import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for deleting a file
 */
export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  publicId: string;
}

/**
 * DTO for bulk file deletion
 */
export class BulkDeleteFileDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  publicIds: string[];
}
