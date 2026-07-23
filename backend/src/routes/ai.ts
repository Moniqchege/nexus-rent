import { Router, Response } from 'express';
import { db } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth-types.js';
import { callLLM } from '../services/aiService.js';

const router = Router();

// ==========================================
// TASK 1: Chatbot Context & Conversation
// ==========================================
router.post('/chat', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Retrieve active tenant context
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        userProperties: {
          include: { property: true }
        },
        leaseTenants: {
          include: {
            lease: {
              include: { property: true }
            }
          }
        },
        rentSchedules: {
          orderBy: { dueDate: 'asc' }
        },
        payments: {
          orderBy: { paidAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User context not found' });
    }

    const activeLeaseRelation = user.leaseTenants.find(lt => lt.lease.status === 'active');
    const lease = activeLeaseRelation?.lease;
    const property = lease?.property || user.userProperties[0]?.property;
    const rentSchedules = user.rentSchedules || [];
    const payments = user.payments || [];

    const context = {
      tenantName: user.name,
      tenantPhone: user.phone || 'N/A',
      propertyName: property?.title || 'N/A',
      propertyLocation: property?.location || 'N/A',
      monthlyRent: lease?.rentAmount || property?.price || 'N/A',
      leaseStart: lease?.startDate ? new Date(lease.startDate).toLocaleDateString() : 'N/A',
      leaseEnd: lease?.endDate ? new Date(lease.endDate).toLocaleDateString() : 'N/A',
      paymentHistory: payments.slice(0, 5).map(p => ({
        amount: p.amount,
        status: p.status,
        paidAt: p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A',
        lateFee: p.lateFee || 0
      })),
      dueSchedules: rentSchedules.filter(s => s.status !== 'PAID').slice(0, 3).map(s => ({
        dueDate: new Date(s.dueDate).toLocaleDateString(),
        amount: s.amount,
        status: s.status
      }))
    };

    const systemPrompt = `You are a professional, empathetic tenant assistant named "Nexus Orion" for the property management platform.
Answer the tenant's question accurately and helpfully based ONLY on the following tenant context:
${JSON.stringify(context, null, 2)}

If the user asks about something not provided in the context, politely let them know you don't have access to that information. Keep answers empathetic and concise.`;

    let reply: string;
    try {
      reply = await callLLM(systemPrompt, message);
    } catch (llmError) {
      console.warn('⚠️ Chatbot LLM call failed. Using local fallback.', llmError);

      // EMPATHETIC LOCAL FALLBACK
      const q = message.toLowerCase();
      if (q.includes('rent') || q.includes('due') || q.includes('payment')) {
        const nextDue = context.dueSchedules[0]
          ? `Your next payment of Ksh ${context.dueSchedules[0].amount.toLocaleString()} is due on ${context.dueSchedules[0].dueDate} (${context.dueSchedules[0].status}).`
          : 'You have no outstanding schedules.';
        reply = `Hi ${user.name}, your monthly rent is Ksh ${(context.monthlyRent || 0).toLocaleString()}. ${nextDue}`;
      } else if (q.includes('lease') || q.includes('contract')) {
        reply = `Your lease for "${context.propertyName}" is active from ${context.leaseStart} to ${context.leaseEnd}.`;
      } else if (q.includes('property') || q.includes('home') || q.includes('apartment')) {
        reply = `You are registered at "${context.propertyName}" located in ${context.propertyLocation}.`;
      } else if (q.includes('score') || q.includes('rating')) {
        reply = `Your payment records show ${context.paymentHistory.length} recent transactions. Keep paying on time to maintain a great credit profile!`;
      } else {
        reply = `Hello! I am Nexus Orion, your property assistant. I can help with information about your rent, lease, property details, and payment schedules. How can I assist you today?`;
      }
    }

    res.json({ reply });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});


