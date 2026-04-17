import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth-types.js';
import { audit } from '../middleware/audit.js';
import { db } from '../db/prisma.js';
import { initiateMpesaSTK, createStripeSession, confirmStripePayment } from '../services/paymentService.js';

const router = Router();

router.use(requireAuth);

// GET /api/payments?propertyId=&status=
router.get('/', audit({ action: 'view_payments', title: 'Payments' }), async (req: Request, res: Response) => {
  try {
    const { propertyId, tenantId, status } = req.query;
    const where: any = {};
    if (propertyId) where.propertyId = Number(propertyId);
    if (tenantId) where.tenantId = Number(tenantId);
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

// GET /api/payments/schedules?status=overdue
router.get('/schedules', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { status } = req.query;
    const where: any = { 
      property: { landlordId: authReq.userId! } 
    };
    if (status) where.status = status;

    const schedules = await db.rentSchedule.findMany({
      where,
      include: { tenant: true, property: { select: { title: true } }, payment: true },
      orderBy: { dueDate: 'asc' },
    });
    res.json({ schedules });
  } catch (error) {
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
        return res.json(result); // ✅ audit triggers here
      } else {
        return res.status(400).json(result); // ✅ audit logs FAILED
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message }); // ✅ audit logs FAILED
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

// POST /api/payments/mpesa/callback (webhook)
// router.post('/mpesa/callback', async (req: Request, res: Response) => {
//   try {
//     const body = req.body.Body.stkCallback;
//     if (body.ResultCode === 0 && body.CallbackMetadata) {
//       const item = body.CallbackMetadata.Item[0];
//       const checkoutId = body.CheckoutRequestID;
//       const amount = item.Value;

//       await db.payment.update({
//         where: { referenceId: checkoutId },
//         data: { status: 'paid', paidAt: new Date(), metadata: { ...body } },
//       });
//       // TODO: SSE notify landlord, audit log
//     }
//     res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
//   } catch (error) {
//     console.error('M-Pesa callback error:', error);
//     res.status(500).json({ ResultCode: 1, ResultDesc: 'Failed' });
//   }
// });

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

export default router;

