/**
 * User Controller
 */
import { Request, Response } from 'express';
import * as UserService from './user.service.js';

export async function getUsers(req: Request, res: Response) {
    try {
        const { searchTerm, currentPage, itemsPerPage } = req.query;
        const result = await UserService.getUsers({
            searchTerm: searchTerm as string,
            currentPage: Number(currentPage) || 1,
            itemsPerPage: Number(itemsPerPage) || 10
        });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getUserById(req: Request, res: Response) {
    try {
        const user = await UserService.getUserById(Number(req.params.id));
        res.json(user);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
}

export async function createUser(req: Request, res: Response) {
    try {
        const userData = { ...req.body, createdBy: req.user?.id || 1 };
        const user = await UserService.createUser(userData);
        res.status(201).json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function updateUser(req: Request, res: Response) {
    try {
        const userData = { ...req.body, updatedBy: req.user?.id || 1 };
        const user = await UserService.updateUser(Number(req.params.id), userData);
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function deleteUser(req: Request, res: Response) {
    try {
        await UserService.deleteUser(Number(req.params.id), req.user?.id || 1);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getRoles(req: Request, res: Response) {
    try {
        const roles = await UserService.getRoles();
        res.json(roles);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export async function getPermissions(req: Request, res: Response) {
    try {
        const permissions = await UserService.getPermissions();
        res.json(permissions);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
