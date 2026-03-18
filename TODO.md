# Notifications Page Implementation TODO

## Phase 1: Backend Data Models 
- ✅ Update `backend/prisma/schema.prisma` with Property, Tenant, Review, Notification models
- ✅ Run migration `cd backend && npx prisma migrate dev --name add-notifications`
- ⏳ Run `cd backend && npx prisma generate`

## Phase 2: Backend APIs
- ✅ Create `backend/src/routes/notifications.ts` with endpoints:
  * GET `/reviews` - landlord's property reviews
  * GET `/tenants` - tenants with properties
  * POST `/send` - send message to tenants
- ✅ Mount route in `backend/src/index.ts`
- [ ] [ ] Test APIs

## Phase 3: Frontend Pages
- ✅ Create `frontend/app/notifications/layout.tsx` (DashboardLayout)
- ✅ Create `frontend/app/notifications/page.tsx`:
  * Tab 1: Tenant Reviews table
  * Tab 2: Send Messages (tenants list + checkboxes + form)
- [ ] Add API calls

## Phase 4: Testing & Seed
- [ ] Seed sample data (tenants, properties, reviews)
- [ ] Test full flow: nav → view reviews → send message
- [ ] Update Sidebar badge logic (optional)

**Next Step: Phase 2 - Create backend notifications route**
