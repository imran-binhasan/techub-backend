import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt"

export interface JwtPayload {
    sub: string;
    email: string;
    type:'admin' | 'customer';
    roles: string[];
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET')
        })
    }
    async validate(payload: JwtPayload) {
        return {
            id: payload.sub,
            email: payload.email,
            type:payload.type,
            roles: payload.roles,
        }
    }
}

