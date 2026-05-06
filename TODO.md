- [ ] Add ledger models to Prisma schema (MainAccount, VendorAccount, AccountBalance, LedgerEntry)
- [ ] Extend Expense model (mpesaPaidTo, paymentStatus/paidAt)
- [ ] Create backend routes for expenses: list/create/pay
- [ ] Implement pay logic: debit main account, credit vendor account (transaction + idempotency)
- [ ] Implement “main account” credits when rent payments are allocated (credit when tenant pays)

- [ ] Update frontend expenses page: load real expenses, add mpesaPaidTo input, add Pay button
- [ ] Update shared frontend types
- [ ] Run prisma migrate + start backend/frontend and manually verify flow

