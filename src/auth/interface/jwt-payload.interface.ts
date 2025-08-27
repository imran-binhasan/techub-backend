export class JwtPayload {
  sub: string;
  email: string;
  type: 'admin' | 'customer';
  role?: string;
  roleId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
  tokenType?: 'access' | 'refresh';
}
