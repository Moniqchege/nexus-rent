# Update Rent Schedule & Payments to Use Lease Data

## Plan
- [ ] Step 1: Update `backend/src/services/paymentService.ts` - `generateMonthlySchedules()` & `applyLateFees()` to use Lease model
- [ ] Step 2: Update `backend/src/routes/leases.ts` - include mapped Tenant record in lease responses
- [ ] Step 3: Update `frontend/types/lease.ts` - add `tenantRecord` field
- [ ] Step 4: Update `frontend/app/payments/initiate/page.tsx` - use real lease data instead of MOCK_TENANTS
- [ ] Step 5: Update `frontend/app/payments/schedules/page.tsx` - fix status handling for real data
- [ ] Step 6: Restart backend and verify

## Information Gathered
- Lease model connects User (tenant), Property, rentAmount, billingCycle, lateFeePercent, graceDays
- Payment/RentSchedule use Tenant.id (not User.id) for tenantId
- Lease.tenantId -> User.id, Payment.tenantId -> Tenant.id
- generateMonthlySchedules currently ignores Lease, uses Property.price
- applyLateFees uses hardcoded 5% and 7 days
- payments/initiate uses MOCK_TENANTS with hardcoded data
