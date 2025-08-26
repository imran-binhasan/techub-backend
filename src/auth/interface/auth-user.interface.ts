export interface BaseAuthenticatedUser {
    id: string;
    email: string;
    type: 'admin' | 'customer';
}

export interface AuthenticatedAdmin extends BaseAuthenticatedUser {
    type: 'admin';
    role: string;
    roleId: string;
    permissions: string[];
}

export interface AuthenticatedCustomer extends BaseAuthenticatedUser {
    type: 'customer';
}

export type AuthenticatedUser = AuthenticatedAdmin | AuthenticatedCustomer;