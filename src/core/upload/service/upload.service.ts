import { Injectable, Logger } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { UploadValidationService } from './upload-validation.service';
import { ImageOptimizationService } from './image-optimization.service';
import { RedisService } from '../../redis/service/redis.service';
import {
  ImageCategory,
  UploaderType,
  UploadType,
  ImageVariant,
} from '../enum/upload.enum';
import {
  UploadResponseDto,
  ImageVariantDto,
  DeleteResponseDto,
  SignedUrlDto,
} from '../dto/upload-response.dto';
import {
  UploadFailedException,
  DeleteFailedException,
  RateLimitExceededException,
} from '../exceptions/upload.exception';
import { UPLOAD_FOLDERS } from '../constants/upload.constants';

/**
 * Main service for file upload operations
 * Orchestrates validation, optimization, and storage
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly validationService: UploadValidationService,
    private readonly optimizationService: ImageOptimizationService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Upload image with validation, optimization, and variant generation
   */
  async uploadImage(
    file: Express.Multer.File,
    category: ImageCategory,
    uploaderId: number,
    uploaderType: UploaderType,
  ): Promise<UploadResponseDto> {
    try {
      // Check rate limit
      await this.checkRateLimit(uploaderId, uploaderType);

      // Validate upload
      await this.validationService.validateUpload(
        file,
        uploaderType,
        UploadType.IMAGE,
        category,
      );

      // Generate variants
      const variants = await this.optimizationService.generateVariants(
        file.buffer,
        category,
      );

      // Upload original image
      const folder = this.getUploadFolder(category, uploaderType);
      const originalResult = await this.cloudinaryService.uploadImage(
        variants.get(ImageVariant.ORIGINAL)!,
        folder,
        file.originalname,
      );

      // Upload all variants
      const variantDtos: ImageVariantDto[] = [];
      for (const [variantName, buffer] of variants.entries()) {
        if (variantName === ImageVariant.ORIGINAL) continue;

        const variantResult = await this.cloudinaryService.uploadImage(
          buffer,
          `${folder}/variants`,
          `${originalResult.public_id}_${variantName}`,
        );

        variantDtos.push({
          variant: variantName,
          url: variantResult.url,
          secureUrl: variantResult.secure_url,
          width: variantResult.width,
          height: variantResult.height,
          size: variantResult.bytes,
        });
      }

      // Increment rate limit counter
      await this.incrementRateLimit(uploaderId, uploaderType);

      // Build response
      const response: UploadResponseDto = {
        success: true,
        fileId: originalResult.asset_id,
        url: originalResult.url,
        secureUrl: originalResult.secure_url,
        publicId: originalResult.public_id,
        format: originalResult.format,
        size: originalResult.bytes,
        width: originalResult.width,
        height: originalResult.height,
        variants: variantDtos,
        uploadedAt: new Date(),
      };

      this.logger.log(
        `Image uploaded successfully: ${originalResult.public_id} by ${uploaderType}:${uploaderId}`,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to upload image', error);
      if (
        error instanceof UploadFailedException ||
        error instanceof RateLimitExceededException
      ) {
        throw error;
      }
      throw new UploadFailedException(error.message);
    }
  }

  /**
   * Upload document without optimization
   */
  async uploadDocument(
    file: Express.Multer.File,
    uploaderId: number,
    uploaderType: UploaderType,
  ): Promise<UploadResponseDto> {
    try {
      // Check rate limit
      await this.checkRateLimit(uploaderId, uploaderType);

      // Validate upload
      await this.validationService.validateUpload(
        file,
        uploaderType,
        UploadType.DOCUMENT,
      );

      // Upload to Cloudinary
      const folder = UPLOAD_FOLDERS.documents;
      const result = await this.cloudinaryService.uploadFile(
        file.buffer,
        folder,
        file.originalname,
      );

      // Increment rate limit counter
      await this.incrementRateLimit(uploaderId, uploaderType);

      return {
        success: true,
        fileId: result.asset_id,
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        variants: [],
        uploadedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to upload document', error);
      throw new UploadFailedException(error.message);
    }
  }

  /**
   * Delete file and all its variants
   */
  async deleteFile(
    publicId: string,
    uploaderId: number,
  ): Promise<DeleteResponseDto> {
    try {
      // Delete from Cloudinary
      await this.cloudinaryService.deleteFile(publicId);

      // Delete variants (try best effort, don't fail if variants don't exist)
      try {
        const variantNames = Object.keys(ImageVariant);
        for (const variant of variantNames) {
          await this.cloudinaryService.deleteFile(`${publicId}_${variant}`);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to delete some variants for ${publicId}`,
          error,
        );
      }

      this.logger.log(`File deleted: ${publicId} by user:${uploaderId}`);

      return {
        success: true,
        publicId,
        deletedAt: new Date(),
        message: 'File and variants deleted successfully',
      };
    } catch (error) {
      this.logger.error('Failed to delete file', error);
      throw new DeleteFailedException(error.message);
    }
  }

  /**
   * Generate signed URL for private file access
   */
  async getSignedUrl(
    publicId: string,
    expiresIn: number = 3600,
  ): Promise<SignedUrlDto> {
    try {
      const url = this.cloudinaryService.getSignedUrl(publicId, expiresIn);
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      return {
        url,
        expiresAt,
        expiresIn,
      };
    } catch (error) {
      this.logger.error('Failed to generate signed URL', error);
      throw new UploadFailedException(error.message);
    }
  }

  /**
   * Get upload folder based on category and uploader type
   */
  private getUploadFolder(
    category: ImageCategory,
    uploaderType: UploaderType,
  ): string {
    const baseFolder = UPLOAD_FOLDERS.images;
    return `${baseFolder}/${category.toLowerCase()}/${uploaderType.toLowerCase()}`;
  }

  /**
   * Check if user has exceeded rate limit
   */
  private async checkRateLimit(
    uploaderId: number,
    uploaderType: UploaderType,
  ): Promise<void> {
    const key = `upload:ratelimit:${uploaderType}:${uploaderId}`;
    const limit = this.validationService.getRateLimit(uploaderType);

    const count = await this.redisService.get(key);
    const currentCount = count ? parseInt(count, 10) : 0;

    if (currentCount >= limit) {
      throw new RateLimitExceededException(limit);
    }
  }

  /**
   * Increment rate limit counter
   */
  private async incrementRateLimit(
    uploaderId: number,
    uploaderType: UploaderType,
  ): Promise<void> {
    const key = `upload:ratelimit:${uploaderType}:${uploaderId}`;
    const exists = await this.redisService.exists(key);

    if (exists) {
      await this.redisService.incr(key);
    } else {
      await this.redisService.setWithExpiry(key, '1', 3600); // 1 hour
    }
  }
}
