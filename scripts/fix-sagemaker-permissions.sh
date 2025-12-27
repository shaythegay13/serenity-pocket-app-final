#!/bin/bash

# Script to add SageMaker permissions to the bedrock-user IAM user
# This fixes the "AccessDeniedException: User is not authorized to perform: sagemaker:InvokeEndpoint" error

set -e

echo "🔧 Fixing SageMaker Permissions for bedrock-user"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured"
echo ""

IAM_USER="bedrock-user"
POLICY_NAME="SerenityPocketSageMakerInvoke"
POLICY_FILE="aws-iam-sagemaker-policy.json"

# Check if policy file exists
if [ ! -f "$POLICY_FILE" ]; then
    echo "❌ Policy file not found: $POLICY_FILE"
    exit 1
fi

echo "📋 Policy file: $POLICY_FILE"
echo ""

# Create the policy
echo "🔨 Creating IAM policy: $POLICY_NAME"
POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document file://$POLICY_FILE \
    --description "Allow Serenity Pocket app to invoke SageMaker endpoints" \
    --query 'Policy.Arn' \
    --output text 2>&1) || {

    # Policy might already exist, try to get its ARN
    echo "⚠️  Policy may already exist, fetching ARN..."
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    POLICY_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${POLICY_NAME}"
}

echo "✅ Policy ARN: $POLICY_ARN"
echo ""

# Attach the policy to the user
echo "🔗 Attaching policy to user: $IAM_USER"
aws iam attach-user-policy \
    --user-name "$IAM_USER" \
    --policy-arn "$POLICY_ARN" || {
    echo "❌ Failed to attach policy. The user may not exist or policy is already attached."
    exit 1
}

echo ""
echo "✅ SUCCESS! SageMaker permissions added to $IAM_USER"
echo ""
echo "📝 Next steps:"
echo "   1. Restart your Next.js dev server"
echo "   2. Test the AI Bet Advisor again"
echo ""
echo "🎉 The SageMaker AccessDeniedException should now be resolved!"
