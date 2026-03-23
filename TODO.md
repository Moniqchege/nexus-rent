# Users Page Implementation Plan
Complete steps sequentially. Mark as [x] when done.

## Backend
- [x] 1. Create `backend/src/routes/users.ts` (CRUD endpoints mirroring roles.ts)
- [x] 2. Edit `backend/src/index.ts` (import and mount /api/users routes)

## Frontend Store
- [x] 3. Edit `frontend/app/store/adminStore.ts` (add createUser, updateUser, deleteUser, update fetchUsers for search)

## Frontend Forms & Pages
- [x] 4. Create `frontend/app/components/users/UserForm.tsx` (mirror RoleForm but simpler: name, email, role dropdown, password create-only)
- [x] 5. Create `frontend/app/users/new/page.tsx` (mirror roles/new)
- [x] 6. Create `frontend/app/users/edit/[id]/page.tsx` (mirror roles/edit)

## Main Pages & Components
- [x] 7. Update `frontend/app/users/page.tsx` (add SearchBar, filter, New button, ConfirmDialog, match roles styling/table)
- [x] 8. Update `frontend/app/components/users/UserTable.tsx` (add View/Edit/Delete buttons)

## Final Steps
- [x] 9. Backend routes added and server needs restart: `cd backend && nodemon src/index.ts`
- [x] 10. Users page complete with full CRUD (create/edit/delete/view), SearchBar, table styles matching roles page, redirects.

**Task complete!** Run `cd frontend && npm run dev` to test /users.


