import Stripe from 'stripe';
import axios from 'axios';
import { db } from '../db/prisma.js';
import crypto from 'crypto';
import { transporter } from './mailer';
import twilio from "twilio";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const twilioClient = new twilio.Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export interface InitiateMpesaSTK {
  phone: string;
  amount: number;
  accountRef: string;
  propertyId: number;
  tenantId: number;
  description: string;
}

export interface PaymentResult {
  success: boolean;
  data?: any;
  error?: string;
}

const getMpesaAccessToken = async (): Promise<string> => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  console.log("🔐 MPESA AUTH BASE64:", auth);

  try {
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        timeout: 10000,
      }
    );

    console.log("✅ MPESA TOKEN RESPONSE:", response.data);

    return response.data.access_token;
  } catch (error: any) {
    console.log("❌ MPESA OAUTH ERROR:");
    console.log(error.response?.data || error.message);
    throw error;
  }
};

// M-Pesa Daraja API - Lipa na M-Pesa STK Push
export async function initiateMpesaSTK(
  params: InitiateMpesaSTK
): Promise<PaymentResult> {
  try {
    const { phone, amount, accountRef, propertyId, tenantId, description } =
      params;

    console.log("📦 STK REQUEST INPUT:", params);

    const accessToken = await getMpesaAccessToken();
    console.log("🔑 ACCESS TOKEN:", accessToken);

    // ✅ SAFE timestamp (Daraja strict format)
    const date = new Date();
    const timestamp =
      date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0") +
      String(date.getHours()).padStart(2, "0") +
      String(date.getMinutes()).padStart(2, "0") +
      String(date.getSeconds()).padStart(2, "0");

    console.log("⏱ TIMESTAMP:", timestamp);

    // ✅ CLEAN ENV VALUES (VERY IMPORTANT)
    const shortCode = (process.env.MPESA_SHORTCODE || "").trim();
    const passKey = (process.env.MPESA_PASSKEY || "").trim();

    console.log("SHORTCODE:", shortCode);
    console.log("PASSKEY LENGTH:", passKey.length);
    console.log("PASSKEY START:", passKey.slice(0, 10));
    console.log("PASSKEY END:", passKey.slice(-10));

    // 🔥 STRICT DARARAJA PASSWORD FORMAT
    const passwordString = `${shortCode}${passKey}${timestamp}`;

    console.log("PASSWORD INPUT STRING:", passwordString);

    const password = Buffer.from(passwordString).toString("base64");

    console.log("🔒 PASSWORD GENERATED:", password);

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: `${process.env.MPESA_CALLBACK_URL}/api/payments/mpesa/callback`,
      AccountReference: accountRef,
      TransactionDesc: description,
    };

    console.log("🚀 STK PAYLOAD:", JSON.stringify(payload, null, 2));

    const stkRes = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("📩 STK RESPONSE:", stkRes.data);

    if (stkRes.data.ResponseCode === "0") {
      await db.payment.create({
        data: {
          tenantId,
          propertyId,
          amount,
          method: "mpesa",
          status: "pending",
          referenceId: stkRes.data.CheckoutRequestID,
          metadata: { phone, description },
        },
      });

      return { success: true, data: stkRes.data };
    }

    console.log("❌ STK FAILED:", stkRes.data);

    return {
      success: false,
      error: stkRes.data.errorMessage || "STK request failed",
    };
  } catch (error: any) {
    console.log("🔥 STK EXCEPTION:");

    if (error.response) {
      console.log("STATUS:", error.response.status);
      console.log(
        "DATA:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.log(error.message);
    }

    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message,
    };
  }
}

// Stripe Card Payment
export async function createStripeSession(propertyId: number, tenantId: number, amount: number, accountRef: string) {
  const session = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency: 'kes',
    metadata: { propertyId: propertyId.toString(), tenantId: tenantId.toString(), accountRef },
    automatic_payment_methods: { enabled: true },
  });
  // Create pending
  await db.payment.create({
    data: {
      tenantId,
      propertyId,
      amount,
      method: 'card',
      status: 'pending',
      referenceId: session.id,
    },
  });
  return session;
}

