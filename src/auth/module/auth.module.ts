import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtStrategy } from "../guard/jwt.strategy";
import { JwtAuthGuard } from "../guard/jwt-auth.guard";
import { AuthService } from "../service/auth.service";

@Module({
    imports:[PassportModule.register({defaultStrategy: 'jwt'}), ConfigModule, TypeOrmModule.forFeature([]),JwtModule.registerAsync({
        imports: [ConfigModule],
        inject:[ConfigService],
        useFactory: async (configService:ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET'),
            signOptions: {
                expiresIn: configService.get<string>('JWT_EXPIRATION', '24h'),
            }
        })
    })],
    providers:[JwtStrategy, JwtAuthGuard, AuthService],
    exports:[JwtModule,JwtStrategy,JwtAuthGuard]
})

export class AuthModule {}