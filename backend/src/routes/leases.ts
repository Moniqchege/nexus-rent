import { Router, Request, Response } from "express";
import { db } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { AuthRequest } from "../middleware/auth-types.js";
import { upload } from "../middleware/upload.js";
import path from "path";

const router = Router();

// Valid enums
const VALID_BILLING_CYCLES = ["monthly", "weekly"];
const VALID_STATUSES = ["active", "ended", "suspended"];

// GET /api/leases - List leases for authenticated landlord
router.get("/", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.userId;

        const leases = await db.lease.findMany({
            where: {
                property: {
                    landlordId: userId,
                },
            },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({ leases });
    } catch (error) {
        console.error("Failed to fetch leases:", error);
        res.status(500).json({ error: "Failed to fetch leases" });
    }
});

// POST /api/leases - Create lease
router.post("/", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.userId;

        const {
            propertyId,
            tenantId,
            startDate,
            endDate,
            rentAmount,
            billingCycle = "monthly",
            status = "active",
            lateFeePercent = 0,
            graceDays = 0,
        } = req.body;

        if (!propertyId || !tenantId || !startDate || !endDate || rentAmount == null) {
            return res.status(400).json({
                error: "propertyId, tenantId, startDate, endDate, and rentAmount are required",
            });
        }

        const propertyIdNum = Number(propertyId);
        const tenantIdNum = Number(tenantId);

        // Verify property belongs to user
        const property = await db.property.findFirst({
            where: { id: propertyIdNum, landlordId: userId },
        });
        if (!property) {
            return res.status(404).json({ error: "Property not found or access denied" });
        }

        // Verify tenant belongs to property
        const tenant = await db.user.findFirst({
            where: {
                id: tenantIdNum,
                userProperties: {
                    some: {
                        propertyId: propertyIdNum,
                        role: {
                            name: "Tenant",
                        },
                    },
                },
            },
        });
        if (!tenant) {
            return res.status(404).json({ error: "Tenant not found for this property" });
        }

        const normalizedBillingCycle = VALID_BILLING_CYCLES.includes(billingCycle)
            ? billingCycle
            : "monthly";
        const normalizedStatus = VALID_STATUSES.includes(status) ? status : "active";

        const lease = await db.lease.create({
            data: {
                propertyId: propertyIdNum,
                tenantId: tenantIdNum,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                rentAmount: Number(rentAmount),
                billingCycle: normalizedBillingCycle,
                status: normalizedStatus,
                lateFeePercent: Number(lateFeePercent) || 0,
                graceDays: Number(graceDays) || 0,
            },
            include: {
                property: { select: { id: true, title: true, location: true } },
                tenant: { select: { id: true, name: true, email: true, phone: true } },
            },
        });

        res.status(201).json({ lease });
    } catch (error: any) {
        console.error("Create lease error:", error);
        res.status(500).json({ error: error.message || "Failed to create lease" });
    }
});

// GET /api/leases/:id - Get single lease
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.userId;
        const leaseId = Number(req.params.id);

        const lease = await db.lease.findFirst({
            where: {
                id: leaseId,
                property: { landlordId: userId },
            },
            include: {
                property: { select: { id: true, title: true, location: true } },
                tenant: { select: { id: true, name: true, email: true, phone: true } },
            },
        });

        if (!lease) {
            return res.status(404).json({ error: "Lease not found or access denied" });
        }

        res.json({ lease });
    } catch (error) {
        console.error("Fetch lease error:", error);
        res.status(500).json({ error: "Failed to fetch lease" });
    }
});

// PATCH /api/leases/:id - Update lease
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.userId;
        const leaseId = Number(req.params.id);

        const existing = await db.lease.findFirst({
            where: {
                id: leaseId,
                property: { landlordId: userId },
            },
        });
        if (!existing) {
            return res.status(404).json({ error: "Lease not found or access denied" });
        }

        const editableFields = [
            "startDate",
            "endDate",
            "rentAmount",
            "billingCycle",
            "status",
            "lateFeePercent",
            "graceDays",
        ];

        const updateData: any = {};
        for (const key of editableFields) {
            if (req.body[key] !== undefined) {
                if (["startDate", "endDate"].includes(key)) {
                    updateData[key] = new Date(req.body[key]);
                } else if (["rentAmount", "lateFeePercent", "graceDays"].includes(key)) {
                    updateData[key] = Number(req.body[key]);
                } else if (key === "billingCycle" && VALID_BILLING_CYCLES.includes(req.body[key])) {
                    updateData[key] = req.body[key];
                } else if (key === "status" && VALID_STATUSES.includes(req.body[key])) {
                    updateData[key] = req.body[key];
                } else {
                    updateData[key] = req.body[key];
                }
            }
        }

        const lease = await db.lease.update({
            where: { id: leaseId },
            data: updateData,
            include: {
                property: { select: { id: true, title: true, location: true } },
                tenant: { select: { id: true, name: true, email: true, phone: true } },
            },
        });

        res.json({ lease });
    } catch (error: any) {
        console.error("Update lease error:", error);
        res.status(500).json({ error: error.message || "Failed to update lease" });
    }
});

// DELETE /api/leases/:id - Delete lease
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.userId;
        const leaseId = Number(req.params.id);

        const existing = await db.lease.findFirst({
            where: {
                id: leaseId,
                property: { landlordId: userId },
            },
        });
        if (!existing) {
            return res.status(404).json({ error: "Lease not found or access denied" });
        }

        await db.lease.delete({ where: { id: leaseId } });
        res.json({ message: "Lease deleted" });
    } catch (error: any) {
        console.error("Delete lease error:", error);
        res.status(500).json({ error: error.message || "Failed to delete lease" });
    }
});

// POST /api/leases/:id/sign - Upload signed lease document
router.post(
    "/:id/sign",
    requireAuth,
    upload.single("signedDocument"),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.userId;
            const leaseId = Number(req.params.id);

            const existing = await db.lease.findFirst({
                where: {
                    id: leaseId,
                    property: { landlordId: userId },
                },
            });
            if (!existing) {
                return res.status(404).json({ error: "Lease not found or access denied" });
            }

            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            const filePath = `/uploads/leases/${path.basename(req.file.filename)}`;

            const lease = await db.lease.update({
                where: { id: leaseId },
                data: { signedDocumentUrl: filePath },
                include: {
                    property: { select: { id: true, title: true, location: true } },
                    tenant: { select: { id: true, name: true, email: true, phone: true } },
                },
            });

            res.json({ lease });
        } catch (error: any) {
            console.error("Upload signed lease error:", error);
            res.status(500).json({ error: error.message || "Failed to upload signed lease" });
        }
    }
);

export default router;

