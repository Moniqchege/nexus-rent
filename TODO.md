# Payments API Integration (Frontend)

✅ Created `docs/payments-api.md` - Full API docs + curl examples  
✅ Created `frontend/app/lib/payments.ts` - React hooks/utils for all endpoints  

## Next Steps
- [ ] Add to `frontend/app/payments/page.tsx` using `getPayments()`, `getRentSchedules()`
- [ ] Stripe Elements integration in payment form
- [ ] Test: `cd frontend && npm run dev`
- [ ] Backend test: Ensure server running `cd backend && npm run dev`

## Usage Example
```tsx
import { getPayments, initiateMpesaSTK } from '@/app/lib/payments';

const payments = await getPayments({ propertyId: 1, status: 'paid' });
const mpesa = await initiateMpesaSTK({
  phone: '254712345678',
  amount: 5000,
  propertyId: 1,
  tenantId: 1,
  accountRef: 'Rent May',
  description: 'Monthly rent'
});
```