export async function confirmStripePayment(piId: string, tenantId: number, propertyId: number) {
  const paymentIntent = await stripe.paymentIntents.retrieve(piId);
  if (paymentIntent.status !== 'succeeded') return false;

  return db.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({ where: { referenceId: piId } });
    if (!existing) return false;
    if (existing.status === 'paid') return true;

    const systemMain = await tx.account.findFirst({ where: { type: 'MAIN' } });
    if (!systemMain) throw new Error('System MAIN account not found');

    await tx.payment.update({
      where: { referenceId: piId },
      data: { status: 'paid', paidAt: new Date() },
    });

    const idempotencyKey = `PAY:${piId}`;


    // ledger: record payment into MAIN
    // Use idempotencyKey to avoid double-credit on retries/webhooks.
    // Ledger write is idempotent.
    await tx.ledgerEntry.create({
      data: {
        idempotencyKey,
        landlordId: 0,
        type: 'PAYMENT_RECEIVED',
        description: `Payment ${piId} confirmed (stripe)`,
        amount: Number(existing.amount),
        mainAccountId: systemMain.id,
        vendorAccountId: null,
      },
    }).catch((e: unknown) => {
      // If duplicate idempotency key, ignore and continue.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (e as any)?.message || '';
      if (!msg.toLowerCase().includes('idempotencykey')) throw e;
    });


    await tx.account.update({
      where: { id: systemMain.id },
      data: { balanceKES: { increment: Number(existing.amount) } },
    });

    await allocatePayment(existing.id);
    return true;
  });
}


// Late Fee Automation — uses Lease.graceDays and Lease.lateFeePercent
export async function applyLateFees(): Promise<number> {
  const now = new Date();

  const candidates = await db.rentSchedule.findMany({
    where: {
      status: { in: ["scheduled", "overdue", "partial"] },
      dueDate: { lt: now },
    },
    select: {
      id: true,
      dueDate: true,
      amount: true,
      propertyId: true,
      tenantId: true,
      lateFeeAmount: true,       
      lateFeeLastAppliedAt: true, 
    },
  });

  if (!candidates.length) return 0;

  const leases = await db.lease.findMany({
    where: {
      status: "active",
      tenants: { some: { tenantId: { in: candidates.map((c) => c.tenantId) } } },
      propertyId: { in: candidates.map((c) => c.propertyId) },
    },
    include: { tenants: true },
  });

  let affected = 0;

  for (const sched of candidates) {
    const lease = leases.find(
      (l) =>
        l.propertyId === sched.propertyId &&
        l.tenants.some((t) => t.tenantId === sched.tenantId)
    );

    const graceDays      = lease?.graceDays      ?? 7;
    const lateFeePercent = lease?.lateFeePercent  ?? 5;

    const graceDeadline = new Date(sched.dueDate);
    graceDeadline.setDate(graceDeadline.getDate() + graceDays);

    if (now <= graceDeadline) continue; 

    // How many days have elapsed since grace expired (or since last application)
    const chargeFrom = sched.lateFeeLastAppliedAt
      ? new Date(sched.lateFeeLastAppliedAt)
      : graceDeadline;

    const msPerDay   = 86_400_000;
    const daysToCharge = Math.floor((now.getTime() - chargeFrom.getTime()) / msPerDay);

    if (daysToCharge < 1) continue; 

    // Daily fee = % of original rent amount (simple, non-compounding)
    const dailyFee      = sched.amount * (lateFeePercent / 100);
    const newFeeAmount  = (sched.lateFeeAmount ?? 0) + dailyFee * daysToCharge;

    await db.rentSchedule.update({
      where: { id: sched.id },
      data: {
        status:              "overdue",
        lateFeeAmount:       newFeeAmount,
        lateFeeLastAppliedAt: now,       
      },
    });

    affected++;
  }

  return affected;
}

// Generate Schedules (cron) — uses Lease.rentAmount and Lease.billingCycle
export async function generateMonthlySchedules() {
  const now = new Date();

  const activeLeases = await db.lease.findMany({
    where: {
      status: "active",
      endDate: { gte: now },
    },
    include: {
      tenants: true,
    },
  });

  for (const lease of activeLeases) {
    if (!lease.tenants.length) {
      console.warn(`No tenants found for lease ${lease.id}`);
      continue;
    }

    let dueDate: Date;
    if (lease.billingCycle === "weekly") {
      dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 7);
    } else {
      dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const period = dueDate.toISOString().slice(0, 7);

    for (const leaseTenant of lease.tenants) {
      const existing = await db.rentSchedule.findFirst({
        where: {
          tenantId: leaseTenant.tenantId,
          propertyId: lease.propertyId,
          period,
        },
      });

      if (!existing) {
        await db.rentSchedule.create({
          data: {
            propertyId: lease.propertyId,
            tenantId: leaseTenant.tenantId,
            dueDate,
            amount: lease.rentAmount,
            status: "scheduled",
            period,
          },
        });
      }
    }
  }
}

