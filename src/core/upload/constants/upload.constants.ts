/**
 * Upload Module Constants
 * 
 * Defines size limits, allowed types, and configuration values.
 */

import { ImageCategory, SupportedMimeType, UploadType, UploaderType } from '../enum/upload.enum';

/**
 * File size limits in bytes
 */
export const FILE_SIZE_LIMITS = {
  [UploaderType.CUSTOMER]: {
    [UploadType.IMAGE]: 5 * 1024 * 1024,      // 5MB
    [UploadType.DOCUMENT]: 10 * 1024 * 1024,  // 10MB
    [UploadType.VIDEO]: 0,                    // Not allowed
    [UploadType.AUDIO]: 0,                    // Not allowed
  },
  [UploaderType.VENDOR]: {
    [UploadType.IMAGE]: 10 * 1024 * 1024,     // 10MB
    [UploadType.DOCUMENT]: 20 * 1024 * 1024,  // 20MB
    [UploadType.VIDEO]: 50 * 1024 * 1024,     // 50MB
    [UploadType.AUDIO]: 10 * 1024 * 1024,     // 10MB
  },
  [UploaderType.ADMIN]: {
    [UploadType.IMAGE]: 20 * 1024 * 1024,     // 20MB
    [UploadType.DOCUMENT]: 50 * 1024 * 1024,  // 50MB
    [UploadType.VIDEO]: 100 * 1024 * 1024,    // 100MB
    [UploadType.AUDIO]: 20 * 1024 * 1024,     // 20MB
  },
  [UploaderType.GUEST]: {
    [UploadType.IMAGE]: 2 * 1024 * 1024,      // 2MB
    [UploadType.DOCUMENT]: 0,                 // Not allowed
    [UploadType.VIDEO]: 0,                    // Not allowed
    [UploadType.AUDIO]: 0,                    // Not allowed
  },
};

/**
 * Allowed mime types per user type and upload type
 */
export const ALLOWED_MIME_TYPES = {
  [UploaderType.CUSTOMER]: {
    [UploadType.IMAGE]: [
      SupportedMimeType.JPEG,
      SupportedMimeType.JPG,
      SupportedMimeType.PNG,
      SupportedMimeType.WEBP,
    ],
    [UploadType.DOCUMENT]: [SupportedMimeType.PDF], // For invoices/receipts
    [UploadType.VIDEO]: [], // Not allowed
    [UploadType.AUDIO]: [], // Not allowed
  },
  [UploaderType.VENDOR]: {
    [UploadType.IMAGE]: [
      SupportedMimeType.JPEG,
      SupportedMimeType.JPG,
      SupportedMimeType.PNG,
      SupportedMimeType.WEBP,
      SupportedMimeType.GIF,
    ],
    [UploadType.DOCUMENT]: [
      SupportedMimeType.PDF,
      SupportedMimeType.DOC,
      SupportedMimeType.DOCX,
      SupportedMimeType.XLS,
      SupportedMimeType.XLSX,
    ],
    [UploadType.VIDEO]: [SupportedMimeType.MP4], // Product videos
    [UploadType.AUDIO]: [SupportedMimeType.MP3, SupportedMimeType.WAV],
  },
  [UploaderType.ADMIN]: {
    [UploadType.IMAGE]: [
      SupportedMimeType.JPEG,
      SupportedMimeType.JPG,
      SupportedMimeType.PNG,
      SupportedMimeType.WEBP,
      SupportedMimeType.GIF,
      SupportedMimeType.SVG,
    ],
    [UploadType.DOCUMENT]: [
      SupportedMimeType.PDF,
      SupportedMimeType.DOC,
      SupportedMimeType.DOCX,
      SupportedMimeType.XLS,
      SupportedMimeType.XLSX,
    ],
    [UploadType.VIDEO]: [SupportedMimeType.MP4, SupportedMimeType.AVI, SupportedMimeType.MOV],
    [UploadType.AUDIO]: [SupportedMimeType.MP3, SupportedMimeType.WAV],
  },
  [UploaderType.GUEST]: {
    [UploadType.IMAGE]: [
      SupportedMimeType.JPEG,
      SupportedMimeType.JPG,
      SupportedMimeType.PNG,
    ],
    [UploadType.DOCUMENT]: [], // Not allowed
    [UploadType.VIDEO]: [], // Not allowed
    [UploadType.AUDIO]: [], // Not allowed
  },
};

