import { db } from "../db/prisma.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    paymentType?: string;
    paymentDetails?: any;
    description?: string;
}) {
    const { landlordId, expenseId, paymentType, paymentDetails, description } = params;

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

        // Resolve vendor account dynamically based on payment type
        let vendorIdentifier = "";
        let vendorName = "";
        let resolvedMpesaPaidTo = "";

        if (paymentType === 'MPESA_NUMBER') {
            vendorIdentifier = paymentDetails?.phoneNumber || "M-Pesa Account";
            vendorName = `M-Pesa (${vendorIdentifier})`;
            resolvedMpesaPaidTo = vendorIdentifier;
        } else if (paymentType === 'PAYBILL') {
            vendorIdentifier = `Paybill:${paymentDetails?.paybillNumber || ""}:${paymentDetails?.accountNumber || ""}`;
            vendorName = `Paybill ${paymentDetails?.paybillNumber || ""} (Acc: ${paymentDetails?.accountNumber || ""})`;
            resolvedMpesaPaidTo = vendorName;
        } else if (paymentType === 'TILL') {
            vendorIdentifier = `Till:${paymentDetails?.tillNumber || ""}`;
            vendorName = `Buy Goods Till ${paymentDetails?.tillNumber || ""}`;
            resolvedMpesaPaidTo = vendorName;
        } else if (paymentType === 'BANK') {
            vendorIdentifier = `Bank:${paymentDetails?.bankName || ""}:${paymentDetails?.bankCode || ""}:${paymentDetails?.accountNumber || ""}`;
            vendorName = `${paymentDetails?.bankName || "Bank"} (Acc: ${paymentDetails?.accountNumber || ""})`;
            resolvedMpesaPaidTo = vendorName;
        } else {
            vendorIdentifier = expense.mpesaPaidTo || expense.vendorAccount?.identifier || `EXP_PAY_FALLBACK:${expense.id}`;
            vendorName = expense.vendorAccount?.name || vendorIdentifier;
            resolvedMpesaPaidTo = vendorName;
        }

        // Upsert vendor account
        const vendorAccountResult = await tx.vendorAccount.upsert({
            where: { identifier: vendorIdentifier },
            update: { name: vendorName },
            create: {
                identifier: vendorIdentifier,
                name: vendorName,
            },
        });
        const vendorAccountId = vendorAccountResult.id;

        // Expenses must debit the single SYSTEM MAIN account (owned by seeded admin)
        const mainAccount = await tx.account.findFirst({
            where: {
                type: "MAIN",
            },
        });

        if (!mainAccount) throw new Error("System MAIN account not found");

        const vendorAccount = await tx.vendorAccount.findUnique({
            where: { id: vendorAccountId },
        });

        if (!vendorAccount) {
            throw new Error("Vendor account not found");
        }

        // Generate Transaction Reference Code (e.g. QE23456789)
        const referenceCode = "QE" + Math.floor(10000000 + Math.random() * 90000000);
        const idempotencyKey = `EXP_PAY:${referenceCode}`;

        // If already processed with same idempotency key, return
        const existing = await tx.ledgerEntry.findFirst({ where: { idempotencyKey } });
        if (existing) {
            const refreshed = await tx.expense.findUnique({ where: { id: expense.id } });
            return { success: true, expense: refreshed };
        }

        // Ledger: debit main, credit vendor
        const amount = Number(expense.amount);

        await tx.ledgerEntry.create({
            data: {
                idempotencyKey,
                landlordId,
                type: "EXPENSE_PAY",
                description: description || expense.description || `Expense #${expense.id}`,
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

        // Generate dynamic SVG receipt
        let paymentTypeLabel = "";
        let destinationDetails = "";
        if (paymentType === 'MPESA_NUMBER') {
            paymentTypeLabel = "M-Pesa";
            destinationDetails = paymentDetails?.phoneNumber || "N/A";
        } else if (paymentType === 'PAYBILL') {
            paymentTypeLabel = "Paybill";
            destinationDetails = `Biz: ${paymentDetails?.paybillNumber || ""} (Acc: ${paymentDetails?.accountNumber || ""})`;
        } else if (paymentType === 'TILL') {
            paymentTypeLabel = "Till Number";
            destinationDetails = paymentDetails?.tillNumber || "N/A";
        } else if (paymentType === 'BANK') {
            paymentTypeLabel = "Bank Transfer";
            destinationDetails = `${paymentDetails?.bankName || "Bank"} (Code: ${paymentDetails?.bankCode || ""} / Acc: ${paymentDetails?.accountNumber || ""})`;
        } else {
            paymentTypeLabel = "M-Pesa";
            destinationDetails = resolvedMpesaPaidTo;
        }

        const paymentDate = new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });
        const propertyTitle = expense.property?.title || "N/A";
        const category = expense.category;
        const formattedAmount = amount.toLocaleString('en-KE', { minimumFractionDigits: 2 });
        const cleanDesc = (description || expense.description || 'Automated multi-channel payment').replace(/[<>&"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                default: return c;
            }
        });

        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 650" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;display=swap');
      .base { font-family: 'Inter', sans-serif; }
      .brand { font-size: 14px; font-weight: 800; fill: #4f46e5; letter-spacing: 1.5px; }
      .title { font-size: 11px; font-weight: 700; fill: #4338ca; letter-spacing: 1px; }
      .badge-bg { fill: #ecfdf5; rx: 12px; }
      .badge-text { font-size: 11px; font-weight: 700; fill: #047857; text-anchor: middle; }
      .amount-val { font-size: 32px; font-weight: 800; fill: #0f172a; text-anchor: middle; }
      .amount-currency { font-size: 16px; font-weight: 500; fill: #64748b; }
      .key { font-size: 12px; font-weight: 500; fill: #64748b; }
      .val { font-size: 12px; font-weight: 600; fill: #0f172a; text-anchor: end; }
      .val-mono { font-size: 12px; font-family: monospace; font-weight: 700; fill: #4f46e5; text-anchor: end; }
      .desc-box { font-size: 12px; fill: #475569; }
      .footer-txt { font-size: 10px; fill: #94a3b8; text-anchor: middle; }
    </style>
    <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#f1f5f9" />
  <rect x="25" y="25" width="400" height="600" rx="16" fill="rgba(0, 0, 0, 0.05)" />
  <rect x="20" y="20" width="400" height="600" rx="16" fill="#ffffff" />
  <rect x="20" y="20" width="400" height="6" rx="3" fill="url(#headerGrad)" />
  <text x="45" y="60" class="base brand" text-anchor="start">NEXUS RENT</text>
  <rect x="315" y="45" width="70" height="22" rx="6" fill="#e0e7ff" />
  <text x="350" y="60" class="base title" text-anchor="middle">RECEIPT</text>
  <g transform="translate(0, 100)">
    <rect x="135" y="0" width="180" height="26" class="badge-bg" />
    <circle cx="152" cy="13" r="5" fill="#047857" />
    <text x="230" y="17" class="base badge-text">PAYMENT SUCCESSFUL</text>
    <text x="225" y="65" class="base amount-val">
      <tspan class="amount-currency">KES </tspan>${formattedAmount}
    </text>
  </g>
  <line x1="20" y1="210" x2="420" y2="210" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6,6" />
  <circle cx="20" cy="210" r="8" fill="#f1f5f9" />
  <circle cx="420" cy="210" r="8" fill="#f1f5f9" />
  <g transform="translate(45, 230)">
    <text x="0" y="20" class="base key">Reference Code</text>
    <text x="360" y="20" class="base val-mono">${referenceCode}</text>
    <text x="0" y="55" class="base key">Date &amp; Time</text>
    <text x="360" y="55" class="base val">${paymentDate}</text>
    <text x="0" y="90" class="base key">Payment Channel</text>
    <text x="360" y="90" class="base val">${paymentTypeLabel}</text>
    <text x="0" y="125" class="base key">Destination</text>
    <text x="360" y="125" class="base val">${destinationDetails}</text>
    <text x="0" y="160" class="base key">Category</text>
    <text x="360" y="160" class="base val">${category}</text>
    <text x="0" y="195" class="base key">Property</text>
    <text x="360" y="195" class="base val">${propertyTitle}</text>
  </g>
  <line x1="20" y1="465" x2="420" y2="465" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="6,6" />
  <circle cx="20" cy="465" r="8" fill="#f1f5f9" />
  <circle cx="420" cy="465" r="8" fill="#f1f5f9" />
  <g transform="translate(45, 485)">
    <text x="0" y="20" class="base key">Description</text>
    <text x="0" y="42" class="base desc-box">${cleanDesc}</text>
  </g>
  <g transform="translate(225, 575)">
    <text class="base footer-txt" y="0">Thank you for your business!</text>
    <text class="base footer-txt" y="16">support@nexusrent.com | +254 700 000000</text>
  </g>
</svg>`;

        const receiptDir = path.resolve(__dirname, "../../uploads/receipts");
        if (!fs.existsSync(receiptDir)) {
            fs.mkdirSync(receiptDir, { recursive: true });
        }
        const receiptFileName = `receipt-${expense.id}-${referenceCode}.svg`;
        const receiptFilePath = path.join(receiptDir, receiptFileName);
        fs.writeFileSync(receiptFilePath, svgContent, "utf8");
        const receiptUrl = `/uploads/receipts/${receiptFileName}`;

        const updated = await tx.expense.update({
            where: { id: expense.id },
            data: {
                paymentStatus: "paid",
                mpesaPaidTo: resolvedMpesaPaidTo,
                vendorAccountId,
                receiptUrl,
            },
            include: {
                property: { select: { id: true, title: true } },
                vendorAccount: { select: { id: true, name: true, identifier: true } },
            },
        });

        return { success: true, expense: updated };
    });
}
