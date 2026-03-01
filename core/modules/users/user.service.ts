/**
 * User Service
 */
import { IUserRepository, UserFilter, PaginatedUsers } from './user.repository.interface.js';
import { User, Role, Permission } from '../../../models/index.js';

let UserRepository: IUserRepository;
let AuthService: any;
let auditService: any;
let hashPassword: any;

export function initUserService(
    repo: IUserRepository,
    authSvc: any,
    audit: any,
    hashPwd: any
) {
    UserRepository = repo;
    AuthService = authSvc;
    auditService = audit;
    hashPassword = hashPwd;
}

interface CreateUserInput {
    username: string;
    name: string;
    password: string;
    role_id?: number;
    is_active?: number;
    createdBy: number;
}

interface UpdateUserInput {
    username?: string;
    name?: string;
    password?: string;
    role_id?: number;
    is_active?: number;
    updatedBy: number;
}

function normalizeUsername(username: string): string {
    return username.trim();
}

function ensureRoleExists(roleId: number): void {
    const roleExists = UserRepository.getAllRoles().some(role => role.id === roleId);
    if (!roleExists) {
        throw new Error('Invalid role selected');
    }
}

export async function getUsers(params: UserFilter): Promise<PaginatedUsers> {
    return UserRepository.findUsers(params);
}

export async function getUserById(id: number): Promise<User> {
    const user = UserRepository.findUserById(id);
    if (!user) throw new Error(`User ${id} not found`);
    return user;
}

export async function createUser(data: CreateUserInput): Promise<User> {
    const trimmedName = data.name.trim();
    if (!trimmedName) throw new Error('Name is required');

    const username = normalizeUsername(data.username);
    if (username.length < 3) throw new Error('Username must be at least 3 characters');
    const existing = UserRepository.findUserByUsername(username);
    if (existing) throw new Error('Username already exists');

    const password_hash = await hashPassword(data.password);
    if (data.role_id !== undefined) {
        ensureRoleExists(data.role_id);
    }
    const roleIds = data.role_id ? [data.role_id] : [];

    const newUser = UserRepository.insertUserWithRoles({
        name: trimmedName,
        username,
        password_hash
    }, roleIds);

    if (!newUser) throw new Error('Failed to create user');

    const userId = newUser.id;

    // Log user creation (exclude password)
    const { password, ...logData } = { ...data, id: userId, username };
    auditService.logCreate(data.createdBy!, 'users', userId, logData);

    return newUser;
}

export async function updateUser(id: number, data: UpdateUserInput): Promise<User> {
    const oldUser = await getUserById(id); // Ensure exists

    if (data.name !== undefined && !data.name.trim()) {
        throw new Error('Name is required');
    }
    if (data.name !== undefined) {
        data.name = data.name.trim();
    }

    if (data.username && data.username !== oldUser.username) {
        const normalizedUsername = normalizeUsername(data.username);
        if (normalizedUsername.length < 3) {
            throw new Error('Username must be at least 3 characters');
        }
        const existing = UserRepository.findUserByUsername(normalizedUsername);
        if (existing) throw new Error('Username already taken');
        data.username = normalizedUsername;
    }

    const { password, role_id, updatedBy, ...restData } = data;
    const updateData: Partial<User> = { ...restData };
    if (password) {
        updateData.password_hash = await hashPassword(password);
    }
    if (role_id !== undefined) {
        ensureRoleExists(role_id);
    }
    const roleIds = role_id !== undefined ? [role_id] : undefined;

    const updatedUser = UserRepository.updateUserWithRolesById(id, updateData, roleIds);
    if (!updatedUser) throw new Error('Failed to update user');

    // Enforce immediate permission/session consistency after account-sensitive updates.
    if (data.is_active === 0 || role_id !== undefined || !!password) {
        AuthService.revokeUserSessions(id);
    }

    // Log user update (exclude password)
    const { password_hash: _old, ...oldData } = oldUser;
    const { password_hash: _new, ...newData } = updatedUser;
    auditService.logUpdate(updatedBy!, 'users', id, oldData, newData);

    return updatedUser;
}

export async function deleteUser(id: number, deletedBy: number): Promise<boolean> {
    if (id === deletedBy) {
        throw new Error('You cannot delete your own account');
    }

    const user = await getUserById(id);
    const success = UserRepository.softDeleteUser(id);

    // Log user deletion (exclude password)
    if (success) {
        AuthService.revokeUserSessions(id);
        const { password_hash, ...userData } = user;
        auditService.logDelete(deletedBy, 'users', id, userData);
    }

    return success;
}

export async function getRoles(): Promise<Role[]> {
    return UserRepository.getAllRoles();
}

export async function getPermissions(): Promise<Permission[]> {
    return UserRepository.getAllPermissions();
}

export async function getUserRoles(userId: number): Promise<Role[]> {
    const user = await getUserById(userId);
    return UserRepository.getUserRoles(userId);
}

export async function updateUserRoles(userId: number, roleIds: number[]): Promise<void> {
    const user = await getUserById(userId);

    // Validate all role IDs exist
    const allRoles = UserRepository.getAllRoles();
    for (const roleId of roleIds) {
        if (!allRoles.some(r => r.id === roleId)) {
            throw new Error(`Invalid role ID: ${roleId}`);
        }
    }

    UserRepository.assignUserRoles(userId, roleIds);
    AuthService.revokeUserSessions(userId);
}

export async function getUserPermissionOverrides(userId: number): Promise<Array<{ permission_id: number; key: string; granted: number }>> {
    const user = await getUserById(userId);
    return UserRepository.getUserPermissionOverrides(userId);
}

export async function updateUserPermissions(userId: number, permissions: Array<{ permissionId: number; granted: boolean }>): Promise<void> {
    const user = await getUserById(userId);

    // Validate all permission IDs exist
    const allPermissions = UserRepository.getAllPermissions();
    for (const perm of permissions) {
        if (!allPermissions.some(p => p.id === perm.permissionId)) {
            throw new Error(`Invalid permission ID: ${perm.permissionId}`);
        }
    }

    // Apply each permission override
    for (const perm of permissions) {
        UserRepository.setUserPermission(userId, perm.permissionId, perm.granted);
    }

    AuthService.revokeUserSessions(userId);
}