// ==========================================
// TASK 2: AI Rent Pricing Engine
// ==========================================
router.get('/pricing/recommend', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.query;

    let targetPropertyId: number;
    if (propertyId) {
      targetPropertyId = parseInt(propertyId as string, 10);
    } else {
      const firstProperty = await db.property.findFirst({ select: { id: true } });
      if (!firstProperty) {
        return res.status(404).json({ error: 'No properties found in database' });
      }
      targetPropertyId = firstProperty.id;
    }

    const property = await db.property.findUnique({
      where: { id: targetPropertyId },
      include: {
        payments: true,
        expenses: true,
        Review: { include: { user: true } },
        leases: { where: { status: 'active' } }
      }
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Aggregate history parameters
    const totalPayments = property.payments.length;
    const latePayments = property.payments.filter(p => p.lateFee && p.lateFee > 0).length;
    const paymentConsistency = totalPayments > 0 ? ((totalPayments - latePayments) / totalPayments) * 100 : 100;

    const totalExpenses = property.expenses.reduce((sum, e) => sum + e.amount, 0);
    const reviews = property.Review.map(r => `Rating: ${r.rating}, Comment: ${r.comment}`).join('\n');
    const averageReviewRating = property.Review.length > 0
      ? property.Review.reduce((sum, r) => sum + r.rating, 0) / property.Review.length
      : property.rating || 4.5;

    const systemPrompt = `You are a real estate pricing analyst AI. Recommend rent changes based on:
1. Baseline asset value: ${property.price} (Score: ${property.score || 80}/100)
2. Income consistency: ${paymentConsistency.toFixed(1)}% on-time payments
3. Maintenance Expenses: Ksh ${totalExpenses}
4. User Sentiment Reviews:
${reviews}

Provide a JSON-only response with keys: "suggestedRent" (number), "demandScore" (number between 1-100), "churnRisk" (number between 1-100), and "explanation" (string).`;

    let recommendation;
    try {
      const aiResponse = await callLLM(systemPrompt, 'Calculate property pricing recommendation.');
      // Extract JSON in case AI wrapped it in markdown
      const cleanedJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      recommendation = JSON.parse(cleanedJson);
    } catch (llmError) {
      console.warn('⚠️ Pricing LLM call failed. Using local calculations.', llmError);

      // DETERMINISTIC CALCULATION FALLBACK
      const sentimentMultiplier = averageReviewRating >= 4 ? 1.10 : averageReviewRating >= 3 ? 1.02 : 0.95;
      const expenseImpact = totalExpenses > property.price * 1.5 ? 1.05 : 1.0;
      const calculatedRent = Math.round(property.price * sentimentMultiplier * expenseImpact);

      recommendation = {
        suggestedRent: Math.max(property.price * 0.9, Math.min(property.price * 1.3, calculatedRent)),
        demandScore: Math.round(property.score || (75 + (averageReviewRating * 3))),
        churnRisk: Math.round(Math.max(10, Math.min(90, 20 + (latePayments * 10) - (averageReviewRating * 5)))),
        explanation: 'Local analytical pricing calculations adjusted for customer sentiment and operational costs.'
      };
    }

    res.json({
      propertyId: property.id,
      title: property.title,
      currentRent: property.price,
      ...recommendation
    });
  } catch (error: any) {
    console.error('Pricing engine error:', error);
    res.status(500).json({ error: 'Failed to calculate pricing recommendation' });
  }
});


