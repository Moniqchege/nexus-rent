import express from "express";
import Stripe from 'stripe';
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth-types.js';
import { audit } from '../middleware/audit.js';
import { db } from '../db/prisma.js';
import { initiateMpesaSTK, createStripeSession, confirmStripePayment, handleMpesaCallback, initiateAirtelSTK, initiateBankTransfer, sendReceipt, allocatePayment, resolveFromReference } from '../services/paymentService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

const router = Router();

router.use(requireAuth);

// GET /api/payments?propertyId=&status=
router.get('/', audit({ action: 'view_payments', title: 'Payments' }), async (req: Request, res: Response) => {
  try {
    const { propertyId, tenantId, status } = req.query;
    const where: any = {};
    if (propertyId) where.propertyId = parseInt(propertyId as string, 10);
    if (tenantId) where.tenantId = parseInt(tenantId as string, 10);
    if (status) where.status = status;

    const payments = await db.payment.findMany({
      where,
      include: { tenant: { select: { name: true } }, property: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/payments/schedules
// GET /api/payments/schedules
router.get('/schedules', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { status, leaseId, propertyId, tenantId } = req.query; 

    const where: any = {
      property: { landlordId: authReq.userId! }
    };

    if (leaseId) {
      const lease = await db.lease.findFirst({
        where: {
          id: Number(leaseId),
          property: { landlordId: authReq.userId! }
        },
        select: { propertyId: true, tenants: { select: { tenantId: true } } }
      });

      if (!lease) {
        return res.status(404).json({ error: 'Lease not found' });
      }

      // If tenantId is also provided, scope to just that tenant (must be on the lease)
      if (tenantId) {
        const parsed = parseInt(tenantId as string, 10);
        const isOnLease = lease.tenants.some((t) => t.tenantId === parsed);
        if (!isNaN(parsed) && isOnLease) {
          where.tenantId = parsed;
        } else {
          return res.status(403).json({ error: 'Tenant not on this lease' });
        }
      } else {
        // No tenantId — return all tenants on the lease
        where.tenantId = { in: lease.tenants.map((t) => t.tenantId) };
      }

      where.propertyId = lease.propertyId;
    }

    // Standalone tenantId filter (no leaseId) — landlord can query a tenant directly
    if (!leaseId && tenantId) {
      const parsed = parseInt(tenantId as string, 10);
      if (!isNaN(parsed)) where.tenantId = parsed;
    }

    if (propertyId) where.propertyId = parseInt(propertyId as string, 10);
    if (status) where.status = status as string;

    const schedules = await db.rentSchedule.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, email: true, phone: true } },
        property: { select: { id: true, title: true, location: true } },
        payment: true,
        allocations: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json({ schedules });
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// POST /api/payments/mpesa
router.post(
  '/mpesa',
  audit({
    action: 'mpesa_initiated',
    title: 'M-Pesa STK Push',
    metadata: (req) => req.body,
  }),
  async (req: Request, res: Response) => {
    try {
      const result = await initiateMpesaSTK({
        ...req.body,
        tenantId: Number(req.body.tenantId),
        propertyId: Number(req.body.propertyId),
      });

      if (result.success) {
        return res.json(result); 
      } else {
        return res.status(400).json(result); 
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message }); 
    }
  }
);

// POST /api/payments/card/session
router.post('/card/session', async (req: Request, res: Response) => {
  try {
    const session = await createStripeSession(
      Number(req.body.propertyId),
      Number(req.body.tenantId),
      Number(req.body.amount),
      req.body.accountRef,
    );
    res.json({ clientSecret: session.client_secret, id: session.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments/card/confirm
router.post('/card/confirm', async (req: Request, res: Response) => {
  try {
    const success = await confirmStripePayment(req.body.piId, Number(req.body.tenantId), Number(req.body.propertyId));
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Payment failed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Confirm failed' });
  }
});

router.post('/mpesa/callback', async (req: Request, res: Response) => {
  try {
    const result = await handleMpesaCallback(req.body);
    if (result.success) {
      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } else {
      res.status(400).json({ ResultCode: 1, ResultDesc: result.error || 'Failed' });
    }
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Processing failed' });
  }
});

// POST /api/payments/airtel
router.post('/airtel', async (req: Request, res: Response) => {
  try {
    const result = await initiateAirtelSTK({
      ...req.body,
      tenantId: Number(req.body.tenantId),
      propertyId: Number(req.body.propertyId),
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments/bank
router.post('/bank', async (req: Request, res: Response) => {
  try {
    const result = await initiateBankTransfer(
      Number(req.body.propertyId),
      Number(req.body.tenantId),
      Number(req.body.amount),
      req.body.accountRef
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/payments/:id/verify - Manual bank verify
router.put('/:id/verify', audit({ action: 'payment_verified', title: 'Manual Verify' }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.payment.update({
      where: { id: Number(id) },
      data: { status: 'paid', paidAt: new Date() },
    });
    await allocatePayment(Number(id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Verify failed' });
  }
});

// POST /api/payments/:id/receipt - Resend receipt
router.post('/:id/receipt', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await sendReceipt(Number(id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Receipt send failed' });
  }
});

// GET /api/payments/reports?propertyId=&month=2024-04 - KRA/P&L CSV
router.get('/reports', audit({ action: 'generate_report', title: 'Financial Report' }), async (req: Request, res: Response) => {
  try {
    const { propertyId, month } = req.query;
    const pid = Number(propertyId);
    const monthStart = month ? new Date(`${month}-01`) : new Date();
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    const [paymentsTotal, arrearsTotal, expensesTotal] = await Promise.all([
      db.payment.aggregate({
        where: {
          propertyId: pid,
          status: 'paid',
          paidAt: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      }),
      db.rentSchedule.aggregate({
        where: {
          propertyId: pid,
          status: { in: ['scheduled', 'overdue'] },
          dueDate: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: {
          propertyId: pid,
          date: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    const csv = `Property ID,Month,Revenue,Arrears,Expenses,P&L\n${pid},${month || 'Current'},KES${(paymentsTotal._sum.amount || 0).toLocaleString()},KES${(arrearsTotal._sum.amount || 0).toLocaleString()},KES${(expensesTotal._sum.amount || 0).toLocaleString()},KES${((paymentsTotal._sum.amount || 0) - (expensesTotal._sum.amount || 0)).toLocaleString()}\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-${propertyId}-${month || 'current'}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Report failed' });
  }
});

// GET /sse/payments/:propertyId - Real-time alerts
router.get('/sse/:propertyId', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  // TODO: SSE logic with EventSource
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ time: new Date().toISOString(), message: 'Payment received!' })}\n\n`);
  }, 30000);
  req.on('close', () => clearInterval(interval));
});

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig || typeof sig !== 'string') {
    return res.status(400).send('Missing signature');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Stripe webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as any;

      const payment = await db.payment.findUnique({
        where: { referenceId: pi.id },
      });

      // ✅ Idempotency
      if (!payment || payment.status === 'paid') {
        return res.json({ received: true });
      }

      await db.payment.update({
        where: { referenceId: pi.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          metadata: {
            ...(payment.metadata as object),
            stripeEventId: event.id,
          },
        },
      });

      await allocatePayment(payment.id);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing failed:', err);
    return res.status(500).send('Webhook handler failed');
  }
};

router.post('/mpesa/validation', async (req, res) => {
  // optional validation
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

router.post('/mpesa/confirmation', async (req, res) => {
  const body = req.body;

  const referenceId = body.TransID;

  const existing = await db.payment.findUnique({ where: { referenceId } });
  if (existing) return res.json({ ResultCode: 0 });

  const mapping = await resolveFromReference(body.BillRefNumber);
  if (!mapping) throw new Error('Invalid reference');

  const payment = await db.payment.create({
    data: {
      tenantId: mapping.userId,
      propertyId: mapping.propertyId,
      amount: body.TransAmount,
      method: 'mpesa',
      status: 'paid',
      referenceId,
    },
  });

  await allocatePayment(payment.id);

  res.json({ ResultCode: 0 });
});

router.get('/tenants/:id/statement', async (req, res) => {
  const tenantId = parseInt(req.params.id, 10);
  if (isNaN(tenantId)) return res.status(400).json({ error: 'Invalid tenant ID' });

  const schedules = await db.rentSchedule.findMany({
    where: { tenantId },
    include: { allocations: true },
    orderBy: { dueDate: 'asc' },
  });

  const payments = await db.payment.findMany({
    where: { tenantId, status: 'paid' },
  });

  const ledger = [];

  for (const sched of schedules) {
    ledger.push({
      type: 'charge',
      date: sched.dueDate,
      amount: sched.amount + (sched.lateFeeAmount || 0),
    });

    for (const alloc of sched.allocations) {
      ledger.push({
        type: 'payment',
        date: alloc.createdAt,
        amount: -alloc.amount,
      });
    }
  }

  res.json({ ledger });
});

export default router;

