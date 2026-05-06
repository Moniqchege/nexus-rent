import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import { AuthRequest } from "../middleware/auth-types.js";
import { db } from "../db/prisma.js";
import { createExpensePay, getExpenseWithVendor } from "../services/expenseService.js";

const router = Router();
router.use(requireAuth);

// GET /api/expenses?propertyId=&status=
router.get(
    "/",
    audit({ action: "view_expenses", title: "Expenses" }),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const { propertyId, status } = req.query;

            // Landlord scoping: only expenses from properties owned by this landlord
            // (expense -> property -> landlordId)
            const where: any = {
                property: {
                    landlordId: authReq.userId!,
                },
            };

            if (propertyId) where.propertyId = Number(propertyId);
            if (status) where.paymentStatus = status;

            const expenses = await db.expense.findMany({
                where,
                include: {
                    property: { select: { id: true, title: true } },
                    vendorAccount: { select: { id: true, name: true, identifier: true } },
                },
                orderBy: { createdAt: "desc" },
            });

            res.json({ expenses });
        } catch (e: any) {
            res.status(500).json({ error: "Failed to fetch expenses" });
        }
    }
);

// POST /api/expenses
router.post(
    "/",
    audit({ action: "expense_created", title: "Expense", metadata: (req) => req.body }),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const { propertyId, amount, category, description, date, mpesaPaidTo } = req.body;

            if (!propertyId || !amount || !category || !mpesaPaidTo) {
                return res.status(400).json({ error: "Missing required fields: propertyId, amount, category, mpesaPaidTo" });
            }

            const expense = await db.$transaction(async (tx) => {
                const property = await tx.property.findFirst({
                    where: {
                        id: Number(propertyId),
                        landlordId: authReq.userId!,
                    },
                    select: { id: true },
                });

                if (!property) throw new Error("Property not found");

                const vendorAccount = await tx.vendorAccount.upsert({
                    where: { identifier: String(mpesaPaidTo) },
                    update: {},
                    create: {
                        identifier: String(mpesaPaidTo),
                        name: String(mpesaPaidTo),
                    },
                });

                const created = await tx.expense.create({
                    data: {
                        propertyId: Number(propertyId),
                        amount: Number(amount),
                        category: String(category),
                        description: description ? String(description) : null,
                        date: date ? new Date(date) : new Date(),
                        mpesaPaidTo: String(mpesaPaidTo),
                        paymentStatus: "pending",
                        vendorAccountId: vendorAccount.id,
                    },
                    include: {
                        property: { select: { id: true, title: true } },
                        vendorAccount: { select: { id: true, name: true, identifier: true } },
                    },
                });

                return created;
            });

            res.json({ expense });
        } catch (e: any) {
            res.status(500).json({ error: e?.message || "Failed to create expense" });
        }
    }
);

// POST /api/expenses/:id/pay
router.post(
    "/:id/pay",
    audit({ action: "expense_paid", title: "Expense Pay", metadata: (req) => req.body }),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const expenseId = Number(req.params.id);
            const { mpesaPaidTo, reference } = req.body;

            const result = await createExpensePay({
                landlordId: authReq.userId!,
                expenseId,
                mpesaPaidTo: mpesaPaidTo ? String(mpesaPaidTo) : undefined,
                reference: reference ? String(reference) : undefined,
            });

            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e?.message || "Failed to pay expense" });
        }
    }
);

export default router;

