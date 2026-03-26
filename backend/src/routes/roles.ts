import { Router, Request, Response, NextFunction } from 'express';
import { db } from "../db/prisma";
import { requireAuth } from '../middleware/auth';

const router = Router();

interface CreateRoleInput {
  name: string;
  code?: string;
  description?: string;
  permissions: string[];
}


interface UpdateRoleInput {
  name?: string;
  code?: string;
  description?: string;
  permissions?: string[];
}

// GET /api/roles - List roles
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { search } = req.query as { search?: string };
    const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
    
    const roles = await db.role.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(roles);
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// POST /api/roles - Create role
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, code, description, permissions } = req.body as CreateRoleInput;
    
    if (!name || !permissions) {
      return res.status(400).json({ error: 'Name and permissions required' });
    }

    const role = await db.role.create({
      data: {
        name,
        code,
        description,
        permissions,
      },
    });
    res.status(201).json(role);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Role name must be unique' });
    } else {
      res.status(500).json({ error: 'Failed to create role' });
    }
  }
});

// GET /api/roles/:id - Get single role
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    const role = await db.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// PATCH /api/roles/:id - Update role
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    const data = req.body as UpdateRoleInput;

    const role = await db.role.update({
      where: { id: roleId },
      data,
    });
    res.json(role);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Role not found' });
    } else {
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
});

// DELETE /api/roles/:id - Delete role
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roleId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    await db.role.delete({ where: { id: roleId } });
    res.json({ message: 'Role deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Role not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete role' });
    }
  }
});

// Fetch Permissions
router.get('/permissions', requireAuth, async (req, res) => {
  try {
    const permissions = await db.permission.findMany({
      orderBy: { key: 'asc' },
      select: {
        id: true,
        key: true,
        label: true,
        category: true,
        createdAt: true
      }
    });
    res.json(permissions);
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

export default router;

