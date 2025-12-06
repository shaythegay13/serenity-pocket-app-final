# Onboarding Testing Guide

## Pre-Testing Setup

1. **Run Database Migration**:
   ```bash
   # In Supabase SQL Editor
   # Run: supabase-migration-onboarding-gate.sql
   ```

2. **Create a Test Account**:
   - Use a new email address
   - Go through the full flow from scratch

## Test Scenarios

### Scenario 1: New User Complete Flow ✅

**Steps:**
1. Open app → See 4-step survey
2. Complete Step 1: Name & Email
3. Complete Step 2: User type & Experience
4. Complete Step 3: Goals & Activity
5. Complete Step 4: Referral + Demographics (optional)
6. Click "Complete Survey"
7. Create account (Sign Up page)
8. Accept Terms & Privacy
9. **ONBOARDING GATE APPEARS**

**Expected Onboarding Gate Behavior:**

**Biography Step:**
- Write <50 characters → Shows error
- Write 50+ characters → Can proceed
- Fill demographics → Notice "+200 XP bonus" mention
- Skip demographics → No bonus shown
- Click "Save & Continue"
- **Expected:** Biography step marked complete, moves to emotion step

**Emotion Tracking Step:**
- Select core emotion (e.g., Fear)
- Choose sub-emotion (e.g., Anxious)
- Set intensity slider
- Add context (optional)
- Click "Log Pre-Bet Emotion"
- **Expected:** Toast success, moves to post-bet emotion

**Post-Bet Emotion:**
- Select different core emotion (e.g., Relief/Calm)
- Choose sub-emotion
- Set intensity
- Add context
- Click "Complete Onboarding"
- **Expected:** 
  - Toast: "Onboarding complete! +50 XP"
  - Full dashboard unlocks
  - Both emotions logged in database

**XP Check:**
- No demographics: 50 XP
- With demographics: 250 XP (50 base + 200 bonus)

---

### Scenario 2: Existing User (Grandfathered) ✅

**Steps:**
1. Login with existing account
2. **Expected:** Direct to dashboard (no onboarding gate)
3. Check user profile → `onboarding_complete = true`

---

### Scenario 3: Partial Completion

**Test A: Biography Only**
1. Complete biography step
2. Close browser/logout
3. Login again
4. **Expected:** Resume at emotion tracking step

**Test B: Pre-Emotion Only**
1. Complete biography
2. Log pre-bet emotion
3. Close browser/logout
4. Login again
5. **Expected:** Resume at post-bet emotion step

---

### Scenario 4: Survey Edge Cases

**Test A: Switch to Sign In**
1. On survey step 1, click "Already Have an Account?"
2. **Expected:** Navigate to sign-in page
3. Sign in with existing account
4. **Expected:** Dashboard (skip survey entirely)

**Test B: Back Navigation**
1. Complete step 1 of survey
2. Go to step 2
3. Click "Back"
4. **Expected:** Return to step 1 with data preserved

**Test C: Required Field Validation**
1. Try to proceed without selecting Primary Goal (step 3)
2. **Expected:** Error message shown
3. Try to proceed without Referral Source (step 4)
4. **Expected:** Error message shown

---

### Scenario 5: XP Reward Validation

**Biography with Demographics:**
1. Complete biography (50+ chars)
2. Fill age range: "25-34"
3. Fill region: "Eastern US"
4. Fill occupation: "Professional"
5. Click "Save & Continue"
6. Check userData.xp
7. **Expected:** XP increased by 200

**Biography without Demographics:**
1. Complete biography (50+ chars)
2. Skip all demographics
3. Click "Save & Continue"
4. Check userData.xp
5. **Expected:** XP increased by 0 (no bonus)

**Emotion Track Completion:**
1. Complete both pre and post emotions
2. Check userData.xp
3. **Expected:** XP increased by 50

---

### Scenario 6: Data Persistence

**Biography Data:**
1. Complete biography with demographics
2. Check database: `user_profiles.biography`
3. **Expected:** Biography text saved
4. Check `surveyData.ageRange`, `region`, `occupation`
5. **Expected:** Demographics saved in survey data

**Emotion Logs:**
1. After completing emotion tracking
2. Check `emotion_logs` table
3. **Expected:** 2 entries with:
   - Same `trade_id`
   - One with `phase = 'before'`
   - One with `phase = 'after'`
   - Timestamps within seconds of each other

---

### Scenario 7: Mobile Responsiveness

1. Test on mobile viewport (375px width)
2. **Expected:**
   - Survey forms readable and functional
   - Onboarding gate UI scales properly
   - Emotion selection grid responsive (2 columns on mobile)
   - Sliders work with touch

---

## Validation Checklist

### Survey (4 Steps)
- [ ] Progress indicator shows 4 bars
- [ ] Step 1: Name & Email validation
- [ ] Step 2: User type & Experience selection
- [ ] Step 3: Goal & Activity required
- [ ] Step 4: Referral required, demographics optional
- [ ] "Already Have Account?" link works
- [ ] Back button preserves data

### Sign Up
- [ ] Email pre-filled from survey
- [ ] Username uniqueness checked
- [ ] Password strength validated
- [ ] Profile created in database

### Terms Agreement
- [ ] Both checkboxes required
- [ ] Scrollable terms sections
- [ ] Accept enables full app
- [ ] Decline returns to survey

### Onboarding Gate
- [ ] Appears after terms for new users
- [ ] Progress bar shows 0% → 50% → 100%
- [ ] Biography requires 50+ characters
- [ ] Demographics are truly optional
- [ ] XP bonus calculation correct
- [ ] Emotion core selection works
- [ ] Sub-emotion radio buttons functional
- [ ] Intensity slider works
- [ ] Pre/post emotion linkage via trade_id
- [ ] "Back to emotions" button works
- [ ] Completion unlocks dashboard

### Dashboard Access
- [ ] New users see gate until complete
- [ ] Existing users bypass gate
- [ ] After completion, full features available
- [ ] XP properly credited

## Database Verification Queries

```sql
-- Check onboarding status for test user
SELECT 
  id,
  name,
  xp,
  biography,
  onboarding_complete,
  biography_complete,
  emotion_track_complete
FROM user_profiles
WHERE name = 'YOUR_TEST_USER';

-- Check emotion logs for test user
SELECT 
  id,
  emotion,
  intensity,
  phase,
  trade_id,
  timestamp
FROM emotion_logs
WHERE user_id = 'YOUR_TEST_USER_ID'
ORDER BY timestamp DESC
LIMIT 10;

-- Verify grandfathered users
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN onboarding_complete THEN 1 ELSE 0 END) as completed
FROM user_profiles;
```

## Bug Report Template

If you find issues, report with:

**Bug Title:** [Component] - [Brief description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**

**Actual Behavior:**

**Environment:**
- Browser: 
- Device: 
- Account Status: (New/Existing)

**Screenshots/Videos:**

**Console Errors:**

## Success Criteria

✅ **New users** complete onboarding in 5-7 minutes
✅ **Survey completion rate** > 80%
✅ **Onboarding completion rate** > 60% (of those who finish survey)
✅ **No blocking bugs** preventing progression
✅ **XP rewards** correctly applied
✅ **Database** properly stores all onboarding data
✅ **Existing users** unaffected (grandfathered)
