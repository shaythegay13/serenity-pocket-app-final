# RapidAPI Sportsbook Integration Guide

This guide explains how to integrate and use the RapidAPI Sportsbook API in the Serenity Pocket application.

## Overview

We've integrated **RapidAPI Sportsbook API** to provide:
- ✅ Real-time odds from 10+ major US sportsbooks
- ✅ 20+ sports leagues coverage (NBA, NFL, MLB, NHL, Soccer, UFC, etc.)
- ✅ Arbitrage opportunities (risk-free profits)
- ✅ Positive Expected Value (+EV) bets
- ✅ Low hold markets (minimal vig)
- ✅ Player props and game props
- ✅ Updates every minute with live lines

## API Sources

The application now supports **three data sources**:

| Source | Use Case | API Key Required |
|--------|----------|------------------|
| **RapidAPI Sportsbook** | US sportsbooks, arbitrage, +EV opportunities | Yes - `NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY` |
| **The Odds API** | International coverage, broader sports | Yes - `NEXT_PUBLIC_ODDS_API_KEY` |
| **Mock Data** | Testing and development | No |

## Setup Instructions

### 1. Get Your RapidAPI Key

1. Visit [RapidAPI Sportsbook API](https://rapidapi.com/sportsbook-api-sportsbook-api-default/api/sportsbook-api2)
2. Sign up or log in to RapidAPI
3. Subscribe to a plan (Free tier available)
4. Copy your API key from the "Code Snippets" section
   - Look for `x-rapidapi-key: YOUR_KEY_HERE`

### 2. Add Environment Variable

Add your API key to `.env.local`:

```env
NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY=35de003165mshc46d5ef4945a808p13a5ddjsn7fc1ce1bd4f7
```

**Note**: Your key is already in the curl example you provided!

### 3. Restart Development Server

```bash
npm run dev
```

## API Usage

### Enhanced Odds API (Recommended)

The enhanced API automatically selects the best source:

```typescript
// In your component or API route
import { fetchEnhancedLiveOdds } from '@/lib/enhanced-odds-api';

// Fetch odds (auto-selects best API)
const result = await fetchEnhancedLiveOdds('basketball_nba', 'auto');

console.log(result.data); // Odds data
console.log(result.source); // 'rapidapi', 'theodds', or 'mock'
console.log(result.advantageOpportunities); // Arbitrage & +EV bets
```

### Strategy Options

```typescript
// Use RapidAPI only
await fetchEnhancedLiveOdds('basketball_nba', 'rapidapi');

// Use The Odds API only
await fetchEnhancedLiveOdds('basketball_nba', 'theodds');

// Merge data from both APIs
await fetchEnhancedLiveOdds('basketball_nba', 'both');

// Auto-select (default)
await fetchEnhancedLiveOdds('basketball_nba', 'auto');
```

### Fetch Advantage Opportunities

```typescript
import { fetchAdvantageOpportunities } from '@/lib/enhanced-odds-api';

// Get arbitrage + positive EV opportunities
const advantages = await fetchAdvantageOpportunities('basketball_nba', 'ALL');

// Arbitrage only
const arb = await fetchAdvantageOpportunities('basketball_nba', 'ARBITRAGE');

// Positive EV only
const ev = await fetchAdvantageOpportunities('basketball_nba', 'POSITIVE_EV');
```

## API Endpoints

### GET /api/enhanced-odds

Unified endpoint for fetching odds data.

**Query Parameters:**
- `sport` - Sport key (default: `basketball_nba`)
  - Supported: `basketball_nba`, `americanfootball_nfl`, `baseball_mlb`, `icehockey_nhl`, `soccer_epl`, etc.
- `strategy` - Data source strategy (default: `auto`)
  - Options: `rapidapi`, `theodds`, `both`, `auto`
- `includeAdvantages` - Include arbitrage/+EV opportunities (default: `false`)

**Example Request:**
```bash
GET /api/enhanced-odds?sport=basketball_nba&strategy=rapidapi&includeAdvantages=true
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "sport": "NBA",
      "event": "Lakers @ Warriors",
      "eventTime": "2025-01-15T19:00:00Z",
      "betType": "Moneyline",
      "comparisons": [
        { "sportsbook": "DraftKings", "odds": -110 },
        { "sportsbook": "FanDuel", "odds": -105 },
        { "sportsbook": "BetMGM", "odds": -108 }
      ],
      "bestOdds": -105,
      "bestSportsbook": "FanDuel"
    }
  ],
  "source": "rapidapi",
  "advantageOpportunities": [
    {
      "id": "arb1",
      "sport": "NBA",
      "event": "Lakers @ Warriors",
      "advantageType": "ARBITRAGE",
      "arbitrageProfit": 25.50,
      "profitPercentage": 2.5,
      "books": [
        {
          "sportsbook": "DraftKings",
          "selection": "Lakers",
          "odds": 150
        },
        {
          "sportsbook": "FanDuel",
          "selection": "Warriors",
          "odds": -130
        }
      ]
    }
  ],
  "availableAPIs": {
    "rapidapi": true,
    "theodds": true
  },
  "remainingRequests": {
    "rapidapi": 450
  },
  "meta": {
    "sport": "basketball_nba",
    "strategy": "rapidapi",
    "count": 12,
    "advantageCount": 3
  }
}
```

## Supported Sports

### RapidAPI Sportsbook Coverage

| League | Code | Description |
|--------|------|-------------|
| NFL | `americanfootball_nfl` | National Football League |
| NBA | `basketball_nba` | National Basketball Association |
| MLB | `baseball_mlb` | Major League Baseball |
| NHL | `icehockey_nhl` | National Hockey League |
| NCAAF | `americanfootball_ncaaf` | College Football |
| NCAAB | `basketball_ncaab` | College Basketball |
| EPL | `soccer_epl` | English Premier League |
| MLS | `soccer_mls` | Major League Soccer |
| UFC | `mma_ufc` | Ultimate Fighting Championship |
| NASCAR | `racing_nascar` | NASCAR Racing |
| Tennis | `tennis` | Professional Tennis |
| Golf | `golf` | Professional Golf |
| Boxing | `boxing` | Professional Boxing |

## Advanced Features

### 1. Arbitrage Detection

Arbitrage opportunities are risk-free profits by betting both sides across different sportsbooks:

```typescript
import { fetchArbitrageOpportunities } from '@/lib/rapidapi-sportsbook';

const arbs = await fetchArbitrageOpportunities('NBA');

arbs.data?.forEach(opp => {
  console.log(`${opp.event}: ${opp.profitPercentage}% profit`);
  console.log(`Books:`, opp.books.map(b => `${b.sportsbook} ${b.selection} ${b.odds}`));
});
```

### 2. Positive Expected Value (+EV)

Find bets where the odds are better than the true probability:

```typescript
import { fetchPositiveEVOpportunities } from '@/lib/rapidapi-sportsbook';

const evBets = await fetchPositiveEVOpportunities('NFL');

evBets.data?.forEach(opp => {
  console.log(`${opp.event}: +${opp.expectedValue}% EV`);
});
```

### 3. Odds Conversion

Convert between American and decimal odds:

```typescript
import {
  americanToDecimal,
  decimalToAmerican,
  calculateImpliedProbability,
  calculateExpectedValue
} from '@/lib/rapidapi-sportsbook';

// American to Decimal
const decimal = americanToDecimal(-110); // 1.909

// Decimal to American
const american = decimalToAmerican(1.909); // -110

// Implied Probability
const prob = calculateImpliedProbability(-110); // 52.38%

// Expected Value
const ev = calculateExpectedValue(-110, 55, 100); // $2.27
```

## Component Updates

### Update Live Odds Tab

Replace the existing odds fetching in `components/tabs/live-odds-tab.tsx`:

```typescript
// OLD:
import { fetchLiveOdds } from '@/lib/odds-api';

// NEW:
import { fetchEnhancedLiveOdds } from '@/lib/enhanced-odds-api';

// In your component:
const response = await fetchEnhancedLiveOdds(selectedSport, 'auto');
setOddsData(response.data);
setAdvantageOpportunities(response.advantageOpportunities || []);
```

### Update API Routes

Replace existing `/api/odds` calls with `/api/enhanced-odds`:

```typescript
// Frontend component
const response = await fetch(
  `/api/enhanced-odds?sport=${sport}&strategy=auto&includeAdvantages=true`
);
const data = await response.json();
```

## Migration Checklist

- [x] Install RapidAPI Sportsbook integration (`lib/rapidapi-sportsbook.ts`)
- [x] Create enhanced odds API (`lib/enhanced-odds-api.ts`)
- [x] Add new API route (`app/api/enhanced-odds/route.ts`)
- [x] Update environment variables (`.env.example`)
- [ ] Add your RapidAPI key to `.env.local`
- [ ] Update Live Odds Tab to use enhanced API
- [ ] Update AI Picks to use advantage opportunities
- [ ] Update Analyze Bet to show arbitrage detection
- [ ] Add advantage opportunities display in UI
- [ ] Test with real API calls
- [ ] Add rate limit monitoring

## Pricing & Rate Limits

Check [RapidAPI Sportsbook Pricing](https://rapidapi.com/sportsbook-api-sportsbook-api-default/api/sportsbook-api2/pricing) for current plans.

### Free Tier
- Typically 100-500 requests/month
- Great for development and testing

### Paid Tiers
- Higher rate limits
- More sports coverage
- Priority support

## Troubleshooting

### Issue: "API key not configured"

**Solution**: Ensure your `.env.local` contains:
```env
NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY=your-actual-key-here
```

Restart your dev server after adding the key.

### Issue: "403 Forbidden" or "401 Unauthorized"

**Solution**:
1. Verify your API key is correct
2. Check that you're subscribed to a plan on RapidAPI
3. Ensure you haven't exceeded rate limits

### Issue: Falls back to mock data

**Solution**:
1. Check browser console for API errors
2. Verify environment variable is set
3. Check `getAvailableAPIs()` in your component

```typescript
import { getAvailableAPIs } from '@/lib/enhanced-odds-api';

const apis = getAvailableAPIs();
console.log('Available APIs:', apis); // { rapidapi: true, theodds: false }
```

## Best Practices

1. **Use Auto Strategy**: Let the system pick the best available API
2. **Cache Results**: Store odds data to minimize API calls
3. **Monitor Rate Limits**: Check `remainingRequests` in responses
4. **Fallback Gracefully**: Always handle mock data fallback
5. **Show Data Source**: Display which API is being used to users

## Resources

- [RapidAPI Sportsbook API](https://rapidapi.com/sportsbook-api-sportsbook-api-default/api/sportsbook-api2)
- [Official Documentation](https://sportsbookapi.com/documentation/)
- [Swagger API Tester](https://api.sportsbookapi.com/documentation/static/index.html)

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify your API key is active
3. Review the RapidAPI dashboard for usage stats
4. Contact RapidAPI support if issues persist

---

**Next Steps**: Add your API key to `.env.local` and start using the enhanced odds system!
