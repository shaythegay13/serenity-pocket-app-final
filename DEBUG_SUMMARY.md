# Sports Data Debugging Summary

## What Was Done

Added comprehensive HTTP status code logging and error handling to debug why sports data isn't showing up.

---

## 1. Added Console Logging to Track HTTP Responses

### ESPN API ([lib/espn-api.ts](lib/espn-api.ts))
Added status code logging to all 6 fetch calls:
- **Line 212**: NBA stats fetch - Shows `Status: 200 ✓` or `Status: 401 ✗`
- **Line 257**: Roster fetch - Shows team abbreviation and status
- **Line 364**: Athlete detail fetch - Tracks individual player lookups
- **Line 396**: Statistics fetch - Tracks stats endpoint calls
- **Line 777**: Game logs fetch - Shows player ID and status
- **Line 813**: Team roster fetch - Shows team and status

### Odds API ([lib/odds-api.ts](lib/odds-api.ts))
Added status code logging to 2 fetch calls:
- **Line 33**: `fetchWithTimeout` - Logs all odds API requests with status
- **Line 203**: Available sports fetch - Tracks API key authentication

### Sportsbook API ([lib/sportsbook-api-v2.ts](lib/sportsbook-api-v2.ts))
Enhanced existing logging:
- **Line 224**: Added explicit status code with auth/rate limit hints

---

## 2. Verified API Routes Properly Await Data

All API routes correctly await library functions:

