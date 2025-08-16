import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "../guard/jwt.strategy";

@Injectable()
export class AuthService {
    constructor(
        private jwtService:JwtService
    ){}

   generateToken(payload:JwtPayload):string{
    return this.jwtService.sign(payload)
   }

   verifyToken(token:string):JwtPayload{
    return this.jwtService.verify<JwtPayload>(token)
   }
}