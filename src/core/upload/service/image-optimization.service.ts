import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { ImageCategory, ImageVariant } from '../enum/upload.enum';
import {
  IMAGE_VARIANTS,
  IMAGE_DIMENSION_LIMITS,
} from '../constants/upload.constants';
import { ImageVariantDto } from '../dto/upload-response.dto';

/**
 * Configuration for image optimization
 */
export interface OptimizationConfig {
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Service for optimizing and transforming images
 */
@Injectable()
export class ImageOptimizationService {
  private readonly logger = new Logger(ImageOptimizationService.name);

  /**
   * Generate all variants for an image category
   */
  async generateVariants(
    buffer: Buffer,
    category: ImageCategory,
  ): Promise<Map<ImageVariant, Buffer>> {
    const variants = new Map<ImageVariant, Buffer>();

    try {
      // Generate all required variants
      for (const [variantName, config] of Object.entries(IMAGE_VARIANTS)) {
        const variant = variantName as ImageVariant;
        const optimized = await this.optimizeImage(buffer, config);
        variants.set(variant, optimized);
      }

      // Always include original
      variants.set(ImageVariant.ORIGINAL, buffer);

      return variants;
    } catch (error) {
      this.logger.error('Failed to generate image variants', error);
      throw error;
    }
  }

  /**
   * Optimize image with specific configuration
   */
  async optimizeImage(
    buffer: Buffer,
    config: OptimizationConfig,
  ): Promise<Buffer> {
    try {
      let pipeline = sharp(buffer).resize(config.width, config.height, {
        fit: config.fit || 'cover',
        withoutEnlargement: true,
      });

      // Apply format-specific optimizations
      switch (config.format) {
        case 'webp':
          pipeline = pipeline.webp({ quality: config.quality });
          break;
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality: config.quality,
            progressive: true,
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            quality: config.quality,
            progressive: true,
            compressionLevel: 9,
          });
          break;
      }

      return await pipeline.toBuffer();
    } catch (error) {
      this.logger.error('Failed to optimize image', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail from image
   */
  async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    const config = IMAGE_VARIANTS.thumbnail;
    return this.optimizeImage(buffer, config);
  }

  /**
   * Convert image format
   */
  async convertFormat(
    buffer: Buffer,
    format: 'jpeg' | 'png' | 'webp',
    quality: number = 90,
  ): Promise<Buffer> {
    try {
      const metadata = await sharp(buffer).metadata();
      const config: OptimizationConfig = {
        width: metadata.width || 1200,
        height: metadata.height || 1200,
        quality,
        format: format,
        fit: 'inside',
      };

      return this.optimizeImage(buffer, config);
    } catch (error) {
      this.logger.error('Failed to convert image format', error);
      throw error;
    }
  }

  /**
   * Resize image to specific dimensions
   */
  async resizeImage(
    buffer: Buffer,
    width: number,
    height: number,
    quality: number = 90,
  ): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(width, height, {
          fit: 'cover',
          withoutEnlargement: true,
        })
        .webp({ quality })
        .toBuffer();
    } catch (error) {
      this.logger.error('Failed to resize image', error);
      throw error;
    }
  }

  /**
   * Get image metadata
   */
  async getMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    return sharp(buffer).metadata();
  }

  /**
   * Compress image without resizing
   */
  async compressImage(buffer: Buffer, quality: number = 85): Promise<Buffer> {
    try {
      const metadata = await this.getMetadata(buffer);

      const pipeline = sharp(buffer);

      if (metadata.format === 'jpeg') {
        return pipeline.jpeg({ quality, progressive: true }).toBuffer();
      } else if (metadata.format === 'png') {
        return pipeline.png({ quality, compressionLevel: 9 }).toBuffer();
      } else {
        // Convert to WebP for other formats
        return pipeline.webp({ quality }).toBuffer();
      }
    } catch (error) {
      this.logger.error('Failed to compress image', error);
      throw error;
    }
  }
}
