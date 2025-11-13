# Survey A vs Survey B Comparison

## Quick Reference

| Feature | Survey A | Survey B |
|---------|----------|----------|
| **Questions** | 8 | 10 |
| **Max Score** | 144 (scaled to 50) | 150 |
| **Component** | `SurveyForm` | `SurveyFormB` |
| **Wrapper** | `IntegratedSurveyWrapper` | `IntegratedSurveyWrapperB` |
| **Validation** | `surveyValidation.ts` | `surveyValidationB.ts` |
| **Service** | `surveyService.ts` | `surveyServiceB.ts` |
| **API Endpoint** | `/api/gambling-survey/submit` | `/api/gambling-survey-b/submit` (to create) |
| **Questions Const** | `SURVEY_QUESTIONS` | `SURVEY_B_QUESTIONS` |
| **Score Function** | `getScoreInterpretation()` | `getScoreInterpretationB()` |

## Survey A Questions (8 total)

1. How often do you engage in gambling or betting activities?
2. How much time do you spend betting?
3. When you start placing bets on a given day, how easy is it for you to stop?
4. Has gambling affected your personal relationships or mental wellbeing?
5. Have you tried to reduce or control your gambling habits?
6. After losing money on bets, what do you typically do?
7. Do you gamble with money you can afford to lose?
8. Does gambling interfere with your daily responsibilities?

## Survey B Questions (10 total)

1. **Frequency of Betting** (in the past 12 months)
2. **Increasing Bet Size for Excitement**
3. **Difficulty Stopping Once You Begin**
4. **Emotional/Relationship Impact**
5. **Attempts to Control or Reduce Gambling**
6. **Response to Losses** (Chasing Losses)
7. **Setting and Sticking to Financial Limits** ⚠️ *Reverse scored*
8. **Interference With Responsibilities** (work, school, family)
9. **Impulsive Betting or Gambling**
10. **Emotional Triggers** (using gambling to cope with negative emotions)

## Scoring Comparison

### Survey A
- **Raw max**: 144 points
- **Scaled to**: 0-50
- **Low risk**: 0-17
- **Medium risk**: 18-34
- **High risk**: 35-50

### Survey B
- **Raw max**: 150 points
- **No scaling**: 0-150
- **Low risk**: 0-37
- **Medium risk**: 38-75
- **High risk**: 76-112
- **Very High risk**: 113-150

## Import Statements

### Survey A
```typescript
import SurveyForm from '@/components/SurveyForm';
import { IntegratedSurveyWrapper } from '@/components/integrated-survey-flow/IntegratedSurveyWrapper';
import { SURVEY_QUESTIONS, getScoreInterpretation } from '@/types/survey';
import { validateSurveySubmission, calculateSurveyScore } from '@/lib/surveyValidation';
import { submitAnonymousSurvey } from '@/lib/surveyService';
```

### Survey B
```typescript
import SurveyFormB from '@/components/SurveyFormB';
import { IntegratedSurveyWrapperB } from '@/components/integrated-survey-flow/IntegratedSurveyWrapperB';
import { SURVEY_B_QUESTIONS, getScoreInterpretationB } from '@/types/survey';
import { validateSurveyBSubmission, calculateSurveyBScore } from '@/lib/surveyValidationB';
import { submitAnonymousSurveyB } from '@/lib/surveyServiceB';
```

## Side-by-Side Usage

### Using Survey A
```tsx
import SurveyForm from '@/components/SurveyForm';

<SurveyForm 
  onSubmit={handleSubmit} 
  isSubmitting={isSubmitting}
/>
```

### Using Survey B
```tsx
import SurveyFormB from '@/components/SurveyFormB';

<SurveyFormB 
  onSubmit={handleSubmit} 
  isSubmitting={isSubmitting}
/>
```

## Database Storage

Both surveys use the same table but are differentiated by the `survey_type` column:

```typescript
// Survey A submission
{
  email: 'user@example.com',
  responses: [...],
  score: 25,
  survey_type: 'A'  // Default
}

// Survey B submission
{
  email: 'user@example.com',
  responses: [...],
  score: 65,
  survey_type: 'B'  // Explicitly set
}
```

## When to Use Each

### Use Survey A when:
- You want the original 8-question assessment
- You need compatibility with existing data
- You prefer the scaled 0-50 scoring system
- You want a shorter survey for better completion rates

### Use Survey B when:
- You want more detailed assessment (10 questions)
- You need the additional questions about impulsivity and emotional triggers
- You prefer the 0-150 raw scoring system
- You want to differentiate risk levels more granularly (4 levels vs 3)

## Migration Path

If you want to switch from A to B:

1. Keep Survey A for existing users
2. Offer Survey B to new users
3. Use `survey_type` flag to track which version
4. Compare results in analytics
5. Gradually migrate based on data

## A/B Testing

You can run both surveys simultaneously:

```typescript
const surveyVersion = Math.random() < 0.5 ? 'A' : 'B';

{surveyVersion === 'A' ? (
  <IntegratedSurveyWrapper {...props} />
) : (
  <IntegratedSurveyWrapperB {...props} />
)}
```

## Key Architectural Similarities

Both surveys share:
- ✅ Same UX patterns (navigation, progress bar, validation)
- ✅ Same component structure
- ✅ Same database table
- ✅ Same authentication flow
- ✅ Same result display logic
- ✅ Same email validation
- ✅ Same submission workflow

This ensures consistency across your application regardless of which survey is used.
