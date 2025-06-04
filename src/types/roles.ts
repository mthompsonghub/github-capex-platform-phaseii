export type UserRole = 'admin' | 'user';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserRoleWithEmail extends UserRoleData {
  email: string;
}

export const isAdmin = (role: UserRole | null): boolean => role === 'admin';
export const isUser = (role: UserRole | null): boolean => role === 'user'; 