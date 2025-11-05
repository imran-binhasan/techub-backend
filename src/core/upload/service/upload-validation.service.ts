import { Injectable, BadRequestException } from '@nestjs/common';
import { ImageCategory, UploaderType, UploadType } from '../enum/upload.enum';
import {
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  IMAGE_DIMENSION_LIMITS,
  UPLOAD_RATE_LIMITS,
} from '../constants/upload.constants';
import {
  FileTooLargeException,
  InvalidFileTypeException,
  InvalidImageDimensionsException,
  NoFileProvidedException,
} from '../exceptions/upload.exception';
import sharp from 'sharp';

/**
 * Service for validating file uploads
 */
@Injectable()
export class UploadValidationService {
  /**
   * Validate file type against allowed types for uploader
   */
  validateFileType(
    file: Express.Multer.File,
    uploaderType: UploaderType,
    uploadType: UploadType,
  ): void {
    if (!file) {
      throw new NoFileProvidedException();
    }

    const allowedTypes = ALLOWED_MIME_TYPES[uploaderType][
      uploadType
    ] as string[];
    if (!allowedTypes || !allowedTypes.includes(file.mimetype)) {
      throw new InvalidFileTypeException(file.mimetype, allowedTypes || []);
    }
  }

  /**
   * Validate file size against limits for uploader type
   */
  validateFileSize(
    file: Express.Multer.File,
    uploaderType: UploaderType,
    uploadType: UploadType,
  ): void {
    if (!file) {
      throw new NoFileProvidedException();
    }

    const maxSize = FILE_SIZE_LIMITS[uploaderType][uploadType];
    if (maxSize > 0 && file.size > maxSize) {
      throw new FileTooLargeException(maxSize, file.size);
    }
  }

  /**
   * Validate image dimensions for category
   */
  async validateImageDimensions(
    file: Express.Multer.File,
    category: ImageCategory,
  ): Promise<void> {
    if (!file) {
      throw new NoFileProvidedException();
    }

    try {
      const metadata = await sharp(file.buffer).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        throw new BadRequestException('Unable to determine image dimensions');
      }

      const limits = IMAGE_DIMENSION_LIMITS[category];
      if (
        width < limits.minWidth ||
        width > limits.maxWidth ||
        height < limits.minHeight ||
        height > limits.maxHeight
      ) {
        throw new InvalidImageDimensionsException(
          width,
          height,
          limits.minWidth,
          limits.minHeight,
          limits.maxWidth,
          limits.maxHeight,
        );
      }
    } catch (error) {
      if (error instanceof InvalidImageDimensionsException) {
        throw error;
      }
      throw new BadRequestException('Invalid image file');
    }
  }

  /**
   * Validate all aspects of file upload
   */
  async validateUpload(
    file: Express.Multer.File,
    uploaderType: UploaderType,
    uploadType: UploadType,
    category?: ImageCategory,
  ): Promise<void> {
    // Basic validations
    this.validateFileType(file, uploaderType, uploadType);
    this.validateFileSize(file, uploaderType, uploadType);

    // Image-specific validations
    if (uploadType === UploadType.IMAGE && category) {
      await this.validateImageDimensions(file, category);
    }
  }

  /**
   * Get rate limit for uploader type
   */
  getRateLimit(uploaderType: UploaderType): number {
    return UPLOAD_RATE_LIMITS[uploaderType];
  }
}
