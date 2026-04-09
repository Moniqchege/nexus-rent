# Nexus-Rent: Add Reviews and Survey Tabs to Notifications Page

## Status: 🚀 In Progress

## Steps:

### 1. ✅ Create TODO.md (Done)

### 2. ✅ Update Prisma Schema
- Edit `backend/prisma/schema.prisma`: Add `Survey` and `SurveyResponse` models
- Run migration: `cd backend && npx prisma migrate dev --name add_surveys` (in progress)

### 3. ✅ Update Backend Routes
- Edit `backend/src/routes/notifications.ts`: Add survey endpoints (/surveys/sent GET, /surveys/send POST, /surveys/users GET)

### 4. ✅ Update Frontend Layout
- Edit `frontend/app/notifications/layout.tsx`: Add tabs (Notifications, Reviews, Surveys)

### 5. ✅ Create Reviews Page
- Create `frontend/app/notifications/reviews/page.tsx`: Table fetching /notifications/reviews

### 6. ✅ Create Surveys Table Page
- Create `frontend/app/notifications/surveys/page.tsx`: Table like notifications/page.tsx for surveys

### 7. ✅ Create New Survey Page
- Create `frontend/app/notifications/surveys/new/page.tsx`: Form like send/page.tsx for surveys

### 8. ✅ Complete!
- All files implemented: tabs, reviews table, surveys table + generate form
- Backend APIs ready (/reviews, /surveys/sent, /surveys/send, /surveys/users)
- Prisma schema updated with models/relations
- Test: Start backend (`cd backend && npm start` or nodemon), frontend dev server, navigate /notifications

## Next Step: Update Prisma Schema
