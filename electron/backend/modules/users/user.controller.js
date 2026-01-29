/**
 * User Controller
 */
import * as UserService from './user.service.js';

export async function getUsers(req, res) {
    try {
        const { searchTerm, currentPage, itemsPerPage } = req.query;
        const result = await UserService.getUsers({
            searchTerm,
            currentPage: parseInt(currentPage) || 1,
            itemsPerPage: parseInt(itemsPerPage) || 10
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getUserById(req, res) {
    try {
        const user = await UserService.getUserById(parseInt(req.params.id));
        res.json(user);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
}

export async function createUser(req, res) {
    try {
        const userData = { ...req.body, createdBy: req.userId || 1 };
        const user = await UserService.createUser(userData);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export async function updateUser(req, res) {
    try {
        const userData = { ...req.body, updatedBy: req.userId || 1 };
        const user = await UserService.updateUser(parseInt(req.params.id), userData);
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export async function deleteUser(req, res) {
    try {
        await UserService.deleteUser(parseInt(req.params.id), req.userId || 1);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
