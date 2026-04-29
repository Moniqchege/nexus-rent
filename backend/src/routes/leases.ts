import { Router, Request, Response } from "express";
import { db } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { AuthRequest } from "../middleware/auth-types.js";
import { upload } from "../middleware/upload.js";
import path from "path";
import { generateScheduleForLease } from "../services/paymentService.js";

const router = Router();
const VALID_BILLING_CYCLES = ["monthly", "weekly"];
const VALID_STATUSES = ["active", "ended", "suspended"];

// Reusable include for all lease queries
const leaseInclude = {
    property: { select: { id: true, title: true, location: true } },
    tenants: {
        include: {
            tenant: { select: { id: true, name: true, email: true, phone: true } },
        },
    },
};

// GET /api/leases
router.get("/", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const leases = await db.lease.findMany({
            where: { property: { landlordId: authReq.userId } },
            include: leaseInclude,
            orderBy: { createdAt: "desc" },
        });
        res.json({ leases });
    } catch (error) {
        console.error("Failed to fetch leases:", error);
        res.status(500).json({ error: "Failed to fetch leases" });
    }
});

// POST /api/leases
router.post("/", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.userId;
        const {
            propertyId, tenantIds, startDate, endDate, rentAmount,
            billingCycle = "monthly", status = "active",
            lateFeePercent = 0, graceDays = 0,
        } = req.body;

        if (!propertyId || !tenantIds?.length || !startDate || !endDate || rentAmount == null) {
            return res.status(400).json({
                error: "propertyId, tenantIds, startDate, endDate, and rentAmount are required",
            });
        }

        const propertyIdNum = Number(propertyId);
        const tenantIdNums: number[] = tenantIds.map(Number);

        const property = await db.property.findFirst({
            where: { id: propertyIdNum, landlordId: userId },
        });
        if (!property) return res.status(404).json({ error: "Property not found or access denied" });

        const validTenants = await db.user.findMany({
            where: {
                id: { in: tenantIdNums },
                userProperties: {
                    some: { propertyId: propertyIdNum, role: { name: "Tenant" } },
                },
            },
        });
        if (validTenants.length !== tenantIdNums.length) {
            return res.status(404).json({ error: "One or more tenants not found for this property" });
        }

        const lease = await db.lease.create({
            data: {
                propertyId: propertyIdNum,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                rentAmount: Number(rentAmount),
                billingCycle: VALID_BILLING_CYCLES.includes(billingCycle) ? billingCycle : "monthly",
                status: VALID_STATUSES.includes(status) ? status : "active",
                lateFeePercent: Number(lateFeePercent) || 0,
                graceDays: Number(graceDays) || 0,
                tenants: {
                    create: tenantIdNums.map((tenantId) => ({ tenantId })),
                },
            },
            include: leaseInclude,
        });

        await generateScheduleForLease(lease.id);
        res.status(201).json({ lease });
    } catch (error: any) {
        console.error("Create lease error:", error);
        res.status(500).json({ error: error.message || "Failed to create lease" });
    }
});

// GET /api/leases/:id
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const leaseId = Number(req.params.id);

        const lease = await db.lease.findFirst({
            where: { id: leaseId, property: { landlordId: authReq.userId } },
            include: leaseInclude,
        });
        if (!lease) return res.status(404).json({ error: "Lease not found or access denied" });

        res.json({ lease });
    } catch (error) {
        console.error("Fetch lease error:", error);
        res.status(500).json({ error: "Failed to fetch lease" });
    }
});

// PATCH /api/leases/:id
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const leaseId = Number(req.params.id);

        const existing = await db.lease.findFirst({
            where: { id: leaseId, property: { landlordId: authReq.userId } },
        });
        if (!existing) return res.status(404).json({ error: "Lease not found or access denied" });

        const editableFields = ["startDate", "endDate", "rentAmount", "billingCycle", "status", "lateFeePercent", "graceDays"];
        const updateData: any = {};

        for (const key of editableFields) {
            if (req.body[key] === undefined) continue;
            if (["startDate", "endDate"].includes(key)) updateData[key] = new Date(req.body[key]);
            else if (["rentAmount", "lateFeePercent", "graceDays"].includes(key)) updateData[key] = Number(req.body[key]);
            else if (key === "billingCycle" && VALID_BILLING_CYCLES.includes(req.body[key])) updateData[key] = req.body[key];
            else if (key === "status" && VALID_STATUSES.includes(req.body[key])) updateData[key] = req.body[key];
            else updateData[key] = req.body[key];
        }

        // Re-sync tenants if provided
        if (req.body.tenantIds?.length) {
            const tenantIdNums: number[] = req.body.tenantIds.map(Number);
            await db.leaseTenant.deleteMany({ where: { leaseId } });
            updateData.tenants = {
                create: tenantIdNums.map((tenantId) => ({ tenantId })),
            };
        }

        const lease = await db.lease.update({
            where: { id: leaseId },
            data: updateData,
            include: leaseInclude,
        });

        res.json({ lease });
    } catch (error: any) {
        console.error("Update lease error:", error);
        res.status(500).json({ error: error.message || "Failed to update lease" });
    }
});

// DELETE /api/leases/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const leaseId = Number(req.params.id);

        const existing = await db.lease.findFirst({
            where: { id: leaseId, property: { landlordId: authReq.userId } },
        });
        if (!existing) return res.status(404).json({ error: "Lease not found or access denied" });

        // LeaseTenant rows cascade-delete automatically
        await db.lease.delete({ where: { id: leaseId } });
        res.json({ message: "Lease deleted" });
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to delete lease" });
    }
});

// POST /api/leases/:id/sign
router.post("/:id/sign", requireAuth, upload.single("signedDocument"), async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const leaseId = Number(req.params.id);

        const existing = await db.lease.findFirst({
            where: { id: leaseId, property: { landlordId: authReq.userId } },
        });
        if (!existing) return res.status(404).json({ error: "Lease not found or access denied" });
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const lease = await db.lease.update({
            where: { id: leaseId },
            data: { signedDocumentUrl: `/uploads/leases/${path.basename(req.file.filename)}` },
            include: leaseInclude,
        });

        res.json({ lease });
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to upload signed lease" });
    }
});

export default router;