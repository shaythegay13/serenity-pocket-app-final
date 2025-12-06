# Complete SageMaker Setup Guide - 3-Class Bet Prediction

## 📊 What This Predicts

Your model will predict **3 possible outcomes** for every bet:

| Class | Label | Meaning | Example |
|-------|-------|---------|---------|
| **0** | LOSS | Bet lost, stake gone | Bet $100, lost everything |
| **1** | PUSH | Break even, stake returned | Bet $100, got $100 back |
| **2** | WIN | Bet won, made profit | Bet $100, won $166.67 |

### Output Format

```javascript
{
  lossProbability: 0.15,    // 15% chance of losing
  pushProbability: 0.10,    // 10% chance of push
  winProbability: 0.75,     // 75% chance of winning
  predictedOutcome: "WIN",
  confidence: 0.75,
  expectedValue: 23.45      // Expected profit in dollars
}
```

## 🚀 Quick Start (5 Steps)

### Step 1: Open SageMaker Studio

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Search for "SageMaker" in the services search bar
3. Click "Studio" in the left sidebar
4. Click "Open Studio" (or create a domain if you don't have one)

### Step 2: Upload Files

In SageMaker Studio:
1. Click the **folder icon** (File Browser) on the left
2. Click the **upload icon** (↑)
3. Upload these two files:
   - `training_data_sagemaker_v2.csv`
   - `sagemaker_training_notebook_v2.ipynb`

### Step 3: Run the Notebook

1. Double-click `sagemaker_training_notebook_v2.ipynb` to open it
2. Select kernel: **Python 3 (Data Science)**
3. Run cells **one by one** (Shift + Enter)
4. Wait for training to complete (~10 minutes)
5. Wait for deployment (~5-10 minutes)

### Step 4: Save Endpoint Name

After Cell 10 runs, you'll see:

```
Endpoint Name: xgboost-2024-01-15-10-30-45-123
Region: us-east-1
```

**Copy this endpoint name!**

### Step 5: Configure Your App

Add to `.env.local`:

```bash
AWS_SAGEMAKER_ENDPOINT=xgboost-2024-01-15-10-30-45-123
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

## 💻 Backend Integration

### Option 1: Use the Helper Function

```typescript
import {
  predictBetOutcome,
  betScenarioToSageMakerInput,
  formatPredictionForUser
} from '@/lib/sagemaker-prediction-v2'

// In your API route
const sagemakerInput = betScenarioToSageMakerInput(
  betScenario,
  {
    emotionalRisk: analysis.recommendation.emotionalAnalysis.emotionalRisk,
    emotionalState: analysis.recommendation.emotionalAnalysis.emotionalState,
    chasingBehavior: detectChasingBehavior(betScenario),
    highFrequencyBetting: detectHighFrequency(betScenario),
    favoriteWinPct: analysis.recommendation.gameFactors.favoriteWinPct / 100,
    underdogWinPct: analysis.recommendation.gameFactors.underdogWinPct / 100,
    hasKeyInjuries: analysis.recommendation.gameFactors.hasKeyInjuries,
    badWeather: analysis.recommendation.gameFactors.badWeather,
    confidenceScore: analysis.recommendation.confidence,
  },
  userProfile
)

const prediction = await predictBetOutcome(sagemakerInput)

// Format for user display
const formatted = formatPredictionForUser(prediction)

console.log(formatted.recommendation)  // "PLACE BET" or "DON'T PLACE BET"
console.log(formatted.riskLevel)        // "LOW", "MODERATE", or "HIGH"
console.log(formatted.details)          // Array of insight strings
```

### Option 2: Combine with Claude Analysis

```typescript
// Run both AI analyses in parallel
const [claudeAnalysis, sagemakerPrediction] = await Promise.all([
  getEnhancedBetAnalysis(scenario),
  predictBetOutcome(sagemakerInput)
])

// Return combined result
return NextResponse.json({
  success: true,
  analysis: claudeAnalysis,
  mlPrediction: {
    outcome: sagemakerPrediction.predictedOutcome,
    probabilities: {
      win: sagemakerPrediction.winProbability,
      push: sagemakerPrediction.pushProbability,
      loss: sagemakerPrediction.lossProbability,
    },
    expectedValue: sagemakerPrediction.expectedValue,
    confidence: sagemakerPrediction.confidence,
  },
})
```

## 📈 Understanding the Predictions

### Probability Interpretation

```javascript
// Example 1: Clear Win
{
  lossProbability: 0.10,   // 10% chance
  pushProbability: 0.05,   // 5% chance
  winProbability: 0.85,    // 85% chance ✅
  predictedOutcome: "WIN",
  confidence: 0.85
}
// Action: Safe to bet

// Example 2: Likely Push
{
  lossProbability: 0.30,   // 30% chance
  pushProbability: 0.50,   // 50% chance ✅
  winProbability: 0.20,    // 20% chance
  predictedOutcome: "PUSH",
  confidence: 0.50
}
// Action: Might want to avoid (likely break even)

// Example 3: High Risk Loss
{
  lossProbability: 0.70,   // 70% chance ✅
  pushProbability: 0.10,   // 10% chance
  winProbability: 0.20,    // 20% chance
  predictedOutcome: "LOSS",
  confidence: 0.70
}
// Action: Don't bet
```

### Expected Value (EV)

The model calculates expected value for you:

```
EV = (P(Win) × Profit) + (P(Push) × 0) + (P(Loss) × -Stake)
```

**Examples:**

- **EV = +$15.50**: On average, you'll profit $15.50 per bet (GOOD)
- **EV = -$8.20**: On average, you'll lose $8.20 per bet (BAD)
- **EV = $0.00**: Break even over time (NEUTRAL)

**Rule of thumb:**
- EV > $5: Good bet
- EV < -$5: Bad bet
- -$5 ≤ EV ≤ $5: Marginal bet

## 🔄 Collecting Training Data

### Setup Database Logging

Create a table to store bet outcomes:

```sql
CREATE TABLE ml_training_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),

  -- Bet details
  sport text NOT NULL,
  bet_type text NOT NULL,
  bet_amount numeric NOT NULL,
  budget numeric NOT NULL,
  odds_american integer NOT NULL,

  -- Game stats
  favorite_win_pct numeric,
  underdog_win_pct numeric,
  has_key_injuries boolean,
  bad_weather boolean,

  -- User state
  emotional_risk text,
  emotional_state text,
  chasing_behavior boolean,
  high_frequency_betting boolean,

  -- Outcome (THE LABEL)
  outcome text NOT NULL, -- 'win', 'push', or 'loss'
  label integer NOT NULL, -- 0=loss, 1=push, 2=win

  -- Metadata
  predicted_outcome text,
  predicted_probabilities jsonb,
  created_at timestamp DEFAULT now()
);
```

### Log Every Bet Resolution

```typescript
// When bet is resolved
async function logBetOutcome(
  betScenario: BetScenario,
  prediction: SageMakerPredictionResult,
  actualOutcome: 'win' | 'push' | 'loss'
) {
  const label = actualOutcome === 'win' ? 2 : actualOutcome === 'push' ? 1 : 0

  await supabase.from('ml_training_data').insert({
    user_id: userId,
    sport: betScenario.sport,
    bet_type: betScenario.betType,
    bet_amount: betScenario.betAmount,
    budget: betScenario.budget,
    odds_american: oddsAmerican,
    // ... other fields
    outcome: actualOutcome,
    label: label,
    predicted_outcome: prediction.predictedOutcome,
    predicted_probabilities: {
      win: prediction.winProbability,
      push: prediction.pushProbability,
      loss: prediction.lossProbability,
    },
  })
}
```

### Export for Retraining

Every month (or when you have 500+ new outcomes):

```typescript
// Export to CSV
const { data } = await supabase
  .from('ml_training_data')
  .select('*')
  .gte('created_at', lastTrainingDate)

