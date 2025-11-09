# Onboarding Emotion Flow Update

## Overview
Modified onboarding to require only PRE-bet emotion logging, with POST-bet emotion completion happening on the dashboard later.

## Changes Made

### 1. Onboarding Gate (`components/onboarding-gate.tsx`)

**Before:**
- Required both pre-bet AND post-bet emotion logging
- User had to complete full emotion track before accessing app
- Awarded 50 XP for completing both emotions

**After:**
- Only requires PRE-bet emotion logging
- User completes post-bet emotion later on dashboard
- Awards 25 XP immediately for pre-bet emotion
- Awards +25 XP bonus when post-bet emotion is completed (total: 50 XP)
- Stores `pendingEmotionTradeId` to link emotions later

**Rationale:**
Users are coming to the app BEFORE placing a bet, so they can't log a post-bet emotion yet. This makes the onboarding more realistic and less forced.

---

### 2. Pending Emotion Banner (`app/page.tsx`)

**New Feature:**
Added a prominent banner at the top of the dashboard when user has a pending emotion track:

```tsx
{userData.pendingEmotionTradeId && (
  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10">
    <p>Complete Your Emotion Track</p>
    <p>You logged your pre-bet emotion. How are you feeling after your bet?</p>
    <Button>Log Post-Bet Emotion</Button>
  </div>
)}
```

**Visual Design:**
- Amber/orange gradient background
- Warning icon
- Clear call-to-action button
- Visible on all tabs until completed

---

### 3. Emotion Check-In Dialog (`components/emotion-check-in-dialog.tsx`)

**Updates:**
- Now accepts `userData` and `updateUserData` props
- Detects if logging "after" phase with pending trade ID
- Links post-bet emotion to original pre-bet emotion via `tradeId`
- Clears `pendingEmotionTradeId` when completed
- Awards bonus XP: +10 base + 25 bonus = 35 XP total

**Logic:**
```typescript
const isCompletingPendingTrack = 
  phase === "after" && 
  userData?.pendingEmotionTradeId && 
  updateUserData

if (isCompletingPendingTrack) {
  // Link to pending trade
  tradeId: userData.pendingEmotionTradeId
  // Award bonus XP
  xp: userData.xp + 35
  // Clear pending
  pendingEmotionTradeId: undefined
}
```

---

### 4. Type System (`lib/types.ts`)

**Added Field:**
```typescript
export interface UserData {
  // ... existing fields
  pendingEmotionTradeId?: string // Trade ID waiting for post-bet emotion
}
```

This field:
- Stores the trade ID from onboarding pre-bet emotion
- Persists until user logs post-bet emotion
- Used to link pre and post emotions together
- Cleared after completion

---

## User Flow

### New User Journey

1. **Complete Survey** (4 steps)
2. **Sign Up** (email/password)
3. **Accept Terms**
4. **Onboarding Gate:**
   - Write biography
   - **Log PRE-bet emotion** ← They're about to place a bet
5. **Dashboard unlocks** with banner showing
6. **User places their bet** (outside app)
7. **User returns to app**
8. **Sees banner:** "Complete Your Emotion Track"
9. **Clicks button** → Opens emotion dialog
10. **Logs POST-bet emotion** (automatically linked to pre-bet)
11. **Banner disappears** + Bonus XP awarded 🎉

---

## XP Rewards Breakdown

| Action | XP Reward | Timing |
|--------|-----------|--------|
| Complete biography | 0 XP | Onboarding |
| Complete demographics (optional) | +200 XP | Onboarding |
| **Log pre-bet emotion** | **+25 XP** | **Onboarding** |
| **Log post-bet emotion** | **+35 XP** | **Dashboard** |
| **Total emotion track** | **60 XP** | **Combined** |

**Note:** 
- Old system: 50 XP for both emotions during onboarding
- New system: 60 XP total (25 + 35), split across onboarding and dashboard
- Increased reward incentivizes users to return and complete

---

## Benefits

