# Lease Document Feature Implementation

## Step 1: Update Prisma Schema [✅ DONE]
- Add `leaseDocument String?` to User model in backend/prisma/schema.prisma

## Step 2: Prisma Migration [PENDING]
- Run `cd backend && npx prisma migrate dev --name add_lease_document`

## Step 3: Update Backend users.ts [✅ DONE]
- Extend GET /users and /:id to select leaseDocument
- Update POST /users: Accept leaseDocument, validate required if any propertyAssignment role.name === 'Tenant'

## Step 4: Update mobile/lib/api.ts [PENDING]
- No new endpoint, but ensure user fetch includes leaseDocument (reuse authStore fetch)

## Step 5: Update mobile/app/(tabs)/home.tsx [✅ DONE]
- Access user.leaseDocument from authStore
- On 'My Lease' press: if exists, Linking.openURL(leaseDocument); else alert/upload

## Step 6: Test & Cleanup [PENDING]
- Backend: Create tenant user with/without lease
- Mobile: Login tenant, check home button opens lease doc
- Mark TODO complete

