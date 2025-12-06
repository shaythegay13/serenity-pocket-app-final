# Onboarding Flow - Complete Guide

## User Journey Overview

### For NEW Users (First Time):

1. **Land on homepage** → See survey (4 steps)
2. **Complete survey** → Data saved to `surveyData`
3. **Sign up** with email/password
4. **Accept terms** agreement
5. **Onboarding Gate appears:**
   - Write biography (50+ chars, optional demographics for +200 XP)
   - Log pre-bet emotion
   - `onboardingComplete` set to `TRUE`
   - `pendingEmotionTradeId` stored for later
6. **Dashboard unlocked** with banner to complete post-bet emotion

### For RETURNING Users (Already Completed Onboarding):

1. **Sign in** with email/password
2. **Go directly to dashboard** (NO onboarding gate shown)
3. If they have `pendingEmotionTradeId`, see banner to complete post-bet
4. Otherwise, normal dashboard experience

---

## Key Flags

### `onboardingComplete`
- **Default:** `false` for new users
- **Set to:** `true` when user completes biography + pre-bet emotion
- **Purpose:** Gate access to dashboard for new users
- **Behavior:** 
  - `false` → Show onboarding gate
  - `true` → Show dashboard (never show gate again)

### `biographyComplete`
- **Purpose:** Track if user completed biography step
- **Used:** Internal progress tracking

### `emotionTrackComplete`  
- **Purpose:** Track if user completed pre-bet emotion step
- **Used:** Internal progress tracking

### `pendingEmotionTradeId`
- **Purpose:** Store trade ID from pre-bet emotion during onboarding
- **Behavior:**
  - Set during onboarding when user logs pre-bet emotion
  - Shown as banner on dashboard
  - Cleared when user logs post-bet emotion
  - Awards +25 XP bonus when completed

### `demographicsComplete`
- **Purpose:** Track if user filled demographics in profile for XP
- **Behavior:**
  - Can be completed anytime in Profile tab
  - Awards +200 XP one-time bonus
  - Prevents duplicate rewards

---

## Logic Flow in Code

### `app/page.tsx`

```typescript
// Check if user is authenticated
if (authed === false) {
  // Show auth flow (survey → signup → signin)
}

if (!userData) {
  // Show loading
}

// CRITICAL: Only show onboarding for NEW users who haven't completed
if (userData.onboardingComplete === false) {
  return <OnboardingGate />
}

// All other users go to dashboard
return <Dashboard />
```

### `components/onboarding-gate.tsx`

```typescript
// Step 1: Biography
const handleBiographySubmit = async () => {
  await updateUserData({
    biographyComplete: true,
    surveyData: { ageRange, region, occupation },
    xp: userData.xp + (hasAllDemographics ? 200 : 0)
  })
  setActiveStep("emotion-pre")
}

// Step 2: Pre-Bet Emotion
const handlePreEmotionSubmit = async () => {
  const tradeId = `trade-${Date.now()}`
  
  await storage.addEmotionLog({ 
    phase: "before", 
    tradeId 
  })
  
  await updateUserData({
    emotionTrackComplete: true,
    onboardingComplete: true, // ← KEY: This prevents gate from showing again
    pendingEmotionTradeId: tradeId,
    xp: userData.xp + 25
  })
  
  onComplete() // Redirects to dashboard
}
```

---

## Database Schema

### Required Columns in `user_profiles` Table:

```sql
-- Onboarding tracking
onboarding_complete BOOLEAN DEFAULT FALSE
biography_complete BOOLEAN DEFAULT FALSE  
emotion_track_complete BOOLEAN DEFAULT FALSE
biography TEXT

-- Post-onboarding
pending_emotion_trade_id TEXT
demographics_complete BOOLEAN DEFAULT FALSE
```

---

## Migration Strategy

### Initial Migration (Run Once):

```sql
-- Add columns
ALTER TABLE user_profiles 
ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE;

-- Grandfather existing users (so they don't see gate)
UPDATE user_profiles
SET onboarding_complete = TRUE
WHERE created_at < NOW(); -- Only users created before migration
```

### Why Grandfather Existing Users?

Existing users already have access to the app. Forcing them through onboarding would be:
- ❌ Bad UX (annoying)
- ❌ Loses their data/progress
- ❌ Feels like a regression

Solution: Mark them as `onboardingComplete = true` so they skip the gate.

---

## Testing Checklist

### Test 1: Brand New User
1. ✅ Create new account
2. ✅ Complete survey → signup → terms
3. ✅ See onboarding gate
4. ✅ Complete biography + pre-bet emotion
5. ✅ Dashboard unlocks with banner
6. ✅ Sign out
7. ✅ Sign back in
8. ✅ **Should go DIRECTLY to dashboard** (no gate)

### Test 2: Existing User (Grandfathered)
1. ✅ Sign in with existing account
2. ✅ **Should go DIRECTLY to dashboard** (no gate)
3. ✅ No banner (unless they have pending emotion)

### Test 3: Incomplete Onboarding
1. ✅ Create new account
2. ✅ Complete survey → signup → terms
3. ✅ See onboarding gate
4. ✅ Close browser (don't complete)
5. ✅ Sign back in
6. ✅ **Should see onboarding gate again** (not complete)
7. ✅ Complete it
8. ✅ Never see it again

---

## Common Issues

### Issue: Onboarding gate shows every time
**Cause:** `onboardingComplete` not persisting  
**Fix:** Check database - ensure flag is being saved

### Issue: All users see onboarding (even old ones)
**Cause:** Migration didn't grandfather existing users  
**Fix:** Run grandfather UPDATE manually

### Issue: User can't get past onboarding
**Cause:** `onComplete()` not triggering or error in save  
**Fix:** Check console for errors, verify updateUserData works

---

## XP Rewards Summary

| Action | XP | When |
|--------|----|----|
| Complete biography | 0 XP | Onboarding |
| Complete demographics (during onboarding) | +200 XP | Onboarding |
| Log pre-bet emotion | +25 XP | Onboarding |
| Log post-bet emotion | +35 XP | Dashboard |
| Complete demographics (in profile) | +200 XP | Profile Tab |

**Total possible during onboarding:** 225 XP (biography + demographics + pre-bet)

---

## Files Modified

1. `app/page.tsx` - Main onboarding gate logic
2. `components/onboarding-gate.tsx` - Biography + emotion tracking
3. `components/tabs/profile-tab.tsx` - Demographics section
4. `lib/types.ts` - UserData interface
5. `lib/init-user.ts` - New user initialization
6. `supabase-migration-onboarding-gate.sql` - Database schema

---

**Status:** ✅ Fully implemented

**Last Updated:** November 9, 2025
