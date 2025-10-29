export interface BaseAuthenticatedUser {
  id: number;
  email: string;
  type: 'admin' | 'customer' | 'vendor';
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

export interface AuthenticatedVendor extends BaseAuthenticatedUser {
  type: 'vendor';
}

export type AuthenticatedUser = AuthenticatedAdmin | AuthenticatedCustomer | AuthenticatedVendor;

export function isAdmin(user: AuthenticatedUser): user is AuthenticatedAdmin {
  return user.type === 'admin';
}

export function isCustomer(
  user: AuthenticatedCustomer,
): user is AuthenticatedCustomer {
  return user.type === 'customer';
}

export function isVendor(user: AuthenticatedUser): user is AuthenticatedVendor {
  return user.type === 'vendor';
}