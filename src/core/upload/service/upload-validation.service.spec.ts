import { Test, TestingModule } from '@nestjs/testing';
import { UploadValidationService } from './upload-validation.service';
import { ImageCategory, UploaderType, UploadType } from '../enum/upload.enum';
import {
  FileTooLargeException,
  InvalidFileTypeException,
  NoFileProvidedException,
} from '../exceptions/upload.exception';

describe('UploadValidationService', () => {
  let service: UploadValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadValidationService],
    }).compile();

    service = module.get<UploadValidationService>(UploadValidationService);
  });

  describe('validateFileType', () => {
    it('should accept valid image type for customer', () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      expect(() =>
        service.validateFileType(file, UploaderType.CUSTOMER, UploadType.IMAGE),
      ).not.toThrow();
    });

    it('should reject invalid file type', () => {
      const file = {
        mimetype: 'application/exe',
        size: 1024,
      } as Express.Multer.File;

      expect(() =>
        service.validateFileType(file, UploaderType.CUSTOMER, UploadType.IMAGE),
      ).toThrow(InvalidFileTypeException);
    });

    it('should throw when file is not provided', () => {
      expect(() =>
        service.validateFileType(null as any, UploaderType.CUSTOMER, UploadType.IMAGE),
      ).toThrow(NoFileProvidedException);
    });

    it('should accept PDF for customer documents', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File;

      expect(() =>
        service.validateFileType(file, UploaderType.CUSTOMER, UploadType.DOCUMENT),
      ).not.toThrow();
    });

    it('should accept video for vendor', () => {
      const file = {
        mimetype: 'video/mp4',
        size: 1024,
      } as Express.Multer.File;

      expect(() =>
        service.validateFileType(file, UploaderType.VENDOR, UploadType.VIDEO),
      ).not.toThrow();
    });

    it('should reject video for customer (not allowed)', () => {
      const file = {
        mimetype: 'video/mp4',
        size: 1024,
      } as Express.Multer.File;

      expect(() =>
        service.validateFileType(file, UploaderType.CUSTOMER, UploadType.VIDEO),
      ).toThrow(InvalidFileTypeException);
    });
  });

  describe('validateFileSize', () => {
    it('should accept file within size limit for customer', () => {
      const file = {
        size: 4 * 1024 * 1024,
        mimetype: 'image/jpeg',
      } as Express.Multer.File; // 4MB

      expect(() =>
        service.validateFileSize(file, UploaderType.CUSTOMER, UploadType.IMAGE),
      ).not.toThrow();
    });

    it('should reject file exceeding size limit for customer', () => {
      const file = {
        size: 6 * 1024 * 1024,
        mimetype: 'image/jpeg',
      } as Express.Multer.File; // 6MB (exceeds 5MB limit)

      expect(() =>
        service.validateFileSize(file, UploaderType.CUSTOMER, UploadType.IMAGE),
      ).toThrow(FileTooLargeException);
    });

    it('should accept larger file for vendor', () => {
      const file = {
        size: 8 * 1024 * 1024,
        mimetype: 'image/jpeg',
      } as Express.Multer.File; // 8MB (within 10MB vendor limit)

      expect(() =>
        service.validateFileSize(file, UploaderType.VENDOR, UploadType.IMAGE),
      ).not.toThrow();
    });

    it('should throw when file is not provided', () => {
      expect(() =>
        service.validateFileSize(null as any, UploaderType.CUSTOMER, UploadType.IMAGE),
      ).toThrow(NoFileProvidedException);
    });
  });

  describe('validateImageDimensions', () => {
    // Note: Image dimension validation requires sharp library which is complex to mock
    // These tests should be covered in integration tests with actual image buffers
    it.skip('should validate image dimensions (requires sharp mocking)', async () => {
      // Skip in unit tests - cover in integration tests
    });
  });

  describe('validateUpload', () => {
    it('should validate all aspects of upload (without dimensions)', async () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 4 * 1024 * 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      // Mock dimension validation to skip sharp complexity
      jest.spyOn(service, 'validateImageDimensions').mockResolvedValue(undefined);

      await expect(
        service.validateUpload(
          file,
          UploaderType.CUSTOMER,
          UploadType.IMAGE,
          ImageCategory.PROFILE,
        ),
      ).resolves.not.toThrow();
    });

    it('should fail if file type is invalid', async () => {
      const file = {
        mimetype: 'application/exe',
        size: 1024,
      } as Express.Multer.File;

      await expect(
        service.validateUpload(
          file,
          UploaderType.CUSTOMER,
          UploadType.IMAGE,
          ImageCategory.PROFILE,
        ),
      ).rejects.toThrow(InvalidFileTypeException);
    });

    it('should fail if file size exceeds limit', async () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB exceeds customer limit of 5MB
      } as Express.Multer.File;

      await expect(
        service.validateUpload(
          file,
          UploaderType.CUSTOMER,
          UploadType.IMAGE,
          ImageCategory.PROFILE,
        ),
      ).rejects.toThrow(FileTooLargeException);
    });
  });

  describe('getRateLimit', () => {
    it('should return rate limit for customer', () => {
      const limit = service.getRateLimit(UploaderType.CUSTOMER);
      expect(limit).toBe(10);
    });

    it('should return rate limit for vendor', () => {
      const limit = service.getRateLimit(UploaderType.VENDOR);
      expect(limit).toBe(50);
    });

    it('should return rate limit for admin', () => {
      const limit = service.getRateLimit(UploaderType.ADMIN);
      expect(limit).toBe(200);
    });

    it('should return rate limit for guest', () => {
      const limit = service.getRateLimit(UploaderType.GUEST);
      expect(limit).toBe(3);
    });
  });
});
