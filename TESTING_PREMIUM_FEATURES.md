# Testing Premium Features - Quick Guide

## 🚀 Quick Start

### Step 1: Open the App
The dev server should already be running at `http://localhost:3000`

### Step 2: Complete Initial Setup
1. Complete the survey to create your account
2. Sign in if needed

### Step 3: Navigate to Account Tab
Click on **"Account"** in the bottom navigation

### Step 4: Use the Dev Mode Tier Switcher
You'll see a yellow box at the top labeled **"🛠️ Developer Mode: Test Subscription Tiers"**

Click the buttons to instantly switch between tiers:
- **Free Plan** - Default tier
- **Premium** - $19.99/mo tier
- **Premium Plus** - $39.99/mo tier  
- **Elite** - $79.99/mo tier

---

## 🧪 Testing Each Tier

### Test 1: FREE TIER (Default)

**What to Test:**
1. ✅ **Home Tab** - Should show emotional score and insights
2. ✅ **My Behavior Tab** - Should allow emotion tracking
3. 🔒 **Live Odds Tab** - Should show LOCK SCREEN with upgrade prompt
4. 🔒 **Analyze Bet Tab** - Should show LOCK SCREEN with upgrade prompt
5. 🔒 **AI Picks Tab** - Should show LOCK SCREEN with upgrade prompt

**Expected Behavior:**
- Home tab shows "Premium Feature" badges on Live Odds and Analyze Bet cards
- Home tab shows "Elite Feature" badge on AI Picks card
- Clicking locked features navigates to them but shows upgrade screen

---

### Test 2: PREMIUM TIER ($19.99/mo)

**Switch to Premium:**
1. Go to Account tab
2. Click **"Premium"** button in dev mode switcher
3. Navigate through the app

**What to Test:**
1. ✅ **Live Odds Tab** - Should now be UNLOCKED
   - Shows search bar
   - Shows mock odds for multiple games
   - Shows sportsbook comparison
   - "Analyze This Bet" buttons work
   
2. ✅ **Analyze Bet Tab** - Should show BASIC ANALYSIS
   - Can input bet description
   - Can enter odds and stake
   - Shows "Data Analysis" section
   - Shows probability, EV, risk level
   - 🔒 "Psychological Analysis" section is LOCKED (Premium Plus feature)

3. 🔒 **AI Picks Tab** - Still LOCKED (Elite only)

**Expected Behavior:**
- Live Odds fully functional
- Analyze Bet shows data analysis but locks psychological insights
- AI Picks still shows upgrade prompt to Elite
- Home tab no longer shows "Premium Feature" badges on Live Odds/Analyze

---

### Test 3: PREMIUM PLUS TIER ($39.99/mo)

**Switch to Premium Plus:**
1. Go to Account tab
2. Click **"Premium Plus"** button
3. Navigate to Analyze Bet tab

**What to Test:**
1. ✅ **Analyze Bet Tab** - FULL ACCESS
   - Data Analysis section (from Premium)
   - ✅ **Psychological Analysis** section now UNLOCKED
   - Shows bias detection
   - Shows emotional alignment
   - Shows personalized recommendations
   - "Should you bet right now?" assessment

2. ✅ **Live Odds** - Still accessible (inherited from Premium)

3. 🔒 **AI Picks Tab** - Still LOCKED (Elite only)

**Expected Behavior:**
- All Premium features work
- Psychological analysis section appears in Analyze Bet
- Shows bias warnings and emotional insights
- AI Picks still requires Elite upgrade

---

### Test 4: ELITE TIER ($79.99/mo)

**Switch to Elite:**
1. Go to Account tab
2. Click **"Elite"** button with crown icon
3. Navigate to AI Picks tab

**What to Test:**
1. ✅ **AI Picks Tab** - FULLY UNLOCKED
   - Shows user status card (emotional stability, bias recognition, mindful rate)
   - Shows AI-generated picks:
     - Lakers vs Warriors pick
     - Chiefs vs Bills pick
   - Each pick shows:
     - Confidence percentage
     - Expected Value (EV)
     - Emotional alignment score
     - AI reasoning
     - "Analyze" and "Log Bet" buttons
   - Responsible gambling disclaimer at bottom

2. ✅ **All Other Features** - Fully accessible
   - Live Odds
   - Full Analyze Bet (data + psychological)
   - Everything from lower tiers

**Expected Behavior:**
- No upgrade prompts anywhere
- All features unlocked
- AI Picks shows personalized recommendations
- Home tab shows no feature badges (everything accessible)

---

## 🎯 Specific Features to Test

### Live Odds Tab (Premium+)

**Test Cases:**
1. Search functionality
   - Type "NBA" in search box
   - Should filter games
2. Sportsbook comparison
   - Check that best odds are highlighted
   - Verify multiple sportsbooks shown
3. "Analyze This Bet" button
   - Click it on any game
   - Should navigate to Analyze Bet tab
   - Should pre-fill bet description

**Current Status**: ✅ UI complete, 🔴 Uses mock data

---

### Analyze Bet Tab (Premium+)

**Test Cases:**

**Data Analysis (Premium):**
1. Enter bet description: "Lakers -3.5 vs Warriors"
2. Enter odds: "-110"
3. Enter stake: "100"
4. Click "Analyze Bet"
5. Should show:
   - Win probability: ~52.4%
   - Expected Value: +$4.76
   - Risk level: Medium
   - Recommendation

