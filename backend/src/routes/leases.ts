import { Router, Request, Response } from "express";
import { db } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { AuthRequest } from "../middleware/auth-types.js";
import { upload } from "../middleware/upload.js";
import path from "path";
import { generateScheduleForLease } from "../services/paymentService.js";

const router = Router();
const VALID_BILLING_CYCLES = ["monthly", "weekly"];
const VALID_STATUSES = ["pending_signature", "active", "ended", "suspended", "cancelled"];

// Reusable include for all lease queries
const leaseInclude = {
    property: {
        select: {
            id: true,
            title: true,
            location: true,
            unitTypes: true,
        },
    },
    unitType: true,
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
            unitTypeId, depositAmount,
            billingCycle = "monthly", status = "pending_signature",
            lateFeePercent = 0, graceDays = 0,
        } = req.body;

        if (!propertyId || !tenantIds?.length || !startDate || !endDate) {
            return res.status(400).json({
                error: "propertyId, tenantIds, startDate, and endDate are required",
            });
        }
        if (!unitTypeId && rentAmount == null) {
            return res.status(400).json({ error: "rentAmount is required when unitTypeId is not provided" });
        }

        const propertyIdNum = Number(propertyId);
        const tenantIdNums: number[] = tenantIds.map(Number);

        const property = await db.property.findFirst({
            where: { id: propertyIdNum, landlordId: userId },
        });
        if (!property) return res.status(404).json({ error: "Property not found or access denied" });

        // POST /api/leases  (replace the "validTenants" block)
        const tenantRole = await db.role.findUnique({ where: { name: "Tenant" } });
        if (!tenantRole) {
            return res.status(500).json({ error: "Tenant role not configured" });
        }

        // Ensure each tenant is linked to this property; create the link if missing.
        const users = await db.user.findMany({ where: { id: { in: tenantIdNums } } });
        if (users.length !== tenantIdNums.length) {
            return res.status(404).json({ error: "One or more tenants not found" });
        }

        await Promise.all(
            tenantIdNums.map((tenantId) =>
                db.userProperty.upsert({
                    where: {
                        userId_propertyId_roleId: {
                            userId: tenantId,
                            propertyId: propertyIdNum,
                            roleId: tenantRole.id,
                        },
                    },
                    update: {},
                    create: { userId: tenantId, propertyId: propertyIdNum, roleId: tenantRole.id },
                })
            )
        );

        let finalRentAmount = Number(rentAmount);
        if (unitTypeId) {
            const unitType = await db.unitType.findUnique({ where: { id: Number(unitTypeId) } });
            if (!unitType) return res.status(400).json({ error: "Unit type not found" });
            if (unitType.propertyId !== propertyIdNum) return res.status(400).json({ error: "Unit type does not belong to the specified property" });
            finalRentAmount = unitType.price;
        }

        const lease = await db.lease.create({
            data: {
                propertyId: propertyIdNum,
                unitTypeId: unitTypeId ? Number(unitTypeId) : null,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                rentAmount: finalRentAmount,
                depositAmount: depositAmount != null ? Number(depositAmount) : null,
                billingCycle: VALID_BILLING_CYCLES.includes(billingCycle) ? billingCycle : "monthly",
                status: VALID_STATUSES.includes(status) ? status : "pending_signature",
                lateFeePercent: Number(lateFeePercent) || 0,
                graceDays: Number(graceDays) || 0,
                tenants: { create: tenantIdNums.map((tenantId) => ({ tenantId })) },
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

// GET /api/leases/mine — tenant-scoped lease fetch
router.get("/mine", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const leaseTenants = await db.leaseTenant.findMany({
            where: { tenantId: authReq.userId },
            include: {
                lease: {
                    select: {
                        id: true,
                        rentAmount: true,
                        startDate: true,
                        status: true,
                        billingCycle: true,
                        renewedFromId: true,
                        property: { select: { id: true, title: true, location: true } },
                        tenants: { select: { tenantId: true } },
                    },
                },
            },
        });

        const leases = leaseTenants.map((lt) => lt.lease);
        res.json({ leases });
    } catch (error) {
        console.error("Failed to fetch tenant leases:", error);
        res.status(500).json({ error: "Failed to fetch leases" });
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

        // Re-derive rentAmount if unitTypeId is being changed
        if (req.body.unitTypeId !== undefined) {
            const newUnitTypeId = req.body.unitTypeId ? Number(req.body.unitTypeId) : null;
            updateData.unitTypeId = newUnitTypeId;
            if (newUnitTypeId) {
                const unitType = await db.unitType.findUnique({ where: { id: newUnitTypeId } });
                if (!unitType) return res.status(400).json({ error: "Unit type not found" });
                if (unitType.propertyId !== existing.propertyId) {
                    return res.status(400).json({ error: "Unit type does not belong to the specified property" });
                }
                updateData.rentAmount = unitType.price;
            }
        }
        // Handle depositAmount explicitly (can be set to null)
        if (req.body.depositAmount !== undefined) {
            updateData.depositAmount = req.body.depositAmount != null ? Number(req.body.depositAmount) : null;
        }

        // Re-sync tenants if provided
        if (req.body.tenantIds?.length) {
            const tenantIdNums: number[] = req.body.tenantIds.map(Number);
            await db.leaseTenant.deleteMany({ where: { leaseId } });
            updateData.tenants = {
                create: tenantIdNums.map((tenantId) => ({ tenantId })),
            };
        }

        if (updateData.status === "active" && !existing.signedDocumentUrl) {
            return res.status(400).json({ error: "Lease cannot be activated until the signed document is uploaded" });
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
router.post("/:id/sign", requireAuth, upload.single("signedDocument"), async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const leaseId = Number(req.params.id);

        const existing = await db.lease.findFirst({
            where: { id: leaseId, property: { landlordId: authReq.userId } },
        });
        if (!existing) return res.status(404).json({ error: "Lease not found or access denied" });
        if (existing.status === "cancelled") {
            return res.status(400).json({ error: "Cannot sign a cancelled lease" });
        }
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const lease = await db.lease.update({
            where: { id: leaseId },
            data: {
                signedDocumentUrl: `/uploads/leases/${path.basename(req.file.filename)}`,
                status: "active", // ← flips lease live on signature
            },
            include: leaseInclude,
        });

        res.json({ lease });
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to upload signed lease" });
    }
});

// POST /api/leases/:id/cancel
router.post("/:id/cancel", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const leaseId = Number(req.params.id);
        const { reason } = req.body;

        const existing = await db.lease.findFirst({
            where: { id: leaseId, property: { landlordId: authReq.userId } },
        });
        if (!existing) return res.status(404).json({ error: "Lease not found or access denied" });
        if (existing.status === "cancelled") {
            return res.status(400).json({ error: "Lease is already cancelled" });
        }

        const lease = await db.lease.update({
            where: { id: leaseId },
            data: { status: "cancelled", cancelledAt: new Date(), cancelReason: reason ?? null },
            include: leaseInclude,
        });

        // Optional: clear out future unpaid schedule entries for this lease's tenants/property.
        // await db.rentSchedule.deleteMany({ where: { ..., status: "pending" } });

        res.json({ lease });
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to cancel lease" });
    }
});

// POST /api/leases/:id/renew
router.post("/:id/renew", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const leaseId = Number(req.params.id);
        const {
            startDate, endDate, rentAmount, unitTypeId, depositAmount,
            billingCycle, lateFeePercent, graceDays, tenantIds,
            requiresNewSignature = true,
        } = req.body;

        const existing = await db.lease.findFirst({
            where: { id: leaseId, property: { landlordId: authReq.userId } },
            include: { tenants: true, renewedTo: true },
        });
        if (!existing) return res.status(404).json({ error: "Lease not found or access denied" });
        if (existing.status === "cancelled") {
            return res.status(400).json({ error: "Cannot renew a cancelled lease" });
        }
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "startDate and endDate are required for renewal" });
        }
        if (existing.renewedTo) {
            return res.status(400).json({ error: "This lease has already been renewed" });
        }

        // Resolve unit type / rent, same rules as create
        const finalUnitTypeId = unitTypeId !== undefined ? unitTypeId : existing.unitTypeId;
        let finalRentAmount = rentAmount != null ? Number(rentAmount) : existing.rentAmount;
        if (finalUnitTypeId) {
            const unitType = await db.unitType.findUnique({ where: { id: Number(finalUnitTypeId) } });
            if (!unitType) return res.status(400).json({ error: "Unit type not found" });
            if (unitType.propertyId !== existing.propertyId) {
                return res.status(400).json({ error: "Unit type does not belong to the specified property" });
            }
            finalRentAmount = unitType.price;
        }

        const tenantIdNums: number[] = tenantIds?.length
            ? tenantIds.map(Number)
            : existing.tenants.map((t) => t.tenantId);

        const newLease = await db.$transaction(async (tx) => {
            const created = await tx.lease.create({
                data: {
                    propertyId: existing.propertyId,
                    unitTypeId: finalUnitTypeId ? Number(finalUnitTypeId) : null,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    rentAmount: finalRentAmount,
                    depositAmount: depositAmount !== undefined
                        ? (depositAmount != null ? Number(depositAmount) : null)
                        : existing.depositAmount,
                    billingCycle: billingCycle && VALID_BILLING_CYCLES.includes(billingCycle)
                        ? billingCycle : existing.billingCycle,
                    lateFeePercent: lateFeePercent != null ? Number(lateFeePercent) : existing.lateFeePercent,
                    graceDays: graceDays != null ? Number(graceDays) : existing.graceDays,
                    status: requiresNewSignature ? "pending_signature" : "active",
                    renewedFromId: existing.id,
                    tenants: { create: tenantIdNums.map((tenantId) => ({ tenantId })) },
                },
                include: leaseInclude,
            });

            await tx.lease.update({
                where: { id: existing.id },
                data: { status: "ended" },
            });

            return created;
        });

        await generateScheduleForLease(newLease.id);
        res.status(201).json({ lease: newLease });
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to renew lease" });
    }
});

export default router;