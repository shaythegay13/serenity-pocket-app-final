# Quick Start Checklist: Survey B & A/B Testing

## 🚀 3-Step Setup

### Step 1: Run Database Migration ✅

Open your Supabase SQL Editor and run:

```sql
-- Add survey_type column to both tables
ALTER TABLE anonymous_survey_submissions 
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(1) DEFAULT 'A' CHECK (survey_type IN ('A', 'B'));

ALTER TABLE survey_responses 
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(1) DEFAULT 'A' CHECK (survey_type IN ('A', 'B'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_survey_type 
    ON anonymous_survey_submissions USING btree (survey_type);

CREATE INDEX IF NOT EXISTS idx_survey_responses_type 
    ON survey_responses USING btree (survey_type);
```

**Verify:**
```sql
-- Should show the new column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'anonymous_survey_submissions' 
AND column_name = 'survey_type';
```

---

### Step 2: Configure Environment Variables ✅

Add to your `.env.local` file:

```bash
# Enable A/B testing with 50/50 split
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=true
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=50
```

**Common Configurations:**

```bash
# 50/50 split (recommended for A/B testing)
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=50

# Everyone gets Survey A (disable A/B testing)
NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=false

# Everyone gets Survey B
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=100

# 70% Survey B, 30% Survey A
NEXT_PUBLIC_SURVEY_B_PERCENTAGE=70
```

---

### Step 3: Deploy & Test ✅

1. **Restart your dev server** (if running locally)
   ```bash
   npm run dev
   ```

2. **Test the flow:**
   - Visit your app
   - Start the survey
   - Check browser console for: `[A/B Test] User ... assigned to Survey ...`
   - Complete the survey
   - Verify in database

3. **Verify database:**
   ```sql
   SELECT id, email, score, survey_type, created_at 
   FROM anonymous_survey_submissions 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

---

## ✅ Verification Checklist

- [ ] Database migration completed successfully
- [ ] Environment variables configured
- [ ] App restarted/redeployed
- [ ] Can see variant assignment in console (dev mode)
- [ ] Survey submissions have `survey_type` populated
- [ ] Both Survey A and Survey B are working
- [ ] Session persistence works (variant stays same on refresh)

---

## 📊 Monitor Your A/B Test

### Check Distribution
```sql
SELECT 
  survey_type,
  COUNT(*) as count,
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

## 🎯 What's Different?

### Survey A (Original)
- 8 questions
- Max score: 144 (scaled to 50)
- 3 risk levels

### Survey B (New)
- 10 questions
- Max score: 150
- 4 risk levels (includes "Very High")
- Additional questions on impulsivity and emotional triggers

---

## 🔧 Troubleshooting

### Not seeing A/B split?
1. Check environment variables are set
2. Restart your dev server
3. Clear browser session storage
4. Try different email addresses

### All users getting Survey A?
- Check `NEXT_PUBLIC_SURVEY_B_PERCENTAGE` is > 0
- Verify `NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED=true`

### `survey_type` is null?
- Run the database migration
- Check default value is set to 'A'

---

## 📚 Full Documentation

- **`IMPLEMENTATION_SUMMARY.md`** - Complete overview
- **`AB_TESTING_GUIDE.md`** - Detailed A/B testing guide
- **`SURVEY_B_README.md`** - Survey B implementation details
- **`SURVEY_COMPARISON.md`** - Side-by-side comparison

---

## 🎉 You're Ready!

Once all three steps are complete, your A/B testing is live!

Users will automatically be assigned to Survey A or Survey B, and you can start collecting data to compare performance.

**Next:** Let it run for at least 2 weeks with 100+ submissions per variant before analyzing results.
