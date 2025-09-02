import { Module } from '@nestjs/common';
import { CloudinaryService } from '../service/cloudinary.service';

@Module({
  imports: [],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadModule {}
