# 🚀 Complete Setup Instructions - Start Here!

## Where You Are Now
✅ Phase 1 Complete: Redesigned UI with mock data  
🔄 **Next: Make it work with real data**

---

## 📋 STEP 1: Database Migration (5 minutes)

### What to do:
1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Open the file: `/migrations/complete_migration.sql`
4. **Copy the ENTIRE file** (all 400+ lines)
5. **Paste** into Supabase SQL Editor
6. Click **"Run"** (or Ctrl+Enter)

### Expected Result:
```
✅ MIGRATION COMPLETED SUCCESSFULLY!
Tables updated/created:
  ✓ bet_analyses (updated)
  ✓ tilt_alerts (created)
  ✓ ai_picks (created)
  ✓ user_profiles (updated)
```

### If you get an error:
- **"relation already exists"** → This is fine! The script handles it.
- **"column already exists"** → This is fine! The script handles it.
- Any other error → Copy the error message and let me know

---

## 📋 STEP 2: Get API Keys (10 minutes)

### A. The Odds API (for Live Odds feature)

1. Go to: **https://the-odds-api.com/**
2. Click **"Get API Key"**
3. Sign up (free tier: 500 requests/month)
4. Copy your API key

**Free tier includes:**
- Live odds from 40+ sportsbooks
- NBA, NFL, MLB, NHL, Soccer, and more
- Real-time updates

### B. OpenAI API (Optional - for AI analysis)

**Skip this for now** - we'll add it in the next phase. The app will continue using mock AI responses.

---

## 📋 STEP 3: Add Environment Variables (2 minutes)

### What to do:
1. Open `.env.local` in your project root
2. Add this line (keep your existing Supabase variables):

```bash
# Add this NEW line:
NEXT_PUBLIC_ODDS_API_KEY=paste_your_odds_api_key_here
```

### Full example of what your `.env.local` should look like:
```bash
# Supabase (existing - keep these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# The Odds API (NEW - add this)
NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key_here
```

### Important:
**Restart your dev server** after adding the API key:
```bash
# Press Ctrl+C to stop the server
# Then restart:
npm run dev
```

---

## 📋 STEP 4: Test Everything (5 minutes)

### A. Test Database Migration

1. Go to **Supabase Dashboard** → **Table Editor**
2. Look for these tables:
   - ✅ `bet_analyses` (should have new columns)
   - ✅ `tilt_alerts` (new table)
   - ✅ `ai_picks` (new table)
3. Click on `user_profiles` table
4. Check for new columns:
   - ✅ `subscription_tier`
   - ✅ `subscription_expires_at`

### B. Test Save Analysis Button

1. Open your app at `http://localhost:3000`
2. Go to **Account** tab
3. Use the dev mode switcher to set tier to **Premium**
4. Go to **Analyze Bet** tab
5. Enter:
   - Bet description: "Lakers -3.5 vs Warriors"
   - Odds: "-110"
   - Stake: "100"
6. Click **"Analyze Bet"**
7. Wait for analysis to appear
8. Click **"Save Analysis"** button
9. You should see: ✅ "Analysis saved successfully!"

### C. Check if data was saved

1. Go to **Supabase Dashboard** → **Table Editor**
2. Click on **`bet_analyses`** table
3. You should see your saved analysis!

### D. Test Live Odds (if API key is set up)

1. Go to **Live Odds** tab (must be Premium tier)
2. You should see:
   - **If API key is working**: Real live odds from sportsbooks
   - **If API key is not set**: Mock data (Lakers vs Warriors, Chiefs vs Bills)
3. Check browser console (F12) for any errors

---

## 🎯 What Works Now

After completing these steps:

✅ **Save Analysis button** - Saves to database  
✅ **Database tables** - All set up with proper security  
✅ **Subscription tracking** - Ready for payment integration  
✅ **Dev mode tier switcher** - Test all premium features  
✅ **Live Odds** - Shows real data (if API key configured)  

---

## 🔍 Troubleshooting

### Problem: "Save Analysis" button doesn't work
**Solution:**
1. Check browser console (F12) for errors
2. Verify migration ran successfully in Supabase
3. Make sure you're logged in (not anonymous)

### Problem: Live Odds shows mock data
**Solution:**
1. Verify you added `NEXT_PUBLIC_ODDS_API_KEY` to `.env.local`
2. Restart dev server after adding the key
3. Check browser console for API errors
4. Verify API key is valid at https://the-odds-api.com/account

### Problem: Can't see premium features
**Solution:**
1. Go to Account tab
2. Use the yellow dev mode switcher at the top
3. Click "Premium" or "Elite" button
4. Navigate to the feature you want to test

### Problem: Database migration failed
**Solution:**
1. Copy the exact error message
2. Check if tables already exist (that's OK!)
3. Try running just the part that failed
4. Let me know the specific error

---

## 📊 What's Still Using Mock Data

These features still use mock data (will integrate in next phase):

🔴 **AI Analysis** - Still shows mock probability/EV calculations  
🔴 **AI Picks** - Still shows mock bet suggestions  
🔴 **Bias Detection** - Still shows mock bias warnings  

**This is intentional!** We're integrating features one at a time.

---

## 🚀 Next Steps (After This Works)

Once you've completed Steps 1-4 and everything is working:

### Phase 2B: AI Integration (Next)
1. Sign up for OpenAI API
2. Add AI analysis for bet evaluation
3. Add bias detection for Premium Plus users
4. Generate real AI picks for Elite users

### Phase 3: Payment Integration
1. Set up Stripe
2. Create checkout flows
3. Handle subscription webhooks
4. Enable real subscription purchases

### Phase 4: Polish & Launch
1. Mobile responsiveness
2. Performance optimization
3. User testing
4. Launch! 🎉

---

## ✅ Checklist - Mark as you complete

- [ ] Step 1: Ran database migration in Supabase
- [ ] Step 2: Got The Odds API key
- [ ] Step 3: Added API key to `.env.local`
- [ ] Step 3: Restarted dev server
- [ ] Step 4A: Verified tables exist in Supabase
- [ ] Step 4B: Tested Save Analysis button
- [ ] Step 4C: Confirmed data saved to database
- [ ] Step 4D: Checked Live Odds tab

---

## 🆘 Need Help?

If you get stuck:
1. Check the troubleshooting section above
2. Look at browser console (F12) for errors
3. Check Supabase logs in the dashboard
4. Copy any error messages and let me know

---

## 📁 Files Created/Updated

**New files:**
- `/migrations/complete_migration.sql` - Database setup
- `/lib/odds-api.ts` - Odds API integration
- `/SETUP_GUIDE.md` - This guide

**Files that will be updated next:**
- `/components/tabs/live-odds-tab.tsx` - Use real odds API
- `/components/tabs/analyze-bet-tab.tsx` - Use real AI analysis

---

**You're doing great! Complete Steps 1-4 and let me know how it goes!** 🚀
