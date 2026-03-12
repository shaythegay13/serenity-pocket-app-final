# Complete Setup Guide - Betting Companion Redesign

## 🎯 Current Status
✅ Phase 1 Complete: UI redesign with mock data
🔄 Phase 2 In Progress: Real data integration

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### **STEP 1: Run Database Migration** ⚡

1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `/migrations/complete_migration.sql`
4. Paste into SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Wait for success message

**What this does:**
- Updates `bet_analyses` table with all required columns
- Creates `tilt_alerts` table
- Creates `ai_picks` table
- Adds subscription tracking to `user_profiles`
- Sets up Row Level Security
- Creates indexes for performance

**Expected output:**
```
✅ MIGRATION COMPLETED SUCCESSFULLY!
Tables updated/created:
  ✓ bet_analyses (updated)
  ✓ tilt_alerts (created)
  ✓ ai_picks (created)
  ✓ user_profiles (updated)
```

---

### **STEP 2: Get The Odds API Key** 🔑

1. Go to https://the-odds-api.com/
2. Click "Get API Key" (free tier available)
3. Sign up for free account
4. Copy your API key

**Free Tier Includes:**
- 500 requests per month
- Live odds data
- Multiple sports
- Multiple bookmakers

---

### **STEP 3: Update Environment Variables** 🔐

Add this to your `.env.local` file:

```bash
# Existing Supabase variables (keep these)
NEXT_PUBLIC_SUPABASE_URL=your_existing_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_existing_key

# NEW: The Odds API
NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key_here

# FUTURE: OpenAI (for AI analysis - add later)
# OPENAI_API_KEY=your_openai_key

# Flowglad (payment processing)
FLOWGLAD_SECRET_KEY=your_flowglad_secret
FLOWGLAD_WEBHOOK_SECRET=your_webhook_secret
FLOWGLAD_PRICE_PREMIUM=price_xxx
FLOWGLAD_PRICE_PREMIUM_PLUS=price_xxx
FLOWGLAD_PRICE_ELITE=price_xxx
```

**Important:** Restart your dev server after adding environment variables!

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

### **STEP 4: Update Live Odds Tab** 🏀

Replace the mock data in `/components/tabs/live-odds-tab.tsx`:

<function_calls>
<invoke name="read_file">
<parameter name="file_path">/home/shaybouchles/serenitypocketredesign/components/tabs/live-odds-tab.tsx