// ==========================================
// TASK 3: Tenant Risk Scoring Engine
// ==========================================
router.get('/risk-score/:tenantId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    if (isNaN(tenantId)) {
      return res.status(400).json({ error: 'Valid tenantId is required' });
    }

    const tenant = await db.user.findUnique({
      where: { id: tenantId },
      include: {
        rentSchedules: true,
        payments: true,
        reviews: true
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Quantify risk inputs
    const totalSchedules = tenant.rentSchedules.length;
    const overdueSchedules = tenant.rentSchedules.filter(s => s.status === 'OVERDUE').length;
    const latePayments = tenant.payments.filter(p => p.lateFee && p.lateFee > 0).length;
    const totalLateFee = tenant.rentSchedules.reduce((sum, s) => sum + (s.lateFeeAmount || 0), 0);
    const avgLateFee = latePayments > 0 ? totalLateFee / latePayments : 0;

    const poorReviewCount = tenant.reviews.filter(r => r.rating <= 2).length;

    // Deterministic formula
    let riskScore = 15; // Base risk
    riskScore += overdueSchedules * 20; // +20 points per overdue schedule
    riskScore += latePayments * 10;     // +10 points per late payment
    if (avgLateFee > 1000) riskScore += 15;
    riskScore += poorReviewCount * 15;

    // Normalize risk score to 1-100
    riskScore = Math.max(1, Math.min(100, riskScore));

    let riskCategory: 'Low' | 'Medium' | 'High' = 'Low';
    if (riskScore > 65) {
      riskCategory = 'High';
    } else if (riskScore > 30) {
      riskCategory = 'Medium';
    }

    // LLM Explanation
    const systemPrompt = `You are a tenant risk assessment model. Write a concise, 1-sentence risk summary for tenant "${tenant.name}" who has:
- Overdue Schedules: ${overdueSchedules}
- Late Payments: ${latePayments}
- Avg Late Fee: Ksh ${avgLateFee}
- Low Rating Reviews: ${poorReviewCount}
- Computed Risk Score: ${riskScore}/100 (${riskCategory} Risk)

Provide a brief, professional summary explaining this evaluation.`;

    let explanation: string;
    try {
      explanation = await callLLM(systemPrompt, 'Summarize tenant risk evaluation.');
    } catch {
      explanation = overdueSchedules > 0
        ? 'Risk is elevated due to active overdue rent balances.'
        : 'Tenant demonstrates highly consistent payment patterns with minimal late incidents.';
    }

    res.json({
      tenantId,
      name: tenant.name,
      riskScore,
      riskCategory,
      explanation
    });
  } catch (error: any) {
    console.error('Risk scoring error:', error);
    res.status(500).json({ error: 'Failed to calculate tenant risk score' });
  }
});


