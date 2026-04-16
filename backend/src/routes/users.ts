import { Router, Request, Response } from 'express';
import { db } from "../db/prisma";
import { requireAuth } from '../middleware/auth';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { transporter } from '../services/mailer';
import { upload } from '../middleware/upload';
import path from 'path';

const router = Router();
function generatePassword(length = 10) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  username?: string;
  role: string;
  phone: string;
  plan?: string;
  leaseDocument?: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  plan?: string;
}

// GET /api/users - List users
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { search } = req.query as { search?: string };
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        // role: true,
        phone: true,
        plan: true,
        leaseDocument: true,
        createdAt: true,
        userProperties: {
          select: {
            propertyId: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
            property: {
              select: {
                id: true,
                title: true,
                location: true,
                price: true,
                beds: true,
                baths: true,
                sqft: true,
                status: true,
                amenities: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Create user
router.post(
  '/',
  requireAuth,
  upload.single('leaseDocument'),
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        username,
        phone,
        plan = 'FREE',
        propertyAssignments = []
      } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Name, email, and phone number are required' });
      }

      const parsedAssignments = JSON.parse(propertyAssignments || "[]");

      const existing = await db.user.findFirst({
        where: {
          OR: [
            { email },
            ...(username ? [{ username }] : []),
          ],
        },
      });

      if (existing) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const plainPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      const leaseDocumentPath = req.file
        ? `/uploads/leases/${path.basename(req.file.filename)}`
        : null;

      const user = await db.user.create({
        data: {
          name,
          email,
          username: username || email.split('@')[0],
          password_hash: hashedPassword,
          phone,
          plan,
          leaseDocument: leaseDocumentPath,
          firstLogin: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          phone: true,
          plan: true,
          leaseDocument: true,
          firstLogin: true,
          createdAt: true,
        },
      });

      if (parsedAssignments.length > 0) {
        await db.userProperty.createMany({
          data: parsedAssignments.map((item: any) => ({
            userId: user.id,
            propertyId: item.propertyId,
            roleId: item.roleId,
          })),
          skipDuplicates: true,
        });
      }

      await transporter.sendMail({
        from: `"Nexus Rent" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your Nexus Rent Account',
        html: `
          <h3>Welcome to Nexus Rent</h3>
          <p>Email: ${email}</p>
          <p>Password: ${plainPassword}</p>
          <p><strong>You will be required to change your password on first login.</strong></p>
        `,
      });

      res.status(201).json(user);

    } catch (error: any) {
      console.error('Create user error:', error);
      res.status(500).json({ error: error.message || 'Failed to create user' });
    }
  }
);

// GET /api/users/contacts - Get caretakers & property managers from same properties
router.get('/contacts', requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id; // adjust to match your auth middleware

    // 1️⃣ Get the current user's property IDs
    const currentUserProperties = await db.userProperty.findMany({
      where: { userId: currentUserId },
      select: { propertyId: true },
    });

    const propertyIds = currentUserProperties.map(
      (up: { propertyId: number }) => up.propertyId
    );

    if (propertyIds.length === 0) {
      return res.json([]);
    }

    // 2️⃣ Find users on the same properties with caretaker/manager roles
    const contacts = await db.userProperty.findMany({
      where: {
        propertyId: { in: propertyIds },
        userId: { not: currentUserId }, // exclude self
        role: {
          name: { in: ['Caretaker', 'Property Manager'] },
        },
      },
      select: {
        propertyId: true,
        role: { select: { id: true, name: true } },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
      },
    });

    // 3️⃣ Deduplicate users (a user might share multiple properties with you)
    const seen = new Set<number>();
    const unique = contacts
      .filter(
        ({ user }: { user: { id: number } }) => {
          if (seen.has(user.id)) return false;
          seen.add(user.id);
          return true;
        }
      )
      .map(
  ({
    user,
    role,
    property,
  }: {
    user: { id: number; name: string; email: string; phone: string | null };
    role: { id: number; name: string };
    property: { id: number; title: string; location: string } | null;
  }) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role,
    property, // now allowed to be null
  })
);

    res.json(unique);
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET /api/users/:id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        // role: true,
        phone: true,
        plan: true,
        leaseDocument: true,
        createdAt: true,
        userProperties: {
          select: {
            propertyId: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
            property: {
              select: {
                id: true,
                title: true,
                location: true,
                price: true,
                beds: true,
                baths: true,
                sqft: true,
                status: true,
                amenities: true,
                image: true,
              },
            },
          },
        },
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/users/:id - Update user
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    const { propertyAssignments, ...data } = req.body as any;

    // Block email change if set
    if (data.email) delete data.email;

    // 1️⃣ Update user basic info
    const user = await db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        plan: true,
        createdAt: true,
      },
    });

    // 2️⃣ Update property assignments
    if (propertyAssignments && Array.isArray(propertyAssignments)) {
      // Remove old assignments first
      await db.userProperty.deleteMany({ where: { userId } });

      // Add new ones
      await db.userProperty.createMany({
        data: propertyAssignments.map((pa: any) => ({
          userId,
          propertyId: pa.propertyId,
          roleId: pa.roleId,
        })),
        skipDuplicates: true,
      });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Update user error:', error); // log full error for debugging
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
});

// DELETE /api/users/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(Array.isArray(id) ? id[0] : id, 10);
    await db.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
});

export default router;