### For Users
✅ **More realistic flow:** Can't log post-bet emotion before placing bet  
✅ **Less pressure:** Shorter onboarding, complete at their pace  
✅ **Clear reminder:** Banner makes it obvious what to do next  
✅ **Better UX:** Natural flow matching real behavior  

### For Product
✅ **Higher completion:** Easier onboarding = more users complete it  
✅ **Engagement loop:** User returns to app after bet  
✅ **Quality data:** Emotions logged at correct times  
✅ **Retention:** Gives users a reason to come back  

---

## Technical Implementation

### Database Schema
No migration needed! Uses existing fields:
- `pendingEmotionTradeId` added to `UserData` type (TypeScript only)
- Can be stored in `user_profiles` JSON column or separate field

### Optional Migration (Recommended):
```sql
-- Add pendingEmotionTradeId column for better querying
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS pending_emotion_trade_id TEXT;

-- Add comment
COMMENT ON COLUMN user_profiles.pending_emotion_trade_id 
IS 'Trade ID from onboarding pre-bet emotion, waiting for post-bet completion';
```

---

## Testing Checklist

- [ ] New user completes onboarding with pre-bet emotion only
- [ ] Banner appears on dashboard after onboarding
- [ ] Banner visible on all tabs (dashboard, emotions, etc.)
- [ ] Clicking "Log Post-Bet Emotion" opens dialog
- [ ] Dialog default phase is "after" when opened from banner
- [ ] Logging post-bet emotion awards +35 XP
- [ ] Banner disappears after post-bet emotion logged
- [ ] Pre and post emotions are linked with same `tradeId`
- [ ] `pendingEmotionTradeId` cleared from userData
- [ ] Banner doesn't appear for users without pending emotion
- [ ] Mobile responsive: banner works on small screens

---

## Edge Cases Handled

### User Never Completes Post-Bet
- Banner stays visible indefinitely
- No negative consequence
- User can still use all features
- Can complete whenever they want

### User Logs Multiple Emotions
- New emotions don't affect pending track
- Banner only cares about "after" phase with matching trade ID
- Independent emotion logs work normally

### User Completes Onboarding But Never Places Bet
- Banner appears but user may ignore it
- Can still use app fully
- No blocking behavior
- Optional completion

---

## Future Enhancements

### Potential Improvements:
1. **Time-based reminder:** "It's been 2 hours since your pre-bet emotion"
2. **Push notification:** "Did your bet complete? Log your post-bet emotion!"
3. **Auto-dismiss:** Hide banner after X days if not completed
4. **Analytics:** Track how long users take to complete post-bet
5. **Smart detection:** If user logs multiple "after" emotions, auto-complete pending

### Nice-to-Haves:
- Allow user to dismiss banner temporarily
- Show timer: "Complete within 24 hours for streak bonus"
- Achievement: "Complete emotion track within 1 hour"

---

## Migration Guide

### For Existing Users

**Option 1: Ignore (Recommended)**
- Existing users won't have `pendingEmotionTradeId`
- Banner won't show for them
- No breaking changes

**Option 2: Reset (If Desired)**
- Clear any existing `onboardingComplete` flags
- Force users through new onboarding flow
- Not recommended unless major issues

---

## Files Modified

1. ✅ `components/onboarding-gate.tsx` - Pre-bet emotion only
2. ✅ `app/page.tsx` - Added pending emotion banner
3. ✅ `components/emotion-check-in-dialog.tsx` - Pending completion logic
4. ✅ `lib/types.ts` - Added `pendingEmotionTradeId` field

---

## Related Documentation

- `ONBOARDING_UPDATE_SUMMARY.md` - Original onboarding streamline
- `ONBOARDING_TESTING_GUIDE.md` - Full testing scenarios
- `QUICK_START_ONBOARDING.md` - Quick reference

---

**Status:** ✅ Implemented and ready to test

**Next Action:** Test new user flow end-to-end

**Date:** November 9, 2025
