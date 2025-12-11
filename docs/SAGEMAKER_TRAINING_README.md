# SageMaker Training Guide - AI Bet Prediction Engine

This guide walks you through training and deploying an XGBoost model on AWS SageMaker to power your AI betting analysis platform.

## 📋 Overview

The SageMaker prediction engine complements your existing AI analysis by providing:
- **Data-driven predictions** based on historical bet outcomes
- **Probability estimates** for bet success (0-100%)
- **Risk scoring** based on bet characteristics and user behavior
- **Real-time inference** via SageMaker endpoint

## 🎯 What This Model Predicts

**Label**: Binary classification (1 = Win, 0 = Loss)

The model learns patterns from:
- Game statistics (win percentages, player performance)
- Betting odds and implied probabilities
- User emotional state and behavioral patterns
- Historical betting performance
- Risk factors (chasing losses, emotional betting, etc.)

## 📊 Training Data Features (50 features)

### Sport Features (4)
- `sport_nba`, `sport_nfl`, `sport_mlb`, `sport_nhl` - One-hot encoded sport type

### Bet Type Features (4)
- `bet_type_moneyline`, `bet_type_spread`, `bet_type_over_under`, `bet_type_parlay`

### Financial Features (3)
- `bet_amount` - Stake amount in dollars
- `budget` - Weekly betting budget
- `budget_percent` - Percentage of budget risked

### Game Analysis Features (7)
- `favorite_win_pct` - Favorite team win percentage (0-1)
- `underdog_win_pct` - Underdog team win percentage (0-1)
- `has_key_injuries` - Boolean (0/1)
- `bad_weather` - Boolean (0/1)
- `is_parlay` - Boolean (0/1)
- `home_advantage` - Boolean (0/1)
- `odds_american` - American odds format (-150, +120, etc.)

### Emotional Risk Features (3)
- `emotional_risk_low`, `emotional_risk_moderate`, `emotional_risk_high` - One-hot encoded

### Emotional State Features (4)
- `emotional_state_neutral`, `emotional_state_positive`, `emotional_state_negative`, `emotional_state_dangerous`

### Behavioral Signals (4)
- `chasing_behavior` - Trying to recover losses
- `high_frequency_betting` - Multiple bets in short time
- `recent_loss` - Lost previous bet
- `recent_win` - Won previous bet

### Performance Metrics (6)
- `favorite_ppg` - Points per game (NBA) or relevant stat
- `underdog_ppg` - Points per game
- `favorite_fg_pct` - Field goal percentage (NBA) or relevant %
- `underdog_fg_pct` - Field goal percentage
- `favorite_def_rating` - Defensive rating
- `underdog_def_rating` - Defensive rating

### Odds & Confidence Features (2)
- `implied_probability` - Calculated from American odds
- `confidence_score` - Your AI's confidence (0-100)

### Safety Risk Features (3)
- `safety_risk_low`, `safety_risk_moderate`, `safety_risk_high` - One-hot encoded

### User Profile Features (3)
- `user_experience_novice`, `user_experience_intermediate`, `user_experience_expert`

### Bias Detection Features (5)
- `emotional_intensity` - Scale of 1-10
- `bias_overconfidence` - Boolean
- `bias_recency` - Boolean
- `bias_loss_aversion` - Boolean
- `bias_confirmation` - Boolean

### Performance History (1)
- `last_5_win_rate` - Win rate of last 5 bets (0-1)

### Demographics (4)
- `user_age_18_25`, `user_age_26_35`, `user_age_36_45`, `user_age_46_plus`

## 🚀 Quick Start

### Step 1: Prepare Your Environment

1. **Open SageMaker Studio**
   - Go to AWS Console → SageMaker → Studio
   - Launch Studio or create a new domain

2. **Upload Files**
   ```bash
   # Upload these files to your SageMaker Studio environment:
   - training_data_sagemaker.csv
   - sagemaker_training_notebook.ipynb
   ```

3. **Install Dependencies**
   The notebook will install required packages automatically.

### Step 2: Run the Training Notebook

Open `sagemaker_training_notebook.ipynb` and run cells sequentially:

1. **Cell 1**: Install dependencies
2. **Cell 2**: Initialize SageMaker session
3. **Cell 3**: Upload data to S3
4. **Cell 4**: Inspect training data
5. **Cell 5**: Get XGBoost container
6. **Cell 6**: Configure model hyperparameters
7. **Cell 7**: Start training (takes ~5-10 minutes)
8. **Cell 8**: Deploy endpoint (takes ~5-10 minutes)
9. **Cell 9**: Test predictions
10. **Cell 10**: Save endpoint name

### Step 3: Configure Your Backend

Add to your `.env.local` file:

```bash
# AWS SageMaker Configuration
AWS_SAGEMAKER_ENDPOINT=xgboost-endpoint-YYYY-MM-DD-HH-MM-SS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Step 4: Integrate with Your App

The model is now accessible via the `lib/sagemaker-prediction.ts` module:

```typescript
import { predictBetOutcome, betScenarioToSageMakerInput } from '@/lib/sagemaker-prediction'

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

