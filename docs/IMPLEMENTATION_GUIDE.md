# Implementation Guide - Betting Companion Redesign

## Quick Start

### 1. Update Main Page Router

Edit `/app/page.tsx` around line 453 to replace the old tab routing with the new structure:

```typescript
// OLD CODE (remove):
{activeTab === "dashboard" && <DashboardTab userData={userData} updateUserData={updateUserData} onNavigateToEmotions={() => setActiveTab("emotions")} />}
{activeTab === "emotions" && <EmotionsTab userData={userData} updateUserData={updateUserData} refreshKey={refreshKey} />}
{activeTab === "biases" && <BiasesTab userData={userData} updateUserData={updateUserData} />}
{activeTab === "progress" && <ProgressTab userData={userData} updateUserData={updateUserData} refreshKey={refreshKey} />}
{activeTab === "rewards" && <RewardsTab userData={userData} updateUserData={updateUserData} />}
{activeTab === "premium" && <PremiumTab userData={userData} updateUserData={updateUserData} />}
{activeTab === "profile" && <ProfileTab userData={userData} updateUserData={updateUserData} forceRefresh={forceRefresh} />}

// NEW CODE (add):
{activeTab === "home" && <HomeTab userData={userData} updateUserData={updateUserData} onNavigateToTab={setActiveTab} />}
{activeTab === "odds" && <LiveOddsTab userData={userData} onNavigateToTab={setActiveTab} />}
{activeTab === "analyze" && <AnalyzeBetTab userData={userData} onNavigateToTab={setActiveTab} />}
{activeTab === "behavior" && <BehaviorTab userData={userData} updateUserData={updateUserData} refreshKey={refreshKey} />}
{activeTab === "ai-picks" && <AIPicksTab userData={userData} onNavigateToTab={setActiveTab} />}
{activeTab === "account" && <AccountTab userData={userData} updateUserData={updateUserData} />}
```

### 2. Update Imports in page.tsx

Add new imports at the top of `/app/page.tsx`:

```typescript
import { HomeTab } from "@/components/tabs/home-tab"
import { LiveOddsTab } from "@/components/tabs/live-odds-tab"
import { AnalyzeBetTab } from "@/components/tabs/analyze-bet-tab"
import { BehaviorTab } from "@/components/tabs/behavior-tab"
import { AIPicksTab } from "@/components/tabs/ai-picks-tab"
import { AccountTab } from "@/components/tabs/account-tab"
```

### 3. Update Default Tab

Change the default active tab from "dashboard" to "home":

```typescript
// Line 33 in page.tsx
const [activeTab, setActiveTab] = useState("home") // Changed from "dashboard"
```

### 4. Test the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and verify:
- ✅ New navigation shows 6 tabs
- ✅ Home tab displays emotional score and tilt alerts
- ✅ Premium features show lock icons for free users
- ✅ Navigation between tabs works correctly

---

## Feature Implementation Roadmap

### Phase 1: Core Functionality (Week 1-2)
**Goal**: Get basic redesign working with mock data

- [x] Update navigation structure
- [x] Create new tab components
- [x] Implement subscription tier system
- [x] Add feature gating logic
- [ ] Update main page router
- [ ] Test all navigation flows
- [ ] Fix any UI/UX issues

### Phase 2: Real Data Integration (Week 3-4)
**Goal**: Connect to real APIs and databases

#### A. Odds API Integration
```bash
# Install odds API client
npm install axios
```

Create `/lib/odds-api.ts`:
```typescript
export async function fetchLiveOdds(sport: string) {
  const response = await fetch(`https://api.the-odds-api.com/v4/sports/${sport}/odds`, {
    headers: {
      'X-API-Key': process.env.ODDS_API_KEY
    }
  })
  return response.json()
}
```

#### B. Database Schema Updates
Run these migrations in Supabase:

```sql
-- Bet analyses table
CREATE TABLE bet_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  bet_description TEXT NOT NULL,
  odds DECIMAL NOT NULL,
  stake DECIMAL NOT NULL,
  probability DECIMAL,
  expected_value DECIMAL,
  bias_warnings TEXT[],
  emotional_state VARCHAR(50),
  emotional_intensity INTEGER,
  ai_recommendation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tilt alerts table
CREATE TABLE tilt_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  severity VARCHAR(20) NOT NULL,
  triggers TEXT[],
  recommendation TEXT,
  cooldown_suggested BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI picks table
CREATE TABLE ai_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  sport VARCHAR(50),
  event TEXT,
  pick TEXT,
  confidence INTEGER,
  expected_value DECIMAL,
  reasoning TEXT,
  emotional_alignment INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscription tiers tracking
ALTER TABLE user_profiles ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE user_profiles ADD COLUMN subscription_expires_at TIMESTAMP;
```

### Phase 3: AI Integration (Week 5-6)
**Goal**: Implement AI-powered features

#### A. Bet Analysis AI
Create `/lib/ai-analysis.ts`:
```typescript
import OpenAI from 'openai'

