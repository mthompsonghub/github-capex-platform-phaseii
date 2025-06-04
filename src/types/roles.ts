export type UserRole = 'admin' | 'user';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserManagementData {
  id: string;
  email: string;
  last_login: string | null;
  user_created_at: string;
  role: UserRole;
  role_created_at: string | null;
  role_updated_at: string | null;
}

export interface UserRoleWithEmail extends UserRoleData {
  email: string;
}

export const isAdmin = (role: UserRole | null): boolean => role === 'admin';
export const isUser = (role: UserRole | null): boolean => role === 'user'; 