import Stripe from 'stripe';
import axios from 'axios';
import { db } from '../db/prisma.js';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export interface InitiateMpesaSTK {
  phone: string; // 2547xxxxxxxx
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

// M-Pesa Daraja API - Lipa na M-Pesa STK Push
export async function initiateMpesaSTK(params: InitiateMpesaSTK): Promise<PaymentResult> {
  try {
    const { phone, amount, accountRef, propertyId, tenantId, description } = params;

    // 1. Get OAuth token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const tokenRes = await axios.post('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {}, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000,
    });
    const accessToken = tokenRes.data.access_token;

    // 2. STK Push
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const stkRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      BusinessShortCode: process.env.MPESA_SHORTCODE!,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE!,
      PhoneNumber: phone,
      CallBackURL: `${process.env.MPESA_CALLBACK_URL}/api/payments/mpesa/callback`,
      AccountReference: accountRef,
      TransactionDesc: description,
    }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (stkRes.data.ResponseCode === '0') {
      // Create pending Payment
      await db.payment.create({
        data: {
          tenantId,
          propertyId,
          amount,
          method: 'mpesa',
          status: 'pending',
          referenceId: stkRes.data.CheckoutRequestID,
          metadata: { phone, description },
        },
      });
      return { success: true, data: stkRes.data };
    }
    return { success: false, error: stkRes.data.errorMessage };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.errorMessage || error.message };
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
  if (paymentIntent.status === 'succeeded') {
    await db.payment.update({
      where: { referenceId: piId },
      data: { status: 'paid', paidAt: new Date() },
    });
    // Update RentSchedule if linked
    // Trigger notification/audit
    return true;
  }
  return false;
}

// Late Fee Automation
export async function applyLateFees() {
  const overdue = await db.rentSchedule.findMany({
    where: {
      status: 'scheduled',
      dueDate: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // >7 days
    },
  });
  for (const sched of overdue) {
    const fee = sched.amount * 0.05; // 5%
    await db.rentSchedule.update({
      where: { id: sched.id },
      data: { status: 'overdue', lateFeeAmount: fee },
    });
    // Notify tenant/landlord
  }
}

// Generate Schedules (cron)
export async function generateMonthlySchedules() {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);

  const activeTenants = await db.tenant.findMany({
    include: { property: true },
  });

  for (const tenant of activeTenants) {
    await db.rentSchedule.create({
      data: {
        propertyId: tenant.propertyId,
        tenantId: tenant.id,
        dueDate: nextMonth,
        amount: tenant.property.price,
        status: 'scheduled',
        period: nextMonth.toISOString().slice(0,7),
      },
    });
  }
}

// Cron helper
export async function startCronJobs() {
  const cron = await import('node-cron');
  cron.schedule('0 9 * * *', applyLateFees); // Daily late fees
  cron.schedule('0 0 1 * *', generateMonthlySchedules); // Monthly schedules
}

