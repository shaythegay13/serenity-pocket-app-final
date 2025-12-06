# 🚀 Quick Setup - New Gambling Survey System

## You're ready to go! Just follow these 3 steps:

### Step 1: Run Database Migrations in Supabase

Go to your **Supabase SQL Editor** and run these 3 migrations **in order**:

#### 1️⃣ First Migration - Anonymous Surveys Table
```sql
-- Copy the entire contents of:
-- /supabase/migrations/20240101_create_anonymous_surveys.sql
-- Paste and run in Supabase SQL editor
```

#### 2️⃣ Second Migration - Survey Responses Table  
```sql
-- Copy the entire contents of:
-- /supabase/migrations/20240102_create_survey_responses.sql
-- This will DROP the old table and create the new one
-- Paste and run in Supabase SQL editor
```

#### 3️⃣ Third Migration - Migration Trigger
```sql
-- Copy the entire contents of:
-- /supabase/migrations/20240103_create_migration_trigger.sql
-- Paste and run in Supabase SQL editor
```

### Step 2: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

### Step 3: Test the New Survey

Visit: **http://localhost:3000/gambling-survey**

## ✅ What's New:

- **Better Questions**: 8 DSM-5 clinical criteria questions
- **Anonymous Start**: Users can take survey without account
- **Smart Linking**: Survey automatically links when they create account  
- **Progress Tracking**: Beautiful charts at `/dashboard/survey-history`
- **Follow-up Surveys**: Users can retake to track improvement
- **Score Range**: 0-100 scale with 4 risk levels (Low/Moderate/High/Very High)

## 🎯 User Flow:

1. User visits `/gambling-survey`
2. Enters email (no account needed)
3. Completes 8 questions
4. Sees score immediately
5. Creates account (optional)
6. Survey auto-links to their account
7. Can view history and retake anytime

## ⚠️ Old System:

- Old files moved to `/lib/survey-old/` (preserved)
- Old API redirects to new endpoint
- Old migration renamed to `.old`

That's it! Your new survey system is ready to use. 🎉
