import { Router, Request, Response } from 'express';
import { db } from "../db/prisma";
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth-types';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { transporter } from '../services/mailer';
import { upload, uploadAvatar } from '../middleware/upload';
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

// GET /api/users/stats - User statistics
router.get('/stats', requireAuth, async (_req: Request, res: Response) => {
  try {
    const totalUsers = await db.user.count();
    const lockedUsers = await db.user.count({ where: { isLocked: true } });
    const activeUsers = totalUsers - lockedUsers;

    res.json({ totalUsers, activeUsers, lockedUsers });
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

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
        isLocked: true,
        createdAt: true,
        userProperties: {
          select: {
            propertyId: true,
            floor: true,
            unit: true,
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
                floors: true,
                status: true,
                amenities: true,
                image: true,
                unitTypes: true,
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
          isLocked: true,
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
            ...(item.floor && { floor: item.floor }),
            ...(item.unit && { unit: item.unit }),
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

// Lock / Unlock User Account
router.post('/:id/lock', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const { locked } = req.body as { locked?: boolean };

    if (typeof locked !== 'boolean') {
      return res.status(400).json({ error: '`locked` (boolean) is required in the request body' });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await db.user.update({
      where: { id: userId },
      data: { isLocked: locked },
      select: { id: true, name: true, email: true, isLocked: true },
    });

    if (locked) {
      await db.session.deleteMany({ where: { user_id: userId } });
    }

    res.json({
      message: locked ? 'User account locked' : 'User account unlocked',
      user: updated,
    });
  } catch (error) {
    console.error('Lock account error:', error);
    res.status(500).json({ error: 'Failed to update account lock state' });
  }
});

// Reset User Password
router.post('/:id/reset-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    await db.user.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
        firstLogin: true,
      },
    });

    await db.session.deleteMany({ where: { user_id: userId } });

    await transporter.sendMail({
      from: `"Nexus Rent" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Your Nexus Rent Password Has Been Reset',
      html: `
        <h3>Password Reset</h3>
        <p>Hi ${user.name},</p>
        <p>An administrator has reset your password.</p>
        <p><strong>New Password:</strong> ${plainPassword}</p>
        <p>You will be required to change your password on next login.</p>
      `,
    });

    res.json({ message: `Password reset and emailed to ${user.email}` });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset user password' });
  }
});

// GET /api/users/contacts - Get caretakers & property managers from same properties
router.get('/contacts', requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
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

    const contacts = await db.userProperty.findMany({
      where: {
        propertyId: { in: propertyIds },
        userId: { not: currentUserId }, // exclude self
        role: {
          name: { notIn: ['Tenant', 'tenant', 'TENANT'] },
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
          property,
        })
      );

    res.json(unique);
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// POST /api/users/me/change-password
router.post('/me/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password_hash: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.user.update({ where: { id: userId }, data: { password_hash: newHash } });

    return res.status(200).json({ message: 'Password updated' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/users/me/profile-stats
router.get('/me/profile-stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;

    const [leaseTenants, allSchedules, nextSchedule, userProperty] = await Promise.all([
      // Query A – lease tenants with nested lease + unitType
      db.leaseTenant.findMany({
        where: { tenantId: userId },
        include: {
          lease: {
            select: {
              id: true,
              rentAmount: true,
              startDate: true,
              endDate: true,
              status: true,
              billingCycle: true,
              unitType: { select: { type: true, baths: true, price: true } },
            },
          },
        },
      }),
      // Query B – all rent schedules (partitioned in memory)
      db.rentSchedule.findMany({
        where: { tenantId: userId },
        select: { status: true, dueDate: true },
      }),
      // Query C – next upcoming/overdue schedule
      db.rentSchedule.findFirst({
        where: { tenantId: userId, status: { in: ['scheduled', 'overdue'] } },
        orderBy: { dueDate: 'asc' },
        select: { dueDate: true },
      }),
      // Query D – userProperty for floor/unit
      db.userProperty.findFirst({
        where: { userId },
        select: { floor: true, unit: true },
      }),
    ]);

    // --- tenancyDuration ---
    const eligibleLeases = leaseTenants
      .filter(lt => ['active', 'ended'].includes(lt.lease.status))
      .map(lt => lt.lease);
    const earliest = eligibleLeases.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )[0];
    const months = earliest
      ? Math.floor((Date.now() - new Date(earliest.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
      : null;
    const tenancyDuration =
      months === null ? '—' : months >= 12 ? `${Math.floor(months / 12)} yr(s)` : `${months} mo`;

    // --- onTimeRate ---
    const now = new Date();
    const pastDue = allSchedules.filter(s => new Date(s.dueDate) <= now);
    const paidCount = pastDue.filter(s => s.status === 'paid').length;
    const pastDueTotal = pastDue.length;
    const onTimeRate = pastDueTotal === 0
      ? 100.0
      : Math.round((paidCount / pastDueTotal) * 1000) / 10;

    // --- score ---
    const overdueCount = allSchedules.filter(s => s.status === 'overdue').length;
    const totalScheduleCount = allSchedules.length;
    const penalty = (overdueCount / Math.max(totalScheduleCount, 1)) * 10;
    const score = Math.max(0, Math.min(100, Math.floor(onTimeRate - penalty)));

    // --- activeLease ---
    const activeLease = leaseTenants
      .map(lt => lt.lease)
      .filter(l => l.status === 'active')
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0] ?? null;

    res.json({
      tenancyDuration,
      onTimeRate,
      score,
      activeLease,
      nextDueDate: nextSchedule?.dueDate ?? null,
      floor: userProperty?.floor ?? null,
      unit: userProperty?.unit ?? null,
    });
  } catch (error) {
    console.error('Failed to fetch profile stats:', error);
    res.status(500).json({ error: 'Failed to fetch profile stats' });
  }
});

// POST /api/users/me/avatar — upload / replace profile picture
router.post('/me/avatar', requireAuth, uploadAvatar.single('avatar'), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId!;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageUrl = `/uploads/avatars/${path.basename(req.file.filename)}`;

    const updated = await db.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: { id: true, name: true, email: true, username: true, phone: true, plan: true, image: true, leaseDocument: true },
    });

    res.json({ image: updated.image, user: updated });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
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
        isLocked: true,
        createdAt: true,
        userProperties: {
          select: {
            propertyId: true,
            floor: true,
            unit: true,
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
                floors: true,
                status: true,
                amenities: true,
                image: true,
                unitTypes: true,
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
    if (data.email) delete data.email;
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
        leaseDocument: true,
        isLocked: true,
        createdAt: true,
      },
    });

    if (propertyAssignments && Array.isArray(propertyAssignments)) {
      await db.userProperty.deleteMany({ where: { userId } });

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
    console.error('Update user error:', error);
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

// Kill User Sessions
router.delete('/:id/sessions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { count } = await db.session.deleteMany({ where: { user_id: userId } });

    res.json({ message: `Terminated ${count} session(s) for user ${userId}` });
  } catch (error) {
    console.error('Kill sessions error:', error);
    res.status(500).json({ error: 'Failed to kill user sessions' });
  }
});

export default router;
