# Emotion Tracker & Journal Merge Plan

## Overview
Combine Journal and Emotions sections so users track emotions tied to trades with cognitive bias checking.

## Changes Required

### 1. EmotionsTab Enhancements
**Add to emotion logging flow:**
- ✅ Select core emotion (already exists)
- ✅ Select sub-emotion (already exists)
- **NEW:** Select trade phase (Pre-Trade REQUIRED, During-Trade OPTIONAL, Post-Trade REQUIRED)
- **NEW:** Cognitive bias checking step (required for pre/post-trade)
- ✅ Intensity + context (already exists)

### 2. Gamification Transfer from Journal → Emotions
**Pre-Trade Logging:**
- XP: 15 points (from journal)
- Daily Ring: biasRecognition +15% per bias identified
- Data: totalTrades +1, totalBiasesIdentified +count
- Challenges: pause-challenge progress

**Post-Trade Logging:**
- XP: 20 points (from journal)
- Daily Ring: mindfulness +20%
- Data: mindfulTrades +1, totalJournalsCompleted +1, mindfulDecisionPercentage recalculated

**During-Trade (Optional):**
- XP: 5 points
- Daily Ring: emotionalAwareness +10%

### 3. Updated Types (Trade interface)
```typescript
interface Trade {
  id: string
  timestamp: Date
  // Pre-trade (REQUIRED)
  preTradeEmotion: string
  preTradeIntensity: number
  biasesIdentified: string[]
  preTradeContext?: string
  // During-trade (OPTIONAL)
  duringTradeEmotion?: string
  duringTradeIntensity?: number
  duringTradeContext?: string
  // Post-trade (REQUIRED to complete)
  postTradeEmotion?: string
  postTradeIntensity?: number
  postTradeContext?: string
  outcome?: "profit" | "loss" | "breakeven"
}
```

### 4. Navigation Updates
- Remove "Journal" tab from navigation
- Rename "Emotions" to "Emotions & Trades" or keep as "Emotions"
- Update icon if needed

### 5. Files to Modify
1. `/components/tabs/emotions-tab.tsx` - Main refactor
2. `/components/navigation.tsx` - Remove journal tab
3. `/app/page.tsx` - Remove JournalTab import
4. `/lib/types.ts` - Update Trade interface
5. Keep `/components/pre-trade-form.tsx` and `/components/post-trade-form.tsx` as reusable components

### 6. Data Migration
- Existing emotion logs remain unchanged
- Existing trades remain unchanged
- New trade entries will use the new flow

## Implementation Steps
1. ✅ Create plan document
2. Update Trade interface in types.ts
3. Create new emotion+trade flow in EmotionsTab
4. Add cognitive bias checking step
5. Transfer all gamification logic
6. Update navigation
7. Test all XP/achievement/data tracking
