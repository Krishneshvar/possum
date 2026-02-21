/**
 * User Controller
 */
import { Request, Response } from 'express';
import * as UserService from './user.service.js';

function getStatusCode(error: unknown, fallback = 500): number {
    const message = error instanceof Error ? error.message : '';
    const lower = message.toLowerCase();

    if (lower.includes('not found')) return 404;
    if (lower.includes('unauthorized')) return 401;
    if (lower.includes('forbidden') || lower.includes('cannot delete your own')) return 403;
    if (lower.includes('already') || lower.includes('failed') || lower.includes('invalid') || lower.includes('constraint')) return 400;

    return fallback;
}

export async function getUsers(req: Request, res: Response) {
    try {
        const { searchTerm, currentPage, itemsPerPage, sortBy, sortOrder } = req.query;
        const result = await UserService.getUsers({
            searchTerm: searchTerm as string,
            currentPage: Number(currentPage),
            itemsPerPage: Number(itemsPerPage),
            sortBy: sortBy as string,
            sortOrder: sortOrder as 'ASC' | 'DESC'
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
        res.status(getStatusCode(error, 404)).json({ error: error.message });
    }
}

export async function createUser(req: Request, res: Response) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const userData = { ...req.body, createdBy: req.user.id };
        const user = await UserService.createUser(userData);
        res.status(201).json(user);
    } catch (error: any) {
        res.status(getStatusCode(error, 400)).json({ error: error.message });
    }
}

export async function updateUser(req: Request, res: Response) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        const userData = { ...req.body, updatedBy: req.user.id };
        const user = await UserService.updateUser(Number(req.params.id), userData);
        res.json(user);
    } catch (error: any) {
        res.status(getStatusCode(error, 400)).json({ error: error.message });
    }
}

export async function deleteUser(req: Request, res: Response) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        await UserService.deleteUser(Number(req.params.id), req.user.id);
        res.status(204).send();
    } catch (error: any) {
        res.status(getStatusCode(error, 500)).json({ error: error.message });
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

export async function getUserRoles(req: Request, res: Response) {
    try {
        const roles = await UserService.getUserRoles(Number(req.params.id));
        res.json(roles);
    } catch (error: any) {
        res.status(getStatusCode(error, 404)).json({ error: error.message });
    }
}

export async function updateUserRoles(req: Request, res: Response) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        await UserService.updateUserRoles(Number(req.params.id), req.body.roleIds);
        res.json({ success: true });
    } catch (error: any) {
        res.status(getStatusCode(error, 400)).json({ error: error.message });
    }
}

export async function getUserPermissions(req: Request, res: Response) {
    try {
        const permissions = await UserService.getUserPermissionOverrides(Number(req.params.id));
        res.json(permissions);
    } catch (error: any) {
        res.status(getStatusCode(error, 404)).json({ error: error.message });
    }
}

export async function updateUserPermissions(req: Request, res: Response) {
    try {
        if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized: No user session' });
        await UserService.updateUserPermissions(Number(req.params.id), req.body.permissions);
        res.json({ success: true });
    } catch (error: any) {
        res.status(getStatusCode(error, 400)).json({ error: error.message });
    }
}
