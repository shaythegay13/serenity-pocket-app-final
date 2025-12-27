# SageMaker Permissions Fix Guide

## Problem
Your IAM user `bedrock-user` doesn't have permission to invoke SageMaker endpoints, causing this error:
```
AccessDeniedException: User: arn:aws:iam::528789129293:user/bedrock-user is not authorized to perform: sagemaker:InvokeEndpoint
```

## Solution: Add SageMaker Invoke Permissions

You have **two options** to fix this:

---

## Option 1: Automated Fix (AWS CLI) ✨ **RECOMMENDED**

### Prerequisites
- AWS CLI installed ([install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- AWS credentials configured with admin access

### Steps

1. **Ensure AWS CLI is configured**:
   ```bash
   aws configure
   # Enter your AWS credentials when prompted
   ```

2. **Run the automated script**:
   ```bash
   ./scripts/fix-sagemaker-permissions.sh
   ```

3. **Done!** The script will:
   - Create an IAM policy with SageMaker permissions
   - Attach it to the `bedrock-user`

---

## Option 2: Manual Fix (AWS Console) 🖱️

### Steps

1. **Go to AWS IAM Console**:
   - Open [AWS IAM Console](https://console.aws.amazon.com/iam)
   - Navigate to **Policies** → **Create policy**

2. **Create the policy**:
   - Click the **JSON** tab
   - Paste this policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowSageMakerInvokeEndpoint",
         "Effect": "Allow",
         "Action": [
           "sagemaker:InvokeEndpoint"
         ],
         "Resource": [
           "arn:aws:sagemaker:us-west-2:528789129293:endpoint/serenity-pocket-sports-model",
           "arn:aws:sagemaker:us-west-2:528789129293:endpoint/xgboost-2024-01-15-10-30-45-123"
         ]
       }
     ]
   }
   ```
   - Click **Next**
   - Name: `SerenityPocketSageMakerInvoke`
   - Description: `Allow Serenity Pocket app to invoke SageMaker endpoints`
   - Click **Create policy**

3. **Attach policy to user**:
   - Navigate to **Users** → **bedrock-user**
   - Click **Add permissions** → **Attach policies directly**
   - Search for `SerenityPocketSageMakerInvoke`
   - Select it and click **Add permissions**

4. **Done!** The permissions are now active.

---

## Verify the Fix

After applying the permissions:

1. **Restart your dev server**:
   ```bash
   # Press Ctrl+C to stop the server
   npm run dev
   ```

2. **Test the AI Bet Advisor**:
   - Navigate to the AI Picks tab
   - Try running an analysis
   - The SageMaker error should be gone!

---

## What This Policy Does

The policy grants your `bedrock-user` permission to:
- ✅ Invoke SageMaker endpoints (required for AI predictions)
- ✅ Only access the specific endpoints used by Serenity Pocket
- ✅ No other permissions (principle of least privilege)

---

## Troubleshooting

### Error: "Policy already exists"
- The policy was already created. Skip to step 3 (attach policy to user)

### Error: "User does not exist"
- Check that the IAM user `bedrock-user` exists in your AWS account
- Verify you're in the correct AWS account (528789129293)

### Still getting AccessDeniedException
- Wait 1-2 minutes for IAM permissions to propagate
- Restart your dev server to clear any cached credentials
- Verify the policy is attached: AWS Console → IAM → Users → bedrock-user → Permissions

---

## Additional AWS Permissions Needed

If you encounter other AWS errors, you may also need:

### Bedrock Permissions (already working ✅)
Your user already has Bedrock access.

### Additional SageMaker Endpoints
If you add more SageMaker endpoints in the future, update the policy to include their ARNs.

---

## Questions?

- Check the AWS IAM documentation: https://docs.aws.amazon.com/iam/
- Verify endpoint names match your `.env.local` configuration
