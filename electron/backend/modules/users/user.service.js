/**
 * User Service
 */
import crypto from 'crypto';
import * as UserRepository from './user.repository.js';
import * as auditService from '../audit/audit.service.js';

function hashPassword(password) {
    // Simple SHA256 hash for demonstration (In prod: use bcrypt/scrypt/argon2)
    // Since we don't have bcrypt installed and cannot easily install it, we use built-in crypto
    return crypto.createHash('sha256').update(password).digest('hex');
}

export async function getUsers(params) {
    return UserRepository.findUsers(params);
}

export async function getUserById(id) {
    const user = UserRepository.findUserById(id);
    if (!user) throw new Error(`User ${id} not found`);
    return user;
}

export async function createUser(data) {
    const existing = UserRepository.findUserByUsername(data.username);
    if (existing) throw new Error('Username already exists');

    const password_hash = hashPassword(data.password);

    const result = UserRepository.insertUser({
        ...data,
        password_hash
    });

    const userId = result.lastInsertRowid;

    // Log user creation (exclude password)
    const { password, password_hash: _, ...logData } = { ...data, id: userId };
    auditService.logCreate(data.createdBy || 1, 'users', userId, logData);

    return result;
}

export async function updateUser(id, data) {
    const oldUser = await getUserById(id); // Ensure exists

    if (data.username && data.username !== oldUser.username) {
        const existing = UserRepository.findUserByUsername(data.username);
        if (existing) throw new Error('Username already taken');
    }

    const updateData = { ...data };
    if (data.password) {
        updateData.password_hash = hashPassword(data.password);
        delete updateData.password;
    }

    const result = UserRepository.updateUserById(id, updateData);

    // Log user update (exclude password)
    if (result.changes > 0) {
        const newUser = UserRepository.findUserById(id);
        const { password_hash: _old, ...oldData } = oldUser;
        const { password_hash: _new, ...newData } = newUser;
        auditService.logUpdate(data.updatedBy || 1, 'users', id, oldData, newData);
    }

    return result;
}

export async function deleteUser(id, deletedBy) {
    const user = await getUserById(id);
    const result = UserRepository.softDeleteUser(id);

    // Log user deletion (exclude password)
    if (result.changes > 0) {
        const { password_hash, ...userData } = user;
        auditService.logDelete(deletedBy || 1, 'users', id, userData);
    }

    return result;
}
