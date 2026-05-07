# TODO - MAIN account + ledger architecture

## Step 1 — Implement system MAIN bootstrap
- Update `backend/src/scripts/seed.ts` to ensure **exactly one** `Account` with `type="MAIN"` exists globally.
- Use seeded admin user (`monicah.tech@gmail.com`) as `ownerUserId`.
- If more than one MAIN exists, fail fast (do not auto-delete).

## Step 2 — Add system MAIN helper
- Add a small helper in `backend/src/services/paymentService.ts` (or shared module) to fetch the system MAIN account inside transactions.

## Step 3 — On payment success: paid + ledger + MAIN credit + allocate
- Update payment success paths:
  - `confirmStripePayment`
  - `handleMpesaCallback`
  - `router.put('/:id/verify')` (or ensure it calls a unified function)
- In one transaction:
  - set `Payment.status='paid'`
  - create `LedgerEntry` with idempotencyKey `PAY:${payment.referenceId}`
  - increment system MAIN `Account.balanceKES`
  - call `allocatePayment(payment.id)`

## Step 4 — Expenses: debit system MAIN
- Update `backend/src/services/expenseService.ts` (`createExpensePay`):
  - fetch system MAIN account globally
  - ensure ledger + debit uses system MAIN

## Step 5 — Idempotency and safety
- Ensure payment webhook/manual verify don’t double-credit MAIN:
  - rely on `LedgerEntry.idempotencyKey` uniqueness
  - still guard with `Payment.status === 'paid'` before ledger write

## Step 6 — Verification
- Run backend and confirm:
  - exactly one MAIN exists after seed
  - payments create ledger + credit MAIN
  - expenses create ledger + debit MAIN

