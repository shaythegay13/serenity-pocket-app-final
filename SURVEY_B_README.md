# Survey B Implementation Guide

## Overview

Survey B is a 10-question alternative gambling assessment that can be used alongside or instead of the original 8-question Survey A. It follows the same architecture and UX patterns for consistency.

## Files Created

### 1. **Types** (`/types/survey.ts`)
- Added `SURVEY_B_QUESTIONS` constant with 10 questions
- Added `getScoreInterpretationB()` function for Survey B scoring
- Max score: 150 points (vs 144 for Survey A)
- Risk levels: Low (0-37), Medium (38-75), High (76-112), Very High (113+)

### 2. **Survey Form Component** (`/components/SurveyFormB.tsx`)
- Identical UX to `SurveyForm.tsx`
- Question-by-question navigation
- Progress bar
- Validation
- Radio button options
- Previous/Next/Submit buttons

### 3. **Validation** (`/lib/surveyValidationB.ts`)
- `validateSurveyBSubmission()` - Validates 10 questions
- `calculateSurveyBScore()` - Calculates score (0-150)
- Email validation with disposable email blocking
- Zod schemas for type safety

### 4. **Service Layer** (`/lib/surveyServiceB.ts`)
- `submitAnonymousSurveyB()` - Submits to database with `survey_type: 'B'`
- `checkExistingAnonymousSurveyB()` - Checks for duplicate submissions
- Uses same database table with type flag

### 5. **Integrated Wrapper** (`/components/integrated-survey-flow/IntegratedSurveyWrapperB.tsx`)
- Complete survey flow matching Survey A
- Welcome screen → Email capture → Questions → Results
- Calls `/api/gambling-survey-b/submit` endpoint

## Survey B Questions

1. **Frequency of Betting** (past 12 months)
2. **Increasing Bet Size for Excitement**
3. **Difficulty Stopping Once You Begin**
4. **Emotional/Relationship Impact**
5. **Attempts to Control or Reduce Gambling**
6. **Response to Losses** (Chasing Losses)
7. **Setting and Sticking to Financial Limits** (reverse scored)
8. **Interference With Responsibilities**
9. **Impulsive Betting or Gambling**
10. **Emotional Triggers** (using gambling to cope)

## Usage Examples

### Basic Usage (Form Only)

```tsx
import SurveyFormB from '@/components/SurveyFormB';
import { SurveyAnswer } from '@/types/survey';

function MyComponent() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (responses: SurveyAnswer[]) => {
    setIsSubmitting(true);
    // Handle submission
    await fetch('/api/gambling-survey-b/submit', {
      method: 'POST',
      body: JSON.stringify({ email, responses }),
    });
    setIsSubmitting(false);
  };

  return <SurveyFormB onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
}
```

### Full Flow (With Welcome/Email/Results)

```tsx
import { IntegratedSurveyWrapperB } from '@/components/integrated-survey-flow/IntegratedSurveyWrapperB';

function MyPage() {
  const handleComplete = (score: number, level: string, email: string) => {
    console.log('Survey B completed:', { score, level, email });
  };

  const handleSwitchToLogin = () => {
    router.push('/login');
  };

  return (
    <IntegratedSurveyWrapperB
      onComplete={handleComplete}
      onSwitchToLogin={handleSwitchToLogin}
    />
  );
}
```

## API Endpoint (To Be Created)

You'll need to create `/app/api/gambling-survey-b/submit/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { submitAnonymousSurveyB, checkExistingAnonymousSurveyB } from '@/lib/surveyServiceB';
import { validateSurveyBSubmission } from '@/lib/surveyValidationB';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, responses } = body;

  // Validate
  const validation = validateSurveyBSubmission({ email, responses });
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 });
  }

  // Check for existing
  const exists = await checkExistingAnonymousSurveyB(email);
  if (exists) {
    return NextResponse.json({ error: 'Survey already submitted' }, { status: 409 });
  }

  // Submit
  const result = await submitAnonymousSurveyB(email, responses);
  return NextResponse.json({ success: true, surveyId: result.surveyId, score: result.score }, { status: 201 });
}
```

## Database Considerations

Survey B uses the same `anonymous_survey_submissions` table as Survey A. To differentiate:

1. **Add `survey_type` column** (if not exists):
   ```sql
   ALTER TABLE anonymous_survey_submissions 
   ADD COLUMN survey_type VARCHAR(1) DEFAULT 'A';
   ```

2. **Update queries** to filter by type when needed

## Scoring Differences

| Aspect | Survey A | Survey B |
|--------|----------|----------|
| Questions | 8 | 10 |
| Max Score | 144 | 150 |
| Low Risk | 0-17 | 0-37 |
| Medium Risk | 18-34 | 38-75 |
| High Risk | 35-50 | 76-112 |
| Very High Risk | N/A | 113+ |

## Key Features

✅ **Same UX** - Identical look and feel to Survey A  
✅ **Type Safety** - Full TypeScript support with Zod validation  
✅ **Reusable** - Can be used anywhere in the app  
✅ **Isolated** - Doesn't affect Survey A functionality  
✅ **Flagged** - Database entries marked with `survey_type: 'B'`  

## Next Steps

1. Create API endpoint at `/app/api/gambling-survey-b/submit/route.ts`
2. Add `survey_type` column to database (if needed)
3. Update account creation flow to handle Survey B results
4. Consider creating a retake version (`AuthenticatedSurveyRetakeB`)
5. Add Survey B to navigation/routing as needed

## Notes

- Survey B is completely independent of Survey A
- Both can coexist in the same application
- Use the `survey_type` flag to differentiate in analytics
- Consider A/B testing between the two surveys