// In paymentService.ts
export async function generateScheduleForLease(leaseId: number) {
  const lease = await db.lease.findUnique({
    where: { id: leaseId },
    include: {
      tenants: true,
    },
  });

  if (!lease || lease.status !== "active") return;

  let dueDate: Date;
  if (lease.billingCycle === "weekly") {
    dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
  } else {
    dueDate = new Date(lease.startDate);
  }

  const period = dueDate.toISOString().slice(0, 7);

  // Create a rent schedule for each tenant on the lease
  for (const leaseTenant of lease.tenants) {
    const existing = await db.rentSchedule.findFirst({
      where: {
        tenantId: leaseTenant.tenantId,
        propertyId: lease.propertyId,
        period,
      },
    });

    if (!existing) {
      await db.rentSchedule.create({
        data: {
          propertyId: lease.propertyId,
          tenantId: leaseTenant.tenantId,
          dueDate,
          amount: lease.rentAmount,
          status: "scheduled",
          period,
        },
      });
    }
  }
}

// Auto-reconciliation helpers
export async function handleMpesaCallback(body: any): Promise<PaymentResult> {
  try {
    const { Body } = body;
    if (!Body || !Body.stkCallback) return { success: false, error: 'Invalid callback' };
    const cb = Body.stkCallback;
    if (cb.ResultCode !== '0') return { success: false, error: cb.ResultDesc };

    const checkoutId = cb.CheckoutRequestID;
    const amount = cb.CallbackMetadata?.Item?.[0]?.Value;

    const payment = await db.payment.findUnique({ where: { referenceId: checkoutId } });
    if (!payment) return { success: false, error: 'Payment not found' };

    const existingMetadata = (payment.metadata && typeof payment.metadata === 'object')
      ? payment.metadata
      : {};

    await db.payment.update({
      where: { referenceId: checkoutId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        metadata: { ...existingMetadata, callback: cb }
      },
    });


    await allocatePayment(payment.id);
    return { success: true, data: { checkoutId, amount } };
  } catch (e) {
    console.error('M-Pesa callback error:', e);
    return { success: false, error: 'Processing failed' };
  }
}

// export async function reconcilePayment(paymentId: number) {
//   try {
//     const payment = await db.payment.findUnique({
//       where: { id: paymentId },
//       include: { tenant: true, property: true },
//     });
//     if (!payment || payment.status !== 'paid') return false;

//     const schedule = await db.rentSchedule.findFirst({
//       where: {
//         tenantId: payment.tenantId,
//         propertyId: payment.propertyId,
//         status: { in: ['scheduled', 'overdue'] },
//       },
//       orderBy: { dueDate: 'desc' },
//     });

//     if (schedule) {
//       await db.$transaction([
//         db.payment.update({
//           where: { id: paymentId },
//           data: { lateFee: schedule.lateFeeAmount || 0 },
//         }),
//         db.rentSchedule.update({
//           where: { id: schedule.id },
//           data: { status: 'paid', paymentId: payment.id },
//         }),
//       ]);
//       await sendReceipt(paymentId);
//       return true;
//     }
//   } catch (e) {
//     console.error('Reconcile failed', e);
//   }
//   return false;
// }

