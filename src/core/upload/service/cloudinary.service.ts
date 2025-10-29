import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUD_API_KEY'),
      api_secret: this.configService.get<string>('CLOUD_API_SECRET'),
    });
  }

  private async uploadFile(
    fileBuffer: Buffer,
    folder: string,
    fileName?: string | number,
  ): Promise<string> {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: fileName?.toString(),
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error);
            else if (!result)
              reject(
                new InternalServerErrorException(
                  'Cloudinary returned no result',
                ),
              );
            else resolve(result);
          },
        );
        Readable.from(fileBuffer).pipe(uploadStream);
      });
      return result.secure_url;
    } catch (error) {
      throw new InternalServerErrorException(
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async uploadImageWithFolder(
    file: Express.Multer.File,
    folderPath: string,
    fileName: string | number,
  ): Promise<string> {
    return this.uploadFile(file.buffer, folderPath, fileName);
  }

  async uploadAdminImage(
    file: Express.Multer.File,
    adminId: number,
  ): Promise<string> {
    return this.uploadImageWithFolder(file, `admins/${adminId}`, adminId);
  }

  async uploadCustomerImage(
    file: Express.Multer.File,
    customerId: number,
  ): Promise<string> {
    return this.uploadImageWithFolder(
      file,
      `customers/${customerId}`,
      customerId,
    );
  }

  async uploadVendorImage(
    file: Express.Multer.File,
    vendorId: number,
  ): Promise<string> {
    return this.uploadImageWithFolder(file, `vendors/${vendorId}`, vendorId);
  }

  async uploadBrandLogo(
    file: Express.Multer.File,
    brandId: number,
  ): Promise<string> {
    return this.uploadImageWithFolder(file, `brands/${brandId}`, brandId);
  }
}