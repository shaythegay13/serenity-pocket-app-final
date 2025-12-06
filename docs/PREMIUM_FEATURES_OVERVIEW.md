# Premium Features Overview - Subscription Gating

## Current Implementation Status

All premium features are currently **gated with UI locks** but use **mock data**. Here's what's behind each tier:

---

## 🆓 FREE TIER (Mindful Bettor)
**Access Level**: Default for all users

### Available Features:
- ✅ **Emotional Risk Profile** - Survey-based assessment
- ✅ **Tilt Alerts & Warnings** - Automatic detection based on losing streaks
- ✅ **Basic Behavior Tracking** - Emotion logging (pre/post bet)
- ✅ **Daily Mood Check-ins** - Emotion tracking dialog
- ✅ **Bet Diary & Journal** - Trade reflection system
- ✅ **Cooldown Mode** - Activated when emotional stability is low
- ✅ **Home Dashboard** - Emotional score, insights, recent activity
- ✅ **My Behavior Tab** - Full emotion tracking (reuses EmotionsTab)

### Limited Access:
- ⚠️ **Line Comparison** - Limited to 3 sportsbooks (not enforced yet)
- ⚠️ **Basic Bet Analysis** - Limited features (not enforced yet)

---

## 💎 PREMIUM TIER ($19.99/mo)
**Required for**: Live Odds, Advanced Bet Analysis

### Gated Features:

#### 1. **Live Odds Tab** (`/components/tabs/live-odds-tab.tsx`)
**Gate Check**: `canAccessFeature(userTier, "premium")`

**What Free Users See**:
- 🔒 Lock screen with upgrade prompt
- Preview of feature (blurred)
- "Upgrade to Premium" CTA button

**What Premium Users See**:
- Real-time odds comparison across ALL sportsbooks
- Search and filter by sport/league
- Best odds highlighting
- Line movement indicators
- Direct "Analyze This Bet" integration

**Current Status**: ✅ UI complete with mock data
**Needs**: Real odds API integration (The Odds API, etc.)

#### 2. **Analyze Bet Tab - Basic Analysis** (`/components/tabs/analyze-bet-tab.tsx`)
**Gate Check**: `canAccessFeature(userTier, "premium")`

**What Free Users See**:
- 🔒 Lock screen with upgrade prompt
- Feature description
- "Upgrade to Premium" CTA

**What Premium Users See**:
- Bet description input form
- Odds and stake inputs
- AI-powered data analysis:
  - Win probability estimates
  - Expected Value (EV) calculations
  - Risk assessment
  - Trend analysis
  - Historical performance data

**Current Status**: ✅ UI complete with mock AI responses
**Needs**: OpenAI/Anthropic API integration for real analysis

---

## 💎💎 PREMIUM PLUS TIER ($39.99/mo)
**Required for**: Psychological Analysis, Bias Detection

### Gated Features:

#### 1. **Analyze Bet Tab - Psychological Analysis** (`/components/tabs/analyze-bet-tab.tsx`)
**Gate Check**: `canAccessFeature(userTier, "premium_plus")`

**What Premium Users See**:
- Basic data analysis only
- "Upgrade for psychological insights" message

**What Premium Plus Users See**:
- **Everything in Premium, PLUS:**
- Emotional state integration
- Bias detection:
  - Overconfidence bias
  - Chasing losses
  - Recency bias
  - Confirmation bias
- Emotional alignment score
- Personalized risk warnings
- Behavioral recommendations
- "Should you bet right now?" assessment

**Current Status**: ✅ UI complete with mock psychological analysis
**Needs**: 
- AI integration for bias detection
- Emotion history analysis
- Pattern recognition algorithms

#### 2. **Advanced Behavioral Analytics** (Future)
**Planned Features**:
- Emotional overlay on bet history
- Behavior-to-performance correlation
- Personalized triggers map
- Weekly psychological reports
- Cognitive stability meter

**Current Status**: ⏳ Not yet implemented
**Location**: Could be added to My Behavior tab or new Analytics tab

---

## 👑 ELITE TIER ($79.99/mo)
**Required for**: AI-Generated Picks

### Gated Features:

#### 1. **AI Picks Tab** (`/components/tabs/ai-picks-tab.tsx`)
**Gate Check**: `canAccessFeature(userTier, "elite")`

**What Non-Elite Users See**:
- 🔒 Lock screen with comprehensive upgrade prompt
- Feature benefits breakdown:
  - AI-Generated Picks
  - Psychology-Filtered recommendations
  - Bankroll Optimization
- Preview of picks (blurred)
- "Upgrade to Elite" CTA

**What Elite Users See**:
- **User Status Card**:
  - Emotional Stability score
  - Bias Recognition score
  - Mindful Rate
- **AI-Generated Picks**:
  - Straight bets
  - Parlays
  - Props
- **For Each Pick**:
  - Confidence percentage
  - Expected Value (EV)
  - Emotional alignment score
  - AI reasoning/explanation
  - "Analyze" and "Log Bet" buttons
- Responsible gambling disclaimer

**Current Status**: ✅ UI complete with mock AI picks
**Needs**:
- AI pick generation engine
- Real-time sports data integration
- User psychology profiling
- Bankroll management algorithms

---

## 🔧 Testing Premium Features

### How to Test Each Tier:

#### Option 1: Manual Database Update (Quick Test)
```sql
-- In Supabase SQL Editor
UPDATE user_profiles 
SET subscription_tier = 'premium'  -- or 'premium_plus', 'elite'
WHERE user_id = 'YOUR_USER_ID';
```