**Psychological Analysis (Premium Plus):**
1. Same as above, but also shows:
   - Emotional state assessment
   - Bias warnings (if applicable)
   - Emotional alignment score
   - "Should you bet?" recommendation
2. Try with different emotional states
3. Check if bias detection triggers

**Current Status**: ✅ UI complete, 🔴 Uses mock AI responses

---

### AI Picks Tab (Elite Only)

**Test Cases:**
1. View user status card
   - Emotional stability score
   - Bias recognition score
   - Mindful rate
2. View AI picks
   - Check confidence levels
   - Check EV calculations
   - Read AI reasoning
3. Click "Analyze" button
   - Should navigate to Analyze Bet
   - Should pre-fill with pick details
4. Click "Log Bet" button
   - Should navigate to My Behavior
   - Should open emotion logging

**Current Status**: ✅ UI complete, 🔴 Uses mock AI picks

---

## 🐛 Known Issues to Watch For

### Issues That Should NOT Occur:
- ❌ Free users accessing Live Odds content
- ❌ Premium users seeing psychological analysis
- ❌ Non-Elite users accessing AI Picks
- ❌ Upgrade prompts for features user already has access to

### Expected Behaviors:
- ✅ Tier switcher updates immediately
- ✅ Navigation badges update based on tier
- ✅ Lock screens show appropriate upgrade messages
- ✅ Feature access changes instantly when tier changes

---

## 📊 Feature Access Matrix

Quick reference for what each tier can access:

| Feature | Free | Premium | Premium Plus | Elite |
|---------|:----:|:-------:|:------------:|:-----:|
| Home Dashboard | ✅ | ✅ | ✅ | ✅ |
| Emotion Tracking | ✅ | ✅ | ✅ | ✅ |
| Tilt Alerts | ✅ | ✅ | ✅ | ✅ |
| My Behavior | ✅ | ✅ | ✅ | ✅ |
| **Live Odds** | ❌ | ✅ | ✅ | ✅ |
| **Data Analysis** | ❌ | ✅ | ✅ | ✅ |
| **Psych Analysis** | ❌ | ❌ | ✅ | ✅ |
| **AI Picks** | ❌ | ❌ | ❌ | ✅ |

---

## 🔍 Detailed Testing Checklist

### For Each Tier Change:

**After Switching Tiers:**
- [ ] Account tab shows correct current plan
- [ ] Account tab highlights active tier button
- [ ] Home tab updates feature badges
- [ ] Navigation works for all accessible tabs
- [ ] Lock screens appear for inaccessible features
- [ ] Upgrade messages mention correct tier to upgrade to

**Navigation Flow:**
- [ ] Can navigate between all tabs
- [ ] Active tab is highlighted in navigation
- [ ] Back button works (if applicable)
- [ ] Deep linking works (if applicable)

**Lock Screens:**
- [ ] Show feature preview (blurred)
- [ ] Display clear upgrade message
- [ ] Show tier pricing
- [ ] "Upgrade" button present
- [ ] Feature benefits listed

**Unlocked Features:**
- [ ] No lock icons or upgrade prompts
- [ ] Full functionality available
- [ ] Mock data displays correctly
- [ ] Interactive elements work
- [ ] Forms submit properly

---

## 💡 Tips for Testing

1. **Start with Free** - Test the locked state first
2. **Upgrade Gradually** - Free → Premium → Premium Plus → Elite
3. **Test Backwards** - Elite → Free to see features lock again
4. **Check Edge Cases** - What happens if tier is undefined/null?
5. **Mobile View** - Test on mobile viewport (responsive design)
6. **Dark Mode** - Toggle theme to test visibility
7. **Console Errors** - Check browser console for errors

---

## 🚨 What to Report

If you find issues, note:
1. **Current Tier**: Which tier were you testing?
2. **Feature**: Which feature had the issue?
3. **Expected**: What should have happened?
4. **Actual**: What actually happened?
5. **Steps**: How to reproduce the issue?
6. **Console**: Any errors in browser console?

---

## ✅ Success Criteria

The premium feature gating is working correctly if:

1. ✅ Free users see lock screens on premium features
2. ✅ Premium users can access Live Odds and basic Analyze Bet
3. ✅ Premium Plus users see psychological analysis
4. ✅ Elite users can access AI Picks
5. ✅ Tier switcher updates access immediately
6. ✅ No console errors when switching tiers
7. ✅ Upgrade prompts show correct tier and pricing
8. ✅ UI is consistent across all tiers

---

## 🎬 Quick Test Script

**5-Minute Full Test:**

```
1. Start on Free tier
   - Click Live Odds → See lock screen ✓
   - Click AI Picks → See lock screen ✓

2. Switch to Premium
   - Click Live Odds → See odds table ✓
   - Click Analyze Bet → See data analysis ✓
   - Psychological section locked ✓

3. Switch to Premium Plus
   - Analyze Bet → Psychological section unlocked ✓
   - AI Picks → Still locked ✓

4. Switch to Elite
   - AI Picks → See AI picks ✓
   - All features accessible ✓

5. Switch back to Free
   - Everything locks again ✓
```

---

All premium features are now testable! Use the dev mode tier switcher in the Account tab to instantly test each subscription level. 🎉
