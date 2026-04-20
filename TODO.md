# Payment & Management Features - Nexus Rent

## Approved Plan Progress
✅ Schema analysis & payments foundation exists
✅ Services/routes partial (M-Pesa STK, Stripe cards, cron late fees/schedules)

## TODO Steps

### Phase 1: Backend Schema & DB ✅
- [x] 1. Add Expense model to schema.prisma → prisma migrate dev --name add_expense → prisma generate (fixed relation)

### Phase 2: Backend Endpoints ✅ (5/5)
- [x] 2. Enhance paymentService.ts: Enable M-Pesa callback logic, add Airtel STK, bank transfer refs, auto-reconcile to RentSchedule, receipt generation
- [x] 3. Update routes/payments.ts: M-Pesa webhook, /airtel /bank /verify /receipt /reports CSV
- [x] 4. Add reminder cron to paymentService.ts (email 3d before due)
- [x] 5. SSE for dashboard (poll stub)

### Phase 3: Frontend/Mobile & Tenant Portal
- [ ] 6. Frontend: payments/page.tsx tenant view, dashboard reports
- [ ] 7. Mobile: pay screen with Airtel/bank, statements
- [ ] 8. Digital receipts download

### Phase 4: Testing & Polish
- [ ] 9. Set env vars (MPESA live, Airtel, Twilio SMS?, SMTP)
- [ ] 10. Test end-to-end: payments, reminders, reports, late fees
- [ ] 11. CSV/KRA export validation

**Current Step: 1/11 - Schema update.** Provide API keys when ready.

**Run after edits:** npx prisma migrate dev --name add_expense && npx prisma generate && npm run dev

