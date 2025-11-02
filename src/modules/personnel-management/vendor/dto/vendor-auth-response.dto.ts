export interface TokensDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface VendorUserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  image?: string;
  shopName: string;
  shopSlug: string;
  status: string;
  commissionRate: number;
  totalSales: number;
  averageRating?: number;
}

export interface VendorAuthResponseDto {
  tokens: TokensDto;
  user: VendorUserDto;
  userType: 'vendor';
}
