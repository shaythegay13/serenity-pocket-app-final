# ⚡ Quick Start - 4 Steps to Get Running

## Step 1: Database (5 min)
```
1. Open Supabase → SQL Editor
2. Copy ALL of: migrations/complete_migration.sql
3. Paste and Run
4. Wait for ✅ success message
```

## Step 2: Get API Key (5 min)
```
1. Go to: https://the-odds-api.com/
2. Sign up (free)
3. Copy your API key
```

## Step 3: Add to .env.local (2 min)
```bash
# Add this line:
NEXT_PUBLIC_ODDS_API_KEY=your_key_here

# Then restart server:
npm run dev
```

## Step 4: Test (5 min)
```
1. Open app → Account tab
2. Switch to "Premium" tier (dev mode)
3. Go to Analyze Bet tab
4. Enter a bet and click "Analyze Bet"
5. Click "Save Analysis"
6. Check Supabase → bet_analyses table
7. Your data should be there! ✅
```

---

## ✅ Success Checklist
- [ ] Migration ran without errors
- [ ] API key added to .env.local
- [ ] Dev server restarted
- [ ] Save Analysis button works
- [ ] Data appears in Supabase

---

## 🆘 If Something Breaks
1. Check browser console (F12)
2. Check Supabase logs
3. Read: COMPLETE_SETUP_INSTRUCTIONS.md
4. Copy error message and ask for help

---

**That's it! You're ready to go! 🚀**
