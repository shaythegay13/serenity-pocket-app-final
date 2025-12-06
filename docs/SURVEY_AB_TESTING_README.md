# Survey A/B Testing - Complete Implementation

## 🎯 Overview

Your Serenity Pocket app now has **automatic A/B testing** between two survey variants:

- **Survey A**: Original 8-question gambling assessment
- **Survey B**: New 10-question gambling assessment with additional questions on impulsivity and emotional triggers

Users are automatically assigned to one variant based on their email address (deterministic assignment), ensuring consistent experience and reliable data collection.

---

## 📦 What's Included

### ✅ Survey B (10 Questions)
Complete implementation matching Survey A's UX:
- Question-by-question navigation
- Progress tracking
- Validation
- Same styling and flow
- Separate API endpoint
- Dedicated scoring system (0-150 scale)

### ✅ A/B Testing Infrastructure
- Automatic variant assignment
- Deterministic (email-based) distribution
- Session persistence
- Database tracking
- Configurable split ratios
- Analytics-ready

### ✅ Database Support
- `survey_type` column added to track variants
- Migration file ready to run
- Indexes for performance
- Compatible with existing data

### ✅ Complete Documentation
- Implementation guides
- A/B testing best practices
- Configuration examples
- Analytics queries
- Troubleshooting tips

---

## 🚀 Quick Start

### 1️⃣ Run Database Migration
```sql
-- In Supabase SQL Editor
ALTER TABLE anonymous_survey_submissions 
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(1) DEFAULT 'A' CHECK (survey_type IN ('A', 'B'));

ALTER TABLE survey_responses 
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(1) DEFAULT 'A' CHECK (survey_type IN ('A', 'B'));
```

### 2️⃣ Configure Environment
```bash
# In .env.local
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=true
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=50  # 50/50 split
```

### 3️⃣ Deploy
That's it! A/B testing is now active.

---

## 📁 File Structure

```
/components
  /integrated-survey-flow
    ├── ABTestSurveyWrapper.tsx        # Main A/B testing wrapper
    ├── IntegratedSurveyWrapper.tsx    # Survey A flow
    └── IntegratedSurveyWrapperB.tsx   # Survey B flow
  ├── SurveyForm.tsx                   # Survey A form
  └── SurveyFormB.tsx                  # Survey B form

/lib
  ├── abTesting.ts                     # A/B testing utilities
  ├── surveyValidation.ts              # Survey A validation
  ├── surveyValidationB.ts             # Survey B validation
  ├── surveyService.ts                 # Survey A database service
  └── surveyServiceB.ts                # Survey B database service

/app/api
  /gambling-survey
    └── submit/route.ts                # Survey A API
  /gambling-survey-b
    └── submit/route.ts                # Survey B API

/types
  └── survey.ts                        # Shared types + both question sets

/supabase/migrations
  └── 20240107_add_survey_type.sql    # Database migration

/docs (Documentation)
  ├── QUICK_START_CHECKLIST.md        # ⭐ Start here
  ├── IMPLEMENTATION_SUMMARY.md        # Complete overview
  ├── AB_TESTING_GUIDE.md              # A/B testing guide
  ├── SURVEY_B_README.md               # Survey B details
  ├── SURVEY_COMPARISON.md             # A vs B comparison
  └── ENV_VARIABLES.md                 # Configuration options
```

---

## 📊 Survey Comparison

| Feature | Survey A | Survey B |
|---------|----------|----------|
| **Questions** | 8 | 10 |
| **Max Score** | 144 (scaled to 50) | 150 |
| **Risk Levels** | 3 (Low, Medium, High) | 4 (Low, Medium, High, Very High) |
| **Unique Questions** | - | Impulsivity, Emotional Triggers |
| **Question 7** | Normal scoring | Reverse scoring |
| **Component** | `SurveyForm` | `SurveyFormB` |
| **API** | `/api/gambling-survey/submit` | `/api/gambling-survey-b/submit` |

---

## 🎛️ Configuration

### Environment Variables

```bash
# Enable/disable A/B testing (default: true)
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=true

# Percentage assigned to Survey B (0-100, default: 50)
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=50
```

### Common Configurations

**50/50 Split (Recommended for A/B Testing)**
```bash
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=50
```

**Everyone Gets Survey A**
```bash
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=false
```

**Everyone Gets Survey B**
```bash
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=100
```

**70% Survey B, 30% Survey A**
```bash
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=70
```

---

## 📈 Analytics

### Check Distribution
```sql
SELECT 
  survey_type,
  COUNT(*) as submissions,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM anonymous_survey_submissions
GROUP BY survey_type;
```

### Compare Performance
```sql
SELECT 
  survey_type,
  COUNT(*) as submissions,
  ROUND(AVG(score), 2) as avg_score,
  MIN(score) as min_score,
  MAX(score) as max_score
FROM anonymous_survey_submissions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY survey_type;
```

---

## 🔍 How It Works

### 1. User Visits Site
- Variant assigned based on email hash
- Assignment stored in session storage

### 2. User Completes Survey
- Sees either Survey A or Survey B
- Submission tagged with `survey_type: 'A'` or `'B'`

### 3. Data Collection
- All submissions tracked in database
- Easy to query and compare results

### 4. Analysis
- Compare completion rates
- Compare average scores
- Identify which variant performs better

---

## 🎯 Key Features

✅ **Deterministic Assignment** - Same email always gets same variant  
✅ **Session Persistence** - Variant stays consistent during session  
✅ **Configurable Split** - Adjust percentages via environment variables  
✅ **Database Tracking** - All submissions tagged with variant  
✅ **Zero Code Changes** - Just configure and deploy  
✅ **Analytics Ready** - Easy to query and compare  
✅ **Backwards Compatible** - Existing Survey A still works  

---

## 📚 Documentation

Start with these files in order:

1. **`QUICK_START_CHECKLIST.md`** ⭐ - 3-step setup guide
2. **`IMPLEMENTATION_SUMMARY.md`** - What was built and why
3. **`AB_TESTING_GUIDE.md`** - Complete A/B testing guide
4. **`SURVEY_B_README.md`** - Survey B implementation details
5. **`SURVEY_COMPARISON.md`** - Side-by-side comparison
6. **`ENV_VARIABLES.md`** - Configuration options

---

## 🐛 Troubleshooting

**All users getting Survey A?**
- Check `NEXT_PUBLIC_SURVEY_B_PERCENTAGE` > 0
- Verify `NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=true`
- Restart dev server

**`survey_type` is null in database?**
- Run the database migration
- Check default value is 'A'

**Variant changes on refresh?**
- Check session storage is enabled in browser
- Verify no errors in console

---

## ✨ Summary

You now have a complete A/B testing infrastructure for comparing Survey A (8 questions) vs Survey B (10 questions). 

**Next Steps:**
1. ✅ Run database migration
2. ✅ Configure environment variables
3. ✅ Deploy
4. 📊 Collect data (2+ weeks, 100+ submissions per variant)
5. 📈 Analyze results
6. 🎯 Choose winning variant or iterate

**The implementation is complete and ready to go live!** 🚀

---

## 📞 Support

For questions or issues:
1. Check the documentation files listed above
2. Review the troubleshooting section
3. Verify database migration ran successfully
4. Check environment variables are set correctly

---

**Happy A/B Testing!** 🎉