// Convert to CSV format matching training_data_sagemaker_v2.csv
const csvData = convertToTrainingFormat(data)

// Upload to S3 and retrain
```

## 💰 Cost Breakdown

### Training Costs
- **Instance**: ml.m5.xlarge @ $0.23/hour
- **Training time**: ~10 minutes
- **Cost per training**: ~$0.04 💵

### Inference Costs (24/7 Endpoint)
- **Instance**: ml.t2.medium @ $0.065/hour
- **Monthly**: $47/month
- **Per prediction**: ~$0.00001

### Cost Optimization

**Option 1: Turn Off When Not Needed**
```python
# Delete endpoint when not in use
xgb_predictor.delete_endpoint()

# Redeploy later from saved model
xgb_predictor = xgb_model.deploy(...)
```

**Option 2: Serverless Inference** (for low traffic)
```python
from sagemaker.serverless import ServerlessInferenceConfig

serverless_config = ServerlessInferenceConfig(
    memory_size_in_mb=2048,
    max_concurrency=5
)

predictor = model.deploy(
    serverless_inference_config=serverless_config
)
```
- **Cost**: Pay per inference
- **Pricing**: ~$0.20 per million inferences
- **Best for**: <1000 predictions/day

## 🔍 Monitoring Performance

### Track Accuracy Over Time

```typescript
// Compare predictions vs actual outcomes
const predictions = await supabase
  .from('ml_training_data')
  .select('predicted_outcome, outcome')
  .gte('created_at', thirtyDaysAgo)

