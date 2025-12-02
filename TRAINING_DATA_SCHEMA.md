# Training Data Schema Documentation

## Overview

This document describes the structure of `training_data_sagemaker.csv` for the AI Bet Prediction Engine.

## File Format

- **Format**: CSV (Comma-Separated Values)
- **Header Row**: Yes (column names in first row)
- **Total Columns**: 51 (1 label + 50 features)
- **Data Types**: All numeric (0/1 for booleans, floats for continuous values)

## Column Definitions

### Label Column (Target Variable)

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `label` | Binary | 0 or 1 | Bet outcome: 1 = Win, 0 = Loss |

### Sport Features (One-Hot Encoded)

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `sport_nba` | Binary | 0 or 1 | 1 if NBA/Basketball, 0 otherwise |
| `sport_nfl` | Binary | 0 or 1 | 1 if NFL/Football, 0 otherwise |
| `sport_mlb` | Binary | 0 or 1 | 1 if MLB/Baseball, 0 otherwise |
| `sport_nhl` | Binary | 0 or 1 | 1 if NHL/Hockey, 0 otherwise |

**Note**: Exactly one should be 1, others 0

### Bet Type Features (One-Hot Encoded)

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `bet_type_moneyline` | Binary | 0 or 1 | 1 if Moneyline bet |
| `bet_type_spread` | Binary | 0 or 1 | 1 if Spread bet |
| `bet_type_over_under` | Binary | 0 or 1 | 1 if Over/Under bet |
| `bet_type_parlay` | Binary | 0 or 1 | 1 if Parlay bet |

**Note**: Exactly one should be 1, others 0

### Financial Features

| Column | Type | Range | Description |
|--------|------|-------|-------------|
| `bet_amount` | Float | 1-500+ | Stake amount in dollars |
| `budget` | Float | 100-10000+ | Weekly betting budget in dollars |
| `budget_percent` | Float | 0-100 | Percentage of budget risked (bet_amount/budget * 100) |

### Game Analysis Features

| Column | Type | Range | Description |
|--------|------|-------|-------------|
| `favorite_win_pct` | Float | 0.0-1.0 | Favorite team's win percentage (e.g., 0.65 = 65%) |
| `underdog_win_pct` | Float | 0.0-1.0 | Underdog team's win percentage |
| `has_key_injuries` | Binary | 0 or 1 | 1 if key players injured |
| `bad_weather` | Binary | 0 or 1 | 1 if poor weather conditions |
| `is_parlay` | Binary | 0 or 1 | 1 if parlay bet (matches bet_type_parlay) |

### Emotional Risk Features (One-Hot Encoded)

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `emotional_risk_low` | Binary | 0 or 1 | 1 if low emotional risk |
| `emotional_risk_moderate` | Binary | 0 or 1 | 1 if moderate emotional risk |
| `emotional_risk_high` | Binary | 0 or 1 | 1 if high emotional risk |

**Note**: Exactly one should be 1, others 0

### Emotional State Features (One-Hot Encoded)

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `emotional_state_neutral` | Binary | 0 or 1 | 1 if neutral/calm state |
| `emotional_state_positive` | Binary | 0 or 1 | 1 if positive/excited state |
| `emotional_state_negative` | Binary | 0 or 1 | 1 if negative/frustrated state |
| `emotional_state_dangerous` | Binary | 0 or 1 | 1 if dangerous/desperate state |

**Note**: Exactly one should be 1, others 0

### Behavioral Signal Features

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `chasing_behavior` | Binary | 0 or 1 | 1 if trying to recover losses |
| `high_frequency_betting` | Binary | 0 or 1 | 1 if multiple bets in short time |
| `recent_loss` | Binary | 0 or 1 | 1 if previous bet was a loss |
| `recent_win` | Binary | 0 or 1 | 1 if previous bet was a win |

### Performance Metrics (Sport-Specific)

| Column | Type | Range | Description |
|--------|------|-------|-------------|
| `favorite_ppg` | Float | 0-35+ | Points per game (NBA) or relevant stat |
| `underdog_ppg` | Float | 0-35+ | Points per game (NBA) or relevant stat |
| `favorite_fg_pct` | Float | 0.0-1.0 | Field goal % (NBA) or completion % (NFL) |
| `underdog_fg_pct` | Float | 0.0-1.0 | Field goal % (NBA) or completion % (NFL) |
| `favorite_def_rating` | Float | 90-120 | Defensive rating (NBA) or ERA (MLB) |
| `underdog_def_rating` | Float | 90-120 | Defensive rating (NBA) or ERA (MLB) |

**Note**: Set to 0 if not applicable for sport

### Context Features

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `home_advantage` | Binary | 0 or 1 | 1 if favorite is home team |

### Odds and Confidence Features

