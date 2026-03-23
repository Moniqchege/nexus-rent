import { Router, Request, Response } from 'express';
import { db } from '../db/prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth-types';

const router = Router();

interface CreatePropertyInput {
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status?: string;
  image?: string;
}

interface UpdatePropertyInput {
  title?: string;
  location?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  status?: string;
  image?: string;
}

// GET /api/properties - List user's properties
router.get('/', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;

    const properties = await db.property.findMany({
      where: { landlordId: userId },
      select: {
        id: true,
        title: true,
        location: true,
        price: true,
        beds: true,
        baths: true,
        sqft: true,
        status: true,
        image: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(properties);
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// POST /api/properties - Create property
router.post('/', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;

    const { title, location, price, beds, baths, sqft, status = 'active', image } = req.body as CreatePropertyInput;

    if (!title || !location || price == null || beds == null || baths == null || sqft == null) {
      return res.status(400).json({ error: 'Title, location, price, beds, baths, sqft are required' });
    }

    const property = await db.property.create({
      data: {
        title,
        location,
        price,
        beds,
        baths,
        sqft,
        status,
        image,
        landlordId: userId,
      },
      select: {
        id: true,
        title: true,
        location: true,
        price: true,
        beds: true,
        baths: true,
        sqft: true,
        status: true,
        image: true,
        createdAt: true,
      },
    });

    res.status(201).json(property);
  } catch (error: any) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// GET /api/properties/:id - Get single property
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    const idParam = req.params.id;
const propertyId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);

    const property = await db.property.findFirst({
      where: { id: propertyId, landlordId: userId },
      select: {
        id: true,
        title: true,
        location: true,
        price: true,
        beds: true,
        baths: true,
        sqft: true,
        status: true,
        image: true,
        createdAt: true,
      },
    });

    if (!property) return res.status(404).json({ error: 'Property not found or access denied' });

    res.json(property);
  } catch (error) {
    console.error('Fetch property error:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// PATCH /api/properties/:id - Update property
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    const idParam = req.params.id;
const propertyId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);
    const data = req.body as UpdatePropertyInput;

    // Ensure property belongs to user first
    const existing = await db.property.findFirst({ where: { id: propertyId, landlordId: userId } });
    if (!existing) return res.status(404).json({ error: 'Property not found or access denied' });

    const property = await db.property.update({
      where: { id: propertyId },
      data,
      select: {
        id: true,
        title: true,
        location: true,
        price: true,
        beds: true,
        baths: true,
        sqft: true,
        status: true,
        image: true,
        createdAt: true,
      },
    });

    res.json(property);
  } catch (error: any) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// DELETE /api/properties/:id - Delete property
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    const idParam = req.params.id;
const propertyId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);

    // Ensure property belongs to user first
    const existing = await db.property.findFirst({ where: { id: propertyId, landlordId: userId } });
    if (!existing) return res.status(404).json({ error: 'Property not found or access denied' });

    await db.property.delete({ where: { id: propertyId } });

    res.json({ message: 'Property deleted' });
  } catch (error: any) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

export default router;