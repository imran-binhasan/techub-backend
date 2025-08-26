// jwt-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "./jwt.strategy";

@Injectable()
export class JwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(
        private readonly jwtService: JwtService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        if (!authHeader) {
            this.logger.warn(`[JwtAuthGuard] No authorization header for ${request.method} ${request.url}`);
            throw new UnauthorizedException('No authentication token provided');
        }

        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            this.logger.warn(`[JwtAuthGuard] Invalid authorization header format`);
            throw new UnauthorizedException('Invalid authentication token format');
        }

        try {
            const payload = this.jwtService.verify<JwtPayload>(token);
            if (!this.isValidJwtPayload(payload)) {
                this.logger.warn(`[JwtAuthGuard] Invalid JWT Payload structure`);
                throw new UnauthorizedException('Invalid token payload');
            }
            
            request.user = await this.attachUser(payload);
            this.logger.debug(`[JwtAuthGuard] Successfully authenticated user ${payload.sub}`);
            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            this.logger.warn(`[JwtAuthGuard] Token verification failed: ${error?.message}`);
            throw new UnauthorizedException('Invalid token or expired token');
        }
    }

    private isValidJwtPayload(payload: any): payload is JwtPayload {
        return (
            payload &&
            typeof payload === 'object' &&
            typeof payload.sub === 'string' &&
            typeof payload.email === 'string' &&
            (payload.type === 'admin' || payload.type === 'customer') &&
            typeof payload.role === 'string' &&
            typeof payload.roleId === 'string' &&
            Array.isArray(payload.permissions)
        );
    }

    private async attachUser(payload: JwtPayload): Promise<any> {
        return {
            id: payload.sub,
            email: payload.email,
            type: payload.type,
            role: payload.role,
            roleId: payload.roleId,
            permissions: payload.permissions
        };
    }
}