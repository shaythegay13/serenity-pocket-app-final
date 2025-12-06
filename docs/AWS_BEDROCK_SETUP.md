# AWS Bedrock Setup Guide for Enhanced AI Analysis

This guide will help you set up AWS Bedrock to enable enhanced AI analysis with Claude for the Bet Advisor feature.

## Prerequisites

- AWS Account with Bedrock access
- AWS CLI installed and configured (optional but recommended)
- IAM user with Bedrock permissions

## Step 1: Enable AWS Bedrock

1. **Sign in to AWS Console**: https://console.aws.amazon.com
2. **Navigate to Bedrock**: Search for "Bedrock" in the AWS Console search bar
3. **Select a Region**: Choose one of these regions (Claude 3.5 Sonnet is available in):
   - `us-east-1` (US East - N. Virginia) - **Recommended**
   - `us-west-2` (US West - Oregon)
   - `eu-west-1` (Europe - Ireland)
   - `ap-southeast-1` (Asia Pacific - Singapore)

4. **Request Model Access**:
   - In the Bedrock console, click **"Model access"** in the left sidebar
   - Click **"Manage model access"**
   - Find **"Anthropic Claude 3.5 Sonnet v2"** in the list
   - Check the box next to it
   - Click **"Request model access"**
   - Wait for approval (usually instant for most accounts)

## Step 2: Create IAM User for Bedrock Access

### Option A: Using AWS Console

1. **Go to IAM**:
   - Navigate to IAM service in AWS Console
   - Click **"Users"** → **"Add users"**

2. **Create User**:
   - User name: `serenity-pocket-bedrock-user`
   - Select **"Programmatic access"**
   - Click **"Next"**

3. **Attach Permissions**:
   - Click **"Attach policies directly"**
   - Search for and select: **`AmazonBedrockFullAccess`**
   - (For production, create a custom policy with minimal permissions - see below)
   - Click **"Next"** → **"Create user"**

4. **Save Credentials**:
   - Copy the **Access Key ID**
   - Copy the **Secret Access Key**
   - ⚠️ **Store these securely** - you won't be able to see the secret key again

### Option B: Using AWS CLI

```bash
# Create IAM user
aws iam create-user --user-name serenity-pocket-bedrock-user

# Attach Bedrock policy
aws iam attach-user-policy \
  --user-name serenity-pocket-bedrock-user \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

# Create access key
aws iam create-access-key --user-name serenity-pocket-bedrock-user
```

## Step 3: Configure Environment Variables

Add these variables to your `.env` file:

```bash
# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1

# Model ID (Claude 3.5 Sonnet v2 - best for bet analysis)
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# Enable enhanced AI analysis
ENABLE_ENHANCED_AI_ANALYSIS=true
```

### Available Claude Models on Bedrock

| Model | Model ID | Best For |
|-------|----------|----------|
| **Claude 3.5 Sonnet v2** (Recommended) | `anthropic.claude-3-5-sonnet-20241022-v2:0` | Complex reasoning, analysis |
| Claude 3.5 Sonnet v1 | `anthropic.claude-3-5-sonnet-20240620-v1:0` | General purpose |
| Claude 3 Opus | `anthropic.claude-3-opus-20240229-v1:0` | Most capable (slower, expensive) |
| Claude 3 Sonnet | `anthropic.claude-3-sonnet-20240229-v1:0` | Balanced |
| Claude 3 Haiku | `anthropic.claude-3-haiku-20240307-v1:0` | Fast, cheaper |

**We recommend Claude 3.5 Sonnet v2** for the best balance of reasoning quality and speed.

## Step 4: Production Security - Custom IAM Policy

For production, create a custom IAM policy with minimal permissions:

