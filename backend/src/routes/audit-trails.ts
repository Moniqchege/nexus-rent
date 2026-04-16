import { Router, Request, Response } from 'express';
import { db } from "../db/prisma";
import { requireAuth } from '../middleware/auth';
import { Prisma } from '@prisma/client';

const router = Router();

// ── Reusable helper ──────────────────────────────────────────────
export async function logAuditTrail(params: {
    userId: number;
    action: string;
    title: string;
    status?: 'SUCCESS' | 'FAILED';
    subtitle?: string;
    metadata?: Record<string, unknown>;
}) {
    return db.auditTrail.create({
        data: {
            userId:   params.userId,
            action:   params.action,
            title:    params.title,
            status:   params.status ?? 'SUCCESS',
            subtitle: params.subtitle,
            metadata: params.metadata as Prisma.InputJsonValue ?? Prisma.JsonNull,
        },
    });
}

// ── POST /audit-trails ───────────────────────────────────────────
router.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { action, title, status = 'SUCCESS', subtitle, metadata } = req.body;

        if (!action || typeof action !== 'string') {
            return res.status(400).json({ error: 'action is required' });
        }
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ error: 'title is required' });
        }

        const record = await logAuditTrail({
            userId: Number(userId),
            action,
            title,
            status,
            subtitle,
            metadata,
        });

        res.status(201).json(record);
    } catch (error) {
        console.error('Audit trail write error:', error);
        res.status(500).json({ error: 'Failed to log audit trail' });
    }
});

// ── GET /audit-trails ────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { limit = '10', skip = '0' } = req.query;

        const [auditTrails, count] = await Promise.all([
            db.auditTrail.findMany({
                where: { userId: Number(userId) },
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
                skip: Number(skip),
                include: { user: { select: { name: true } } },
            }),
            db.auditTrail.count({ where: { userId: Number(userId) } }),
        ]);

        res.json({ auditTrails, count });
    } catch (error) {
        console.error('Audit trails error:', error);
        res.status(500).json({ error: 'Failed to fetch audit trails' });
    }
});

export default router;