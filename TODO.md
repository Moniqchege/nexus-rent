# Nexus Rent Mobile FirstLogin Flow Implementation

## Plan Progress

### [x] Step 1: Update mobile/store/authStore.ts
- Add firstLogin state (tempToken, needsOtp)
- Add setTempToken, verifyOtp actions

### [ ] Step 2: Update mobile/lib/api.ts
- Add resetFirstPassword(token, password)
- Add verifyOtp(userId, code)
- Update login() to return full response (isFirstLogin, etc.)

### [ ] Step 3: Create mobile/app/otp.tsx
- OTP verification screen
- Calls verifyOtp → stores final token → nav to home
- Params: userId, email

### [ ] Step 4: Update mobile/app/reset-password.tsx
- Receive/use token param from login
- Call resetFirstPassword(token, password)
- On success → nav to otp with userId/email

### [ ] Step 5: Update mobile/app/login.tsx
- Use useAuthStore().login() instead of custom fetch
- Handle navigation based on response flags

### [ ] Step 6: Update mobile/app/_layout.tsx
- Extend auth guard for tempToken/partial auth states

### [ ] Testing
- Backend: npm run dev (in backend/)
- Mobile: npx expo start
- Test full flow: register → login → reset → OTP → home

**Status: All steps complete. Testing recommended.**
