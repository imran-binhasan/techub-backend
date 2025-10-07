import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(ConfigService)
    private configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: configService.get<string>('CLOUD_NAME'),
      api_key: configService.get<string>('CLOUD_API_KEY'),
      api_secret: configService.get<string>('CLOUD_API_SECRET'),
    });
  }

  private async uploadFile(
    fileBuffer: Buffer,
    folder: string,
    fileName?: string,
  ): Promise<UploadApiResponse> {
    try {
      return await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder, public_id: fileName, overwrite: true },
          (error, result) => {
            if (error) return reject(error);
            if (!result)
              return reject(
                new InternalServerErrorException(
                  'Cloudinary returned no result',
                ),
              );
            resolve(result);
          },
        );
        Readable.from(fileBuffer).pipe(uploadStream);
      });
    } catch (error: any) {
      throw new InternalServerErrorException(
        `File upload failed: ${error.message}`,
      );
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete file: ${error.message}`,
      );
    }
  }

  async uploadAdminImage(
    file: Express.Multer.File,
    adminId: number,
  ): Promise<string> {
    const folder = `admins/${adminId}`;
    const result = await this.uploadFile(file.buffer, folder, adminId);
    return result.secure_url; // return Cloudinary public URL
  }

  async uploadCustomerImage(
    file: Express.Multer.File,
    customerId: number,
  ): Promise<string> {
    const folder = `customers/${customerId}`;
    const result = await this.uploadFile(file.buffer, folder, customerId);
    return result.secure_url; // return Cloudinary public URL
  }

  async uploadBrandLogo(
    file: Express.Multer.File,
    brandId: number,
  ): Promise<string> {
    const folder = `brands/${brandId}`;
    const result = await this.uploadFile(file.buffer, folder, brandId);
    return result.secure_url; // return Cloudinary public URL
  }
}
