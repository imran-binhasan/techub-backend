// jwt.strategy.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";

export interface JwtPayload {
    sub: string;
    email: string;
    type: 'admin' | 'customer';
    role?: string;        // Optional - only for admins
    roleId?: string;      // Optional - only for admins
    permissions?: string[]; // Optional - only for admins
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET')
        });
    }

    async validate(payload: JwtPayload) {
        const baseUser = {
            id: payload.sub,
            email: payload.email,
            type: payload.type,
        };

        // Add role-based properties only for admins
        if (payload.type === 'admin') {
            return {
                ...baseUser,
                role: payload.role,
                roleId: payload.roleId,
                permissions: payload.permissions || []
            };
        }

        // For customers, just return basic info
        return baseUser;
    }
}