import { User, Role, Permission } from '../../../types/index.js';

export interface UserFilter {
  searchTerm?: string;
  roleId?: number;
  isActive?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: User[];
  totalCount: number;
  totalPages: number;
}

export interface IUserRepository {
  findUsers(params: UserFilter): PaginatedUsers;
  findUserById(id: number): User | undefined;
  findUserByUsername(username: string): User | undefined;
  insertUserWithRoles(userData: Partial<User>, roleIds: number[]): User;
  updateUserWithRolesById(id: number, userData: Partial<User>, roleIds?: number[]): User;
  softDeleteUser(id: number): boolean;
  getAllRoles(): Role[];
  getAllPermissions(): Permission[];
  getUserRoles(userId: number): Role[];
  getUserPermissions(userId: number): string[];
  assignUserRoles(userId: number, roleIds: number[]): void;
  getUserPermissionOverrides(userId: number): Array<{ permission_id: number; key: string; granted: number }>;
  setUserPermission(userId: number, permissionId: number, granted: boolean): void;
}