export async function analyzeBet(betDescription: string, odds: number, emotionalState: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "You are a sports betting analyst focused on responsible gambling and bias detection."
    }, {
      role: "user",
      content: `Analyze this bet: ${betDescription} at ${odds} odds. User's emotional state: ${emotionalState}`
    }]
  })
  
  return response.choices[0].message.content
}
```

#### B. AI Picks Generation
Create `/lib/ai-picks.ts`:
```typescript
export async function generateAIPicks(userProfile: UserData) {
  // Implement AI pick generation based on:
  // - User's emotional stability score
  // - Historical betting patterns
  // - Current sports data
  // - Risk tolerance
}
```

### Phase 4: Payment Integration (Week 7-8)
**Goal**: Enable subscription purchases

#### A. Flowglad Setup
```bash
npm install @flowglad/nextjs
```

Create `/lib/flowglad.ts`:
```typescript
import { FlowgladServer } from '@flowglad/nextjs/server'

export const FLOWGLAD_CONFIG = {
  secretKey: process.env.FLOWGLAD_SECRET_KEY!,
  webhookSecret: process.env.FLOWGLAD_WEBHOOK_SECRET!,
}

export function flowglad(userId: string, customer?: { email?: string; name?: string }) {
  return new FlowgladServer({ ...FLOWGLAD_CONFIG, userId, customer })
}
```

#### B. Webhook Handler
Create `/app/api/webhooks/flowglad/route.ts`:
```typescript
import { verifyWebhook } from '@flowglad/nextjs/server'
import { FLOWGLAD_CONFIG } from '@/lib/flowglad'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('flowglad-signature')!

  const event = verifyWebhook(body, { 'flowglad-signature': signature }, FLOWGLAD_CONFIG.webhookSecret)

  if (event.type === 'checkout.session.completed') {
    // Update user's subscription tier
  }

  return new Response(JSON.stringify({ received: true }))
}
```

### Phase 5: Testing & Refinement (Week 9-10)
**Goal**: Polish and optimize

- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Accessibility audit
- [ ] Security review
- [ ] Load testing

---

## Environment Variables

Add to `.env.local`:

```bash
# Existing
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# New - Odds API
ODDS_API_KEY=your_odds_api_key

# New - OpenAI
OPENAI_API_KEY=your_openai_key

# New - Flowglad
FLOWGLAD_SECRET_KEY=your_flowglad_secret_key
FLOWGLAD_WEBHOOK_SECRET=your_webhook_secret

# Tier Price IDs (from Flowglad Dashboard)
FLOWGLAD_PRICE_PREMIUM=price_xxx
FLOWGLAD_PRICE_PREMIUM_PLUS=price_xxx
FLOWGLAD_PRICE_ELITE=price_xxx
```

---

## Testing Checklist

### Navigation
- [ ] All 6 tabs are visible
- [ ] Tab switching works smoothly
- [ ] Active tab is highlighted
- [ ] Mobile navigation works

### Home Tab
- [ ] Emotional score displays correctly
- [ ] Tilt alerts show when triggered
- [ ] Cooldown mode activates
- [ ] Recent bets display
- [ ] Quick action cards navigate correctly

### Live Odds Tab
- [ ] Shows lock screen for free users
- [ ] Displays odds for premium users
- [ ] Odds comparison works
- [ ] Best odds highlighted
- [ ] "Analyze This Bet" button works

### Analyze Bet Tab
- [ ] Shows lock screen for free users
- [ ] Input form works for premium users
- [ ] Analysis displays correctly
- [ ] Bias detection shows for Premium Plus
- [ ] Emotional alignment displays

### My Behavior Tab
- [ ] Emotion tracking works
- [ ] Pre/post-bet logging functions
- [ ] Bias identification works
- [ ] Charts display correctly

### AI Picks Tab
- [ ] Shows lock screen for non-Elite users
- [ ] Displays picks for Elite users
- [ ] Confidence scores show
- [ ] EV calculations display
- [ ] "Analyze" and "Log Bet" buttons work

### Account Tab
- [ ] Current tier displays
- [ ] All tiers show correctly
- [ ] Feature comparison table works
- [ ] Upgrade buttons function
- [ ] Responsible gambling message displays

---

## Common Issues & Solutions

### Issue: Lint Errors
**Solution**: These are expected TypeScript errors from missing node_modules. Run:
```bash
npm install
```

### Issue: Navigation doesn't update
**Solution**: Clear browser cache and restart dev server:
```bash
rm -rf .next
npm run dev
```

### Issue: Tabs show old content
**Solution**: Verify imports in page.tsx match new component names

### Issue: Feature gating not working
**Solution**: Check `userData.subscriptionTier` is set correctly in database

---

## Next Steps After Implementation

1. **User Testing**: Get feedback from real bettors
2. **A/B Testing**: Test tier pricing and features
3. **Analytics**: Track conversion funnels
4. **Marketing**: Create landing pages for each tier
5. **Support**: Set up help documentation
6. **Compliance**: Ensure responsible gambling compliance
7. **Scaling**: Optimize for performance at scale

---

## Support & Resources

- **Redesign Summary**: See `REDESIGN_SUMMARY.md`
- **Subscription Tiers**: See `/lib/subscription-tiers.ts`
- **Type Definitions**: See `/lib/types.ts`
- **Component Library**: All tabs in `/components/tabs/`

---

## Questions?

If you encounter issues:
1. Check this guide first
2. Review `REDESIGN_SUMMARY.md` for context
3. Inspect component code for implementation details
4. Test with mock data before integrating real APIs

**Remember**: The goal is to make betting smarter, not bigger. Every feature should support responsible gambling and user well-being.
