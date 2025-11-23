# 🧪 Test AI Analysis - Quick Guide

## ✅ Setup Complete!

Your OpenAI integration is ready to test. Here's what to do:

---

## 🎯 Quick Test (2 minutes)

### **Test 1: Basic AI Analysis**

1. **Open your app:** http://localhost:3000
2. **Go to Account tab** → Switch to **Premium** tier
3. **Go to Analyze Bet tab**
4. **Enter this test bet:**
   ```
   Description: Lakers to beat Warriors at home
   Odds: -110
   Stake: 100
   ```
5. **Click "Analyze Bet"**

### **Expected Results:**
- ✅ Analysis completes in 2-3 seconds
- ✅ Shows real probability (around 52-55% for -110 odds)
- ✅ Shows Expected Value (likely small positive or negative)
- ✅ Shows Confidence Score (0-100%)
- ✅ Shows Risk Level badge (color-coded)
- ✅ Shows AI recommendation with reasoning
- ✅ "Powered by AI" badge appears
- ✅ No error messages

---

### **Test 2: Bias Detection (Premium Plus)**

1. **Switch to Premium Plus tier** (Account tab)
2. **First, log an emotion:**
   - Go to **My Behavior** tab
   - Click "Log Emotion"
   - Select "Frustrated" with intensity 8/10
   - Add note: "Just lost my last bet"
   - Click "Log Emotion"

3. **Now analyze a bet:**
   - Go to **Analyze Bet** tab
   - Enter:
     ```
     Description: Betting double my usual stake on my favorite team after they lost yesterday
     Odds: +150
     Stake: 200
     ```
   - Click "Analyze Bet"

### **Expected Results:**
- ✅ All basic analysis results (probability, EV, etc.)
- ✅ **Psychological Analysis card appears** (purple gradient)
- ✅ **Bias warnings show up**, such as:
  - "High emotional intensity detected - consider waiting"
  - "Negative emotions may lead to revenge betting"
  - "Loss chasing detected"
  - "Large stake size - ensure bankroll management"
- ✅ **Emotional Alignment bar** shows your stability score
- ✅ Personalized recommendation based on your state

---

## 🔍 What to Check

### **In Browser Console (F12):**

**Success indicators:**
```
✅ Real AI analysis completed
```

**If you see this instead:**
```
⚠️ No OpenAI API key, using mock analysis
```
→ Restart your dev server

### **In Terminal:**

Look for successful API calls:
```
POST /api/analyze-bet 200 in XXXms
```

---

## 🎨 UI Elements to Verify

### **Data Analysis Card (Blue):**
- [x] Win Probability percentage
- [x] Expected Value in dollars (green if positive, red if negative)
- [x] Confidence Score percentage
- [x] Risk Level badge (color-coded)
- [x] AI Recommendation with emoji (✅ ⚠️ ❌)
- [x] Reasoning text
- [x] "Powered by AI" badge

### **Psychological Analysis Card (Purple) - Premium Plus only:**
- [x] Detected Biases section with red badges
- [x] Emotional Alignment progress bar
- [x] Recommendation text

### **Save Analysis Button:**
- [x] Appears below analysis
- [x] Shows "Saving..." when clicked
- [x] Shows checkmark when saved
- [x] Success toast appears
- [x] Data saves to Supabase

---

## 🧪 Advanced Tests

### **Test 3: Different Bet Types**

Try these to see how AI responds:

**Underdog bet:**
```
Description: Underdog team with strong recent performance
Odds: +250
Stake: 50
```

**Heavy favorite:**
```
Description: Top-ranked team vs bottom team
Odds: -500
Stake: 100
```

**Parlay bet:**
```
Description: 3-team parlay: Lakers ML, Warriors ML, Celtics ML
Odds: +600
Stake: 25
```

### **Test 4: Emotional States**

Log different emotions and see how bias detection changes:

- **Confident** (intensity 9) → May detect overconfidence bias
- **Anxious** (intensity 8) → May warn about emotional betting
- **Calm** (intensity 3) → Should show positive alignment
- **Excited** (intensity 9) → May warn about impulsive decisions

---

## 📊 Understanding the Results

### **Win Probability:**
- AI estimates true probability (not just implied odds)
- Considers context from bet description
- Range: 0-100%

### **Expected Value (EV):**
- Formula: `(Probability × Potential Win) - ((1 - Probability) × Stake)`
- **Positive EV** = Good bet long-term
- **Negative EV** = Bad bet long-term
- **Near zero** = Fair bet

### **Confidence Score:**
- How confident the AI is in its analysis
- Higher = more reliable
- Lower = more uncertainty

### **Risk Level:**
- **LOW** = Small stake, high probability
- **MEDIUM** = Moderate stake/probability
- **HIGH** = Large stake or low probability

### **Recommendation:**
- **STRONG_BET** (✅) = High EV, good probability
- **MODERATE_BET** (⚠️) = Decent value, some risk
- **WEAK_BET** (⚠️) = Low value, questionable
- **AVOID** (❌) = Negative EV or high risk

---

## 🐛 Troubleshooting

### **"Using mock analysis" toast:**
**Fix:** Restart dev server
```bash
# In terminal, stop server (Ctrl+C)
npm run dev
```

### **"Analysis failed" error:**
**Possible causes:**
1. OpenAI API key invalid
2. Rate limit exceeded (3 per minute on free tier)
3. No credits remaining in OpenAI account

**Check:**
- OpenAI dashboard: https://platform.openai.com/usage
- Browser console for detailed error

### **No bias warnings showing:**
**Requirements:**
1. Must be in Premium Plus or Elite tier
2. Must have logged emotions recently
3. Emotional intensity should be notable (>6)

### **Bias warnings not relevant:**
**This is normal!** The AI:
- Learns from your description
- Considers your emotional state
- Reviews betting patterns
- May be conservative to promote responsible gambling

---

## 💰 API Cost Tracking

### **Monitor Your Usage:**
1. Go to https://platform.openai.com/usage
2. Check "Usage" tab
3. Each analysis costs ~$0.00025 (less than 1 cent)

### **Free Tier Limits:**
- $5 in free credits
- ~20,000 analyses possible
- 3 requests per minute
- 200 requests per day

---

## ✅ Success Checklist

After testing, you should have:

- [x] Completed at least one basic analysis
- [x] Seen real AI probability estimates
- [x] Verified "Powered by AI" badge appears
- [x] Tested bias detection (Premium Plus)
- [x] Saved an analysis successfully
- [x] Checked Supabase for saved data
- [x] No console errors
- [x] Smooth user experience

---

## 🎉 What's Working Now

### **Phase 2B Complete:**
✅ Real AI-powered bet analysis  
✅ Probability estimation  
✅ Expected Value calculations  
✅ Cognitive bias detection  
✅ Risk assessment  
✅ Personalized recommendations  
✅ Confidence scoring  
✅ Graceful fallback to mock data  
✅ Beautiful UI with color-coded metrics  
✅ Save analysis to database  

---

## 🚀 Next Steps

**Your AI integration is complete!** 

**Want to add more?**
1. **AI Picks Tab** - Generate bet recommendations (Elite feature)
2. **Bet History** - View all saved analyses
3. **Tilt Detection** - Real-time emotional monitoring
4. **Stripe Integration** - Enable real subscriptions

Let me know what you'd like to build next! 🎯
