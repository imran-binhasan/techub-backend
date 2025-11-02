export interface TokensDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface AdminUserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  image?: string;
  roleId: number;
  roleName?: string;
  department?: string;
  employeeNumber?: string;
  permissions: string[];
}

export interface AdminAuthResponseDto {
  tokens: TokensDto;
  user: AdminUserDto;
  userType: 'admin';
}
