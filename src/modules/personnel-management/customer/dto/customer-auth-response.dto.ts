export interface TokensDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface CustomerUserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  image?: string;
  rewardPoints: number;
  tier: string;
}

export interface CustomerAuthResponseDto {
  tokens: TokensDto;
  user: CustomerUserDto;
  userType: 'customer';
}