export async function allocatePayment(paymentId: number) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== 'paid') return;
    if (payment.allocated >= payment.amount) return;

    let remaining = payment.amount - payment.allocated;

    const schedules = await tx.rentSchedule.findMany({
      where: {
        tenantId: payment.tenantId,
        propertyId: payment.propertyId,
        status: { in: ['scheduled', 'overdue', 'partial'] },
      },
      orderBy: { dueDate: 'asc' },
    });

    for (const sched of schedules) {
      if (remaining <= 0) break;

      const totalDue = sched.amount + (sched.lateFeeAmount || 0);
      const balance = totalDue - sched.allocatedAmount;

      if (balance <= 0) continue;

      const allocation = Math.min(balance, remaining);

      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          scheduleId: sched.id,
          amount: allocation,
        },
      });

      await tx.rentSchedule.update({
        where: { id: sched.id },
        data: {
          allocatedAmount: { increment: allocation },
          status:
            allocation === balance
              ? 'paid'
              : 'partial',
        },
      });

      remaining -= allocation;
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        allocated: payment.amount - remaining,
      },
    });
    if (remaining > 0) {
      await tx.user.update({
        where: { id: payment.tenantId },
        data: { creditBalance: { increment: remaining } },
      });
    }
  });
}

export async function ensureNotProcessed(referenceId: string) {
  const existing = await db.payment.findUnique({ where: { referenceId } });
  if (existing?.status === 'paid') {
    throw new Error('Already processed');
  }
}

export async function sendReceipt(paymentId: number) {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { tenant: { select: { name: true, email: true } }, property: { select: { title: true } } },
    });
    if (!payment?.tenant?.email) return;

    const mailOptions = {
      from: `"Nexus Rent" <${process.env.SMTP_USER}>`,
      to: payment.tenant.email,
      subject: `Rent Receipt #${payment.referenceId}`,
      html: `
<!DOCTYPE html>
<html>
<head><title>Rent Receipt</title></head>
<body>
  <h1>Rent Payment Receipt</h1>
  <p><strong>Tenant:</strong> ${payment.tenant.name}</p>
  <p><strong>Property:</strong> ${payment.property.title}</p>
  <p><strong>Amount:</strong> KES ${payment.amount.toLocaleString()}</p>
  <p><strong>Late Fee:</strong> KES ${(payment.lateFee || 0).toLocaleString()}</p>
  <p><strong>Total Paid:</strong> KES ${(payment.amount + (payment.lateFee || 0)).toLocaleString()}</p>
  <p><strong>Method:</strong> ${payment.method.toUpperCase()}</p>
  <p><strong>Date:</strong> ${payment.paidAt?.toLocaleString()}</p>
  <p><strong>Ref:</strong> ${payment.referenceId}</p>
  <hr>
  <p>Thank you for your payment!</p>
</body>
</html>      
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Receipt sent to ${payment.tenant.email}`);
  } catch (e) {
    console.error('Receipt failed', e);
  }
}

async function dispatchReminder(
  sched: {
    id: number;
    amount: number;
    lateFeeAmount: number | null;
    dueDate: Date;
    status: string;
    tenant: { id: number; name: string; email: string; phone: string | null };
    property: { title: string };
  }
): Promise<{ email: boolean; whatsapp: boolean }> {
  const result = { email: false, whatsapp: false };

  const dueDateStr = new Date(sched.dueDate).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  });

  const lateFeeNote = sched.lateFeeAmount
    ? ` + KES ${sched.lateFeeAmount.toLocaleString()} late fee`
    : "";

  const overdueNote = sched.status === "overdue" ? "⚠️ This payment is OVERDUE.\n" : "";

  const message = `${overdueNote}Hi ${sched.tenant.name}, this is a reminder that your rent of KES ${sched.amount.toLocaleString()}${lateFeeNote} for ${sched.property.title} is due on ${dueDateStr}. Please pay at your earliest convenience.`;

  // ── Email ──
  if (sched.tenant.email) {
    try {
      await transporter.sendMail({
        from: `"Nexus Rent" <${process.env.SMTP_USER}>`,
        to: sched.tenant.email,
        subject: `Rent Reminder — ${sched.property.title}`,
        html: `
          <h2>Rent Payment Reminder</h2>
          <p>Dear ${sched.tenant.name},</p>
          <p>Your rent of <strong>KES ${sched.amount.toLocaleString()}</strong>${lateFeeNote}
             for <strong>${sched.property.title}</strong> is due on
             <strong>${dueDateStr}</strong>.</p>
          ${sched.status === "overdue"
            ? `<p style="color:red;"><strong>⚠️ This payment is overdue.</strong></p>`
            : ""}
          <p>Please make your payment at your earliest convenience.</p>
        `,
      });
      result.email = true;
    } catch (e) {
      console.error(`Email failed for tenant ${sched.tenant.id}:`, e);
    }
  }

  // ── WhatsApp ──
  if (sched.tenant.phone) {
    try {
      const raw = sched.tenant.phone.replace(/\s+/g, "");
      const e164 = raw.startsWith("+")
        ? raw
        : raw.startsWith("0")
          ? `+254${raw.slice(1)}`
          : `+${raw}`;

      console.log("📱 Attempting WhatsApp to:", e164);

      const response = await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM!,
        to: `whatsapp:${e164}`,
        contentSid: process.env.TWILIO_WHATSAPP_CONTENT_SID!,
        contentVariables: JSON.stringify({
          "1": new Date(sched.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
          "2": `KES ${sched.amount.toLocaleString()}`,
        }),
      });

      console.log("✅ WhatsApp sent! SID:", response.sid, "Status:", response.status);
      result.whatsapp = true;
    } catch (e: any) {
      console.error("❌ WhatsApp failed for tenant", sched.tenant.id);
      console.error("   Code:", e.code);
      console.error("   Message:", e.message);
      console.error("   More info:", e.moreInfo);
    }
  }

  // ── Mark as reminded so it won't be re-queued ──
  await db.rentSchedule.update({
    where: { id: sched.id },
    data: { reminderSentAt: new Date() },
  });

  // ── In-app notification ──
  await db.notification.create({
    data: {
      title: "Rent Reminder",
      message: `KES ${sched.amount.toLocaleString()} due ${dueDateStr}`,
      recipientIds: [sched.tenant.id.toString()],
    },
  }).catch(console.error);

  return result;
}

