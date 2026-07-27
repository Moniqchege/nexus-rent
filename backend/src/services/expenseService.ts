import { db } from "../db/prisma.js";

// Expenses are considered overdue once they've sat unpaid for this many days,
// counted from the expense's own `date` field.
const OVERDUE_AFTER_DAYS = 7;

// Fetches a single expense, scoped to the requesting landlord.
// The Expense table is the ledger — no VendorAccount/Account/LedgerEntry
// involvement here.
export async function getExpense(expenseId: number, landlordId: number) {
    return db.expense.findFirst({
        where: {
            id: expenseId,
            property: { landlordId },
        },
        include: {
            property: { select: { id: true, title: true, landlordId: true } },
        },
    });
}

// Flips any "pending" expense older than OVERDUE_AFTER_DAYS to "overdue".
// Pass an extra `where` clause to scope this to one landlord/property, or
// call with no args to sweep every expense (used by the cron below).
// Returns the number of rows updated.
export async function autoMarkOverdueExpenses(extraWhere: Record<string, any> = {}) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - OVERDUE_AFTER_DAYS);

    const result = await db.expense.updateMany({
        where: {
            paymentStatus: "pending",
            date: { lt: cutoff },
            ...extraWhere,
        },
        data: { paymentStatus: "overdue" },
    });

    return result.count;
}

// Scheduled entry point — wire this into your existing cron runner
// (e.g. alongside whatever already writes to CronLog for rent schedules)
// to sweep overdue expenses across all landlords once a day.
export async function runExpenseOverdueCron() {
    const start = Date.now();
    try {
        const affected = await autoMarkOverdueExpenses();
        await db.cronLog.create({
            data: {
                type: "expense_overdue_check",
                status: "success",
                affected,
                duration: Date.now() - start,
            },
        });
        return affected;
    } catch (e: any) {
        await db.cronLog.create({
            data: {
                type: "expense_overdue_check",
                status: "error",
                error: e?.message || "Unknown error",
                duration: Date.now() - start,
            },
        });
        throw e;
    }
}