✅ [app/api/enhanced-odds/route.ts:37](app/api/enhanced-odds/route.ts#L37)
```typescript
const oddsResponse = await fetchEnhancedLiveOdds(sport, strategy);
```

✅ [app/api/picker/recommend/route.ts:213](app/api/picker/recommend/route.ts#L213)
```typescript
const oddsResult = await fetchEnhancedLiveOdds(sport, "auto")
```

✅ [app/api/capture-odds-snapshot/route.ts:30](app/api/capture-odds-snapshot/route.ts#L30)
```typescript
const oddsResponse = await fetchEnhancedLiveOdds(sportKey, 'auto');
```

---

## 3. Fixed Missing Error Messages in Components

### Problem Found
The `useEnhancedOdds` hook tracks errors, but components weren't displaying them! This meant:
- **401/403 auth errors** → User sees "No games available" (misleading)
- **Network errors** → User sees "No games available" (misleading)
- **Rate limit errors** → User sees "No games available" (misleading)

### Components Fixed
Added error display to 4 components in [components/sports-dashboard/FeaturePanels.tsx](components/sports-dashboard/FeaturePanels.tsx):

1. **LiveScoresPanelEnhanced** (line 128)
2. **UpcomingGamesOddsPanelEnhanced** (line 167)
3. **LineMovementPanelEnhanced** (line 205)
4. **BettingTrendsPanelEnhanced** (line 243)

Each now shows:
```tsx
if (error) {
  return (
    <div className="p-6 text-sm bg-red-900/20 border border-red-500/30 rounded-xl">
      <p className="text-red-400 font-semibold">⚠️ Error loading data</p>
      <p className="text-red-300/70 mt-2">{error}</p>
    </div>
  )
}
```

---

## 4. Verified Empty Array Handling

All components properly handle empty data arrays with user-friendly messages:
- ✅ "No live games available. Check back during game time for real-time scores!"
- ✅ "No upcoming games with odds available."
- ✅ "No line movement data available."
- ✅ "No betting trends data available."

---

## How to Debug Now

### 1. Check Browser Console
Open DevTools Console and look for these log messages:

**Success (200):**
```
[ESPN API] Roster fetch - Status: 200 ✓ SUCCESS - Team: lal
[Odds API] Fetch - Status: 200 ✓ SUCCESS - URL: https://api.the-odds-api.com/...
[Sportsbook API] Fetch - Status: 200 ✓ SUCCESS
```

**Auth Error (401/403):**
```
[ESPN API] Roster fetch - Status: 401 ✗ FAILED - Team: lal
[Odds API] Available sports fetch - Status: 403 ✗ FAILED (Auth Error?)
[Sportsbook API] Fetch - Status: 403 ✗ FAILED (Auth/Rate Limit Error?)
```

**Rate Limit Error (429):**
```
[Sportsbook API] Fetch - Status: 429 ✗ FAILED (Auth/Rate Limit Error?)
⏳ Remaining API requests: 0
```

### 2. Check UI Error Messages
If APIs fail, you'll now see red error boxes instead of misleading "No games available" messages.

### 3. Common Issues to Look For

| Status Code | Meaning | Solution |
|-------------|---------|----------|
| **200** | Success ✓ | Data should appear |
| **401** | Unauthorized | Check API key in `.env` file |
| **403** | Forbidden | API key invalid or expired |
| **429** | Rate Limit | Wait or upgrade API plan |
| **500** | Server Error | External API is down |

---

## Additional Checks Completed

### ✅ No Hardcoded Years Found
Searched all API files for hardcoded "2024" or "2025" - **none found**. The app dynamically uses current dates.

### ✅ No Invalid Date Filtering
The Odds API uses `dateFormat: 'iso'` but doesn't filter by specific dates - it fetches all upcoming games.

### ✅ API Keys Verified
All required API keys are present in `.env.local`:
- ✓ NEXT_PUBLIC_ODDS_API_KEY
- ✓ NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY
- ✓ NEXT_PUBLIC_THESPORTSDB_API_KEY

### ⚠️ Potential Supabase Caching Issue
The `game_lines` table in Supabase caches games with **no date filtering**:
```typescript
.from("game_lines")
.order("commence_time", { ascending: false })
.limit(1000)  // ← No WHERE clause for dates!
```

**This could show old 2024 games if they exist in the database.**

---

## Next Steps

### 1. Test APIs Directly (Bypass UI)
```bash
npx tsx test-api-direct.ts
```

This will test:
- ✓ The Odds API (NFL & NBA)
- ✓ RapidAPI Sportsbook
- ✓ ESPN API

**Expected Output:**
- If APIs are working: `Status: 200 ✓ SUCCESS` + game count
- If auth issues: `Status: 401 ✗ FAILED` or `Status: 403 ✗ FAILED`
- If rate limited: `Status: 429` + remaining requests = 0

### 2. Check Supabase Cache for Old Games
```bash
npx tsx check-supabase-cache.ts
```

This will:
- Show how many games are cached
- Identify old 2024 games
- Provide SQL to clean stale data

**If old games found**, run this in Supabase SQL Editor:
```sql
DELETE FROM game_lines WHERE commence_time < NOW() - INTERVAL '1 day';
```

### 3. Check Browser Console
Open DevTools and look for these patterns:

**✓ Success:**
```
[ESPN API] Roster fetch - Status: 200 ✓ SUCCESS
[Odds API] Fetch - Status: 200 ✓ SUCCESS
✅ The Odds API success - Retrieved 15 games for basketball_nba
```

**✗ Auth Error:**
```
[Odds API] Fetch - Status: 401 ✗ FAILED
❌ The Odds API error (401): Invalid API key
```

**✗ Rate Limit:**
```
[Sportsbook API] Fetch - Status: 429 ✗ FAILED
⏳ Remaining API requests: 0
```

### 4. Check UI Error Messages
The components now show red error boxes for API failures instead of misleading "No games available" messages.

---

## Diagnosis Decision Tree

```
Is data showing in browser console logs?
  ├─ YES → Check if it's reaching the UI components
  │         └─ Check React DevTools props
  │
  └─ NO → Check API test script results
        ├─ 200 Success + 0 games → No games scheduled (expected)
        ├─ 401/403 → API key issue
        ├─ 429 → Rate limited
        └─ 500 → External API down
```

The app will now clearly show whether the problem is:
- ❌ **Authentication** (401/403 errors)
- ❌ **Rate limiting** (429 errors)
- ❌ **API downtime** (500 errors)
- ⚠️ **Stale Supabase cache** (old 2024 games)
- ✅ **No games scheduled** (200 success but empty array)