export async function sendDueReminders(): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const threeDaysFromNow = new Date(todayStart.getTime() + 3 * 24 * 60 * 60 * 1000);

  const schedules = await db.rentSchedule.findMany({
    where: {
      status: "scheduled",
      reminderSentAt: null,
      dueDate: {
        gte: todayStart,
        lt: threeDaysFromNow,
      },
    },
    include: {
      tenant: { select: { id: true, email: true, name: true, phone: true } },
      property: { select: { title: true } },
    },
  });

  let sent = 0;
  for (const sched of schedules) {
    const { email, whatsapp } = await dispatchReminder(sched);
    if (email || whatsapp) sent++;
  }
  return sent;
}

export async function sendManualReminders(scheduleIds?: number[]): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const where: any = {
    status: { in: ["scheduled", "overdue", "partial"] },
    OR: [
      { reminderSentAt: null },
      { reminderSentAt: { lt: todayStart } },
    ],
  };

  if (scheduleIds?.length) where.id = { in: scheduleIds };

  const schedules = await db.rentSchedule.findMany({
    where,
    include: {
      tenant: { select: { id: true, email: true, name: true, phone: true } },
      property: { select: { title: true } },
    },
  });

  let sent = 0;
  for (const sched of schedules) {
    const { email, whatsapp } = await dispatchReminder(sched);
    if (email || whatsapp) sent++;
  }
  return sent;
}

// Bank Transfers
export async function initiateBankTransfer(propertyId: number, tenantId: number, amount: number, accountRef: string) {
  const ref = `NEXUS-BANK-${propertyId}-${tenantId}-${Math.floor(Date.now() / 1000).toString().slice(-6)}`;
  await db.payment.create({
    data: {
      tenantId,
      propertyId,
      amount,
      method: 'bank',
      status: 'pending',
      referenceId: ref,
      metadata: {
        instructions: `Pay KES ${amount.toLocaleString()} to Equity Bank Acc #0123456789. Reference: ${ref}`,
        accountRef,
      },
    },
  });
  return { success: true, ref, instructions: `Reference: ${ref}` };
}

export async function resolveFromReference(ref: string) {
  return db.paymentReference.findUnique({
    where: { reference: ref },
  });
}

// Airtel Money (placeholder - integrate Airtel API)
export async function initiateAirtelSTK(params: InitiateMpesaSTK): Promise<PaymentResult> {
  // TODO: https://africa.airtel.com/business/api-documentation/money
  // Similar to M-Pesa
  console.log('Airtel STK placeholder', params);
  return { success: false, error: 'Airtel integration coming soon' };
}

// Cron helper
export async function startCronJobs() {
  const cron = await import('node-cron');
  cron.schedule('0 9 * * *', applyLateFees);
  cron.schedule('0 0 1 * *', generateMonthlySchedules);
}
