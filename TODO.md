# Lease CRUD Implementation

## Database
- [x] Update `backend/prisma/schema.prisma` - Expand Lease model
- [x] Create migration SQL file

## Backend
- [x] Create `backend/src/routes/leases.ts` - CRUD + signed doc upload
- [x] Register routes in `backend/src/index.ts`

## Frontend Types
- [x] Create `frontend/types/lease.ts`

## Frontend Store
- [x] Update `frontend/app/store/adminStore.ts` - Add lease methods

## Frontend Components
- [x] Create `frontend/app/components/leases/LeaseForm.tsx`
- [x] Create `frontend/app/components/leases/LeaseTable.tsx`
- [x] Create `frontend/app/components/leases/LeaseAgreementTemplate.tsx`

## Frontend Pages
- [x] Create `frontend/app/leases/page.tsx`
- [x] Create `frontend/app/leases/new/page.tsx`
- [x] Create `frontend/app/leases/[id]/page.tsx`
- [x] Create `frontend/app/leases/[id]/print/page.tsx`
- [x] Create `frontend/app/leases/layout.tsx`

## Navigation
- [x] Update `frontend/app/components/layout/Sidebar.tsx`

## Followup
- [x] Run `npx prisma db push` (succeeded — DB is in sync)
- [ ] Stop backend server, run `npx prisma generate`, then restart backend
- [ ] Test full flow

