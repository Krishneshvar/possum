/**
 * User Service
 */
import crypto from 'crypto';
import * as UserRepository from './user.repository.js';
import * as auditService from '../audit/audit.service.js';
import { User, Role } from '../../../../types/index.js';

function hashPassword(password: string): string {
    // Simple SHA256 hash for demonstration (In prod: use bcrypt/scrypt/argon2)
    return crypto.createHash('sha256').update(password).digest('hex');
}

export async function getUsers(params: UserRepository.UserFilter): Promise<UserRepository.PaginatedUsers> {
    return UserRepository.findUsers(params);
}

export async function getUserById(id: number): Promise<User> {
    const user = UserRepository.findUserById(id);
    if (!user) throw new Error(`User ${id} not found`);
    return user;
}

export async function createUser(data: any): Promise<User> {
    const existing = UserRepository.findUserByUsername(data.username);
    if (existing) throw new Error('Username already exists');

    const password_hash = hashPassword(data.password);

    const newUser = UserRepository.insertUser({
        ...data,
        password_hash
    });

    if (!newUser) throw new Error('Failed to create user');

    const userId = newUser.id;

    // Log user creation (exclude password)
    const { password, password_hash: _, ...logData } = { ...data, id: userId };
    auditService.logCreate(data.createdBy!, 'users', userId, logData);

    return newUser;
}

export async function updateUser(id: number, data: any): Promise<User> {
    const oldUser = await getUserById(id); // Ensure exists

    if (data.username && data.username !== oldUser.username) {
        const existing = UserRepository.findUserByUsername(data.username);
        if (existing) throw new Error('Username already taken');
    }

    const updateData: any = { ...data };
    if (data.password) {
        updateData.password_hash = hashPassword(data.password);
        delete updateData.password;
    }

    const updatedUser = UserRepository.updateUserById(id, updateData);
    if (!updatedUser) throw new Error('Failed to update user');

    // Log user update (exclude password)
    const { password_hash: _old, ...oldData } = oldUser;
    const { password_hash: _new, ...newData } = updatedUser;
    auditService.logUpdate(data.updatedBy!, 'users', id, oldData, newData);

    return updatedUser;
}

export async function deleteUser(id: number, deletedBy: number): Promise<boolean> {
    const user = await getUserById(id);
    const success = UserRepository.softDeleteUser(id);

    // Log user deletion (exclude password)
    if (success) {
        const { password_hash, ...userData } = user;
        auditService.logDelete(deletedBy, 'users', id, userData);
    }

    return success;
}

export async function getRoles(): Promise<Role[]> {
    return UserRepository.getAllRoles();
}

export async function getPermissions(): Promise<any[]> {
    return UserRepository.getAllPermissions();
}
