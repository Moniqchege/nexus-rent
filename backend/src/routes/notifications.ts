import { Router, Response } from "express";
import { db } from "../db/prisma";
import type { AuthRequest } from "../middleware/auth-types";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// GET /api/notifications/reviews - Get all reviews for landlord's properties
router.get("/reviews", async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const reviews = await db.review.findMany({
      where: {
        property: {
          landlordId: authReq.userId!
        }
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            location: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    res.json(reviews);
  } catch (error) {
    console.error("Reviews error:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// GET /api/notifications/tenants - Get all tenants of landlord's properties
router.get("/tenants", async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const tenants = await db.tenant.findMany({
      where: {
        property: {
          landlordId: authReq.userId!
        }
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });
    res.json(tenants);
  } catch (error) {
    console.error("Tenants error:", error);
    res.status(500).json({ error: "Failed to fetch tenants" });
  }
});

// GET /api/notifications/users - Get users for notifications (filter by propertyId, floor)
router.get("/users", async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { propertyId, floor } = req.query;
    const propertyIdNum = propertyId ? Number(propertyId) : undefined;

    const whereClause: any = {
      id: { not: authReq.userId! }
    };
    if (propertyIdNum) {
      whereClause.userProperties = {
        some: {
          propertyId: propertyIdNum
        },
      };
    }

    if (floor) {
      whereClause.userProperties = {
        some: {
          property: {
            floor
          }
        }
      };
    }

    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userProperties: {
          select: {
            property: {
              select: {
                id: true,
                title: true,
                floor: true
              }
            }
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });
    res.json(users);
  } catch (error) {
    console.error("Users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/notifications/send - Send message to selected users
router.post("/send", async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { message, userIds } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "Select at least one user" });
    }

    // Verify all userIds exist
    const validUsers = await db.user.findMany({
      where: {
        id: { in: userIds }
      }
    });

    if (validUsers.length !== userIds.length) {
      return res.status(403).json({ error: "Invalid users selected" });
    }

    const notification = await db.notification.create({
      data: {
        message: message.trim(),
        landlordId: authReq.userId!,
        recipientIds: userIds.map(id => String(id)) // JSON array
      }
    });

    res.status(201).json({
      message: "Notification sent successfully",
      notificationId: notification.id
    });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// GET /api/notifications/sent - Get landlord's sent notifications
router.get("/sent", async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch notifications
    const notifications = await db.notification.findMany({
      where: { landlordId: authReq.userId! },
      select: {
        id: true,
        message: true,
        recipientIds: true,
        isRead: true,
        sentAt: true
      },
      orderBy: { sentAt: "desc" },
      take: Number(limit),
      skip
    });

    // Add recipientCount manually
    const notificationsWithCount = notifications.map(n => ({
      ...n,
      recipientCount: Array.isArray(n.recipientIds) ? n.recipientIds.length : 0
    }));

    const total = await db.notification.count({
      where: { landlordId: authReq.userId! }
    });

    res.json({
      notifications: notificationsWithCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error("Sent notifications error:", error);
    res.status(500).json({ error: "Failed to fetch sent notifications" });
  }
});

// GET /api/notifications - Get user notifications
router.get("/", async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { unread } = req.query;
    const where: any = {
      recipientIds: {
        path: ['$.*'],
        array_contains: authReq.userId!.toString()
      }
    };
    if (unread === 'true') {
      where.isRead = false;
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: {
        sentAt: 'desc'
      }
    });

    res.json(notifications);
  } catch (error) {
    console.error("Notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch("/:id/read", async (req, res) => {
  const authReq = req as AuthRequest;
  const notificationId = Number(req.params.id);

  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Verify recipient has access
    const recipientIds = notification.recipientIds as any[];
    if (!recipientIds.some(id => Number(id) === authReq.userId!)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updated = await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json(updated);
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

export default router;

