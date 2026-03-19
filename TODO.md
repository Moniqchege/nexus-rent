# Backend API Integration for Roles - TODO

## Approved Plan Steps:

### 1. [PENDING] Remove mock data from adminStore.ts
   - Edit `frontend/app/store/adminStore.ts`:
     - Remove `mockRoles`, `mockUsers` initial data (set `roles: []`).
     - Enable `fetchUsers` if needed (roles focus).
     - Keep `mockPermissions` (no backend fetch endpoint, hardcoded fine).
   - Test: Backend must run (`cd backend && npm run dev`), auth/login.

### 2. [COMPLETE] Verify RoleForm & missing pages
   - RoleForm ready.
   - Created /roles/edit/[id]/page.tsx stub (uses existing RoleForm, store).
   - RoleForm.tsx: Uses store `permissions`, `createRole`/`updateRole` → ready.
   - No `/roles/edit` dir → add stub or ignore (page.tsx routes to it).

### 3. [PENDING] Test full CRUD
   - Run backend/frontend.
   - Login → /roles → create → list → delete.
   - Check console/DB.

### 4. [PENDING] Optional: Users integration
   - Enable `fetchUsers`, `updateUserRole`.

### 5. [COMPLETE] Use attempt_completion

**Status: Ready to edit adminStore.ts**
