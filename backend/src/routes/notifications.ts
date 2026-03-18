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

// POST /api/notifications/send - Send message to selected tenants
router.post("/send", async (req, res) => {
  const authReq = req as AuthRequest;
  try {
    const { message, tenantIds } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({ error: "Select at least one tenant" });
    }

    // Verify all tenantIds belong to landlord's properties
    const validTenants = await db.tenant.findMany({
      where: {
        id: { in: tenantIds },
        property: {
          landlordId: authReq.userId!
        }
      }
    });

    if (validTenants.length !== tenantIds.length) {
      return res.status(403).json({ error: "Invalid tenants selected" });
    }

    const notification = await db.notification.create({
      data: {
        message: message.trim(),
        landlordId: authReq.userId!,
        tenantIds // JSON array
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

export default router;

