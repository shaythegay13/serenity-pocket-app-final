# Feature Panels Setup Guide

This guide explains the new specialized feature panels for the Sports Dashboard and how to set them up.

## Overview

The sports dashboard now includes three specialized panels:

1. **Line Movement Panel** - Time-series graphs showing how betting odds change from opening to current
2. **Team & Player Analytics Panel** - Clickable games that display detailed team rosters and player statistics
3. **Betting Trends Panel** - Public betting percentages vs. sharp money indicators

## Components Added

### Line Movement Panel

**Files:**
- [lib/odds-history-store.ts](lib/odds-history-store.ts) - Historical odds storage system
- [app/api/odds-history/route.ts](app/api/odds-history/route.ts) - API for fetching odds history
- [app/api/capture-odds-snapshot/route.ts](app/api/capture-odds-snapshot/route.ts) - API for capturing current odds
- [components/live-betting/LineMovementChart.tsx](components/live-betting/LineMovementChart.tsx) - Recharts visualization
- [lib/services/data-aggregator.ts](lib/services/data-aggregator.ts) - Updated to use odds history

**Features:**
- ✅ Historical odds tracking stored in JSON files (`data/odds-history/`)
- ✅ Time-series line graphs showing moneyline, spread, and total odds movements
- ✅ Sharp money movement indicators
- ✅ Opening vs. current odds comparison
- ✅ Multiple bookmaker tracking

**How it works:**
1. Odds snapshots are captured periodically and stored
2. The Line Movement chart fetches historical data via `/api/odds-history?gameId={id}`
3. Data is transformed into time-series format and displayed with Recharts

### Team & Player Analytics Panel

**Files:**
- [lib/player-stats-api.ts](lib/player-stats-api.ts) - Player statistics integration
- [app/api/player-analytics/route.ts](app/api/player-analytics/route.ts) - API for team rosters
- [components/sports-dashboard/PlayerStatsModal.tsx](components/sports-dashboard/PlayerStatsModal.tsx) - Modal display

**Features:**
- ✅ Clickable game cards
- ✅ Full team rosters with player details
- ✅ Player information: position, jersey number, height, weight, age
- ✅ Player statistics (when available)
- ✅ Injury status tracking
- ✅ Player images/cutouts

**Data Sources:**
- Primary: TheSportsDB (free tier)
- Fallback: RapidAPI Sports APIs (NBA, NFL, MLB, NHL)

**How it works:**
1. Click on any game in the Team & Player Analytics panel
2. Modal opens and fetches roster data via `/api/player-analytics`
3. Displays both home and away team rosters with player details

### Betting Trends Panel

**Files:**
- [components/sports-dashboard/BettingTrendsViz.tsx](components/sports-dashboard/BettingTrendsViz.tsx) - Visualization component
- [lib/services/data-aggregator.ts](lib/services/data-aggregator.ts) - Betting trends estimation
- [app/api/betting-trends/route.ts](app/api/betting-trends/route.ts) - API endpoint

