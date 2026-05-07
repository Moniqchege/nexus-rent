import { db } from "../db/prisma.js";

export async function getExpenseWithVendor(expenseId: number, landlordId: number) {
    return db.expense.findFirst({
        where: {
            id: expenseId,
            property: { landlordId },
        },
        include: {
            property: { select: { id: true, title: true, landlordId: true } },
            vendorAccount: { select: { id: true, identifier: true, name: true } },
        },
    });
}

export async function createExpensePay(params: {
    landlordId: number;
    expenseId: number;
    mpesaPaidTo?: string;
    reference?: string;
}) {
    const { landlordId, expenseId, mpesaPaidTo, reference } = params;

    return db.$transaction(async (tx) => {
        const expense = await tx.expense.findFirst({

            where: {
                id: expenseId,
                property: { landlordId },
            },
            include: {
                property: { select: { id: true, title: true, landlordId: true } },
                vendorAccount: { select: { id: true, identifier: true } },
            },
        });

        if (!expense) throw new Error("Expense not found");
        if (expense.paymentStatus === "paid") {
            return { success: true, expense };
        }

        // If mpesaPaidTo was provided at pay-time, ensure vendor account matches it
        let vendorAccountId = expense.vendorAccountId;
        if (mpesaPaidTo) {
            const vendorAccount = await tx.vendorAccount.upsert({
                where: { identifier: String(mpesaPaidTo) },
                update: {},
                create: {
                    identifier: String(mpesaPaidTo),
                    name: String(mpesaPaidTo),
                },
            });
            vendorAccountId = vendorAccount.id;
        }

        // Expenses must debit the single SYSTEM MAIN account (owned by seeded admin)
        const mainAccount = await tx.account.findFirst({
            where: {
                type: "MAIN",
            },
        });

        if (!mainAccount) throw new Error("System MAIN account not found");

        // Vendor source of truth for expenses is the Prisma VendorAccount model
        const vendorAccount = await tx.vendorAccount.findUnique({
            where: { id: vendorAccountId ?? undefined },
        });

        if (!vendorAccount) {
            throw new Error("Vendor account not found");
        }


        // Idempotency key: use reference if provided, otherwise use expenseId
        const idempotencyKey = reference ? `EXP_PAY:${reference}` : `EXP_PAY:${expense.id}`;

        // If already processed with same idempotency key, return
        const existing = await tx.ledgerEntry.findFirst({ where: { idempotencyKey } });
        if (existing) {
            const refreshed = await tx.expense.findUnique({ where: { id: expense.id } });
            return { success: true, expense: refreshed };
        }

        // Ledger: debit main, credit vendor
        // Store balances on Account (we keep them as running totals).
        const amount = Number(expense.amount);

        await tx.ledgerEntry.create({
            data: {
                idempotencyKey,
                landlordId,
                type: "EXPENSE_PAY",
                description: expense.description ?? `Expense #${expense.id}`,
                amount,
                mainAccountId: mainAccount.id,
                vendorAccountId: vendorAccount.id,
            },
        });


        await tx.account.update({
            where: { id: mainAccount.id },
            data: {
                balanceKES: { decrement: amount },
                updatedAt: new Date(),
            },
        });

        // Vendor balance is not tracked via Account.type for expenses.
        // (LedgerEntry references the VendorAccount record for auditing.)

        const updated = await tx.expense.update({

            where: { id: expense.id },
            data: {
                paymentStatus: "paid",
                mpesaPaidTo: (mpesaPaidTo ? String(mpesaPaidTo) : expense.mpesaPaidTo) ?? null,
                vendorAccountId,


            },
            include: {
                property: { select: { id: true, title: true } },
                vendorAccount: { select: { id: true, name: true, identifier: true } },
            },
        });

        return { success: true, expense: updated };
    });
}


