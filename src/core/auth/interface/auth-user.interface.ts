export interface BaseAuthenticatedUser {
  id: number;
  email: string;
  type: 'admin' | 'customer';
}

export interface AuthenticatedAdmin extends BaseAuthenticatedUser {
  type: 'admin';
  role: string;
  roleId: number;
  permissions: string[];
}

export interface AuthenticatedCustomer extends BaseAuthenticatedUser {
  type: 'customer';
}

export type AuthenticatedUser = AuthenticatedAdmin | AuthenticatedCustomer;

export function isAdmin(user: AuthenticatedUser): user is AuthenticatedAdmin {
  return user.type === 'admin';
}

export function isCustomer(
  user: AuthenticatedCustomer,
): user is AuthenticatedCustomer {
  return user.type === 'customer';
}
