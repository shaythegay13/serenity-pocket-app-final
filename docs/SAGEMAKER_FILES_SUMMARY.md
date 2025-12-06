# SageMaker Files Summary

## 📦 What You've Got

I've created a complete machine learning pipeline for your AI bet prediction engine. Here's everything:

## 🗂️ Files Created

### 1. Training Data
- **`training_data_sagemaker_v2.csv`** (40 examples)
  - Ready-to-use training dataset
  - 50 features + 1 label column
  - Label: 0=LOSS, 1=PUSH, 2=WIN
  - Balanced across all bet types and sports

### 2. Training Notebook
- **`sagemaker_training_notebook_v2.ipynb`**
  - Complete Python notebook for SageMaker Studio
  - Handles: upload, training, deployment, testing
  - Includes performance metrics and visualizations
  - Ready to run cell-by-cell

### 3. Backend Integration
- **`lib/sagemaker-prediction-v2.ts`**
  - Node.js/TypeScript integration code
  - Functions to call SageMaker endpoint
  - Converts BetScenario → feature vector → prediction
  - Calculates expected value and risk scores

### 4. Documentation
- **`SAGEMAKER_SETUP_GUIDE.md`**
  - Complete step-by-step setup instructions
  - Backend integration examples
  - Cost breakdown and optimization tips
  - Troubleshooting guide

- **`TRAINING_DATA_SCHEMA.md`**
  - Detailed schema for all 51 columns
  - Feature descriptions and value ranges
  - Data validation checklist
  - Examples and best practices

- **`.env.sagemaker.example`**
  - Environment variable template
  - AWS credentials setup guide
  - IAM policy configuration

- **`SAGEMAKER_FILES_SUMMARY.md`** (this file)
  - Overview of all files
  - Quick reference

### 5. Legacy Files (Binary Classification)
- `training_data_sagemaker.csv` - 2-class version (WIN/LOSS only)
- `sagemaker_training_notebook.ipynb` - Original binary notebook
- `lib/sagemaker-prediction.ts` - Original binary integration

**Note**: Use the `_v2` versions for the 3-class system (WIN/PUSH/LOSS)

## 🎯 What Each File Does

```
training_data_sagemaker_v2.csv
├─→ Sample data to train the model
└─→ Upload to S3 via notebook

sagemaker_training_notebook_v2.ipynb
├─→ Run in SageMaker Studio
├─→ Trains XGBoost model
├─→ Deploys as endpoint
└─→ Gives you endpoint name

lib/sagemaker-prediction-v2.ts
├─→ Add to your Next.js app
├─→ Calls SageMaker endpoint
└─→ Returns predictions

SAGEMAKER_SETUP_GUIDE.md
└─→ Read this first!

.env.sagemaker.example
└─→ Copy to .env.local after deployment
```

## 🚀 Quick Start (3 Steps)

### Step 1: Train & Deploy
```bash
1. Open SageMaker Studio
2. Upload training_data_sagemaker_v2.csv
3. Upload sagemaker_training_notebook_v2.ipynb
4. Run all cells in notebook
5. Copy endpoint name from output
```

### Step 2: Configure Backend
```bash
1. Copy .env.sagemaker.example to .env.local
2. Paste your endpoint name
3. Add AWS credentials
```

### Step 3: Integrate
```typescript
// In your API route
import { predictBetOutcome } from '@/lib/sagemaker-prediction-v2'

const prediction = await predictBetOutcome(input)
// Returns: { winProbability, pushProbability, lossProbability, ... }
```

## 📊 Data Flow

```
User submits bet
    ↓
Your Next.js API
    ↓
lib/sagemaker-prediction-v2.ts
    ↓
AWS SageMaker Endpoint
    ↓
XGBoost Model Prediction
    ↓
{
  lossProbability: 0.15,
  pushProbability: 0.10,
  winProbability: 0.75,
  predictedOutcome: "WIN",
  expectedValue: 23.45
}
    ↓
Display to user
```

## 🎓 Training Data Details

### Features (50 total)
- **Sport**: NBA, NFL, MLB, NHL (one-hot encoded)
- **Bet Type**: Moneyline, Spread, Over/Under, Parlay
- **Financial**: bet amount, budget, budget %
- **Game Stats**: win percentages, injuries, weather
- **Emotional**: risk level, state, intensity
- **Behavioral**: chasing, frequency, biases
- **User**: experience level, age group
- **Performance**: recent win rate, team stats

