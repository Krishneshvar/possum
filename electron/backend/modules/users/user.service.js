/**
 * User Service
 */
import crypto from 'crypto';
import * as UserRepository from './user.repository.js';

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

    return UserRepository.insertUser({
        ...data,
        password_hash
    });
}

export async function updateUser(id, data) {
    const user = await getUserById(id); // Ensure exists

    if (data.username && data.username !== user.username) {
        const existing = UserRepository.findUserByUsername(data.username);
        if (existing) throw new Error('Username already taken');
    }

    const updateData = { ...data };
    if (data.password) {
        updateData.password_hash = hashPassword(data.password);
        delete updateData.password;
    }

    return UserRepository.updateUserById(id, updateData);
}

export async function deleteUser(id) {
    const user = await getUserById(id);
    return UserRepository.softDeleteUser(id);
}