| Column | Type | Range | Description |
|--------|------|-------|-------------|
| `odds_american` | Integer | -500 to +500 | American odds format (negative = favorite) |
| `implied_probability` | Float | 0-100 | Implied probability from odds |
| `confidence_score` | Integer | 0-100 | AI confidence in analysis |

### Safety Risk Features (One-Hot Encoded)

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `safety_risk_low` | Binary | 0 or 1 | 1 if low safety risk |
| `safety_risk_moderate` | Binary | 0 or 1 | 1 if moderate safety risk |
| `safety_risk_high` | Binary | 0 or 1 | 1 if high safety risk |

**Note**: Exactly one should be 1, others 0. Usually matches emotional_risk.

### User Experience Features (One-Hot Encoded)

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `user_experience_novice` | Binary | 0 or 1 | 1 if novice bettor |
| `user_experience_intermediate` | Binary | 0 or 1 | 1 if intermediate bettor |
| `user_experience_expert` | Binary | 0 or 1 | 1 if expert bettor |

**Note**: Exactly one should be 1, others 0

### Emotional and Bias Features

| Column | Type | Range | Description |
|--------|------|-------|-------------|
| `emotional_intensity` | Integer | 1-10 | Emotional intensity scale |
| `bias_overconfidence` | Binary | 0 or 1 | 1 if overconfidence bias detected |
| `bias_recency` | Binary | 0 or 1 | 1 if recency bias detected |
| `bias_loss_aversion` | Binary | 0 or 1 | 1 if loss aversion detected |
| `bias_confirmation` | Binary | 0 or 1 | 1 if confirmation bias detected |

### Performance History

| Column | Type | Range | Description |
|--------|------|-------|-------------|
| `last_5_win_rate` | Float | 0.0-1.0 | Win rate of last 5 bets (e.g., 0.6 = 60%) |

### User Demographics (One-Hot Encoded)

| Column | Type | Values | Description |
|--------|------|--------|-------------|
| `user_age_18_25` | Binary | 0 or 1 | 1 if age 18-25 |
| `user_age_26_35` | Binary | 0 or 1 | 1 if age 26-35 |
| `user_age_36_45` | Binary | 0 or 1 | 1 if age 36-45 |
| `user_age_46_plus` | Binary | 0 or 1 | 1 if age 46+ |

**Note**: Exactly one should be 1, others 0

## Example Rows

### Example 1: Safe NBA Moneyline Bet (WIN)

```csv
label,sport_nba,sport_nfl,sport_mlb,sport_nhl,bet_type_moneyline,bet_type_spread,bet_type_over_under,bet_type_parlay,bet_amount,budget,budget_percent,favorite_win_pct,underdog_win_pct,has_key_injuries,bad_weather,is_parlay,emotional_risk_low,emotional_risk_moderate,emotional_risk_high,emotional_state_neutral,emotional_state_positive,emotional_state_negative,emotional_state_dangerous,chasing_behavior,high_frequency_betting,recent_loss,recent_win,favorite_ppg,underdog_ppg,favorite_fg_pct,underdog_fg_pct,favorite_def_rating,underdog_def_rating,home_advantage,odds_american,implied_probability,confidence_score,safety_risk_low,safety_risk_moderate,safety_risk_high,user_experience_novice,user_experience_intermediate,user_experience_expert,emotional_intensity,bias_overconfidence,bias_recency,bias_loss_aversion,bias_confirmation,last_5_win_rate,user_age_18_25,user_age_26_35,user_age_36_45,user_age_46_plus
1,1,0,0,0,1,0,0,0,25,500,5,0.65,0.45,0,0,0,1,0,0,1,0,0,0,0,0,0,0,22.5,18.3,0.475,0.442,105.2,112.4,1,-150,60,75,1,0,0,0,1,0,3,0,0,0,0,0.6,0,1,0,0
```

**Characteristics**:
- NBA game, moneyline bet
- Low stake (5% of budget)
- Strong favorite (65% win rate vs 45%)
- Low emotional risk, neutral state
- No chasing or biases
- Result: WIN

### Example 2: Risky NFL Parlay (LOSS)

