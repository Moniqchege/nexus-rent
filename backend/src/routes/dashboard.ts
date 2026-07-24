import { Router, Request, Response } from "express";
import { db } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { AuthRequest } from "../middleware/auth-types.js";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", requireAuth, async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.userId;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Run all queries in parallel
        const [
            totalProperties,
            activeLeases,
            unitAggregate,
            totalOccupiedUnits,
            monthlyRevenue,
            totalArrears,
            revenueTrend,
            expenseByCategory,
            recentPayments,
            leasesExpiringSoon,
        ] = await Promise.all([
            // 1. Total properties count
            db.property.count({
                where: { landlordId: userId },
            }),

            // 2. Active leases count
            db.lease.count({
                where: {
                    status: "active",
                    property: { landlordId: userId },
                },
            }),

            // 3. Total available units (sum of all unit type capacities)
            db.unitType.aggregate({
                where: { property: { landlordId: userId } },
                _sum: { totalUnits: true },
            }),

            // 4. Total occupied units (one active lease = one unit occupied)
            db.lease.count({
                where: {
                    status: "active",
                    property: { landlordId: userId },
                },
            }),

            // 5. Monthly revenue (current calendar month)
            (async () => {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

                const result = await db.payment.aggregate({
                    where: {
                        status: "paid",
                        paidAt: {
                            gte: monthStart,
                            lt: monthEnd,
                        },
                        property: { landlordId: userId },
                    },
                    _sum: { amount: true },
                });

                return result._sum.amount || 0;
            })(),

            // 6. Total arrears
            (async () => {
                const now = new Date();
                const result = await db.rentSchedule.aggregate({
                    where: {
                        OR: [
                            { status: "overdue" },
                            { status: "scheduled" },
                        ],
                        dueDate: { lt: now },
                        property: { landlordId: userId },
                    },
                    _sum: {
                        amount: true,
                        lateFeeAmount: true,
                    },
                });

                const totalAmount = result._sum.amount || 0;
                const totalLateFees = result._sum.lateFeeAmount || 0;
                return totalAmount + totalLateFees;
            })(),

            // 7. Revenue trend (last 6 months including current)
            (async () => {
                const now = new Date();
                const trend: { month: string; revenue: number }[] = [];
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                for (let i = 5; i >= 0; i--) {
                    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
                    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);

                    const result = await db.payment.aggregate({
                        where: {
                            status: "paid",
                            paidAt: {
                                gte: monthStart,
                                lt: monthEnd,
                            },
                            property: { landlordId: userId },
                        },
                        _sum: { amount: true },
                    });

                    trend.push({
                        month: monthNames[targetDate.getMonth()],
                        revenue: result._sum.amount || 0,
                    });
                }

                return trend;
            })(),

            // 8. Expense by category
            (async () => {
                const expenses = await db.expense.groupBy({
                    by: ["category"],
                    where: { property: { landlordId: userId } },
                    _sum: { amount: true },
                });

                return expenses.map((e) => ({
                    category: e.category,
                    total: e._sum.amount || 0,
                }));
            })(),

            // 9. Recent payments (last 5)
            (async () => {
                const payments = await db.payment.findMany({
                    where: {
                        status: "paid",
                        property: { landlordId: userId },
                    },
                    include: {
                        tenant: { select: { name: true } },
                        property: { select: { title: true } },
                    },
                    orderBy: { paidAt: "desc" },
                    take: 5,
                });

                return payments.map((p) => ({
                    id: p.id,
                    tenantName: p.tenant.name,
                    propertyTitle: p.property.title,
                    amount: p.amount,
                    paidAt: p.paidAt?.toISOString() || "",
                    method: p.method,
                }));
            })(),

            // 10. Leases expiring soon (within 30 days)
            (async () => {
                const now = new Date();
                const thirtyDaysFromNow = new Date(now);
                thirtyDaysFromNow.setDate(now.getDate() + 30);

                const leases = await db.lease.findMany({
                    where: {
                        status: "active",
                        endDate: {
                            gte: now,
                            lte: thirtyDaysFromNow,
                        },
                        property: { landlordId: userId },
                    },
                    include: {
                        property: { select: { title: true } },
                        tenants: {
                            include: {
                                tenant: { select: { name: true } },
                            },
                        },
                    },
                });

                return leases.map((lease) => ({
                    id: lease.id,
                    propertyTitle: lease.property.title,
                    tenantNames: lease.tenants.map((lt) => lt.tenant.name),
                    endDate: lease.endDate.toISOString(),
                }));
            })(),
        ]);

        // Calculate occupancy rate (unit-count based)
        const totalAvailableUnits = unitAggregate._sum.totalUnits ?? 0;
        const occupancyRate = totalAvailableUnits > 0
            ? Math.round((totalOccupiedUnits / totalAvailableUnits) * 100 * 100) / 100
            : 0;

        // Return DashboardStats response
        const stats = {
            totalProperties,
            activeLeases,
            occupancyRate,
            monthlyRevenue,
            totalArrears,
            revenueTrend,
            expenseByCategory,
            recentPayments,
            leasesExpiringSoon,
        };

        res.json(stats);
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
});

export default router;
