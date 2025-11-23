# 🤖 AI Integration Guide - OpenAI Bet Analysis

## ✅ What's Been Implemented

### **Phase 2B Complete: Real AI-Powered Bet Analysis**

Your app now uses OpenAI's GPT-4o-mini to provide:
- ✅ Real probability estimation
- ✅ Expected Value (EV) calculations  
- ✅ Cognitive bias detection (Premium Plus)
- ✅ Risk assessment
- ✅ Personalized recommendations
- ✅ Confidence scoring

---

## 🔧 Setup Instructions

### **1. Get Your OpenAI API Key**

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-...`)

### **2. Add to Environment Variables**

Open `/home/shaybouchles/serenitypocketredesign/.env.local` and verify:

```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

### **3. Restart Dev Server**

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## 🎯 How It Works

### **Basic Analysis (Premium Tier)**

When a user clicks "Analyze Bet":

1. **Input Collection:**
   - Bet description
   - Odds (American format)
   - Stake amount

2. **AI Processing:**
   - Calculates implied probability from odds
   - Estimates true win probability
   - Computes Expected Value (EV)
   - Assesses risk level
   - Provides recommendation

3. **Output:**
   - Win Probability (0-100%)
   - Expected Value (in $)
   - Confidence Score (0-100%)
   - Risk Level (LOW/MEDIUM/HIGH)
   - Recommendation (STRONG_BET/MODERATE_BET/WEAK_BET/AVOID)

### **Advanced Analysis (Premium Plus Tier)**

Includes everything above PLUS:

4. **Bias Detection:**
   - Analyzes user's emotional state
   - Reviews recent betting history
   - Detects cognitive biases:
     - Recency bias
     - Loss chasing
     - Overconfidence
     - Confirmation bias
     - Emotional betting
     - Gambler's fallacy

5. **Personalized Warnings:**
   - Specific bias warnings
   - Emotional alignment score
   - Behavioral recommendations

---

## 📊 API Usage & Costs

### **OpenAI Pricing (GPT-4o-mini)**
- **Input:** $0.150 per 1M tokens
- **Output:** $0.600 per 1M tokens

### **Estimated Costs Per Analysis:**
- ~500 input tokens + ~300 output tokens
- **Cost per analysis:** ~$0.00025 (less than 1 cent!)
- **100 analyses:** ~$0.025
- **1,000 analyses:** ~$0.25

### **Free Tier:**
OpenAI provides $5 in free credits for new accounts.
- **~20,000 bet analyses** with free credits!

### **Rate Limits (Free Tier):**
- 3 requests per minute
- 200 requests per day

---

## 🧪 Testing the AI Integration

### **Test 1: Basic Analysis (Premium)**

1. Go to **Account** tab → Switch to **Premium** tier
2. Go to **Analyze Bet** tab
3. Enter:
   ```
   Description: Lakers to beat Warriors
   Odds: -110
   Stake: $100
   ```
4. Click **"Analyze Bet"**
5. Should see:
   - Real probability estimate
   - EV calculation
   - Risk assessment
   - "Powered by AI" badge

### **Test 2: Bias Detection (Premium Plus)**

1. Switch to **Premium Plus** tier
2. First, log an emotion (go to My Behavior → Log emotion as "frustrated")
3. Go to **Analyze Bet** tab
4. Enter:
   ```
   Description: Betting on my favorite team after they lost
   Odds: +150
   Stake: $200
   ```
5. Click **"Analyze Bet"**
6. Should see:
   - Bias warnings (e.g., "Emotional betting detected")
   - Emotional alignment score
   - Personalized recommendations

### **Test 3: Fallback to Mock Data**

1. Remove or comment out `OPENAI_API_KEY` in `.env.local`
2. Restart server
3. Try analyzing a bet
4. Should see:
   - Toast notification: "Using mock analysis"
   - Analysis still works (using mathematical calculations)
   - No "Powered by AI" badge

---

## 🎨 UI Features

### **New Display Elements:**

1. **4-Column Metrics:**
   - Win Probability
   - Expected Value (color-coded: green for positive, red for negative)
   - Confidence Score
   - Risk Level (color-coded badge)

2. **AI Recommendation Card:**
   - Visual indicator (✅ ⚠️ ❌)
   - Recommendation level
   - Detailed reasoning
   - "Powered by AI" badge (when using real AI)

3. **Bias Warnings (Premium Plus):**
   - Red badges for each detected bias
   - Emotional alignment progress bar
   - Personalized recommendations

---

## 🔍 How the AI Prompt Works

### **System Prompt:**
```
You are an expert sports betting analyst with a focus on 
responsible gambling and behavioral psychology.

Your role is to:
1. Analyze bets objectively based on odds and probability
2. Calculate expected value (EV)
3. Detect cognitive biases in betting decisions
4. Consider the bettor's emotional state
5. Provide clear, actionable recommendations
```