### Custom Policy JSON

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeModel",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
      ]
    }
  ]
}
```

### Apply Custom Policy

1. In IAM, go to **Policies** → **Create policy**
2. Click **JSON** tab
3. Paste the policy above
4. Name it: `SerenityPocketBedrockInvokeOnly`
5. Create policy
6. Attach it to your user instead of `AmazonBedrockFullAccess`

## Step 5: Test the Integration

### Local Testing

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Check console logs**:
   - You should see: `✅ AWS Bedrock client initialized for enhanced AI analysis`
   - If not, check your environment variables

3. **Test the feature**:
   - Login as an Elite user
   - Go to **AI Picks** tab → **Analyze My Bet**
   - Fill out the form and submit
   - You should see the purple **"Enhanced AI Analysis with Claude"** badge
   - Analysis should include **"Claude's Key Insights"** section

### Verify in Console

When analysis runs, you should see:
```
🤖 Running enhanced AI analysis with Claude...
✅ Claude response received (XXX in, YYY out)
✅ Enhanced AI analysis completed
```

## Cost Estimation

### Claude 3.5 Sonnet v2 Pricing (as of November 2024)

- **Input**: $3.00 per million tokens (~$0.003 per 1,000 tokens)
- **Output**: $15.00 per million tokens (~$0.015 per 1,000 tokens)

### Typical Bet Analysis Costs

Each analysis uses approximately:
- **Input**: 800-1,200 tokens (~$0.003 per analysis)
- **Output**: 400-600 tokens (~$0.008 per analysis)
- **Total**: ~**$0.011 per analysis** (about 1 cent)

**Example Monthly Costs:**
- 100 analyses: ~$1.10
- 1,000 analyses: ~$11.00
- 10,000 analyses: ~$110.00

💡 **Tip**: The Elite subscription is $79.99/month, so costs are minimal compared to revenue.

## Monitoring & Optimization

### CloudWatch Monitoring

Track Bedrock usage in CloudWatch:
1. Go to **CloudWatch** → **Metrics** → **Bedrock**
2. Monitor:
   - `InvocationCount` - Number of API calls
   - `InvocationLatency` - Response time
   - `ModelInvocationTokens` - Token usage

### Cost Management

1. **Set up billing alerts**:
   - Go to **Billing Dashboard** → **Budgets**
   - Create a budget for Bedrock costs
   - Set alert threshold (e.g., $50/month)

2. **Enable detailed billing**:
   - Tag Bedrock requests with cost allocation tags
   - Track per-feature costs

## Troubleshooting

### Error: "Model access denied"

**Solution**: Request model access in Bedrock console
```
Go to Bedrock → Model access → Request access for Claude 3.5 Sonnet v2
```

### Error: "Region not supported"

**Solution**: Change to a supported region
```bash
AWS_REGION=us-east-1  # or us-west-2, eu-west-1
```

### Error: "AWS credentials not found"

**Solution**: Check environment variables are loaded
```bash
# Verify .env file is in project root
# Restart dev server after adding credentials
npm run dev
```

### Enhanced AI not activating

**Solution**: Check the feature flag
```bash
ENABLE_ENHANCED_AI_ANALYSIS=true  # Must be exactly "true"
```

### Slow responses

**Solutions**:
- Use faster model: `anthropic.claude-3-haiku-20240307-v1:0`
- Reduce max_tokens in `lib/aws-bedrock.ts`
- Use different region closer to your server

## Fallback Behavior

The system is designed to be resilient:

1. **If AWS Bedrock is not configured**:
   - Falls back to built-in analysis algorithms
   - Console logs: `ℹ️  Enhanced AI analysis disabled - using built-in algorithms`

2. **If Claude API fails**:
   - Catches error gracefully
   - Returns built-in analysis results
   - Console logs: `⚠️  Enhanced AI failed, falling back to built-in analysis`

3. **No degradation of service**:
   - Users always get an analysis
   - Enhanced AI is purely additive

## Security Best Practices

### ✅ Do's

- ✅ Store credentials in environment variables
- ✅ Use IAM roles (not root account)
- ✅ Enable MFA on AWS account
- ✅ Rotate access keys regularly (every 90 days)
- ✅ Use minimal IAM permissions
- ✅ Monitor CloudTrail for unusual activity
- ✅ Set up billing alerts

### ❌ Don'ts

- ❌ Never commit AWS credentials to Git
- ❌ Never use root account credentials
- ❌ Never share access keys
- ❌ Never disable credential rotation
- ❌ Never grant broader permissions than needed

## Advanced Configuration

### Custom System Prompt

Edit `lib/aws-bedrock.ts` to customize Claude's behavior:

```typescript
const systemPrompt = `You are an expert betting advisor specializing in responsible gambling...`
```

### Adjust Temperature

For more creative responses:
```typescript
temperature: 0.9,  // More creative (default: 0.7)
```

For more conservative responses:
```typescript
temperature: 0.3,  // More deterministic
```

### Timeout Configuration

Add timeout to prevent long-running requests:
```typescript
// In lib/aws-bedrock.ts
const command = new InvokeModelCommand(input)
const response = await bedrockClient.send(command, {
  requestTimeout: 30000  // 30 seconds
})
```

## Next Steps

1. ✅ Set up AWS Bedrock and get credentials
2. ✅ Add credentials to `.env`
3. ✅ Test locally with Elite account
4. ✅ Monitor costs in AWS Console
5. ✅ Deploy to production
6. ✅ Monitor CloudWatch metrics
7. ✅ Set up billing alerts

## Support

- **AWS Bedrock Docs**: https://docs.aws.amazon.com/bedrock/
- **Anthropic Claude**: https://docs.anthropic.com/claude/docs
- **IAM Best Practices**: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

---

**Setup completed**: November 23, 2024
**Feature**: Enhanced AI Bet Advisor with Claude
**Status**: ✅ Ready for production
