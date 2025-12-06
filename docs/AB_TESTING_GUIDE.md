# A/B Testing Guide: Survey A vs Survey B

## Overview

Your Serenity Pocket app now supports A/B testing between two survey variants:
- **Survey A**: Original 8-question assessment
- **Survey B**: New 10-question assessment

Users are automatically assigned to one variant in a deterministic way based on their email address.

## How It Works

### 1. **Automatic Assignment**
When a user starts the survey flow, they are automatically assigned to either Survey A or Survey B:

```typescript
// Based on email hash (deterministic)
const variant = assignSurveyVariant('user@example.com');
// Same email always gets same variant

// Or random assignment
const variant = assignRandomSurveyVariant();
```

### 2. **Session Persistence**
The assigned variant is stored in session storage, ensuring consistency throughout the user's session.

### 3. **Database Tracking**
Each survey submission includes a `survey_type` field ('A' or 'B') for analytics.

## Configuration

### Environment Variables

Control A/B testing behavior via environment variables in `.env.local`:

```bash
# Enable/disable A/B testing (default: true)
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=true

# Percentage of users to assign to Survey B (0-100, default: 50)
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=50
```

### Examples

**50/50 split (default):**
```bash
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=50
```

**Give 70% of users Survey B:**
```bash
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=70
```

**Everyone gets Survey A:**
```bash
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=0
# OR
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=false
```

**Everyone gets Survey B:**
```bash
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=100
```

## Implementation Details

### Files Modified/Created

1. **`/lib/abTesting.ts`** - A/B testing utilities
2. **`/components/integrated-survey-flow/ABTestSurveyWrapper.tsx`** - Wrapper component
3. **`/app/page.tsx`** - Updated to use ABTestSurveyWrapper
4. **`/supabase/migrations/20240107_add_survey_type.sql`** - Database migration

### Database Schema

```sql
-- Added to anonymous_survey_submissions and survey_responses
survey_type VARCHAR(1) DEFAULT 'A' CHECK (survey_type IN ('A', 'B'))
```

## Analytics & Tracking

### Track Variant Assignment

```typescript
import { trackSurveyVariantAssignment } from '@/lib/abTesting';

trackSurveyVariantAssignment('user@example.com', 'B');
// Logs to console in dev, sends to analytics in production
```

### Query Survey Results by Variant

```sql
-- Get all Survey A submissions
SELECT * FROM anonymous_survey_submissions WHERE survey_type = 'A';

-- Get all Survey B submissions
SELECT * FROM anonymous_survey_submissions WHERE survey_type = 'B';

-- Compare average scores
SELECT 
  survey_type,
  COUNT(*) as total_submissions,
  AVG(score) as avg_score,
  MIN(score) as min_score,
  MAX(score) as max_score
FROM anonymous_survey_submissions
GROUP BY survey_type;
```

## Testing Different Variants

### Force a Specific Variant (for testing)

```typescript
import { ABTestSurveyWrapper } from '@/components/integrated-survey-flow/ABTestSurveyWrapper';

// Force Survey A
<ABTestSurveyWrapper
  forceVariant="A"
  onComplete={handleComplete}
  onSwitchToLogin={handleLogin}
/>

// Force Survey B
<ABTestSurveyWrapper
  forceVariant="B"
  onComplete={handleComplete}
  onSwitchToLogin={handleLogin}
/>
```

### Clear Variant from Session

```typescript
import { clearVariantFromSession } from '@/lib/abTesting';

// Clear to test reassignment
clearVariantFromSession();
```

## Migration Steps

### 1. Run Database Migration

```bash
# Apply the migration to add survey_type column
# This is in: /supabase/migrations/20240107_add_survey_type.sql
```

Or run manually in Supabase SQL editor:

```sql
ALTER TABLE anonymous_survey_submissions 
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(1) DEFAULT 'A' CHECK (survey_type IN ('A', 'B'));

ALTER TABLE survey_responses 
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(1) DEFAULT 'A' CHECK (survey_type IN ('A', 'B'));
```

### 2. Deploy Code

The code is already integrated! Just deploy your app.

### 3. Configure Split

Set your desired split in `.env.local` (or environment variables in your hosting platform).

## Analyzing Results

### Key Metrics to Track

1. **Completion Rate**
   - % of users who start vs complete each variant
   
2. **Average Score**
   - Compare average scores between variants
   
3. **Score Distribution**
   - How scores are distributed across risk levels
   
4. **Time to Complete**
   - Track submission timestamps to measure completion time
   
5. **Conversion to Account**
   - % of survey completers who create accounts

### Sample Analytics Query

```sql
-- Comprehensive A/B test results
WITH survey_stats AS (
  SELECT 
    survey_type,
    COUNT(*) as total_submissions,
    AVG(score) as avg_score,
    STDDEV(score) as stddev_score,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score) as median_score
  FROM anonymous_survey_submissions
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY survey_type
)
SELECT 
  survey_type,
  total_submissions,
  ROUND(avg_score, 2) as avg_score,
  ROUND(stddev_score, 2) as stddev_score,
  median_score
FROM survey_stats;
```

## Best Practices

### 1. **Run for Sufficient Time**
- Collect at least 100 submissions per variant
- Run for at least 2 weeks to account for weekly patterns

### 2. **Statistical Significance**
- Use proper statistical tests (t-test, chi-square) to validate results
- Don't make decisions on small sample sizes

### 3. **Segment Analysis**
- Analyze results by user segments (time of day, traffic source, etc.)
- Look for patterns in different user groups

### 4. **Monitor Both Metrics**
- Don't just look at scores - track completion rates too
- A more accurate survey that fewer people complete may not be better

### 5. **Document Findings**
- Keep notes on what you learn
- Track changes over time

## Troubleshooting

### Users Getting Different Variants
**Problem**: Same email getting different variants  
**Solution**: Check session storage is working, ensure deterministic assignment is used

### All Users Getting Same Variant
**Problem**: No variation in assignments  
**Solution**: Check `NEXT_PUBLIC_SURVEY_B_PERCENTAGE` environment variable

### Survey Type Not Saving
**Problem**: `survey_type` is null in database  
**Solution**: Run the migration to add the column with default value

## Advanced: Custom Assignment Logic

You can customize the assignment logic in `/lib/abTesting.ts`:

```typescript
// Example: Assign based on time of day
export function assignSurveyVariantByTime(): SurveyVariant {
  const hour = new Date().getHours();
  // Morning users get Survey A, afternoon/evening get Survey B
  return hour < 12 ? 'A' : 'B';
}

// Example: Assign based on traffic source
export function assignSurveyVariantBySource(source: string): SurveyVariant {
  const bSources = ['google', 'facebook', 'instagram'];
  return bSources.includes(source) ? 'B' : 'A';
}
```

## Summary

✅ **Automatic A/B testing** between Survey A (8 questions) and Survey B (10 questions)  
✅ **Deterministic assignment** - same email always gets same variant  
✅ **Configurable split** - adjust percentages via environment variables  
✅ **Database tracking** - all submissions tagged with variant  
✅ **Session persistence** - consistent experience during session  
✅ **Analytics ready** - track and compare performance  

Your A/B testing infrastructure is now live and ready to collect data!