### **User Prompt Includes:**
- Bet description
- Odds (with implied probability calculation)
- Stake amount
- User's emotional state (if Premium Plus)
- Recent betting history (if Premium Plus)
- Specific bias detection instructions (if Premium Plus)

### **AI Response Format (JSON):**
```json
{
  "recommendation": "STRONG_BET" | "MODERATE_BET" | "WEAK_BET" | "AVOID",
  "probability": 65,
  "expectedValue": 5.20,
  "reasoning": "Detailed 2-3 sentence explanation",
  "biasWarnings": ["Recency bias detected", "High emotional intensity"],
  "confidenceScore": 78,
  "riskLevel": "MEDIUM"
}
```

---

## 🚀 Next Steps: AI Picks (Elite Feature)

The foundation is ready for **AI Picks** generation. Here's what's included:

### **`generateAIPicks()` Function**

Located in `/lib/ai-analysis.ts`, this function:
- Takes live odds data
- User's emotional stability score
- Risk tolerance preference
- Generates top 3 bet recommendations

### **To Implement AI Picks Tab:**

1. Create `/components/tabs/ai-picks-tab.tsx`
2. Fetch live odds using `fetchLiveOdds()`
3. Calculate user's emotional score from recent logs
4. Call `generateAIPicks(liveOdds, emotionalScore, riskTolerance)`
5. Display picks with:
   - Confidence scores
   - Expected value
   - Reasoning
   - Emotional alignment
   - Risk level

### **AI Picks Features:**
- Only shows picks when user is emotionally stable (score > 70)
- Prioritizes positive EV bets
- Matches user's risk tolerance
- Provides detailed reasoning
- Tracks emotional alignment

---

## 📈 Performance Optimization

### **Current Implementation:**
- ✅ Server-side API route (keeps API key secure)
- ✅ Graceful fallback to mock data
- ✅ Error handling with user-friendly messages
- ✅ JSON response format for reliability

### **Future Optimizations:**
- [ ] Cache recent analyses (same bet = same result for 5 minutes)
- [ ] Batch multiple analyses in one API call
- [ ] Use streaming for real-time analysis updates
- [ ] Add retry logic for failed API calls

---

## 🐛 Troubleshooting

### **"Using mock analysis" toast appears:**
- ✅ Check `.env.local` has `OPENAI_API_KEY=sk-...`
- ✅ Restart dev server after adding key
- ✅ Verify no typos in the key

### **"Analysis failed" error:**
- Check browser console for details
- Verify OpenAI API key is valid
- Check if you've exceeded rate limits
- Ensure you have credits in OpenAI account

### **Bias warnings not showing:**
- Verify user is in **Premium Plus** or **Elite** tier
- Check that emotional state is logged (go to My Behavior tab)
- Ensure `includeBiasDetection` is true in API call

### **Expected Value seems wrong:**
- EV calculation: `(Probability × Potential Win) - ((1 - Probability) × Stake)`
- Negative EV means bet is not profitable long-term
- Positive EV means bet has value

---

## 💡 Tips for Best Results

### **For Users:**
1. **Be specific in bet descriptions** - More context = better analysis
2. **Log emotions regularly** - Improves bias detection
3. **Review bias warnings** - They're personalized to your patterns
4. **Check confidence scores** - Higher confidence = more reliable analysis

### **For Development:**
1. **Test with various bet types** - Favorites vs underdogs
2. **Test emotional states** - Happy, frustrated, confident, etc.
3. **Monitor API costs** - Check OpenAI dashboard
4. **Review AI responses** - Ensure quality and relevance

---

## 📚 Files Modified/Created

### **New Files:**
- ✅ `/lib/ai-analysis.ts` - AI analysis service
- ✅ `/app/api/analyze-bet/route.ts` - API endpoint
- ✅ `/AI_INTEGRATION_GUIDE.md` - This guide

### **Modified Files:**
- ✅ `/components/tabs/analyze-bet-tab.tsx` - Updated to use real AI
- ✅ `package.json` - Added `openai` dependency

---

## 🎉 Success Metrics

Track these to measure AI integration success:

- **Analysis accuracy** - User feedback on recommendations
- **Bias detection rate** - % of analyses with bias warnings
- **User engagement** - Analyses per user per week
- **Conversion rate** - Free → Premium Plus (for bias detection)
- **API costs** - Stay under budget
- **Response time** - Keep under 3 seconds

---

## 🔐 Security Notes

✅ **API key is secure:**
- Stored in `.env.local` (not committed to git)
- Only accessible server-side
- Never exposed to client

✅ **User data privacy:**
- Emotional states only sent if user has Premium Plus
- No personal identifying information sent to OpenAI
- Betting history limited to last 5 bets

---

## 🎯 What's Next?

You've completed **Phase 2B: AI Integration**! 

**Next recommended phases:**

1. **AI Picks Tab** (Elite feature) - 2-3 days
2. **Bet History View** - Show saved analyses - 1 day
3. **Stripe Integration** - Enable real payments - 1 week

**Want to continue?** Let me know which feature to build next! 🚀
