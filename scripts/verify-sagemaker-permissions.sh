#!/bin/bash

# Script to verify SageMaker permissions for bedrock-user

set -e

echo "🔍 Verifying SageMaker Permissions for bedrock-user"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    exit 1
fi

IAM_USER="bedrock-user"
ENDPOINT_ARN="arn:aws:sagemaker:us-west-2:528789129293:endpoint/serenity-pocket-sports-model"

echo "👤 Checking policies attached to user: $IAM_USER"
echo ""

# List all policies attached to the user
echo "📋 Attached policies:"
aws iam list-attached-user-policies --user-name $IAM_USER --output table

echo ""
echo "🔐 Testing SageMaker permissions..."
echo ""

# Simulate the InvokeEndpoint permission check
aws iam simulate-principal-policy \
    --policy-source-arn "arn:aws:iam::528789129293:user/$IAM_USER" \
    --action-names "sagemaker:InvokeEndpoint" \
    --resource-arns "$ENDPOINT_ARN" \
    --output table

echo ""
echo "💡 If you see 'allowed' in the results above, the permissions are correct."
echo "   If you see 'denied', the policy needs to be attached or updated."
