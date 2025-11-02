/**
 * Upload Module Enums
 * 
 * Defines all enum types for file uploads, user types, and file statuses.
 */

/**
 * Supported file upload types
 */
export enum UploadType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
}

/**
 * Image upload categories
 */
export enum ImageCategory {
  PROFILE = 'profile',
  PRODUCT = 'product',
  BRAND = 'brand',
  CATEGORY = 'category',
  BANNER = 'banner',
  SHOP_LOGO = 'shop_logo',
  SHOP_BANNER = 'shop_banner',
  REVIEW = 'review',
  VERIFICATION = 'verification', // For KYC documents
}

/**
 * User types for upload policies
 */
export enum UploaderType {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
  GUEST = 'guest',
}

/**
 * Image variants/sizes
 */
export enum ImageVariant {
  THUMBNAIL = 'thumbnail',   // 150x150
  SMALL = 'small',           // 300x300
  MEDIUM = 'medium',         // 600x600
  LARGE = 'large',           // 1200x1200
  ORIGINAL = 'original',     // Original size
}

/**
 * Supported mime types
 */
export enum SupportedMimeType {
  // Images
  JPEG = 'image/jpeg',
  JPG = 'image/jpg',
  PNG = 'image/png',
  WEBP = 'image/webp',
  GIF = 'image/gif',
  SVG = 'image/svg+xml',
  
  // Documents
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS = 'application/vnd.ms-excel',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  
  // Videos
  MP4 = 'video/mp4',
  AVI = 'video/x-msvideo',
  MOV = 'video/quicktime',
  
  // Audio
  MP3 = 'audio/mpeg',
  WAV = 'audio/wav',
}

/**
 * File processing status
 */
export enum FileStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * File storage provider
 */
export enum StorageProvider {
  CLOUDINARY = 'cloudinary',
  S3 = 's3',
  LOCAL = 'local',
  R2 = 'r2', // CloudFlare R2
}
