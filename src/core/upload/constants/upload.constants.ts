/**
 * Upload Module Constants
 * 
 * Defines size limits, allowed types, and configuration values.
 */

import { ImageCategory, SupportedMimeType, UploaderType } from '../enum/upload.enum';

/**
 * File size limits in bytes
 */
export const FILE_SIZE_LIMITS = {
  [UploaderType.CUSTOMER]: {
    IMAGE: 5 * 1024 * 1024,      // 5MB
    DOCUMENT: 10 * 1024 * 1024,  // 10MB
    VIDEO: 0,                    // Not allowed
    AUDIO: 0,                    // Not allowed
  },
  [UploaderType.VENDOR]: {
    IMAGE: 10 * 1024 * 1024,     // 10MB
    DOCUMENT: 20 * 1024 * 1024,  // 20MB
    VIDEO: 50 * 1024 * 1024,     // 50MB
    AUDIO: 10 * 1024 * 1024,     // 10MB
  },
  [UploaderType.ADMIN]: {
    IMAGE: 20 * 1024 * 1024,     // 20MB
    DOCUMENT: 50 * 1024 * 1024,  // 50MB
    VIDEO: 100 * 1024 * 1024,    // 100MB
    AUDIO: 20 * 1024 * 1024,     // 20MB
  },
  [UploaderType.GUEST]: {
    IMAGE: 2 * 1024 * 1024,      // 2MB
    DOCUMENT: 0,                 // Not allowed
    VIDEO: 0,                    // Not allowed
    AUDIO: 0,                    // Not allowed
  },
};

/**
 * Allowed mime types per user type
 */
export const ALLOWED_MIME_TYPES = {
  [UploaderType.CUSTOMER]: [
    SupportedMimeType.JPEG,
    SupportedMimeType.JPG,
    SupportedMimeType.PNG,
    SupportedMimeType.WEBP,
    SupportedMimeType.PDF, // For invoices/receipts
  ],
  [UploaderType.VENDOR]: [
    SupportedMimeType.JPEG,
    SupportedMimeType.JPG,
    SupportedMimeType.PNG,
    SupportedMimeType.WEBP,
    SupportedMimeType.GIF,
    SupportedMimeType.PDF,
    SupportedMimeType.DOC,
    SupportedMimeType.DOCX,
    SupportedMimeType.XLS,
    SupportedMimeType.XLSX,
    SupportedMimeType.MP4, // Product videos
  ],
  [UploaderType.ADMIN]: Object.values(SupportedMimeType), // All types
  [UploaderType.GUEST]: [
    SupportedMimeType.JPEG,
    SupportedMimeType.JPG,
    SupportedMimeType.PNG,
  ],
};

/**
 * Image dimension limits (width x height in pixels)
 */
export const IMAGE_DIMENSION_LIMITS = {
  MIN: {
    [ImageCategory.PROFILE]: { width: 100, height: 100 },
    [ImageCategory.PRODUCT]: { width: 300, height: 300 },
    [ImageCategory.BRAND]: { width: 200, height: 200 },
    [ImageCategory.CATEGORY]: { width: 200, height: 200 },
    [ImageCategory.BANNER]: { width: 800, height: 300 },
    [ImageCategory.SHOP_LOGO]: { width: 200, height: 200 },
    [ImageCategory.SHOP_BANNER]: { width: 1000, height: 300 },
    [ImageCategory.REVIEW]: { width: 200, height: 200 },
    [ImageCategory.VERIFICATION]: { width: 500, height: 500 },
  },
  MAX: {
    [ImageCategory.PROFILE]: { width: 2000, height: 2000 },
    [ImageCategory.PRODUCT]: { width: 4000, height: 4000 },
    [ImageCategory.BRAND]: { width: 2000, height: 2000 },
    [ImageCategory.CATEGORY]: { width: 2000, height: 2000 },
    [ImageCategory.BANNER]: { width: 4000, height: 2000 },
    [ImageCategory.SHOP_LOGO]: { width: 2000, height: 2000 },
    [ImageCategory.SHOP_BANNER]: { width: 4000, height: 2000 },
    [ImageCategory.REVIEW]: { width: 2000, height: 2000 },
    [ImageCategory.VERIFICATION]: { width: 4000, height: 4000 },
  },
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
