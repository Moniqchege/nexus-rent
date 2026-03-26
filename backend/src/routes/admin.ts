import { Router, Request, Response } from 'express';
import { db } from '../db/prisma';
import { requireAuth, isAdmin } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth-types';
import { STANDARD_PERMISSIONS, STANDARD_AMENITIES } from '../services/seedData';
import { Prisma } from '@prisma/client';

const router = Router();

// POST /api/admin/seed - Seed amenities & permissions (admin only)
console.log("🔥 /api/admin/seed called");
router.post('/seed', requireAuth, isAdmin, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.userId!;

        const permissionData: Prisma.PermissionCreateManyInput[] =
            STANDARD_PERMISSIONS.map(p => ({
                key: p.key,
                label: p.label,
                category: p.category
            }));

        await db.permission.createMany({
            data: permissionData,
            skipDuplicates: true
        });

        console.log('Available amenities:', STANDARD_AMENITIES);

        const totalPermissions = await db.permission.count();

        res.json({
            message: 'Seed complete',
            amenitiesAvailable: STANDARD_AMENITIES.length,
            permissionsCount: totalPermissions
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        res.status(500).json({ error: 'Seed failed', details: error.message });
    }
});

export default router;
