# Onboarding Update Summary

## Overview
Streamlined the onboarding process from 11 steps to 4 steps based on tester feedback, and implemented an engagement gate to prevent spam/troll accounts.

## Changes Made

### 1. Survey Streamlined (11 steps → 4 steps)

**Removed Steps (5, 9, 4, 6, 7, 8):**
- Step 4: Emotional challenges (optional list)
- Step 5: Account creation motivation
- Step 6: Trigger situations
- Step 7: Current tracking habits
- Step 8: Preferred support methods
- Step 9: Monthly budget/activity scale

**Kept Steps:**
- **Step 1**: Name & Email (with "Already have account?" link)
- **Step 2**: User type (Sports bettor/Day trader/Both) & Experience level
- **Step 3**: Primary goal & Weekly activity level
- **Step 4**: Referral source & Optional demographics (for investor insights)

**Rationale:**
- Marketing data (motivation, budget, referral details) kept only where essential for investors
- Optional demographics remain for investor pitch value
- User behavior data will be collected organically through actual usage

### 2. Engagement Gate Implementation

New component: `/components/onboarding-gate.tsx`

**Two Required Steps:**

#### Step 1: Biography Completion
- Users write 50+ character bio about themselves
- Optional demographics (age, region, occupation)
- **Reward:** +200 XP bonus for completing ALL optional demographics
- Prevents quick signups without commitment

#### Step 2: Full Emotion Track
- Log a **PRE-bet emotion** (before trade/bet)
  - Select core emotion (Joy, Calm, Fear, Greed, Frustration, Sadness)
  - Pick specific sub-emotion (10 options per core)
  - Set intensity (1-10 slider)
  - Optional context notes
  
- Log a **POST-bet emotion** (after trade/bet)
  - Same process as pre-bet
  - Linked to same trade ID for tracking

- **Reward:** +50 XP for completing full emotion track

**Total Onboarding XP Potential:** 250 XP (50 base + 200 demographics bonus)

### 3. Type System Updates

**Updated `/lib/types.ts`:**
```typescript
// Simplified SurveyData
export interface SurveyData {
  name: string
  email: string
  userType: "sports-bettor" | "day-trader" | "both"
  experience: "beginner" | "intermediate" | "advanced"
  primaryGoal: string
  weeklyActivity: string
  referralSource: string
  referralOther?: string
  // Optional demographics
  ageRange?: string
  region?: string
  occupation?: string
  completedAt?: string
}

// UserData with onboarding tracking
export interface UserData {
  // ... existing fields
  onboardingComplete?: boolean
  biographyComplete?: boolean
  emotionTrackComplete?: boolean
  biography?: string
}
```

### 4. Main Page Flow

**Updated `/app/page.tsx`:**
- After authentication → Check `userData.onboardingComplete`
- If `false` → Show OnboardingGate component
- If `true` → Show full dashboard

**Flow:**
1. Survey (4 steps)
2. Sign Up
3. Terms Agreement
4. **Onboarding Gate** (NEW - blocks all features)
5. Full Dashboard Access

### 5. Database Initialization

**Updated `/lib/init-user.ts`:**
- New user profiles now include:
  - `onboardingComplete: false`
  - `biographyComplete: false`
  - `emotionTrackComplete: false`

## Anti-Troll Measures

### Email Verification
- Already handled by Supabase (existing)

### Engagement Requirements
1. **Biography**: Requires meaningful input (50+ characters)
2. **Emotion Tracking**: Demonstrates understanding of the app's purpose
3. **Time Investment**: Takes 3-5 minutes to complete thoughtfully

### Data Quality
- Biography shows genuine interest vs. automated signups
- Emotion tracking proves user understands the app's value proposition
- Demographics bonus incentivizes real data without making it mandatory

## Benefits

### For Users
- **Faster signup**: 11 steps → 4 steps (63% reduction)
- **Clear expectations**: Understand core features during onboarding
- **Gamification**: Immediate XP rewards for engagement
- **Transparency**: Understand why data is collected (investor insights)

### For Product
- **Higher quality users**: Engagement gate filters out trolls/bots
- **Better data**: Users who complete onboarding are committed
- **Investor-ready metrics**: Kept essential demographic data for pitches
- **Reduced noise**: Only engaged users access full features

### For Investors
- **User commitment metrics**: Onboarding completion rate
- **Quality signals**: Biography length, emotion tracking completion
- **Demographics data**: Still available for market analysis
- **Referral insights**: Understanding growth channels

## Testing Recommendations

1. **Test new user flow**:
   - Survey → Sign Up → Terms → Onboarding Gate → Dashboard

2. **Test partial completion**:
   - Complete biography only (should unlock emotion tracking)
   - Complete both steps (should unlock full dashboard)

3. **Test validation**:
   - Try submitting biography with <50 characters
   - Try skipping emotion selection

4. **Test XP rewards**:
   - Biography only: 0 XP
   - Biography + all demographics: 200 XP
   - Full emotion track: +50 XP

## Migration Notes

**Existing Users:**
- Users who signed up before this change will have `onboardingComplete: undefined`
- They should be treated as `onboardingComplete: true` to grandfather them in
- Consider adding a migration script to set all existing users to `onboardingComplete: true`

**Database Schema:**
- May need to add columns to `user_profiles` table:
  - `biography` (TEXT, nullable)
  - `onboarding_complete` (BOOLEAN, default FALSE)
  - `biography_complete` (BOOLEAN, default FALSE)
  - `emotion_track_complete` (BOOLEAN, default FALSE)

## Files Modified

1. `/lib/types.ts` - Updated interfaces
2. `/components/serenity-survey.tsx` - Streamlined to 4 steps
3. `/components/onboarding-gate.tsx` - NEW component
4. `/app/page.tsx` - Added onboarding gate logic
5. `/lib/init-user.ts` - Added onboarding fields to defaults

## Next Steps

1. **Database Migration**: Run SQL to add onboarding columns
2. **Grandfather Existing Users**: Set `onboardingComplete = true` for all current users
3. **Analytics**: Track onboarding completion rates
4. **A/B Testing**: Consider testing different biography length requirements
5. **Progressive Profiling**: Collect removed survey questions in-app contextually
