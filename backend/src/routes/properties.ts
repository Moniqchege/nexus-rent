import { Router, Request, Response } from 'express';
import { db } from '../db/prisma';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth-types';

import { STANDARD_AMENITIES } from '../services/seedData';

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
  amenities?: string[];
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
  amenities?: string[];
}

// GET /api/properties - List user's properties
router.get('/', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;

    const properties = await db.property.findMany({
      where: {
        OR: [
          { landlordId: userId },
          {
            users: {
              some: {
                userId: userId
              }
            }
          }
        ]
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
        amenities: true,
        createdAt: true,
        users: {
          where: {
            userId
          },
          select: {
            id: true,
            assignedAt: true,
            user: {
              select: {
                id: true,
                name: true,
              }
            },
            role: {
              select: {
                id: true,
                name: true,
                permissions: true,
              }
            }
          }
        }
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

    const {
      title,
      location,
      price,
      beds,
      baths,
      sqft,
      status = 'active',
      image,
      amenities = [],
    } = req.body as CreatePropertyInput;

    if (!title || !location || price == null || beds == null || baths == null || sqft == null) {
      return res.status(400).json({ error: 'Title, location, price, beds, baths, sqft are required' });
    }

    // Validate amenities against enum
    const validAmenities = ["GYM", "SWIMMING_POOL", "YOGA_STUDIO", "STEAM_ROOM", "SAUNA"];
    const sanitizedAmenities = amenities.filter(a => validAmenities.includes(a));

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
        amenities: sanitizedAmenities,
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
        amenities: true,
        createdAt: true,
      },
    });

    res.status(201).json(property);
  } catch (error: any) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// Fetch amenities
router.get('/amenities', requireAuth, async (req, res) => {
  try {
    const amenities = await db.amenity.findMany({
      orderBy: { key: 'asc' },
      select: {
        id: true,
        key: true,
        label: true,
        category: true,
        createdAt: true
      }
    });
    res.json(amenities);
  } catch (error) {
    console.error('Failed to fetch amenities:', error);
    res.status(500).json({ error: 'Failed to fetch amenities' });
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
      where: {
        id: propertyId,
        OR: [
          { landlordId: userId },
          {
            users: {
              some: {
                userId: userId
              }
            }
          }
        ]
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
        amenities: true,
        createdAt: true,
        users: {
          where: { userId },
          select: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: true,
              }
            }
          }
        }
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

    const { amenities, ...rest } = req.body as UpdatePropertyInput;

    // Fetch existing property to ensure ownership
    const existing = await db.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { landlordId: userId },
          { users: { some: { userId } } }
        ]
      }
    });

    if (!existing) return res.status(404).json({ error: 'Property not found or access denied' });

    // Only allow editable fields
    const editableFields: (keyof UpdatePropertyInput)[] = [
      'title', 'location', 'price', 'beds', 'baths', 'sqft', 'status', 'image'
    ];
    let updateData: Partial<UpdatePropertyInput> = {};
    const restAny = rest as Record<string, any>;
    for (const key of editableFields) {
      if (restAny[key] !== undefined) updateData[key] = restAny[key];
    }

    // Handle amenities if provided
    if (amenities) {
      // Fetch all valid amenities from DB
      const validAmenities = await db.amenity.findMany({ select: { key: true } });
      const validKeys = validAmenities.map(a => a.key);

      updateData.amenities = (amenities || []).filter(a => validKeys.includes(a));
    }

    const property = await db.property.update({
      where: { id: propertyId },
      data: updateData,
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
        amenities: true,
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

    // Ensure property belongs to user first (landlord OR attached)
    const existing = await db.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { landlordId: userId },
          {
            users: {
              some: {
                userId: userId
              }
            }
          }
        ]
      }
    });
    if (!existing) return res.status(404).json({ error: 'Property not found or access denied' });

    await db.property.delete({ where: { id: propertyId } });

    res.json({ message: 'Property deleted' });
  } catch (error: any) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

export default router;