const correct = predictions.filter(p => p.predicted_outcome.toLowerCase() === p.outcome).length
const accuracy = (correct / predictions.length) * 100

console.log(`Model Accuracy: ${accuracy.toFixed(1)}%`)
```

### Alert on Poor Performance

```typescript
if (accuracy < 50) {
  // Model is worse than random guessing
  console.error('⚠️ Model performance degraded - retrain ASAP')
  await sendAdminAlert('Model accuracy dropped to ' + accuracy + '%')
}
```

## 📚 Files Overview

| File | Purpose |
|------|---------|
| `training_data_sagemaker_v2.csv` | Sample training data (40 examples) |
| `sagemaker_training_notebook_v2.ipynb` | Python notebook for training & deployment |
| `lib/sagemaker-prediction-v2.ts` | Node.js integration code |
| `TRAINING_DATA_SCHEMA.md` | Complete data schema documentation |

## 🆘 Troubleshooting

### Issue: "No module named 'sagemaker'"
**Solution**: Run the first cell in the notebook to install dependencies

### Issue: "Role not found"
**Solution**: Ensure you're running in SageMaker Studio, not a local notebook

### Issue: Endpoint returns errors
**Solution**: Check CloudWatch logs
```bash
aws logs tail /aws/sagemaker/Endpoints/your-endpoint-name --follow
```

### Issue: All predictions return 33% each
**Solution**: Model needs more/better training data

### Issue: High inference latency (>5 seconds)
**Solution**: Use a larger instance type (ml.c5.xlarge instead of ml.t2.medium)

## 🎓 Next Steps

1. ✅ **Start with sample data** - Validate the pipeline works
2. 📊 **Deploy to production** - Set up endpoint
3. 🔄 **Collect real outcomes** - Log every bet result
4. 🔁 **Retrain monthly** - Update with new data
5. 📈 **Monitor accuracy** - Track performance
6. ⚙️ **Tune hyperparameters** - Optimize for your data

## 🤝 Support

- **AWS SageMaker Docs**: https://docs.aws.amazon.com/sagemaker/
- **XGBoost Docs**: https://xgboost.readthedocs.io/
- **Community**: AWS SageMaker forums

---

**Ready to train?** Open `sagemaker_training_notebook_v2.ipynb` and start with Cell 1!
