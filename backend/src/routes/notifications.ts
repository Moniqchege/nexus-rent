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
          landlordId: authReq.userId!,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
      orderBy: {
        createdAt: "desc",
      },
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
    const tenants = await db.user.findMany({
      where: {
        userProperties: {
          some: {
            role: {
              name: "Tenant",
            },
            property: {
              landlordId: authReq.userId!,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        userProperties: {
          select: {
            property: {
              select: {
                id: true,
                title: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
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

    const users = await db.user.findMany({
      where: {
        id: { not: authReq.userId! },
        ...(propertyIdNum && {
          userProperties: {
            some: {
              propertyId: propertyIdNum,
            },
          },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        userProperties: {
          select: {
            property: {
              select: {
                id: true,
                title: true,
                floor: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/notifications/send - Send message to selected users
router.post("/send", async (req, res) => {

  // POST /api/notifications/surveys/send - Send survey to selected users
  router.post("/surveys/send", async (req, res) => {
    const authReq = req as AuthRequest;
    try {
      const { title, questions, userIds } = req.body;

      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: "Title is required" });
      }
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "Questions array is required" });
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

      const survey = await db.survey.create({
        data: {
          title: title.trim(),
          questions,
          landlordId: authReq.userId!,
          recipientIds: userIds.map(id => String(id))
        }
      });

      res.status(201).json({
        message: "Survey sent successfully",
        surveyId: survey.id
      });
    } catch (error) {
      console.error("Send survey error:", error);
      res.status(500).json({ error: "Failed to send survey" });
    }
  });
  const authReq = req as AuthRequest;
  try {
    const { title, message, userIds } = req.body;

    if (!title || title.trim().length === 0) {
  return res.status(400).json({ error: "Title is required" });
}

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
        title: title.trim(),
        message: message.trim(),
        landlordId: authReq.userId!,
        recipientIds: userIds.map(id => String(id)) 
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

  // GET /api/notifications/surveys/sent - Get landlord's sent surveys
  router.get("/surveys/sent", async (req, res) => {
    const authReq = req as AuthRequest;
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const surveys = await db.survey.findMany({
        where: { landlordId: authReq.userId! },
        select: {
          id: true,
          title: true,
          recipientIds: true,
          sentAt: true
        },
        orderBy: { sentAt: "desc" },
        take: Number(limit),
        skip
      });

      const surveysWithCount = surveys.map(s => ({
        ...s,
        recipientCount: Array.isArray(s.recipientIds) ? s.recipientIds.length : 0,
        responseCount: 0 // TODO: add subquery if needed
      }));

      const total = await db.survey.count({
        where: { landlordId: authReq.userId! }
      });

      res.json({
        surveys: surveysWithCount,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error("Sent surveys error:", error);
      res.status(500).json({ error: "Failed to fetch sent surveys" });
    }
  });
  const authReq = req as AuthRequest;
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch notifications
    const notifications = await db.notification.findMany({
      where: { landlordId: authReq.userId! },
      select: {
        id: true,
        title: true,
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

    const allNotifications = await db.notification.findMany({
      orderBy: { sentAt: 'desc' }
    });

    const userId = authReq.userId!.toString();

    let notifications = allNotifications.filter(n => {
      const ids = n.recipientIds as string[];
      return ids.includes(userId);
    });

    if (unread === 'true') {
      notifications = notifications.filter(n => !n.isRead);
    }

    res.json({ notifications }); 
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

// GET /api/notifications/:id
router.get("/:id", async (req, res) => {
  const authReq = req as AuthRequest;
  const notificationId = Number(req.params.id);
 
  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        title: true,
        message: true,
        recipientIds: true,
        isRead: true,
        sentAt: true,
        landlordId: true,
      },
    });
 
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
 
    if (notification.landlordId !== authReq.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
 
    const recipientIds = Array.isArray(notification.recipientIds)
      ? notification.recipientIds
      : [];
    const recipientCount = recipientIds.length;
    const deliveryRate = recipientCount > 0 ? 100 : 0;
    const readReceipts = recipientCount > 0 ? Math.floor(recipientCount * 0.5) : 0;
 
    res.json({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      sentAt: notification.sentAt,
      recipientIds,
      recipientCount,
      deliveryRate,
      readReceipts,
      isRead: notification.isRead,
    });
  } catch (error) {
    console.error("Get notification error:", error);
    res.status(500).json({ error: "Failed to fetch notification" });
  }
});

// GET /api/notifications/:id/recipients
router.get("/:id/recipients", async (req, res) => {
  const authReq = req as AuthRequest;
  const notificationId = Number(req.params.id);
 
  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: {
        recipientIds: true,
        landlordId: true,
      },
    });
 
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
 
    if (notification.landlordId !== authReq.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
 
    const recipientIds = Array.isArray(notification.recipientIds)
      ? notification.recipientIds.map((id) => Number(id))
      : [];
 
    const recipients = await db.user.findMany({
      where: {
        id: { in: recipientIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        userProperties: {
          select: {
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          take: 1, 
        },
      },
    });
 
    const recipientsWithStatus = recipients.map((user) => ({
      id: String(user.id),
      name: user.name,
      email: user.email,
      unit: user.userProperties?.[0]?.property?.title || undefined,
      building: undefined, 
      hasRead: false,
    }));
 
    res.json({ recipients: recipientsWithStatus });
  } catch (error) {
    console.error("Get recipients error:", error);
    res.status(500).json({ error: "Failed to fetch recipients" });
  }
});

// DELETE /api/notifications/:id 
router.delete("/:id", async (req, res) => {
  const authReq = req as AuthRequest;
  const notificationId = Number(req.params.id);
 
  try {
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: {
        landlordId: true,
      },
    });
 
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
 
    if (notification.landlordId !== authReq.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
 
    await db.notification.delete({
      where: { id: notificationId },
    });
 
    res.json({
      message: "Notification deleted successfully",
      notificationId,
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;

