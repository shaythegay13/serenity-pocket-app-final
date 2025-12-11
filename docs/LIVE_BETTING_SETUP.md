# Live Betting Dashboard Setup Guide

## Overview

This comprehensive real-time sports betting dashboard provides four critical data layers:

1. **Live Game Data**: Real-time scores, play-by-play, game clock, player stats
2. **Live Odds Data**: Current odds from multiple sportsbooks with best odds highlighted
3. **Line Movement Data**: Historical line tracking showing opening vs current odds
4. **Betting Trends Data**: Sharp money indicators, public/professional splits, consensus picks

## Architecture

- **Frontend**: Next.js with React + TypeScript
- **Real-time Updates**: Socket.IO WebSocket with REST API fallback
- **Data Sources**: The Odds API, OddsJam, Sportradar, SportsDataIO (configurable)
- **Caching**: In-memory cache with configurable TTL
- **Update Frequency**:
  - Live scores: Every 5 seconds
  - Odds: Every 5 seconds
  - Line movement: Every 15 seconds
  - Trends: Every 30 seconds

## Installation

### 1. Install Dependencies

```bash
npm install socket.io socket.io-client
```

### 2. Environment Variables

Create a `.env.local` file in your project root:

```env
# Data Source API Keys (at least one required)
ODDS_API_KEY=your_odds_api_key_here
ODDSJAM_API_KEY=your_oddsjam_key_here
SPORTRADAR_API_KEY=your_sportradar_key_here
SPORTSDATA_API_KEY=your_sportsdata_key_here

# App configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. WebSocket Server Setup (Optional but Recommended)

For WebSocket support, you need a custom Next.js server. Create `server.js` in your project root:

```javascript
const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { initializeWebSocket } = require("./lib/services/websocket-server")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Initialize WebSocket server
  initializeWebSocket(server)

  const PORT = process.env.PORT || 3000
  server.listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${PORT}`)
    console.log(`> WebSocket server running at ws://localhost:${PORT}`)
  })
})
```

Update `package.json`:

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

## Data Source Configuration

### The Odds API (Recommended for Getting Started)

- **Sign up**: https://the-odds-api.com
- **Free tier**: 500 requests/month
- **Coverage**: 40+ sportsbooks, all major sports
- **Features**: Live odds, scores, futures
- **Pricing**: $0.001 per request after free tier

### OddsJam API (Best for Speed)

- **Sign up**: https://oddsjam.com/api
- **Speed**: 1M+ odds updates/second
- **Features**: Sharp money tracking, trend data, injury reports
- **Pricing**: Starts at $99/month

### Sportradar (Best for Official Data)

- **Sign up**: https://developer.sportradar.com
- **Features**: Official league data, play-by-play, props
- **Pricing**: Custom enterprise pricing

### SportsDataIO (Best for Historical Data)

- **Sign up**: https://sportsdata.io
- **Features**: Comprehensive historical odds, closing lines
- **Pricing**: Starts at $10/month per sport

## Usage

### Example: Full Dashboard Page

```tsx
"use client"

import { useState } from "react"
import { LiveGameCard } from "@/components/live-betting/LiveGameCard"
import { OddsGrid } from "@/components/live-betting/OddsGrid"
import { LineMovementChart } from "@/components/live-betting/LineMovementChart"
import { BettingTrendsDashboard } from "@/components/live-betting/BettingTrendsDashboard"

export default function LiveBettingDashboard() {
  const [selectedGameId, setSelectedGameId] = useState("game-123")
  const sport = "nfl"

  return (
    <div className="min-h-screen bg-[#1b212c] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F5] mb-2">
            Live Betting Dashboard
          </h1>
          <p className="text-gray-400">
            Real-time odds, line movement, and sharp money tracking
          </p>
        </div>

        {/* Live Game Card */}
        <LiveGameCard
          sport={sport}
          gameId={selectedGameId}
          onClick={() => console.log("Game clicked")}
        />

        {/* Odds Grid */}
        <OddsGrid sport={sport} gameId={selectedGameId} />

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Movement */}
          <LineMovementChart sport={sport} gameId={selectedGameId} />

          {/* Betting Trends */}
          <BettingTrendsDashboard sport={sport} gameId={selectedGameId} />
        </div>
      </div>
    </div>
  )
}
```

### Example: Individual Component Usage

#### 1. Live Game Card

```tsx
import { LiveGameCard } from "@/components/live-betting/LiveGameCard"

<LiveGameCard
  sport="nfl"
  gameId="game-123"
  onClick={() => handleGameClick()}
/>
```

#### 2. Odds Grid

```tsx
import { OddsGrid } from "@/components/live-betting/OddsGrid"

<OddsGrid sport="nfl" gameId="game-123" />
```

#### 3. Line Movement Chart

```tsx
import { LineMovementChart } from "@/components/live-betting/LineMovementChart"

<LineMovementChart sport="nfl" gameId="game-123" />
```

#### 4. Betting Trends Dashboard

```tsx
import { BettingTrendsDashboard } from "@/components/live-betting/BettingTrendsDashboard"

<BettingTrendsDashboard sport="nfl" gameId="game-123" />
```

### Example: Using Hooks Directly

```tsx
"use client"

import { useLiveGame, useLiveOdds, useBettingTrends } from "@/lib/hooks/useWebSocket"