#### Option 2: Temporary Override (Development)
Add to `/lib/storage-hybrid.ts`:
```typescript
async getUserData(): Promise<UserData | null> {
  // ... existing code ...
  
  // TEMPORARY: Override for testing
  if (data) {
    data.subscriptionTier = 'elite' // Change this to test different tiers
  }
  
  return data
}
```

#### Option 3: UI Toggle (Recommended for Testing)
Create a dev-only tier switcher in the Account tab:
```typescript
// Add to account-tab.tsx for development
{process.env.NODE_ENV === 'development' && (
  <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
    <p className="text-sm font-semibold mb-2">🛠️ Dev Mode: Switch Tier</p>
    <div className="flex gap-2">
      {SUBSCRIPTION_TIERS.map(tier => (
        <Button 
          key={tier.id}
          size="sm"
          onClick={() => updateUserData({ subscriptionTier: tier.id })}
        >
          {tier.displayName}
        </Button>
      ))}
    </div>
  </Card>
)}
```

---

## 📊 Feature Gate Summary

| Feature | Free | Premium | Premium Plus | Elite |
|---------|------|---------|--------------|-------|
| Emotional Tracking | ✅ | ✅ | ✅ | ✅ |
| Tilt Alerts | ✅ | ✅ | ✅ | ✅ |
| Cooldown Mode | ✅ | ✅ | ✅ | ✅ |
| **Live Odds** | ❌ | ✅ | ✅ | ✅ |
| **Basic Bet Analysis** | ❌ | ✅ | ✅ | ✅ |
| **Bias Detection** | ❌ | ❌ | ✅ | ✅ |
| **Emotional Analysis** | ❌ | ❌ | ✅ | ✅ |
| **AI Picks** | ❌ | ❌ | ❌ | ✅ |

---

## 🔍 Gate Implementation Details

### How Feature Gating Works:

```typescript
// 1. Import the helper function
import { canAccessFeature } from "@/lib/subscription-tiers"

// 2. Check user's tier
const hasAccess = canAccessFeature(
  userData.subscriptionTier || "free",  // User's current tier
  "premium"                              // Required tier
)

// 3. Conditional rendering
{hasAccess ? (
  <ActualFeature />
) : (
  <UpgradePrompt />
)}
```

### Tier Hierarchy:
```
free < premium < premium_plus < elite
```
- If user has `premium_plus`, they can access `premium` and `free` features
- If user has `premium`, they can only access `premium` and `free` features
- Etc.

---

## 🚀 Next Steps to Make Features Functional

### Phase 1: Live Odds (Premium)
1. Sign up for The Odds API or similar
2. Create `/lib/odds-api.ts` with fetch functions
3. Replace mock data in `live-odds-tab.tsx`
4. Add real-time updates (WebSocket or polling)
5. Implement caching to reduce API calls

### Phase 2: AI Bet Analysis (Premium/Premium Plus)
1. Set up OpenAI or Anthropic API
2. Create `/lib/ai-analysis.ts` with prompt engineering
3. Implement data analysis (probability, EV calculations)
4. Add bias detection algorithms for Premium Plus
5. Integrate user emotion history for personalized insights

### Phase 3: AI Picks (Elite)
1. Build pick generation engine
2. Integrate sports data + user psychology
3. Create recommendation filtering system
4. Implement bankroll management logic
5. Add performance tracking

### Phase 4: Payment Integration
1. Set up Stripe
2. Create checkout flows in Account tab
3. Add webhook handlers for subscription events
4. Implement tier upgrades/downgrades
5. Handle subscription expiration

---

## 🐛 Known Issues / TODO

- [ ] Line comparison limit (3 books) not enforced for free tier
- [ ] No actual API integrations yet (all mock data)
- [ ] No payment processing
- [ ] No subscription expiration handling
- [ ] Dev mode tier switcher not implemented
- [ ] Need to add "trial period" logic
- [ ] Need to add "downgrade" restrictions
- [ ] Weekly psychological reports not implemented
- [ ] Behavioral analytics dashboard not built

---

## 💡 Recommendations

1. **Start with Premium tier** - Easiest to implement (odds API + basic AI)
2. **Add dev mode switcher** - Makes testing much easier
3. **Use environment flags** - `NEXT_PUBLIC_ENABLE_PREMIUM_FEATURES=true`
4. **Implement analytics** - Track which features drive upgrades
5. **A/B test pricing** - Test different price points
6. **Add free trial** - 7-day trial for Premium to drive conversions

---

## 📝 Testing Checklist

### For Each Tier:

**Free Tier**:
- [ ] Can access Home tab
- [ ] Can track emotions
- [ ] Can see tilt alerts
- [ ] Cannot access Live Odds (sees lock screen)
- [ ] Cannot access Analyze Bet (sees lock screen)
- [ ] Cannot access AI Picks (sees lock screen)
- [ ] Sees upgrade prompts on locked features

**Premium Tier**:
- [ ] Can access Live Odds tab
- [ ] Can access Analyze Bet (data analysis only)
- [ ] Cannot see psychological analysis in Analyze Bet
- [ ] Cannot access AI Picks
- [ ] Sees "Upgrade to Premium Plus" prompts

**Premium Plus Tier**:
- [ ] Can access all Premium features
- [ ] Can see psychological analysis in Analyze Bet
- [ ] Can see bias detection
- [ ] Cannot access AI Picks
- [ ] Sees "Upgrade to Elite" prompts

**Elite Tier**:
- [ ] Can access ALL features
- [ ] Can see AI Picks tab
- [ ] Can view AI-generated recommendations
- [ ] No upgrade prompts shown
- [ ] All features unlocked

---

This document provides a complete overview of all premium features and their current implementation status. All UI is complete and functional with mock data - the next step is integrating real APIs and payment processing.
