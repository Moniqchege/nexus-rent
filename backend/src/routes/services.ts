import { Router, Request, Response } from 'express';
import { db } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth-types.js';

const router = Router();

interface CreateServiceProviderInput {
    name: string;
    phone: string;
    email?: string;
    categoryId: number;
    hourlyRate?: number;
    location?: string;
    bio?: string;
    image?: string;
}

interface UpdateServiceProviderInput {
    name?: string;
    phone?: string;
    email?: string;
    categoryId?: number;
    hourlyRate?: number;
    location?: string;
    bio?: string;
    image?: string;
    isActive?: boolean;
}

// GET /api/services/categories - List all service categories
router.get('/categories', requireAuth, async (req: Request, res: Response) => {
    try {
        const categories = await db.serviceCategory.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                description: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json({ categories });
    } catch (error) {
        console.error('Failed to fetch service categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/services/providers - List providers (filter by categoryId, active)
router.get('/providers', requireAuth, async (req: Request, res: Response) => {
    try {
        const { categoryId, active } = req.query;
        const where: any = { isActive: true };
        if (categoryId) where.categoryId = parseInt(categoryId as string);
        if (active !== undefined) where.isActive = active === 'true';

        const providers = await db.serviceProvider.findMany({
            where,
            include: {
                category: {
                    select: { id: true, name: true, slug: true, icon: true },
                },
            },
            orderBy: [{ rating: 'desc' }, { name: 'asc' }],
        });
        res.json({ providers });
    } catch (error) {
        console.error('Failed to fetch service providers:', error);
        res.status(500).json({ error: 'Failed to fetch providers' });
    }
});

// POST /api/services/providers - Create new provider (landlord)
router.post('/providers', requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.userId;

        const {
            name,
            phone,
            email,
            categoryId,
            hourlyRate,
            location,
            bio,
            image,
        } = req.body;

        // ----------------------------
        // Basic validation
        // ----------------------------
        if (!name || !phone || categoryId === undefined || categoryId === null) {
            return res.status(400).json({
                error: 'Name, phone, and categoryId are required',
            });
        }

        // ----------------------------
        // Safe type normalization
        // ----------------------------
        const parsedCategoryId = Number(categoryId);
        if (Number.isNaN(parsedCategoryId)) {
            return res.status(400).json({ error: 'Invalid categoryId' });
        }

        const parsedHourlyRate =
            hourlyRate !== undefined && hourlyRate !== null && hourlyRate !== ''
                ? Number(hourlyRate)
                : null;

        if (
            parsedHourlyRate !== null &&
            Number.isNaN(parsedHourlyRate)
        ) {
            return res.status(400).json({ error: 'Invalid hourlyRate' });
        }

        // ----------------------------
        // Create provider
        // ----------------------------
        const provider = await db.serviceProvider.create({
            data: {
                name: String(name).trim(),
                phone: String(phone).trim(),
                email: email ? String(email).trim() : null,
                categoryId: parsedCategoryId,
                hourlyRate: parsedHourlyRate ?? undefined,
                location: location ? String(location).trim() : null,
                bio: bio ? String(bio).trim() : null,
                image: image ? String(image).trim() : null,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        icon: true,
                    },
                },
            },
        });

        return res.status(201).json(provider);
    } catch (error: any) {
        console.error('Create provider error:', error);
        return res.status(500).json({
            error: 'Failed to create provider',
        });
    }
});

// GET /api/services/providers/:id
router.get('/providers/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const rawId = req.params.id;
        if (Array.isArray(rawId)) {
            return res.status(400).json({ error: 'Invalid provider id' });
        }

        const id = Number(rawId);

        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Provider id must be a number' });
        }

        const provider = await db.serviceProvider.findUnique({
            where: { id },
            include: {
                category: true,
            },
        });

        if (!provider) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        return res.json(provider);
    } catch (error) {
        console.error('Fetch provider error:', error);
        return res.status(500).json({ error: 'Failed to fetch provider' });
    }
});

// PATCH /api/services/providers/:id
router.patch('/providers/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const rawId = req.params.id;
        if (Array.isArray(rawId)) {
            return res.status(400).json({ error: 'Invalid provider id' });
        }
        const id = Number(rawId);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Provider id must be a number' });
        }
        const data = req.body as UpdateServiceProviderInput;
        const provider = await db.serviceProvider.update({
            where: { id },
            data,
            include: {
                category: {
                    select: { id: true, name: true },
                },
            },
        });

        res.json(provider);
    } catch (error: any) {
        console.error('Update provider error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Provider not found' });
        }
        res.status(500).json({ error: 'Failed to update provider' });
    }
});

// DELETE /api/services/providers/:id
router.delete('/providers/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const rawId = req.params.id;
        if (Array.isArray(rawId)) {
            return res.status(400).json({ error: 'Invalid provider id' });
        }

        const id = Number(rawId);

        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Provider id must be a number' });
        }
        await db.serviceProvider.delete({ where: { id } });
        res.json({ message: 'Provider deleted' });
    } catch (error: any) {
        console.error('Delete provider error:', error);
        res.status(500).json({ error: 'Failed to delete provider' });
    }
});

export default router;

