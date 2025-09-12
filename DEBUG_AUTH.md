# 🔍 Authentication Debugging Guide

## The Problem You Experienced

**Issue**: After deleting a user from Supabase, clicking "Try for Free" doesn't show Google sign-in - it goes straight to dashboard.

**Root Cause**: Browser still has authentication cookies, so the app thinks you're logged in, but the user doesn't exist in the database anymore.

## 🛠️ What We Fixed

### 1. Main Page Authentication Check (`app/page.tsx`)
**Before**: Only checked if auth user exists in cookies
**After**: Now checks BOTH:
- ✅ Auth user exists in cookies
- ✅ User record exists in database

If either check fails, it clears the auth session and shows the landing page.

### 2. Database Trigger Setup
**File**: `fix-user-creation-complete.sql`
**Purpose**: Automatically creates user records when someone signs up with Google OAuth

## 🚀 How to Test the Fix

### Step 1: Clear Browser Data
```bash
# Option A: Clear all browser data for the site
# Chrome: Settings > Privacy > Clear browsing data > Advanced > All time
# Or use incognito/private mode

# Option B: Clear specific cookies
# Open DevTools > Application > Storage > Cookies > Delete all
```

### Step 2: Test the Flow
1. **Visit** `https://www.portraitly.xyz`
2. **Click** "Try for Free" 
3. **Should see** Google OAuth popup
4. **Sign in** with Google
5. **Should redirect** to `/dashboard` with your beautiful interface

### Step 3: Test User Deletion
1. **Delete user** from Supabase Dashboard
2. **Visit** `https://www.portraitly.xyz` again
3. **Should see** landing page (not dashboard)
4. **Click** "Try for Free"
5. **Should see** Google OAuth popup again

## 🔧 Manual Debugging Steps

### Check Auth State in Browser
```javascript
// Open browser console and run:
localStorage.clear()
sessionStorage.clear()
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
})
```

### Check Supabase Auth State
```javascript
// In browser console:
const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY')
const { data: { user } } = await supabase.auth.getUser()
console.log('Auth user:', user)
```

### Check Database User Record
```sql
-- In Supabase SQL Editor:
SELECT * FROM auth.users WHERE email = 'your-email@gmail.com';
SELECT * FROM public.users WHERE email = 'your-email@gmail.com';
```

## 🚨 Common Issues & Solutions

### Issue 1: "Database error saving new user"
**Solution**: Run `fix-user-creation-complete.sql` in Supabase SQL Editor

### Issue 2: Still redirecting to dashboard after user deletion
**Solution**: Clear browser cookies/cache or use incognito mode

### Issue 3: Google OAuth not working
**Solution**: Check Supabase Dashboard > Authentication > Providers > Google settings

### Issue 4: User created in auth.users but not in public.users
**Solution**: The trigger should handle this automatically. Check if trigger exists:
```sql
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
```

## 📊 Authentication Flow Diagram

```
Landing Page (/)
    ↓
Check Auth Cookies
    ↓
Check Database Record
    ↓
┌─────────────────┬─────────────────┐
│   User Exists   │  No User Found  │
│   in Database   │   in Database   │
│        ↓        │        ↓        │
│  Redirect to    │  Clear Auth &   │
│  /dashboard     │  Show Landing   │
└─────────────────┴─────────────────┘
```

## 🎯 Key Files to Monitor

- `app/page.tsx` - Main authentication check
- `middleware.ts` - Route protection
- `app/auth/callback/route.ts` - OAuth callback
- `components/Demo.tsx` - Dashboard interface
- `fix-user-creation-complete.sql` - Database setup

## 🔄 Testing Checklist

- [ ] Clear browser data
- [ ] Visit landing page
- [ ] Click "Try for Free"
- [ ] Complete Google OAuth
- [ ] Verify redirect to dashboard
- [ ] Test style toggles work
- [ ] Delete user from Supabase
- [ ] Visit landing page again
- [ ] Verify shows landing page (not dashboard)
- [ ] Test new signup flow

Your authentication system should now be bulletproof! 🛡️
