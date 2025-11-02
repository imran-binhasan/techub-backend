import { Module } from '@nestjs/common';
import { CloudinaryService } from '../service/cloudinary.service';
import { UploadService } from '../service/upload.service';
import { UploadValidationService } from '../service/upload-validation.service';
import { ImageOptimizationService } from '../service/image-optimization.service';
import { UploadController } from '../controller/upload.controller';
import { RedisModule } from '../../redis/module/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [UploadController],
  providers: [
    CloudinaryService,
    UploadService,
    UploadValidationService,
    ImageOptimizationService,
  ],
  exports: [
    CloudinaryService,
    UploadService,
    UploadValidationService,
    ImageOptimizationService,
  ],
})
export class UploadModule {}