console.log(`Win Probability: ${prediction.winProbability}`)
console.log(`Prediction: ${prediction.prediction}`)
console.log(`Confidence: ${prediction.confidence}`)
```

## 📈 Model Performance

The sample training data includes 40 examples. For production:

1. **Collect Real Data**: Replace synthetic data with actual bet outcomes
2. **Minimum Dataset Size**: Aim for 1000+ examples for robust training
3. **Regular Retraining**: Retrain monthly or when you have 500+ new examples
4. **Track Metrics**: Monitor accuracy, AUC, precision, and recall

### Expected Performance (with real data)
- **Accuracy**: 65-75% (better than random guessing)
- **AUC**: 0.70-0.80
- **Precision**: 70-80% (when model predicts WIN, it's correct 70-80% of time)

## 💰 Cost Estimate

### Training Costs
- **Instance**: ml.m5.xlarge @ $0.23/hour
- **Training Time**: ~10 minutes
- **Cost per training**: ~$0.04

### Inference Costs
- **Instance**: ml.t2.medium @ $0.065/hour
- **Monthly cost**: ~$47/month (if running 24/7)
- **Cost per prediction**: ~$0.00001

### Cost Optimization Tips
1. **Use Serverless Inference** for low-traffic endpoints
2. **Auto-scaling** for variable traffic
3. **Delete endpoint** when not in use (can redeploy later)
4. **Batch predictions** for bulk analysis

## 🔄 Continuous Improvement

### 1. Data Collection Strategy

Create a feedback loop in your app:

```typescript
// After bet is resolved
await supabase.from('bet_outcomes').insert({
  user_id: userId,
  bet_scenario: betScenario,
  prediction: sagemakerPrediction,
  actual_outcome: actualOutcome, // 'win' or 'loss'
  timestamp: new Date().toISOString()
})
```

### 2. Retrain Pipeline

Every month (or when you have 500+ new outcomes):

1. Export data from database to CSV
2. Upload to S3
3. Run training notebook with new data
4. Deploy updated model
5. Compare performance metrics

### 3. A/B Testing

Run both models in parallel:

```typescript
const [claudeAnalysis, sagemakerPrediction] = await Promise.all([
  getEnhancedBetAnalysis(scenario),
  predictBetOutcome(sagemakerInput)
])

// Compare and log both predictions
// Over time, see which is more accurate
```

## 🛠️ Hyperparameter Tuning

Once you have real data, optimize these XGBoost parameters:

```python
xgb_estimator.set_hyperparameters(
    objective='binary:logistic',
    num_round=100,        # Try: 50, 100, 200
    max_depth=5,          # Try: 3, 5, 7
    eta=0.2,              # Learning rate: 0.1, 0.2, 0.3
    gamma=4,              # Min loss reduction: 2, 4, 6
    min_child_weight=6,   # Try: 3, 6, 10
    subsample=0.8,        # Try: 0.7, 0.8, 0.9
)
```

Use SageMaker's built-in hyperparameter tuning:

```python
from sagemaker.tuner import HyperparameterTuner, IntegerParameter, ContinuousParameter

hyperparameter_ranges = {
    'max_depth': IntegerParameter(3, 10),
    'eta': ContinuousParameter(0.1, 0.5),
    'num_round': IntegerParameter(50, 200),
}

tuner = HyperparameterTuner(
    xgb_estimator,
    objective_metric_name='validation:auc',
    hyperparameter_ranges=hyperparameter_ranges,
    max_jobs=20,
    max_parallel_jobs=3
)

tuner.fit({'train': train_input, 'validation': validation_input})
```

## 🔍 Monitoring & Debugging

### Check Endpoint Status
```python
import boto3

client = boto3.client('sagemaker')
response = client.describe_endpoint(EndpointName='your-endpoint-name')
print(response['EndpointStatus'])  # Should be 'InService'
```

### Monitor Predictions
```python
# CloudWatch logs show inference requests
# Navigate to CloudWatch → Log groups → /aws/sagemaker/Endpoints/your-endpoint
```

### Test Locally Before Deployment
```python
# Load model artifact from S3 and test locally
import xgboost as xgb
import boto3

s3 = boto3.client('s3')
s3.download_file(bucket, 'path/to/model.tar.gz', 'model.tar.gz')

# Extract and load
import tarfile
with tarfile.open('model.tar.gz') as tar:
    tar.extractall()

model = xgb.Booster()
model.load_model('xgboost-model')

# Test prediction
import numpy as np
test_data = np.array([features]).reshape(1, -1)
dtest = xgb.DMatrix(test_data)
prediction = model.predict(dtest)
print(f"Win probability: {prediction[0]}")
```

## 🎓 Next Steps

1. **Start with synthetic data** to validate the pipeline
2. **Deploy to production** and collect real outcomes
3. **Retrain monthly** with growing dataset
4. **Compare predictions** against your current AI
5. **Optimize hyperparameters** based on performance
6. **Scale infrastructure** as needed

## 🆘 Troubleshooting

### Issue: Endpoint creation fails
**Solution**: Check IAM role has SageMaker permissions

### Issue: High inference latency
**Solution**: Use larger instance type or serverless inference

### Issue: Model accuracy is low
**Solution**:
- Need more training data (aim for 1000+ examples)
- Feature engineering (add more relevant features)
- Hyperparameter tuning

### Issue: Predictions always return 0.5
**Solution**: Model not trained properly or features not normalized

## 📚 Resources

- [SageMaker XGBoost Documentation](https://docs.aws.amazon.com/sagemaker/latest/dg/xgboost.html)
- [SageMaker Python SDK](https://sagemaker.readthedocs.io/)
- [XGBoost Parameters](https://xgboost.readthedocs.io/en/stable/parameter.html)
- [AWS SageMaker Pricing](https://aws.amazon.com/sagemaker/pricing/)

## 🤝 Support

For issues with:
- **Training**: Check SageMaker logs in CloudWatch
- **Inference**: Test endpoint with AWS Console
- **Integration**: Review `lib/sagemaker-prediction.ts` code

---

**Built for Serenity Pocket AI** - Responsible Betting Platform
