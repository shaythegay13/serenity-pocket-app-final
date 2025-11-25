# Quick Start: Enhanced AI with AWS Bedrock

Get Claude-powered analysis running in **5 minutes**! ⚡

## Prerequisites

- ✅ AWS Account
- ✅ Serenity Pocket app running locally
- ✅ Elite subscription test account

## Step 1: Enable Bedrock (2 minutes)

1. Go to: https://console.aws.amazon.com/bedrock
2. **Select Region**: Choose **us-east-1** (recommended)
3. Click **"Model access"** (left sidebar)
4. Click **"Manage model access"**
5. Find **"Anthropic Claude 3.5 Sonnet v2"**
6. Check the box → **"Request model access"**
7. Wait ~30 seconds for approval ✅

## Step 2: Create IAM User (2 minutes)

1. Go to: https://console.aws.amazon.com/iam/home#/users
2. Click **"Add users"**
3. Username: `serenity-bedrock`
4. Select **"Programmatic access"**
5. Click **"Next"**
6. Click **"Attach policies directly"**
7. Search for: `AmazonBedrockFullAccess`
8. Select it → **"Next"** → **"Create user"**
9. **Copy Access Key ID** ✅
10. **Copy Secret Access Key** ✅
11. Click **"Done"**

## Step 3: Configure App (1 minute)

Add to your `.env` file:

```bash
# AWS Bedrock
AWS_ACCESS_KEY_ID=AKIA... # paste your access key
AWS_SECRET_ACCESS_KEY=... # paste your secret key
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
ENABLE_ENHANCED_AI_ANALYSIS=true
```

## Step 4: Test It! (30 seconds)

```bash
# Restart your dev server
npm run dev

# Check console logs - you should see:
# ✅ AWS Bedrock client initialized for enhanced AI analysis
```

Then:
1. Login as Elite user
2. Go to **AI Picks** → **Analyze My Bet** tab
3. Fill out any bet scenario
4. Click **"Analyze Scenario"**
5. Look for the purple **"Enhanced AI Analysis with Claude"** badge! 🎉

## That's It! 🚀

Your app now has Claude 3.5 Sonnet analyzing bets with advanced reasoning!

### Verify It's Working

Look for these in the UI:
- 🟣 Purple badge saying "Enhanced AI Analysis with Claude"
- ✨ "Claude's Key Insights" section
- More detailed, natural language reasoning

Look for these in console:
```
🤖 Running enhanced AI analysis with Claude...
✅ Claude response received (XXX in, YYY out)
✅ Enhanced AI analysis completed
```

## What It Costs

~**$0.01 per analysis** (1 cent)

That's it! For 100 analyses per day:
- Daily: $1
- Monthly: ~$30

Well within Elite subscription revenue of $79.99/month.

## Troubleshooting

### Not seeing enhanced AI badge?

1. Check `.env` has correct credentials
2. Restart dev server
3. Check console for errors
4. Verify `ENABLE_ENHANCED_AI_ANALYSIS=true`

### See "Enhanced AI not available"?

1. Make sure you requested Claude model access in Bedrock
2. Wait a few minutes after requesting access
3. Check AWS region matches (use us-east-1)

### AWS errors?

1. Verify IAM user has Bedrock permissions
2. Check access keys are correct (no extra spaces)
3. Try regenerating access keys

## Need More Help?

- **Full Setup Guide**: See [AWS_BEDROCK_SETUP.md](AWS_BEDROCK_SETUP.md)
- **Architecture Details**: See [ENHANCED_AI_SUMMARY.md](ENHANCED_AI_SUMMARY.md)
- **Integration Guide**: See [AI_ADVISOR_INTEGRATION.md](AI_ADVISOR_INTEGRATION.md)

---

**Total setup time**: ~5 minutes
**Difficulty**: Easy ⭐
**Cost**: ~$1 per 100 analyses
**Value**: Priceless! 🔥
