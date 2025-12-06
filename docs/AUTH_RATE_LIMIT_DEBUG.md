# Auth Rate Limit Debug Guide

## Understanding the Error

The error you're seeing:
```
Too many sign-in attempts. Please wait 15 minutes before trying again.
```

This is **NOT a bug** - it's the rate limiting working correctly! Here's what happened:

1. **You hit Supabase's rate limit** (too many sign-in attempts in a short period)
2. **Our code detected it** and showed you a friendly error message instead of Supabase's raw error
3. **The cooldown is now active** to prevent further attempts until the rate limit expires

## Two Types of Rate Limits

### 1. **Client-Side Rate Limit** (Our Protection)
- **Sign In**: 5 attempts per 15 minutes
- **Password Reset**: 3 attempts per 15 minutes  
- **Resend Confirmation**: 3 attempts per 15 minutes
- Stored in `localStorage`
- Can be cleared manually (see below)

### 2. **Supabase Rate Limit** (Server-Side)
- Enforced by Supabase's auth service
- Cannot be bypassed from client
- Must wait for it to expire (~15-60 minutes depending on Supabase config)
- This is what you're currently experiencing

## Clearing the Client-Side Cooldown

### Option 1: Use the UI Button
Look for the **"Clear cooldown (if you've waited long enough)"** button in the sign-in form when a cooldown is active.

### Option 2: Browser Console (Recommended for Development)

Open your browser's developer console and run:

```javascript
// Check current rate limit status
window.authDebug.status()

// Clear all auth rate limits
window.authDebug.clearAll()

// Clean up expired cooldowns
window.authDebug.cleanup()

// Clear specific rate limit
window.authDebug.clear('SIGN_IN')
window.authDebug.clear('PASSWORD_RESET')
window.authDebug.clear('RESEND_CONFIRMATION')
```

### Option 3: Enable Dev Bypass Mode (Development Only!)

⚠️ **WARNING**: This only bypasses CLIENT-SIDE rate limiting. Supabase's server-side rate limits still apply!

```javascript
// Enable dev bypass (skips client-side rate limiting)
window.authDebug.enableDevBypass()

// When done, disable it
window.authDebug.disableDevBypass()
```

### Option 4: Manual localStorage Clear

Open browser console and run:
```javascript
localStorage.removeItem('sign_in_attempts')
localStorage.removeItem('password_reset_attempts')
localStorage.removeItem('resend_confirmation_attempts')
```

## Important Notes

⚠️ **Clearing client-side cooldown does NOT clear Supabase's rate limit!**

If you clear the cooldown but still get the error, it means **Supabase's server-side rate limit is still active**. You must wait for it to expire.

## Persistent Supabase Rate Limit (24+ Hours)

If you're getting rate limited on **every single attempt** and it's been 24+ hours:

### The Problem
Supabase's server-side rate limit hasn't expired. This is a **server-side IP block** that our code cannot bypass.

### Solutions

**Option 1: Check Console Logs**
Open browser console and try to sign in. Look for logs that say:
```
⚠️ Supabase rate limit detected - this is a server-side block
```

**Option 2: Bypass Client-Side Rate Limiting**
Refresh page, then run in console:
```javascript
window.authDebug.enableDevBypass()
window.authDebug.clearAll()
```
Then try to sign in. You'll see detailed error logs about whether it's client or server blocking you.

**Option 3: Try Different Network**
- Try from a different WiFi network
- Use your phone's hotspot
- Use a VPN
- This confirms if it's an IP-based block

**Option 4: Disable Supabase Rate Limiting (Best for Dev)**
1. Go to **Supabase Dashboard**
2. Navigate to **Authentication → Rate Limits**
3. Increase or temporarily disable rate limits
4. Or change SMTP settings (different rate limits)

**Option 5: Use Supabase Dashboard**
Instead of signing in through the app:
1. Go to **Supabase Dashboard → Authentication → Users**
2. Find your user
3. Click **"Send magic link"** for password-less login
4. Or create a new test user directly

## Current Situation & Solution

Based on your error, here's what's happening:

1. ✅ Rate limiting is working correctly
2. ⚠️ You're likely under a **persistent** Supabase-imposed rate limit
3. 🕐 May take 1-24+ hours to expire naturally

### Quick Fix for Development:

1. **Enable dev bypass** and **clear client cooldown**:
   ```javascript
   window.authDebug.enableDevBypass()
   window.authDebug.clearAll()
   ```
2. **Try to sign in** - check console logs
3. If still blocked, it's **Supabase's server-side limit** - try options above

### Preventing This in Production:

The rate limiting will prevent users from hitting Supabase's limit in the first place by:
- Tracking attempts locally
- Showing cooldown warnings
- Disabling buttons during cooldown
- Providing clear feedback with countdown timers

## Testing Rate Limiting

To test the rate limiting without hitting actual limits:

1. Try signing in with wrong password 5 times
2. You should see the cooldown activate
3. Use `window.authDebug.clearAll()` to reset
4. Try again

## Files Modified

- `components/auth/sign-in.tsx` - Sign-in rate limiting
- `components/auth/forgot-password.tsx` - Password reset rate limiting
- `components/auth/resend-confirmation.tsx` - Confirmation email rate limiting
- `lib/auth-rate-limit-utils.ts` - Debug utilities (NEW)
- `app/page.tsx` - Imports debug utilities

## Questions?

The error message in your IDE is expected behavior - it's showing where the friendly error message is being thrown after detecting Supabase's rate limit. This is actually protecting your users from seeing cryptic Supabase errors!
