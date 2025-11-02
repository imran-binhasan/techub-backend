import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string; // Google ID token from frontend
}

export class FacebookAuthDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string; // Facebook access token from frontend
}

export class SocialAuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    image?: string;
    provider: 'google' | 'facebook';
    isNewUser: boolean;
  };
  userType: 'customer';
}