/**
 * Image dimension limits (width x height in pixels)
 */
export const IMAGE_DIMENSION_LIMITS = {
  [ImageCategory.PROFILE]: { minWidth: 100, maxWidth: 2000, minHeight: 100, maxHeight: 2000 },
  [ImageCategory.PRODUCT]: { minWidth: 300, maxWidth: 4000, minHeight: 300, maxHeight: 4000 },
  [ImageCategory.BRAND]: { minWidth: 200, maxWidth: 2000, minHeight: 200, maxHeight: 2000 },
  [ImageCategory.CATEGORY]: { minWidth: 200, maxWidth: 2000, minHeight: 200, maxHeight: 2000 },
  [ImageCategory.BANNER]: { minWidth: 800, maxWidth: 4000, minHeight: 300, maxHeight: 2000 },
  [ImageCategory.SHOP_LOGO]: { minWidth: 200, maxWidth: 2000, minHeight: 200, maxHeight: 2000 },
  [ImageCategory.SHOP_BANNER]: { minWidth: 1000, maxWidth: 4000, minHeight: 300, maxHeight: 2000 },
  [ImageCategory.REVIEW]: { minWidth: 200, maxWidth: 2000, minHeight: 200, maxHeight: 2000 },
  [ImageCategory.VERIFICATION]: { minWidth: 500, maxWidth: 4000, minHeight: 500, maxHeight: 4000 },
};

/**
 * Image variant dimensions
 */
export const IMAGE_VARIANTS = {
  thumbnail: {
    width: 150,
    height: 150,
    quality: 80,
    format: 'webp' as const,
  },
  small: {
    width: 300,
    height: 300,
    quality: 85,
    format: 'webp' as const,
  },
  medium: {
    width: 600,
    height: 600,
    quality: 90,
    format: 'webp' as const,
  },
  large: {
    width: 1200,
    height: 1200,
    quality: 95,
    format: 'webp' as const,
  },
};

/**
 * Upload folder structure on Cloudinary
 */
export const UPLOAD_FOLDERS = {
  images: 'uploads/images',
  documents: 'uploads/documents',
  videos: 'uploads/videos',
  audio: 'uploads/audio',
  profile: 'users/profile',
  product: 'products',
  brand: 'brands',
  category: 'categories',
  banner: 'banners',
  shop_logo: 'shops/logos',
  shop_banner: 'shops/banners',
  review: 'reviews',
  verification: 'verifications',
};

/**
 * CDN configuration
 */
export const CDN_CONFIG = {
  SIGNED_URL_EXPIRATION: 3600, // 1 hour in seconds
  CACHE_MAX_AGE: 31536000, // 1 year in seconds
  CACHE_CONTROL: 'public, max-age=31536000, immutable',
};

/**
 * Rate limiting (per user per hour)
 */
export const UPLOAD_RATE_LIMITS = {
  [UploaderType.CUSTOMER]: 10,  // 10 uploads/hour
  [UploaderType.VENDOR]: 50,    // 50 uploads/hour
  [UploaderType.ADMIN]: 200,    // 200 uploads/hour
  [UploaderType.GUEST]: 3,      // 3 uploads/hour
};

/**
 * Error messages
 */
export const UPLOAD_ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit',
  INVALID_FILE_TYPE: 'File type is not supported',
  INVALID_DIMENSIONS: 'Image dimensions do not meet requirements',
  VIRUS_DETECTED: 'File contains malicious content',
  UPLOAD_FAILED: 'Failed to upload file to storage provider',
  DELETE_FAILED: 'Failed to delete file from storage provider',
  RATE_LIMIT_EXCEEDED: 'Upload rate limit exceeded. Please try again later',
  NO_FILE_PROVIDED: 'No file was provided in the request',
  INVALID_IMAGE_CATEGORY: 'Invalid image category specified',
};

/**
 * Supported image formats for conversion
 */
export const CONVERTIBLE_IMAGE_FORMATS = ['jpeg', 'jpg', 'png', 'gif', 'webp'];

/**
 * File name sanitization regex
 */
export const FILENAME_SANITIZE_REGEX = /[^a-zA-Z0-9_.-]/g;

/**
 * Max filename length
 */
export const MAX_FILENAME_LENGTH = 255;
