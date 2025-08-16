import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary"

@Injectable()
export class CloudinaryService {

    constructor(
        @Inject(ConfigService)
        private configService: ConfigService
    ) {
        cloudinary.config({
            cloud_name: configService.get<string>('CLOUD_NAME'),
            api_key: configService.get<string>('CLOUD_API_KEY'),
            api_secret: configService.get<string>('CLOUD_API_SECRET')
        })
    }
}