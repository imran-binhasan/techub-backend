import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { CloudinaryService } from './cloudinary.service';
import { UploadValidationService } from './upload-validation.service';
import { ImageOptimizationService } from './image-optimization.service';
import { RedisService } from '../../redis/service/redis.service';
import { ImageCategory, UploaderType, ImageVariant } from '../enum/upload.enum';
import {
  UploadFailedException,
  RateLimitExceededException,
} from '../exceptions/upload.exception';
import { UploadApiResponse } from 'cloudinary';

describe('UploadService', () => {
  let service: UploadService;
  let cloudinaryService: jest.Mocked<CloudinaryService>;
  let validationService: jest.Mocked<UploadValidationService>;
  let optimizationService: jest.Mocked<ImageOptimizationService>;
  let redisService: jest.Mocked<RedisService>;

  const mockCloudinaryResponse: Partial<UploadApiResponse> = {
    asset_id: 'test-asset-id',
    url: 'https://cloudinary.com/test.jpg',
    secure_url: 'https://cloudinary.com/test.jpg',
    public_id: 'test-public-id',
    format: 'jpg',
    bytes: 1024,
    width: 800,
    height: 600,
  };

  beforeEach(async () => {
    const mockCloudinary = {
      uploadImage: jest.fn(),
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      getSignedUrl: jest.fn(),
    };

    const mockValidation = {
      validateUpload: jest.fn(),
      getRateLimit: jest.fn(),
    };

    const mockOptimization = {
      generateVariants: jest.fn(),
    };

    const mockRedis = {
      get: jest.fn(),
      exists: jest.fn(),
      incr: jest.fn(),
      setWithExpiry: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: CloudinaryService, useValue: mockCloudinary },
        { provide: UploadValidationService, useValue: mockValidation },
        { provide: ImageOptimizationService, useValue: mockOptimization },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    cloudinaryService = module.get(CloudinaryService);
    validationService = module.get(UploadValidationService);
    optimizationService = module.get(ImageOptimizationService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    const mockFile = {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    it('should upload image with variants successfully', async () => {
      // Mock rate limit check
      redisService.get.mockResolvedValue('5');

      // Mock validation
      validationService.validateUpload.mockResolvedValue(undefined);
      validationService.getRateLimit.mockReturnValue(10);

      // Mock variant generation
      const mockVariants = new Map([
        [ImageVariant.ORIGINAL, Buffer.from('original')],
        [ImageVariant.THUMBNAIL, Buffer.from('thumbnail')],
        [ImageVariant.MEDIUM, Buffer.from('medium')],
      ]);
      optimizationService.generateVariants.mockResolvedValue(mockVariants);

      // Mock Cloudinary uploads
      cloudinaryService.uploadImage.mockResolvedValue(
        mockCloudinaryResponse as UploadApiResponse,
      );

      // Mock rate limit increment
      redisService.exists.mockResolvedValue(1);
      redisService.incr.mockResolvedValue(6);

      const result = await service.uploadImage(
        mockFile,
        ImageCategory.PROFILE,
        123,
        UploaderType.CUSTOMER,
      );

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('variants');
      expect(result.variants).toHaveLength(2); // thumbnail and medium (not original)
      expect(validationService.validateUpload).toHaveBeenCalled();
      expect(optimizationService.generateVariants).toHaveBeenCalled();
      expect(cloudinaryService.uploadImage).toHaveBeenCalledTimes(3); // original + 2 variants
    });

    it('should throw RateLimitExceededException when limit exceeded', async () => {
      redisService.get.mockResolvedValue('10');
      validationService.getRateLimit.mockReturnValue(10);

      await expect(
        service.uploadImage(
          mockFile,
          ImageCategory.PROFILE,
          123,
          UploaderType.CUSTOMER,
        ),
      ).rejects.toThrow(RateLimitExceededException);
    });

    it('should handle validation errors', async () => {
      redisService.get.mockResolvedValue('5');
      validationService.getRateLimit.mockReturnValue(10);
      validationService.validateUpload.mockRejectedValue(
        new Error('Invalid file'),
      );

      await expect(
        service.uploadImage(
          mockFile,
          ImageCategory.PROFILE,
          123,
          UploaderType.CUSTOMER,
        ),
      ).rejects.toThrow();
    });

    it('should handle upload failures', async () => {
      redisService.get.mockResolvedValue('5');
      validationService.validateUpload.mockResolvedValue(undefined);
      validationService.getRateLimit.mockReturnValue(10);
      optimizationService.generateVariants.mockResolvedValue(
        new Map([[ImageVariant.ORIGINAL, Buffer.from('test')]]),
      );
      cloudinaryService.uploadImage.mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(
        service.uploadImage(
          mockFile,
          ImageCategory.PROFILE,
          123,
          UploaderType.CUSTOMER,
        ),
      ).rejects.toThrow(UploadFailedException);
    });
  });

  describe('uploadDocument', () => {
    const mockFile = {
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    it('should upload document successfully', async () => {
      redisService.get.mockResolvedValue('5');
      validationService.validateUpload.mockResolvedValue(undefined);
      validationService.getRateLimit.mockReturnValue(10);
      cloudinaryService.uploadFile.mockResolvedValue(
        mockCloudinaryResponse as UploadApiResponse,
      );
      redisService.exists.mockResolvedValue(1);
      redisService.incr.mockResolvedValue(6);

      const result = await service.uploadDocument(
        mockFile,
        123,
        UploaderType.CUSTOMER,
      );

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('url');
      expect(validationService.validateUpload).toHaveBeenCalled();
      expect(cloudinaryService.uploadFile).toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('should delete file and all variants', async () => {
      cloudinaryService.deleteFile.mockResolvedValue(undefined);

      const result = await service.deleteFile('test-public-id', 123);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('publicId', 'test-public-id');
      expect(cloudinaryService.deleteFile).toHaveBeenCalled();
    });

    it('should handle deletion errors gracefully', async () => {
      cloudinaryService.deleteFile.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(service.deleteFile('test-public-id', 123)).rejects.toThrow();
    });
  });

  describe('getSignedUrl', () => {
    it('should generate signed URL', async () => {
      cloudinaryService.getSignedUrl.mockReturnValue('https://signed-url.com');

      const result = await service.getSignedUrl('test-public-id', 3600);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(cloudinaryService.getSignedUrl).toHaveBeenCalledWith(
        'test-public-id',
        3600,
      );
    });
  });

  describe('rate limiting', () => {
    it('should allow upload when under rate limit', async () => {
      redisService.get.mockResolvedValue('5');
      validationService.getRateLimit.mockReturnValue(10);

      // Should not throw
      await expect(
        (service as any).checkRateLimit(123, UploaderType.CUSTOMER),
      ).resolves.not.toThrow();
    });

    it('should block upload when rate limit exceeded', async () => {
      redisService.get.mockResolvedValue('10');
      validationService.getRateLimit.mockReturnValue(10);

      await expect(
        (service as any).checkRateLimit(123, UploaderType.CUSTOMER),
      ).rejects.toThrow(RateLimitExceededException);
    });

    it('should increment rate limit counter', async () => {
      redisService.exists.mockResolvedValue(1);
      redisService.incr.mockResolvedValue(6);

      await (service as any).incrementRateLimit(123, UploaderType.CUSTOMER);

      expect(redisService.incr).toHaveBeenCalled();
    });

    it('should set new rate limit counter with expiry', async () => {
      redisService.exists.mockResolvedValue(0);
      redisService.setWithExpiry.mockResolvedValue(true);

      await (service as any).incrementRateLimit(123, UploaderType.CUSTOMER);

      expect(redisService.setWithExpiry).toHaveBeenCalledWith(
        expect.any(String),
        '1',
        3600,
      );
    });
  });
});
