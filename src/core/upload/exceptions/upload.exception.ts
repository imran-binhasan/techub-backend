import { HttpException, HttpStatus } from '@nestjs/common';
import { UPLOAD_ERROR_MESSAGES } from '../constants/upload.constants';

/**
 * Base class for all upload-related exceptions
 */
export class UploadException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, statusCode);
  }
}

/**
 * Thrown when file size exceeds limit
 */
export class FileTooLargeException extends UploadException {
  constructor(maxSize: number, actualSize: number) {
    super(
      `${UPLOAD_ERROR_MESSAGES.FILE_TOO_LARGE}. Maximum: ${Math.round(maxSize / 1024 / 1024)}MB, Actual: ${Math.round(actualSize / 1024 / 1024)}MB`,
      HttpStatus.PAYLOAD_TOO_LARGE,
    );
  }
}

/**
 * Thrown when file type is not supported
 */
export class InvalidFileTypeException extends UploadException {
  constructor(mimeType: string, allowedTypes: string[]) {
    super(
      `${UPLOAD_ERROR_MESSAGES.INVALID_FILE_TYPE}. Got: ${mimeType}, Allowed: ${allowedTypes.join(', ')}`,
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    );
  }
}

/**
 * Thrown when image dimensions don't meet requirements
 */
export class InvalidImageDimensionsException extends UploadException {
  constructor(
    width: number,
    height: number,
    minWidth: number,
    minHeight: number,
    maxWidth: number,
    maxHeight: number,
  ) {
    super(
      `${UPLOAD_ERROR_MESSAGES.INVALID_DIMENSIONS}. Got: ${width}x${height}, Required: ${minWidth}x${minHeight} to ${maxWidth}x${maxHeight}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Thrown when virus is detected in file
 */
export class VirusDetectedException extends UploadException {
  constructor() {
    super(UPLOAD_ERROR_MESSAGES.VIRUS_DETECTED, HttpStatus.FORBIDDEN);
  }
}

/**
 * Thrown when upload to provider fails
 */
export class UploadFailedException extends UploadException {
  constructor(reason?: string) {
    super(
      `${UPLOAD_ERROR_MESSAGES.UPLOAD_FAILED}${reason ? `: ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when file deletion fails
 */
export class DeleteFailedException extends UploadException {
  constructor(reason?: string) {
    super(
      `${UPLOAD_ERROR_MESSAGES.DELETE_FAILED}${reason ? `: ${reason}` : ''}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * Thrown when rate limit is exceeded
 */
export class RateLimitExceededException extends UploadException {
  constructor(limit: number) {
    super(
      `${UPLOAD_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED}. Limit: ${limit} uploads/hour`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Thrown when no file is provided
 */
export class NoFileProvidedException extends UploadException {
  constructor() {
    super(UPLOAD_ERROR_MESSAGES.NO_FILE_PROVIDED, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Thrown when invalid category is specified
 */
export class InvalidImageCategoryException extends UploadException {
  constructor(category: string) {
    super(
      `${UPLOAD_ERROR_MESSAGES.INVALID_IMAGE_CATEGORY}: ${category}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
