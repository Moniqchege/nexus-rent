import { Router, Request, Response } from 'express';
import { db } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth-types.js';

const router = Router();

// Fixed contact categories
const CONTACT_CATEGORIES = [
    { id: 1, name: 'Landlord', slug: 'landlord', icon: '👑', description: 'Property owner' },
    { id: 2, name: 'Property Manager', slug: 'property-manager', icon: '🏢', description: 'Manages the property' },
    { id: 3, name: 'Caretaker', slug: 'caretaker', icon: '🔧', description: 'Maintenance and repairs' }
];

// GET /api/contacts/categories - Fixed categories
router.get('/categories', requireAuth, async (req: Request, res: Response) => {
    try {
        res.json({ categories: CONTACT_CATEGORIES });
    } catch (error) {
        console.error('Failed to fetch contact categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/contacts - List contacts for property (filtered by propertyId, tenant's property)
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const { propertyId } = req.query;

        if (!propertyId || isNaN(Number(propertyId))) {
            return res.status(400).json({ error: 'propertyId is required' });
        }

        const parsedPropertyId = Number(propertyId);

        // 1. Landlord
        const landlord = await db.property.findUnique({
            where: { id: parsedPropertyId },
            select: { landlord: { select: { id: true, name: true, phone: true, email: true } } }
        });

        // 2. Property Managers & Caretakers via UserProperty
        const staff = await db.userProperty.findMany({
            where: {
                propertyId: parsedPropertyId,
                role: {
                    name: { in: ['Property Manager', 'Caretaker', 'PROPERTY_MANAGER', 'CARETAKER'] }
                }
            },
            include: {
                user: { select: { id: true, name: true, phone: true, email: true } },
                role: { select: { name: true } }
            },
            orderBy: [{ role: { name: 'asc' } }, { user: { name: 'asc' } }]
        });

        // Combine
        const contacts = [
            ...(landlord?.landlord ? [{
                id: landlord.landlord.id,
                name: landlord.landlord.name,
                phone: landlord.landlord.phone,
                email: landlord.landlord.email,
                type: 'landlord',
                role: 'Landlord'
            }] : []),
            ...staff.map(up => ({
                id: up.user.id,
                name: up.user.name,
                phone: up.user.phone,
                email: up.user.email,
                type: up.role.name.toLowerCase().replace(/\s+/g, '-'),
                role: up.role.name
            }))
        ];

        res.json({ contacts });
    } catch (error) {
        console.error('Failed to fetch contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

export default router;