**Features:**
- ✅ Public betting percentages (# of bets)
- ✅ Public money percentages ($ amount)
- ✅ Sharp money indicators
- ✅ Reverse line movement detection
- ✅ Moneyline, spread, and total markets

**Data Source:**
- Currently uses **estimated/simulated data** based on line movement patterns
- For production: Integrate with Action Network API, OddsJam API, or Sports Insights

**How it works:**
1. Fetches betting trends via `/api/betting-trends?sport={sport}&gameId={gameId}`
2. Shows public vs. sharp money splits with progress bars
3. Highlights reverse line movement (when sharp and public disagree)

## Setup Instructions

### 1. Install Dependencies

Recharts was already installed:
```bash
npm install recharts
```

### 2. Set Up Odds Snapshot Automation

To populate the Line Movement graphs with actual historical data, you need to capture odds snapshots periodically.

#### Option A: Run Locally with Node.js

Run the capture script continuously:
```bash
node scripts/capture-odds-snapshots.js
```

Or specify a custom interval (in minutes):
```bash
node scripts/capture-odds-snapshots.js --interval 15
```

Run once manually:
```bash
node scripts/capture-odds-snapshots.js --once
```

#### Option B: Use Vercel Cron Jobs

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/capture-odds-snapshot",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

This runs every 30 minutes on Vercel (requires Pro plan).

#### Option C: GitHub Actions

Create `.github/workflows/capture-odds.yml`:
```yaml
name: Capture Odds Snapshots

on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  capture:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger odds capture
        run: |
          curl -X POST https://your-domain.com/api/capture-odds-snapshot
```

#### Option D: System Cron Job (Linux/Mac)

Add to crontab:
```bash
crontab -e
```

Add this line (runs every 30 minutes):
```
*/30 * * * * curl -X POST http://localhost:3000/api/capture-odds-snapshot
```

### 3. API Keys Required

Ensure these environment variables are set in `.env.local`:

```bash
# Required for odds data
NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY=your_rapidapi_key

# Optional for player stats (uses free tier if available)
NEXT_PUBLIC_THESPORTSDB_API_KEY=your_key

# Optional for odds data fallback
NEXT_PUBLIC_ODDS_API_KEY=your_key
```

### 4. Data Storage

Historical odds are stored in:
```
data/odds-history/
  ├── {gameId1}.json
  ├── {gameId2}.json
  └── ...
```

Each file contains:
```json
{
  "gameId": "...",
  "homeTeam": "...",
  "awayTeam": "...",
  "sport": "...",
  "commenceTime": "...",
  "snapshots": [
    {
      "timestamp": "2025-12-09T10:30:00Z",
      "moneyline": { "home": -150, "away": 130 },
      "spread": {
        "home": { "line": -3.5, "odds": -110 },
        "away": { "line": 3.5, "odds": -110 }
      },
      "totals": {
        "over": { "line": 215.5, "odds": -110 },
        "under": { "line": 215.5, "odds": -110 }
      }
    }
  ]
}
```

## Usage

### Viewing Line Movement

1. Navigate to any sport tab (NFL, NBA, MLB, NHL)
2. Click on "Line Movement" feature panel
3. You'll see graphs showing how odds have changed over time
4. Switch between Moneyline, Spread, and Total bet types

**Note:** Graphs will be empty until you've captured at least 2 snapshots for a game.

### Viewing Player Analytics

1. Navigate to "Team & Player Analytics" panel
2. Click on any game
3. Modal opens with both team rosters
4. Switch between home and away teams
5. View player details, stats, and injury status

### Viewing Betting Trends

1. Navigate to "Betting Trends" panel
2. View public betting percentages vs. sharp money
3. Switch between Moneyline, Spread, and Total markets
4. Look for reverse line movement indicators (sharp vs. public)

## Testing

### Test Odds Snapshot Capture

```bash
curl -X POST http://localhost:3000/api/capture-odds-snapshot
```

Expected response:
```json
{
  "success": true,
  "message": "Odds snapshot capture completed",
  "stats": {
    "totalGames": 26,
    "totalSnapshots": 26,
    "sports": 4
  }
}
```

### Test Odds History Retrieval

```bash
curl "http://localhost:3000/api/odds-history?gameId=some_game_id"
```

### Test Player Analytics

```bash
curl "http://localhost:3000/api/player-analytics?sport=basketball_nba&teamName=Lakers"
```

### Test Betting Trends

```bash
curl "http://localhost:3000/api/betting-trends?sport=basketball_nba&gameId=some_game_id"
```

## Production Considerations

### For Line Movement
- Run snapshot capture every 15-30 minutes for best granularity
- Consider using a database (PostgreSQL, MongoDB) instead of JSON files for better performance
- Implement cleanup of old game histories (after games complete)
- Use the cleanup function: `cleanupOldHistories(cutoffDate)`

### For Player Analytics
- **Rate Limiting**: Sports Information API on the free tier allows 4 requests/minute
- **Built-in caching**: Team rosters are cached for 30 minutes to minimize API calls
- **Queue system**: Requests are automatically queued and spaced 15 seconds apart
- **First load may take 30+ seconds** for a game (fetching both teams)
- **Subsequent loads are instant** (served from cache)
- Consider upgrading to a higher tier if you need faster loading for many teams

### For Betting Trends
- Current implementation uses **estimated data**
- For production, integrate with:
  - Action Network API (betting percentages)
  - OddsJam API (sharp money indicators)
  - Sports Insights (public vs. sharp splits)
- These services typically cost $50-200/month

## Troubleshooting

### Line Movement graphs are empty
- **Cause:** No historical data captured yet
- **Solution:** Run `node scripts/capture-odds-snapshots.js --once` to capture initial snapshot, wait 30 minutes, run again

### Player modal shows "No roster data available"
- **Cause:** Team name might not match API database
- **Solution:** Check console logs for team search results, adjust team name matching logic in `player-stats-api.ts`

### Betting Trends shows error
- **Cause:** No line movement data available for the game
- **Solution:** Ensure odds snapshots have been captured for the game first

### API rate limits exceeded
- **Cause:** Too many requests to RapidAPI or TheSportsDB
- **Solution:**
  - Increase cache TTL in `data-aggregator.ts`
  - Reduce snapshot capture frequency
  - Upgrade API plan

## Next Steps

### Enhancements to Consider

1. **Database Integration**: Replace JSON file storage with PostgreSQL or MongoDB
2. **Real Betting Trends**: Integrate with Action Network or OddsJam API
3. **Advanced Stats**: Add advanced player metrics (PER, VORP, WAR, etc.)
4. **Predictive Models**: Use historical line movement to predict future movements
5. **Alerts**: Notify users of significant line movements or reverse line movement
6. **Export**: Allow users to export historical odds data to CSV
7. **Comparison**: Side-by-side player comparison tool
8. **Injuries**: Real-time injury updates with expected return dates

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify all API keys are set correctly in `.env.local`
3. Ensure the development server is running on the correct port
4. Check that the `data/odds-history/` directory is writable
