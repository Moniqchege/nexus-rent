# Payment Implementation - Nexus Rent

## Current Progress
✅ Plan approved with real-time, late fees, unified UI, accounting export

## TODO Steps (Phase 1: Backend)

### 1. Database Schema
- [x] Update schema.prisma with Payment + RentSchedule models
- [ ] npx prisma migrate dev --name add_payments_reminders
- [ ] npx prisma generate

### 2. Backend Services & Routes
- [ ] Create backend/src/services/paymentService.ts (Stripe/M-Pesa)
- [ ] Create backend/src/routes/payments.ts
- [ ] Edit backend/src/index.ts (mount routes, cron job)
- [ ] Edit backend/src/routes/notifications.ts (reminders/SSE)

### 3. Frontend & Mobile
- [ ] Edit mobile/lib/api.ts + create mobile/app/(tabs)/pay.tsx
- [ ] Edit frontend/app/payments/page.tsx + types
- [ ] Add SSE listeners (unified real-time)

### 4. Testing & Polish
- [ ] User provides API keys (M-Pesa/STRIPE)
- [ ] Test payments, cron reminders, late fees (5% after 7d)
- [ ] CSV export for accounting
- [ ] Full e2e test

**Next: Schema update → migrate**