// ==========================================
// TASK 4: Smart Expense Anomaly Detection
// ==========================================
router.get('/expenses/anomalies', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const expenses = await db.expense.findMany({
      include: { property: true }
    });

    const anomalies: any[] = [];

    // Group expenses by property + category
    const grouped: Record<string, typeof expenses> = {};
    for (const exp of expenses) {
      const key = `${exp.propertyId}-${exp.category}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(exp);
    }

    // 1. Detect Category Spending Spikes
    for (const [key, list] of Object.entries(grouped)) {
      // Use only records within the 90-day window for the baseline
      const cutOff = new Date();
      cutOff.setDate(cutOff.getDate() - 90);

      const windowRecords = list.filter(e => new Date(e.date) >= cutOff);
      if (windowRecords.length < 3) continue; // Needs rolling average baseline

      const amounts = windowRecords.map(l => l.amount);
      const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev === 0) continue;

      for (const exp of windowRecords) {
        if (exp.amount > mean + 2 * stdDev) {
          anomalies.push({
            id: `spike-${exp.id}`,
            propertyId: exp.propertyId,
            propertyTitle: exp.property.title,
            severity: exp.amount > mean + 3 * stdDev ? 'CRITICAL' : 'WARNING',
            message: `Spending spike in "${exp.category}" at ${exp.property.title}: Ksh ${exp.amount.toLocaleString()} is significantly higher than average (Ksh ${Math.round(mean).toLocaleString()}).`,
            confidenceScore: 0.88
          });
        }
      }
    }

    // 2. Detect Duplicate Invoice Amounts (within 7 days for same property + vendor/amount)
    for (let i = 0; i < expenses.length; i++) {
      for (let j = i + 1; j < expenses.length; j++) {
        const e1 = expenses[i];
        const e2 = expenses[j];

        if (
          e1.propertyId === e2.propertyId &&
          e1.amount === e2.amount &&
          e1.category === e2.category &&
          (e1.vendorName || e1.vendorAccountId) &&
          (e1.vendorName === e2.vendorName || e1.vendorAccountId === e2.vendorAccountId)
        ) {
          const d1 = new Date(e1.date).getTime();
          const d2 = new Date(e2.date).getTime();
          const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);

          if (diffDays <= 7) {
            anomalies.push({
              id: `dup-${e1.id}-${e2.id}`,
              propertyId: e1.propertyId,
              propertyTitle: e1.property.title,
              severity: 'WARNING',
              message: `Potential duplicate vendor invoice detected: Two expenses of Ksh ${e1.amount.toLocaleString()} for "${e1.vendorName || 'same vendor'}" submitted within ${Math.ceil(diffDays)} days.`,
              confidenceScore: 0.95
            });
          }
        }
      }
    }

    res.json(anomalies);
  } catch (error: any) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ error: 'Failed to scan financial anomalies' });
  }
});


// ==========================================
// TASK 5: Intelligent Notification Drafting Assistant
// ==========================================
router.post('/notifications/draft', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { templateType, landlordInput } = req.body;

    if (!templateType || !landlordInput) {
      return res.status(400).json({ error: 'templateType and landlordInput are required' });
    }

    const systemPrompt = `You are a professional property management communications assistant. Your job is to write clear, specific, tenant-facing notification messages.

The landlord has provided these instructions: "${landlordInput}"
Notification type hint: "${templateType}"

Rules:
- Write directly about what the landlord described. Do NOT use generic placeholders.
- The message must naturally incorporate all the specific details (dates, times, services affected, reasons) from the instructions.
- Write in a warm, professional tone. Do NOT use section labels like "Schedule and Impact:" or "Details:".
- Keep the message concise — 2 to 4 short paragraphs maximum.
- The title should be specific and descriptive, not generic.

Respond with ONLY a raw JSON object — no markdown, no code fences:
{"title": "...", "message": "..."}`;

    let draft;
    try {
      const aiResponse = await callLLM(systemPrompt, `Write a notification: ${landlordInput}`);
      const cleanedJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);
      if (
        typeof parsed.title === 'string' && parsed.title.trim().length > 0 &&
        typeof parsed.message === 'string' && parsed.message.trim().length > 0
      ) {
        draft = { title: parsed.title.trim(), message: parsed.message.trim() };
      } else {
        throw new Error('LLM response missing required title or message fields');
      }
    } catch (llmError) {
      console.warn('⚠️ Notification LLM call failed. Using local backup composer.', llmError);

      // LOCAL FALLBACK — uses landlordInput as the natural body, no labeled fields
      if (templateType.toLowerCase().includes('rent') && (templateType.toLowerCase().includes('increase') || templateType.toLowerCase().includes('adjust'))) {
        draft = {
          title: 'Notice of Rent Adjustment',
          message: `Dear Residents,\n\n${landlordInput}\n\nIf you have any questions about this change, please do not hesitate to reach out to the management office. We value your tenancy and appreciate your understanding.\n\nBest regards,\nProperty Management`
        };
      } else if (templateType.toLowerCase().includes('outage') || templateType.toLowerCase().includes('maintenance') || templateType.toLowerCase().includes('water') || templateType.toLowerCase().includes('power')) {
        draft = {
          title: 'Service Maintenance Notice',
          message: `Dear Residents,\n\n${landlordInput}\n\nWe apologize for any inconvenience this may cause and appreciate your patience and cooperation.\n\nBest regards,\nProperty Management`
        };
      } else if (templateType.toLowerCase().includes('survey') || templateType.toLowerCase().includes('feedback')) {
        draft = {
          title: 'Resident Feedback Request',
          message: `Dear Residents,\n\n${landlordInput}\n\nYour feedback helps us improve the living experience for everyone. Thank you for taking the time to respond.\n\nBest regards,\nProperty Management`
        };
      } else {
        draft = {
          title: 'Important Notice from Management',
          message: `Dear Residents,\n\n${landlordInput}\n\nThank you for your attention to this matter. Please contact the management office if you have any questions.\n\nBest regards,\nProperty Management`
        };
      }
    }

    res.json(draft);
  } catch (error: any) {
    console.error('Draft assistant error:', error);
    res.status(500).json({ error: 'Failed to draft notification' });
  }
});


// ==========================================
// TASK 6: Lease Expiry & Renewal Intelligence
// ==========================================
router.get('/leases/renewals', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    const minEnd = new Date();
    minEnd.setDate(today.getDate() + 60); // 60-90 day renewal window
    const maxEnd = new Date();
    maxEnd.setDate(today.getDate() + 90);

    const maturingLeases = await db.lease.findMany({
      where: {
        status: 'active',
        endDate: {
          gte: minEnd,
          lte: maxEnd
        }
      },
      include: {
        property: true,
        tenants: {
          include: {
            tenant: {
              include: {
                rentSchedules: true,
                payments: true,
                reviews: true
              }
            }
          }
        }
      }
    });

    const intelligenceList = [];

    for (const lease of maturingLeases) {
      const primaryTenantRelation = lease.tenants[0];
      if (!primaryTenantRelation) continue;
      const tenant = primaryTenantRelation.tenant;

      // 1. Calculate tenant risk score deterministically (matches Requirement 5 formula)
      const overdueSchedules = tenant.rentSchedules.filter(s => s.status === 'OVERDUE').length;
      const latePayments = tenant.payments.filter(p => p.lateFee && p.lateFee > 0).length;
      const totalLateFee = tenant.rentSchedules.reduce((sum, s) => sum + (s.lateFeeAmount || 0), 0);
      const avgLateFee = latePayments > 0 ? totalLateFee / latePayments : 0;
      const poorReviewCount = tenant.reviews.filter(r => r.rating <= 2).length;

      let riskScore = 1;
      riskScore += Math.min(overdueSchedules * 10, 40);
      riskScore += Math.min(latePayments * 5, 30);
      if (avgLateFee > 1000) riskScore += 15;
      riskScore += Math.min(poorReviewCount * 15, 15);
      riskScore = Math.max(1, Math.min(100, riskScore));

      const riskCategory: 'Low' | 'Medium' | 'High' = riskScore > 65 ? 'High' : riskScore > 30 ? 'Medium' : 'Low';

      // 2. Determine flight risk logic
      // Math: tenure length (months)
      const startDate = new Date(lease.startDate);
      const tenureMs = today.getTime() - startDate.getTime();
      const tenureMonths = Math.round(tenureMs / (1000 * 60 * 60 * 24 * 30.4));

      // Flight Risk: if they have good history (Low risk) but long tenure, their risk of relocation is high.
      const isFlightRisk = riskCategory === 'Low' && tenureMonths >= 12;

      // 3. Recommended retention offer
      let incentive = 'Standard renewal lease offer.';
      if (isFlightRisk) {
        incentive = 'Offer 1-year renewal at 2% below projected market rate + complimentary carpet cleaning.';
      } else if (riskCategory === 'High') {
        incentive = 'Require security deposit top-up or standard co-sign agreement on renewal.';
      } else {
        incentive = 'Offer complimentary maintenance checklist service upon renewal.';
      }

      intelligenceList.push({
        leaseId: lease.id,
        propertyId: lease.propertyId,
        propertyTitle: lease.property.title,
        tenantId: tenant.id,
        tenantName: tenant.name,
        endDate: lease.endDate,
        tenureMonths,
        riskScore,
        riskCategory,
        isFlightRisk,
        incentive
      });
    }

    res.json(intelligenceList);
  } catch (error: any) {
    console.error('Lease renewals intelligence error:', error);
    res.status(500).json({ error: 'Failed to evaluate renewal list' });
  }
});

export default router;