```csv
label,sport_nba,sport_nfl,sport_mlb,sport_nhl,bet_type_moneyline,bet_type_spread,bet_type_over_under,bet_type_parlay,bet_amount,budget,budget_percent,favorite_win_pct,underdog_win_pct,has_key_injuries,bad_weather,is_parlay,emotional_risk_low,emotional_risk_moderate,emotional_risk_high,emotional_state_neutral,emotional_state_positive,emotional_state_negative,emotional_state_dangerous,chasing_behavior,high_frequency_betting,recent_loss,recent_win,favorite_ppg,underdog_ppg,favorite_fg_pct,underdog_fg_pct,favorite_def_rating,underdog_def_rating,home_advantage,odds_american,implied_probability,confidence_score,safety_risk_low,safety_risk_moderate,safety_risk_high,user_experience_novice,user_experience_intermediate,user_experience_expert,emotional_intensity,bias_overconfidence,bias_recency,bias_loss_aversion,bias_confirmation,last_5_win_rate,user_age_18_25,user_age_26_35,user_age_36_45,user_age_46_plus
0,0,1,0,0,0,0,0,1,200,400,50,0.52,0.58,0,0,1,0,1,0,0,0,1,0,1,1,1,0,24.5,26.8,0.0,0.0,20.5,19.2,0,250,28.6,45,0,1,0,0,1,0,6,1,1,1,0,0.3,1,0,0,0
```

**Characteristics**:
- NFL game, parlay bet
- High stake (50% of budget)
- Moderate teams, underdog favored
- Moderate emotional risk, negative state
- Chasing losses, recent loss
- Multiple biases detected
- Result: LOSS

## Data Quality Guidelines

### 1. Balanced Dataset
- Aim for 40-60% win rate in labels
- Don't have too many wins or losses

### 2. Realistic Values
- Budget should be reasonable ($100-$10,000)
- Win percentages between 0.30-0.80
- Odds typically -500 to +500

### 3. Feature Consistency
- One-hot encoded features must sum to 1
- is_parlay should match bet_type_parlay
- budget_percent should equal (bet_amount/budget * 100)

### 4. Sport-Specific Stats
- Set non-applicable stats to 0
- NBA: Use PPG, FG%, defensive rating
- NFL: Use yards, TD, completion %
- MLB: Use batting avg, ERA, RBI
- NHL: Use goals, assists, save %

## How to Generate More Training Data

### Option 1: Manual Entry

Create a spreadsheet template and fill in real bet outcomes:

```csv
# Template for new bets
label,sport_nba,sport_nfl,...
?,1,0,0,0,1,0,0,0,50,1000,5,0.70,0.42,...
```

### Option 2: Database Export

Export from your application database:

```sql
SELECT
  CASE WHEN outcome = 'win' THEN 1 ELSE 0 END as label,
  CASE WHEN sport = 'NBA' THEN 1 ELSE 0 END as sport_nba,
  CASE WHEN sport = 'NFL' THEN 1 ELSE 0 END as sport_nfl,
  ...
FROM bet_outcomes
WHERE created_at >= '2024-01-01'
```

### Option 3: Programmatic Generation

Use the helper function in your app:

```typescript
import { betScenarioToSageMakerInput } from '@/lib/sagemaker-prediction'

// After bet is resolved
const features = betScenarioToSageMakerInput(scenario, analysis, userProfile)
const label = actualOutcome === 'win' ? 1 : 0

// Save to CSV or database
await saveToBetOutcomesTable({ label, ...features })
```

## Data Validation Checklist

Before training:

- [ ] All one-hot encoded groups sum to 1
- [ ] No missing values (use 0 for unknown)
- [ ] budget_percent matches calculation
- [ ] Label column is 0 or 1
- [ ] At least 100 rows (preferably 1000+)
- [ ] Reasonable class balance (30-70% wins)
- [ ] All features are numeric
- [ ] File has header row
- [ ] No extra columns

## Common Pitfalls

### ❌ Don't Do This:

1. **All wins or all losses**: Model won't learn patterns
2. **Missing values**: Replace with 0 or mean
3. **Text in numeric columns**: Convert to numbers
4. **Inconsistent one-hot encoding**: Exactly one feature should be 1
5. **Too few examples**: Need 100+ minimum, 1000+ recommended

### ✅ Best Practices:

1. **Diverse scenarios**: Include different sports, bet types, risk levels
2. **Real outcomes**: Use actual bet results when possible
3. **Feature engineering**: Add derived features (e.g., team form, head-to-head)
4. **Regular updates**: Retrain with new data monthly
5. **Version control**: Keep track of dataset versions

## File Size Estimates

| Rows | File Size | Training Time | Recommended For |
|------|-----------|---------------|-----------------|
| 40 | ~10 KB | 2-3 min | Testing pipeline |
| 1,000 | ~250 KB | 5-8 min | Initial production |
| 10,000 | ~2.5 MB | 10-15 min | Mature product |
| 100,000 | ~25 MB | 30-60 min | Enterprise scale |

## Next Steps

1. **Start with provided sample data** (40 rows) to test the pipeline
2. **Collect real bet outcomes** from your application
3. **Export to CSV** using the schema above
4. **Upload to S3** and retrain
5. **Compare model performance** before and after

---

**Questions?** Check [SAGEMAKER_TRAINING_README.md](SAGEMAKER_TRAINING_README.md) for detailed training instructions.
