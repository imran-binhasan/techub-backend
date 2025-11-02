import { ImageVariant, FileStatus } from '../enum/upload.enum';

/**
 * Response for single file upload
 */
export interface UploadResponseDto {
  success: boolean;
  fileId: string;
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  variants?: ImageVariantDto[];
  uploadedAt: Date;
}

/**
 * Image variant information
 */
export interface ImageVariantDto {
  variant: ImageVariant;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Response for multiple file uploads
 */
export interface BulkUploadResponseDto {
  success: boolean;
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  files: UploadResponseDto[];
  errors?: UploadErrorDto[];
}

/**
 * Error information for failed uploads
 */
export interface UploadErrorDto {
  fileName: string;
  error: string;
  reason?: string;
}

/**
 * Response for file deletion
 */
export interface DeleteResponseDto {
  success: boolean;
  publicId: string;
  deletedAt: Date;
  message?: string;
}

/**
 * File processing status response
 */
export interface FileStatusDto {
  fileId: string;
  status: FileStatus;
  progress?: number; // 0-100
  message?: string;
  url?: string;
}

/**
 * Signed URL response for private files
 */
export interface SignedUrlDto {
  url: string;
  expiresAt: Date;
  expiresIn: number; // seconds
}