### Label (1)
- **0** = LOSS (bet lost)
- **1** = PUSH (break even)
- **2** = WIN (bet won)

## 💡 Key Concepts

### 3-Class Classification
Unlike simple win/loss, this predicts three outcomes:
- **WIN**: User makes profit
- **PUSH**: User breaks even (common in spreads)
- **LOSS**: User loses stake

### Expected Value
Model calculates expected profit/loss:
```javascript
EV = P(Win) × Profit + P(Push) × 0 + P(Loss) × -Stake

Examples:
  EV = +$15  → Good bet (expect $15 profit)
  EV = -$8   → Bad bet (expect $8 loss)
  EV = $0    → Break even
```

### Confidence Score
Highest probability among the three outcomes:
```javascript
Probabilities: [0.10, 0.05, 0.85]  // LOSS, PUSH, WIN
Confidence: 0.85 (85% sure it's a WIN)
```

## 📈 Production Workflow

### Initial Setup (Once)
1. Train model with sample data
2. Deploy endpoint
3. Integrate into your app
4. Test with real users

### Ongoing (Monthly)
1. Collect bet outcomes from users
2. Export to CSV (same format as training data)
3. Retrain model with new data
4. Deploy updated model
5. Monitor accuracy improvements

### Data Collection
```typescript
// After each bet is resolved
await supabase.from('ml_training_data').insert({
  // All 50 features
  label: actualOutcome === 'win' ? 2 : actualOutcome === 'push' ? 1 : 0
})
```

## 💰 Costs

### One-Time
- Training: ~$0.04 per run
- Total initial setup: < $1

### Monthly
- **Option 1**: Always-on endpoint: ~$47/month
- **Option 2**: Serverless: ~$0.20 per 1000 predictions
- **Option 3**: Delete when not in use: $0

**Recommended**: Start with Option 2 (serverless) for low traffic

## 🔄 Updating the Model

### When to Retrain
- ✅ Every month (recommended)
- ✅ After collecting 500+ new outcomes
- ✅ When accuracy drops below 60%

### How to Retrain
1. Export new data from your database
2. Combine with existing training data
3. Re-run notebook with combined dataset
4. Deploy new endpoint
5. Update endpoint name in .env.local

## 🎯 Success Metrics

### Good Model Performance
- **Accuracy**: 65-75% (better than random)
- **AUC**: 0.70-0.80
- **Precision**: 70-80% (when it says WIN, it's right 70-80% of time)

### What to Track
- Overall accuracy
- Accuracy per class (WIN/PUSH/LOSS)
- Accuracy per sport
- Accuracy per bet type
- Expected value vs actual returns

## 📚 Additional Resources

- **AWS SageMaker Docs**: https://docs.aws.amazon.com/sagemaker/
- **XGBoost Docs**: https://xgboost.readthedocs.io/
- **Your Training Data Schema**: See `TRAINING_DATA_SCHEMA.md`
- **Setup Guide**: See `SAGEMAKER_SETUP_GUIDE.md`

## ✅ Checklist

Before you start:
- [ ] Have AWS account
- [ ] Have access to SageMaker Studio
- [ ] Have IAM permissions for SageMaker
- [ ] Downloaded all files from this project

To deploy:
- [ ] Upload CSV to SageMaker Studio
- [ ] Upload notebook to SageMaker Studio
- [ ] Run all notebook cells
- [ ] Copy endpoint name
- [ ] Add endpoint to .env.local
- [ ] Test prediction in your app

To maintain:
- [ ] Set up bet outcome logging
- [ ] Export data monthly
- [ ] Retrain model
- [ ] Monitor accuracy
- [ ] Adjust as needed

## 🆘 Need Help?

1. **Setup issues**: Check `SAGEMAKER_SETUP_GUIDE.md`
2. **Data questions**: Check `TRAINING_DATA_SCHEMA.md`
3. **AWS errors**: Check CloudWatch logs
4. **Model accuracy**: Need more training data (aim for 1000+ examples)

## 🎉 You're Ready!

You now have everything needed to:
1. ✅ Train a machine learning model
2. ✅ Deploy it to AWS SageMaker
3. ✅ Integrate with your Next.js app
4. ✅ Predict bet outcomes with 3 classes (WIN/PUSH/LOSS)
5. ✅ Calculate expected value
6. ✅ Continuously improve with real data

**Next step**: Open `SAGEMAKER_SETUP_GUIDE.md` and follow Step 1!

---

**Questions?** All documentation is in the files above. Start with `SAGEMAKER_SETUP_GUIDE.md`!
