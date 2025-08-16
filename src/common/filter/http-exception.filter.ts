import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name)

    constructor(
        @Inject(ConfigService)
        private readonly configService: ConfigService
    ) { }



    catch(exception: HttpException, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus()
        const exceptionResponse = exception.getResponse();

        const errorResponse = this.buildErrorResponse(exceptionResponse, request)
        this.logError(exception, request, status);
        response.status(status).json(errorResponse)
    }

    private buildErrorResponse(exceptionResponse: any, request: Request) {
        const { message, errors, errorCode } = this.parseExceptionResponse(exceptionResponse);
        const requestId = (request as any).requestId || this.generateRequestId()
        return {
            data: null,
            status: 'error',
            message,
            ...(errorCode && { errorCode }),
            ...(errors && {errors}),
            meta: {
                timestamp: new Date().toISOString(),
                requestId,
                path: request.url,
                method: request.method,
                ...(this.shouldIncludeStack() && { stack: this.getStackTrace(exceptionResponse) })
            }
        }
    }

    private parseExceptionResponse(exceptionResponse: any): {
        message: string;
        errors?: Record<string, string[]>
        errorCode?: string
    } {
        if (typeof exceptionResponse === 'string') {
            return { message: exceptionResponse }
        }
        if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const { message, error, statusCode } = exceptionResponse;
            if (Array.isArray(message)) {
                return {
                    message: 'Validation failed',
                    errors: this.formatValidationErrors(message),
                    errorCode: 'VALIDATION_FAILED'
                };
            }

            if (message) {
                return {
                    message: typeof message === 'string' ? message : message.toString(),
                    errorCode: this.getErrorCode(statusCode, error)
                }
            }
        }
        return { message: 'An error occurred' }
    }

    private formatValidationErrors(validationErrors: any[]): Record<string, string[]> {
        const formattedErrors: Record<string, string[]> = {};

        validationErrors.forEach((error) => {
            if (typeof error === 'string') {
                const match = error.match(/^(\w+(?:\.\w+)*)\s+(.+)$/);
                if (match) {
                    const [, field, message] = match
                    this.addErrorToField(formattedErrors, field, message);
                } else {
                    this.addErrorToField(formattedErrors, 'general', error)
                }
            } else if (typeof error === 'object' && error !== null) {
                const { property, constraints } = error;
                if (property && constraints) {
                    const messages = Object.values(constraints) as string[];
                    messages.forEach(msg => this.addErrorToField(formattedErrors, property, msg));
                }
            }
        });

        return formattedErrors
    }

    private addErrorToField(errors: Record<string, string[]>, field: string, message: string): void {
        if (!errors[field]) {
            errors[field] = []
        }
        errors[field].push(message);
    }

    private generateRequestId(): string {
        return Math.random().toString(20).substring(2, 10);
    }

    private shouldIncludeStack() {
        return this.configService.get<string>('NODE_ENV') === 'development'
    }

    private getStackTrace(exceptionResponse: any): string | undefined {
        if (typeof exceptionResponse === 'object' && exceptionResponse?.stack) {
            return exceptionResponse.stack
        }
        return undefined
    }

    private getErrorCode(statusCode?: number, error?: string): string | undefined {
        const errorCodeMap: Record<number, string> = {
            [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
            [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
            [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
            [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
            [HttpStatus.CONFLICT]: 'CONFLICT',
            [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
            [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
            [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR'
        };

        return statusCode ? errorCodeMap[statusCode] : undefined;
    }

    private logError(exception: HttpException, request: Request, status: number) {
        const requestId = (request as any).requestId;
        const context = {
            method: request.method,
            url: request.url,
            statusCode: status,
            requestId,
            ip: request.ip,
            userAgent: request.get('user-agent'),
        };
        const message = `${request.method} ${request.url} ${exception.message}`;
        if (status >= 500) {
            this.logger.error(message, exception.stack, context)
        } else if (status >= 400) {
            this.logger.warn(message, context)
        }
    }
}