function MyCustomComponent() {
  const { data: game, loading, isConnected } = useLiveGame("nfl", "game-123")
  const { data: odds } = useLiveOdds("nfl", "game-123")
  const { data: trends } = useBettingTrends("nfl", "game-123")

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h2>{game?.homeTeam} vs {game?.awayTeam}</h2>
      <p>Score: {game?.status.homeScore} - {game?.status.awayScore}</p>
      <p>Connection: {isConnected ? "Live WebSocket" : "Polling"}</p>
    </div>
  )
}
```

## API Routes

### GET /api/live-games

Fetch live game data with scores and status.

**Query Parameters:**
- `sport` (required): nfl | nba | mlb | nhl
- `gameId` (optional): Specific game ID

**Example:**
```bash
curl http://localhost:3000/api/live-games?sport=nfl&gameId=game-123
```

### GET /api/live-odds

Fetch live odds from multiple sportsbooks.

**Query Parameters:**
- `sport` (required): nfl | nba | mlb | nhl
- `gameId` (optional): Specific game ID

**Example:**
```bash
curl http://localhost:3000/api/live-odds?sport=nfl&gameId=game-123
```

### GET /api/line-movement

Fetch historical line movement data.

**Query Parameters:**
- `sport` (required): nfl | nba | mlb | nhl
- `gameId` (required): Specific game ID

**Example:**
```bash
curl http://localhost:3000/api/line-movement?sport=nfl&gameId=game-123
```

### GET /api/betting-trends

Fetch betting trends and sharp money data.

**Query Parameters:**
- `sport` (required): nfl | nba | mlb | nhl
- `gameId` (required): Specific game ID

**Example:**
```bash
curl http://localhost:3000/api/betting-trends?sport=nfl&gameId=game-123
```

## Utility Functions

### Odds Format Conversions

```typescript
import {
  americanToDecimal,
  americanToFractional,
  decimalToAmerican,
  calculateImpliedProbability,
} from "@/lib/utils/betting-calculations"

// Convert American odds to Decimal
const decimal = americanToDecimal(-110) // 1.909

// Convert to Fractional
const fractional = americanToFractional(+150) // "3/2"

// Calculate implied probability
const prob = calculateImpliedProbability(-110) // 52.38%
```

### Line Movement Analysis

```typescript
import {
  calculateOddsChange,
  isSignificantLineMovement,
  detectReverseLineMovement,
  detectSteamMove,
} from "@/lib/utils/betting-calculations"

// Calculate % change
const change = calculateOddsChange(-110, -105) // Returns % change

// Detect significant movement
const significant = isSignificantLineMovement(
  { value: -110 },
  { value: -105 },
  5 // 5% threshold
)

// Detect reverse line movement (sharp indicator)
const rlm = detectReverseLineMovement(
  { value: -110 },
  { value: -115 },
  75 // 75% public on favorite but line moved worse
)
```

### Best Odds Finding

```typescript
import { findBestOdds, calculateArbitrage } from "@/lib/utils/betting-calculations"

// Find best odds across bookmakers
const best = findBestOdds(bookmakers, "moneyline")
console.log(best.bestHome.bookmaker) // "FanDuel"
console.log(best.bestHome.odds) // -105

// Check for arbitrage opportunity
const arb = calculateArbitrage(-105, +120)
if (arb.hasArbitrage) {
  console.log(`Guaranteed profit: ${arb.profit}%`)
}
```

### Value Betting

```typescript
import { calculateValueBet, calculateKellyCriterion } from "@/lib/utils/betting-calculations"

// Find value bets
const value = calculateValueBet(
  60, // Your estimated 60% win probability
  -110, // Market odds
  5 // Minimum 5% edge required
)

if (value.hasValue) {
  console.log(`Edge: ${value.edge}%`)
  console.log(`Expected value: $${value.expectedValue}`)

  // Calculate optimal bet size (Kelly Criterion)
  const kellySizing = calculateKellyCriterion(0.60, -110)
  console.log(`Bet ${kellySizing}% of bankroll`)
}
```

## Performance Optimization

### Caching Configuration

Edit `lib/services/data-aggregator.ts` to adjust cache TTL:

```typescript
const CACHE_CONFIG: CacheConfig = {
  liveGames: 5000,    // 5 seconds
  liveOdds: 5000,     // 5 seconds
  lineMovement: 15000, // 15 seconds
  bettingTrends: 30000, // 30 seconds
}
```

### WebSocket Fallback

If WebSocket is unavailable, components automatically fallback to REST API polling:

```typescript
const { data, isConnected } = useLiveGame("nfl", "game-123", {
  enabled: true,           // Enable WebSocket
  fallbackPollingInterval: 10000, // Poll every 10s if WS fails
  reconnectAttempts: 5,    // Try to reconnect 5 times
})
```

## Troubleshooting

### WebSocket Not Connecting

1. Ensure custom server is running (`node server.js`)
2. Check console for connection errors
3. Verify firewall/proxy settings
4. Components will automatically fall back to polling

### API Rate Limiting

- Monitor your API usage in provider dashboards
- Increase cache TTL to reduce requests
- Consider upgrading to higher tier plans
- Use multiple providers for failover

### No Data Returned

- Verify API keys are correct in `.env.local`
- Check that games are actually live/upcoming
- Review API provider status pages
- Check browser console for specific errors

## Cost Optimization

### Free Tier Usage

The Odds API free tier (500 requests/month) can support:
- ~16 requests/day
- 2-3 games updated every 15 minutes for 3 hours

To stay within free tier:
1. Only fetch data for games you're actively monitoring
2. Increase cache TTL during non-critical periods
3. Disable WebSocket and use longer polling intervals
4. Use mock data for development/testing

### Production Recommendations

For production use with multiple games:
- The Odds API: ~$50-100/month for moderate usage
- OddsJam: $99-299/month for comprehensive data + trends
- Combine multiple free tiers across providers

## License

This implementation is provided as-is for educational and personal use. Please review the terms of service for each data provider before commercial use.
