export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface AuthResponse<T = any> extends TokenResponse {
  user: T;
  user_type: 'admin' | 'customer' | 'vendor';
}
