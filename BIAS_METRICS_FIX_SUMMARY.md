# Bias Metrics Fix Summary

## Problem
The Progress tab was showing 0% for two bias-related metrics:
1. **Mindful Betting** - Percentage of bets with bias awareness
2. **Bias Recognition Score** - Overall bias recognition ability

These metrics weren't being calculated properly from the two sources of bias data:
- Biases identified during emotion tracking (pre-betting phase)
- Bias assessment quiz completion

## Solution

### 1. Created New Calculation Module
**File:** `lib/bias-calculations.ts`

Three new utility functions:

#### `calculateMindfulDecisionPercentage(trades)`
- Calculates what percentage of bets included bias identification
- Formula: (bets with biases identified / total bets) × 100
- Returns: 0-100%

#### `calculateBiasRecognitionScore(biasProfile, totalBiasesIdentified, totalTrades)`
- Combines two sources of data:
  - **Assessment score (60% weight)**: Based on bias quiz results
  - **Practical score (40% weight)**: Based on how many biases user identifies in real bets
- Formula: 
  ```
  assessmentScore = 100 - (average bias susceptibility from quiz)
  practicalScore = (avg biases per trade / 3) × 100
  finalScore = (assessmentScore × 0.6) + (practicalScore × 0.4)
  ```
- Returns: 0-100 (higher = better bias recognition)

#### `getTotalBiasesIdentified(trades)`
- Helper function to count all biases across all trades
- Returns: Total count

### 2. Updated app/page.tsx
**What changed:**
- Import the new calculation functions
- In `updateUserData()`, recalculate bias metrics every time user data updates
- Automatically keeps scores current as users:
  - Log emotions with bias identification
  - Complete trades
  - Take the bias assessment

**Code flow:**
```typescript
// Recalculate bias metrics
const biasProfile = await storage.getBiasProfile()
const mindfulDecisionPercentage = calculateMindfulDecisionPercentage(trades)
const biasRecognitionScore = calculateBiasRecognitionScore(biasProfile, biasesCount, trades.length)

// Update calculated metrics
newData.mindfulDecisionPercentage = mindfulDecisionPercentage
newData.biasRecognitionScore = biasRecognitionScore
```

### 3. Updated biases-tab.tsx
**What changed:**
- When user completes bias assessment quiz
- Now uses `calculateBiasRecognitionScore()` to combine:
  - Quiz results (assessment)
  - Practical bias identification from emotion tracking

**Before:**
```typescript
const avgScore = Object.values(newProfile).reduce((a, b) => a + b, 0) / 6
biasRecognitionScore: Math.round(100 - avgScore)
```

**After:**
```typescript
const trades = await storage.getTrades()
const totalBiasesIdentified = getTotalBiasesIdentified(trades)
const biasRecognitionScore = calculateBiasRecognitionScore(
  newProfile, 
  totalBiasesIdentified, 
  trades.length
)
```

## How It Works Now

### Mindful Betting Percentage
**Updates when:**
- User logs pre-betting emotions and identifies biases
- Automatically recalculated on every data update

**Example:**
- User has 10 total bets
- 7 bets included bias identification
- Score: 70%

### Bias Recognition Score
**Updates when:**
- User completes bias assessment quiz
- User identifies biases during emotion tracking
- Combines both sources with weighted scoring

**Example calculation:**
```
Assessment Quiz Results:
- Average bias susceptibility: 40/100
- Assessment score: 100 - 40 = 60

Practical Identification:
- 20 total biases identified across 15 bets
- Average: 20/15 = 1.33 biases per bet
- Practical score: (1.33/3) × 100 = 44

Final Score:
(60 × 0.6) + (44 × 0.4) = 36 + 17.6 = 53.6 ≈ 54%
```

## Progress Tab Display

Users will now see accurate, live-updated metrics:

**Mindful Betting Card:**
> 70% of your bets include bias awareness. Aim for consistent mindfulness in every decision.

**Bias Recognition Card:**
> Your bias recognition score is 54%. Understanding your biases is the first step to overcoming them.

## Benefits

1. ✅ **Accurate tracking** - Combines assessment + practical identification
2. ✅ **Real-time updates** - Scores update as users interact with the app
3. ✅ **Motivating feedback** - Users see progress from both learning AND applying
4. ✅ **Balanced scoring** - 60/40 weight prevents gaming the system
5. ✅ **Data-driven insights** - Progress tab now shows meaningful metrics

## Testing

To verify the fix works:

1. **Test Mindful Betting:**
   - Log pre-betting emotion without biases → Check score stays same/lower
   - Log pre-betting emotion WITH biases → Check score increases
   - View Progress tab → See updated percentage

2. **Test Bias Recognition:**
   - Complete bias assessment → Check score updates (60% weight)
   - Identify biases in bets → Check score improves (40% weight)
   - View Progress tab → See combined score

The Progress tab will no longer show 0% - it will accurately reflect the user's bias awareness journey! 🎯📊
