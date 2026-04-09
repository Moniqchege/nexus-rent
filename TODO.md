# Nexus Rent - Notifications Refactor TODO

## Approved Plan Summary
- New send page: `/notifications/send`
- Current notifications page → Sent messages list
- Filter users by Property (apartment) & Floor (add to Property model)
- Users fetched via UserProperty → Property relations

## Steps (0/14 ✅)

### Backend (5 steps)
- [✅] 1. Add `floor: String?` to Property model in `backend/prisma/schema.prisma`
- [✅] 2. Create & run migration: `npx prisma migrate dev --name add_floor_to_property` (Migration 20260408103919 applied)
- [⚠️] 3. `npx prisma generate` (EPERM error, prisma client outdated - run `npm i --save-dev prisma@latest @prisma/client@latest` if needed)
- [✅] 4. Add `GET /notifications/sent` endpoint in `backend/src/routes/notifications.ts` (landlord's sent notifications)
- [✅] 5. Update `GET /notifications/users` with `?propertyId=&floor=` filters via UserProperty join

### Frontend Core (5 steps)
- [✅] 6. Update property components: Add floor to interfaces/display in PropertyCard.tsx, PropertyTable.tsx, PropertyForm.tsx
- [✅] 7. Create `frontend/app/notifications/send/page.tsx` (send UI + property/floor filters)
- [✅] 8. Convert `frontend/app/notifications/page.tsx` to sent messages list
- [✅] 9. Update `frontend/app/notifications/layout.tsx` with tabs navigation
- [✅] 10. Add property fetch for filter dropdown in send page

### Testing & Polish (4 steps)
- [ ] 11. Restart backend/frontend, test send → appears in sent list
- [ ] 12. Test filters: propertyId shows users in that property, floor filters further
- [ ] 13. Update Sidebar if needed
- [ ] 14. ✅ Complete & cleanup TODO.md

**Next: Backend schema → migration → generate → API endpoints**

