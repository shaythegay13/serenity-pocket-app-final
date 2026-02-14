# Parlay & SGP System — PlayMind Labs

## Overview

The parlay system supports **classic (cross-game) parlays**, **same-game parlays (SGP)**, and **SGP+ (mixed)** with full lifecycle management: build → track → settle.

Key differentiators for PlayMind:
- **SGP correlation tax** — heuristic pricing that penalizes correlated legs (e.g. QB yards + WR receptions)
- **Push handling** — pushed legs reduce/reprice the ticket instead of voiding
- **Tilt detection** — flags chasing losses, cross-sport mashups, laddering
- **EV integration** — requires AI model probabilities for honest EV calculation

---

## Architecture

```
lib/types/ai-models.ts          ← ParlayLeg, Parlay, ParlayType, ParlayOutcome
lib/parlay-utils.ts              ← Pricing, validation, SGP tax, EV, correlation detection
lib/parlay-tracking-service.ts   ← Lifecycle: create, settle, query, tilt signals
app/api/parlays/route.ts         ← POST (build) + GET (list)
app/api/parlays/[id]/route.ts    ← GET (single) + PATCH (settle)
app/api/parlays/settle/[id]/route.ts ← POST (settle with legResults map)
app/api/analyze-parlay/route.ts  ← POST (analysis: EV, risk, warnings)
```

---

## Data Models

### `ParlayLeg`
```typescript
interface ParlayLeg {
  pickId: string
  gameId?: string
  teams: string
  betType: string         // "moneyline", "spread", "total", "player_passing_yards", etc.
  line: string
  odds: number            // American odds
  confidence?: number
  aiWinProbability?: number
  sport?: string
  league?: string
  selection?: string
  outcome?: 'won' | 'lost' | 'void' | 'push' | 'pending'
  settledAt?: string
}
```

### `Parlay`
```typescript
interface Parlay {
  id: string
  type: 'classic' | 'sgp' | 'sgp_plus'
  legs: ParlayLeg[]
  stake: number
  totalOddsAmerican: number
  totalOddsDecimal: number
  impliedProbability: number
  trueProbability?: number
  projectedEV?: number
  riskScore?: number
  outcome: 'pending' | 'won' | 'lost' | 'void' | 'push'
  actualPayout?: number
  settledAt?: string
  emotionAtCreation?: string
  tiltSignals?: string[]
}
```

---

## Pricing

### Regular Parlay (independence assumption)
```
combinedOdds = leg1_decimal × leg2_decimal × ... × legN_decimal
```

### SGP Pricing (with correlation tax)
```
naiveOdds   = leg1_decimal × leg2_decimal × ... × legN_decimal
baseTax     = 0.75  (25% haircut — adjustable)
extraTaxes  = Σ per-pair correlation penalties
effectiveMul = max(0.30, baseTax × (1 − extraTaxes))
sgpOdds     = max(1.01, naiveOdds × effectiveMul)
```

**Correlation pairs** (examples):
| Pair | Extra Tax | Reason |
|------|-----------|--------|
| QB pass yds ↔ WR rec yds | 10% | Directly correlated |
| QB pass TDs ↔ WR rec TDs | 8% | Same scoring play |
| Moneyline ↔ Spread | 12% | Near-duplicate bet |
| Player points ↔ Moneyline | 5% | Moderate correlation |

---

## Validation Rules

| Rule | Regular | SGP |
|------|---------|-----|
| Min legs | 2 | 2 |
| Max legs | 20 | 20 |
| Event IDs | Must be different | Must be same |
| Duplicates | Rejected | Rejected |
| Correlated pairs | N/A | Warned + extra tax |

---

## Settlement State Machine

```
                    ┌─── any leg lost ───► LOST (payout = 0)
                    │
  PENDING ──────────┼─── all active won ──► WON (payout = stake × odds)
                    │
                    ├─── won + pushes ───► WON (repriced: pushed legs removed)
                    │
                    ├─── all pushed ─────► PUSH (payout = stake)
                    │
                    └─── all voided ─────► VOID (payout = stake)
```

**Push reduce/reprice:** When legs push, they are excluded and the parlay reprices with remaining legs. For SGPs, the correlation tax is reapplied to the remaining set.

---

## API Endpoints

### `POST /api/parlays` — Build a parlay
```json
{
  "legs": [{ "gameId": "...", "betType": "moneyline", "odds": -150, ... }],
  "stake": 50,
  "type": "regular",
  "emotionAtCreation": "calm"
}
```

### `GET /api/parlays` — List parlays (with optional filters)
```
GET /api/parlays?sport=nba&outcome=pending&minLegs=2
```

### `GET /api/parlays/:id` — Get single parlay

### `PATCH /api/parlays/:id` — Settle (array format)
```json
{
  "legOutcomes": [
    { "pickId": "leg-1", "outcome": "won" },
    { "pickId": "leg-2", "outcome": "push" }
  ]
}
```

### `POST /api/parlays/settle/:id` — Settle (map format)
```json
{
  "legResults": {
    "leg-1": "win",
    "leg-2": "loss",
    "leg-3": "push"
  }
}
```

### `POST /api/analyze-parlay` — Analyze (EV, risk, warnings)
```json
{
  "legs": [...],
  "stake": 100,
  "emotionalState": "excited"
}
```

---

## Running Tests

```bash
npx jest test/__tests__/lib/parlay-system.test.ts --verbose
```

Test cases included:
1. **3-leg regular NBA parlay** — odds, validation, EV, implied probability
2. **4-leg NFL SGP (Mahomes props)** — SGP tax, correlation detection, pricing
3. **Settlement** — push reduce/reprice, all-pushed refund
4. **Validation edge cases** — min/max legs, duplicates, SGP+ detection
5. **Tilt signals** — chasing losses, cross-sport mashup

---

## Extending for Real Odds

To connect to a live odds API (e.g., The Odds API):

1. **Get an API key** from [the-odds-api.com](https://the-odds-api.com)
2. **Add to `.env.local`**: `ODDS_API_KEY=your_key`
3. **Fetch odds** in the picker recommend route:
   ```typescript
   const res = await fetch(
     `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${key}&regions=us&markets=h2h,spreads,totals`
   )
   ```
4. **Map to ParlayLeg format**: convert `h2h` → `moneyline`, `spreads` → `spread`, `totals` → `total`
5. **Player props**: use `/v4/sports/{sport}/events/{eventId}/odds?markets=player_pass_yds,...`

For SGP, real sportsbook APIs (DraftKings, FanDuel) have their own correlation pricing. The `baseTaxMultiplier` parameter in `calculateSGPOdds()` can be tuned to match observed SGP pricing from each book.
