import {
  AuthenticatedAdmin,
  AuthenticatedCustomer,
  AuthenticatedUser,
} from '../interface/auth-user.interface';

export function isAdmin(user: AuthenticatedUser): user is AuthenticatedAdmin {
  return user.type === 'admin';
}

export function isCustomer(
  user: AuthenticatedUser,
): user is AuthenticatedCustomer {
  return user.type === 'customer';
}
