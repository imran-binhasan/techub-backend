import {
  Controller,
  Post,
  Delete,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../service/upload.service';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth-guard';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interface/auth-user.interface';
import { ImageCategory, UploaderType, UploadType } from '../enum/upload.enum';
import {
  UploadResponseDto,
  DeleteResponseDto,
  SignedUrlDto,
} from '../dto/upload-response.dto';
import { UploadFileDto } from '../dto/upload-file.dto';
import { DeleteFileDto } from '../dto/delete-file.dto';

/**
 * Controller for file upload operations
 */
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload image with validation and optimization
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Map user type to uploader type
    const uploaderType = this.mapUserTypeToUploaderType(user.type);

    return this.uploadService.uploadImage(
      file,
      dto.category,
      user.id,
      uploaderType,
    );
  }

  /**
   * Upload document (PDF, DOCX, etc.)
   */
  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uploaderType = this.mapUserTypeToUploaderType(user.type);

    return this.uploadService.uploadDocument(
      file,
      user.id,
      uploaderType,
    );
  }

  /**
   * Delete uploaded file
   */
  @Delete(':publicId')
  async deleteFile(
    @Param() params: DeleteFileDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeleteResponseDto> {
    return this.uploadService.deleteFile(params.publicId, user.id);
  }

  /**
   * Get signed URL for private file access
   */
  @Get('signed-url/:publicId')
  async getSignedUrl(
    @Param('publicId') publicId: string,
    @Query('expiresIn') expiresIn?: number,
  ): Promise<SignedUrlDto> {
    const expires = expiresIn ? parseInt(expiresIn.toString(), 10) : 3600;
    return this.uploadService.getSignedUrl(publicId, expires);
  }

  /**
   * Map user type to uploader type
   */
  private mapUserTypeToUploaderType(userType: string): UploaderType {
    switch (userType.toLowerCase()) {
      case 'customer':
        return UploaderType.CUSTOMER;
      case 'vendor':
        return UploaderType.VENDOR;
      case 'admin':
        return UploaderType.ADMIN;
      default:
        return UploaderType.GUEST;
    }
  }
}
