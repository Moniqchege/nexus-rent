import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { audit } from "../middleware/audit.js";
import { AuthRequest } from "../middleware/auth-types.js";
import { db } from "../db/prisma.js";
import { getExpense, autoMarkOverdueExpenses } from "../services/expenseService.js";
import { uploadReceipt } from "../middleware/upload.js";

const router = Router();
router.use(requireAuth);

const ALLOWED_STATUSES = ["pending", "paid", "overdue"] as const;

// GET /api/expenses?propertyId=&status=
router.get(
    "/",
    audit({ action: "view_expenses", title: "Expenses" }),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const { propertyId, status } = req.query;

            // Sweep this landlord's stale "pending" expenses to "overdue"
            // before reading, so the list is always current even without
            // a cron wired up.
            await autoMarkOverdueExpenses({
                property: { landlordId: authReq.userId! },
            });

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
                },
                orderBy: { createdAt: "desc" },
            });

            res.json({ expenses });
        } catch (e: any) {
            res.status(500).json({ error: "Failed to fetch expenses" });
        }
    }
);

// GET /api/expenses/summary?month=2026-07 — total expenses for the period (dashboard card)
router.get(
    "/summary",
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const { month } = req.query;
            const monthStart = month
                ? new Date(`${month}-01`)
                : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

            const total = await db.expense.aggregate({
                where: {
                    property: { landlordId: authReq.userId! },
                    date: { gte: monthStart, lte: monthEnd },
                },
                _sum: { amount: true },
            });

            res.json({ expenses: total._sum.amount || 0 });
        } catch (e: any) {
            res.status(500).json({ error: "Failed to fetch expense summary" });
        }
    }
);

// POST /api/expenses
// Expenses are recorded directly on the Expense table — this is the ledger.
// No money moves, no Account/VendorAccount/LedgerEntry involvement.
router.post(
    "/",
    uploadReceipt.single("receipt"),
    audit({
        action: "expense_created",
        title: "Expense",
        metadata: (req) => req.body,
    }),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;

            const {
                propertyId,
                amount,
                category,
                description,
                date,
                mpesaPaidTo,
                vendor,
                unit,
                invoiceNumber,
                vendorEmail,
                vendorDescription,
            } = req.body;

            const receiptFile = req.file;

            const receiptUrl = receiptFile
                ? `/uploads/receipts/${receiptFile.filename}`
                : null;

            if (!propertyId || !amount || !category || !mpesaPaidTo) {
                return res.status(400).json({
                    error:
                        "Missing required fields: propertyId, amount, category, mpesaPaidTo",
                });
            }

            const property = await db.property.findFirst({
                where: {
                    id: Number(propertyId),
                    landlordId: authReq.userId!,
                },
            });

            if (!property) {
                return res.status(404).json({ error: "Property not found" });
            }

            const expense = await db.expense.create({
                data: {
                    propertyId: Number(propertyId),
                    amount: Number(amount),
                    category: String(category),
                    description: description || null,

                    unit: unit || null,
                    invoiceNumber: invoiceNumber || null,
                    vendorEmail: vendorEmail || null,
                    vendorDescription: vendorDescription || null,

                    vendorName: vendor || null,
                    receiptUrl,

                    date: date ? new Date(date) : new Date(),

                    mpesaPaidTo: String(mpesaPaidTo),
                    paymentStatus: "pending",
                },
                include: {
                    property: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

            res.json({ expense });
        } catch (e: any) {
            res.status(500).json({
                error: e?.message || "Failed to create expense",
            });
        }
    }
);

// GET /api/expenses/:id
router.get(
    "/:id",
    audit({ action: "view_expense", title: "Expense Detail" }),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const expenseId = Number(req.params.id);

            if (isNaN(expenseId)) {
                return res.status(400).json({ error: "Invalid expense id" });
            }

            const expense = await getExpense(expenseId, authReq.userId!);

            if (!expense) {
                return res.status(404).json({ error: "Expense not found" });
            }

            // Return the expense directly, not wrapped
            res.json(expense);
        } catch (e: any) {
            res.status(500).json({ error: "Failed to fetch expense" });
        }
    }
);

// PATCH /api/expenses/:id/status
// Marks an expense as paid/pending/overdue. Record-keeping only — no
// balances move and nothing is debited from any system account.
router.patch(
    "/:id/status",
    audit({
        action: "expense_status_updated",
        title: "Expense Status",
        metadata: (req) => req.body,
    }),
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthRequest;
            const expenseId = Number(req.params.id);
            const { status } = req.body;

            if (isNaN(expenseId)) {
                return res.status(400).json({ error: "Invalid expense id" });
            }

            if (!status || !ALLOWED_STATUSES.includes(status)) {
                return res.status(400).json({
                    error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
                });
            }

            const existing = await db.expense.findFirst({
                where: {
                    id: expenseId,
                    property: { landlordId: authReq.userId! },
                },
            });

            if (!existing) {
                return res.status(404).json({ error: "Expense not found" });
            }

            const expense = await db.expense.update({
                where: { id: expenseId },
                data: { paymentStatus: status },
                include: {
                    property: { select: { id: true, title: true } },
                },
            });

            res.json({ expense });
        } catch (e: any) {
            res.status(500).json({
                error: e?.message || "Failed to update expense status",
            });
        }
    }
);

export default router;