# Mobile-Backend Integration: Display Properties in Explore Tab (Auth-First)
Status: In Progress

## Approved Plan Summary
- User auth first (login with email/password from admin registration).
- Fetch user's properties via protected `/api/properties`.
- Display in explore tab (adapt mock UI).
- Backend port: 4000.

## Step-by-Step Tasks
### 1. ✅ Understand files & create plan (done)
### 2. ✅ Create mobile types & API layer
   - `mobile/types/property.ts`
   - `mobile/lib/api.ts` (fetch with auth headers)
### 3. ✅ Implement auth store & login screen
   - Zustand store (`mobile/store/authStore.ts`)
   - Login page (`mobile/app/login.tsx`)
   - Protect tabs (redirect unauth)
### 4. 🔄 Backend: Add optional public endpoint? (defer)
### 5. ✅ Update explore.tsx: fetch & display real data
### 6. 🔄 Test: expo start --tunnel + backend dev
### 7. ✅ Complete

Next step marked for execution.

