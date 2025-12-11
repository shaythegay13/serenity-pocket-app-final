# How to Use Live Betting Features

## ✨ Your Live Betting Dashboard is Already Integrated!

The advanced live betting components are now **built into your existing Sports Dashboard**. You don't need to visit a separate page - everything is accessible through your current navigation.

## 📍 Where to Find the Features

### Option 1: Through Your Existing Sports Dashboard (Main Access Point)

1. **Navigate to your Sports Dashboard** (wherever it's currently accessible in your app)

2. **Select a sport** using the sport tabs (NFL, NBA, MLB, NHL)

3. **Click any of the 6 feature cards**:
   - 🔴 **Live Scores** → Shows real-time game cards with WebSocket updates
   - 💰 **Upcoming Games & Odds** → Multi-sportsbook odds comparison grid
   - 📊 **Team & Player Analytics** → (Your existing panel - not changed)
   - 📈 **Line Movement** → Historical odds tracking with % change
   - 🎯 **Betting Trends** → Sharp money indicators and public/pro splits
   - ☁️ **Weather Impact** → (Your existing panel - not changed)

4. **The modal popup opens** showing the advanced components for that feature

### Option 2: Standalone Demo Page

Visit: `http://localhost:3000/live-betting`

This is a full-featured demo page showing all components together. It's useful for:
- Testing the complete dashboard layout
- Seeing all features side-by-side
- Development and debugging

## 🎯 What Each Feature Shows

### 🔴 Live Scores
- **Real-time game scores** updated every 5 seconds via WebSocket
- Current quarter/period and game clock
- Last play description
- Team logos and venue info
- Weather conditions (if available)
- **Connection indicator**: Green "LIVE" = WebSocket | Gray "POLLING" = REST fallback

### 💰 Upcoming Games & Odds
- **Multi-sportsbook comparison table** showing odds from 5+ bookmakers
- **Best odds highlighted** with trophy icon
- Tabbed interface: Moneyline / Spread / Total
- Implied probability calculations
- **Best Available Odds** summary card
- Auto-refresh every 5 seconds

### 📈 Line Movement
- **Opening vs Current odds** comparison
- Percentage change indicators (green = moved in your favor, red = against)
- Historical movement timeline showing when each bookmaker updated
- **Significant Movement Alerts** when line moves >5%
- Insights about sharp money action

### 🎯 Betting Trends
- **Sharp Money Indicators** with confidence levels:
  - 🔴 **Extreme** - Very strong sharp action
  - 🟠 **High** - Notable sharp divergence
  - 🟡 **Medium** - Some sharp interest
  - ⚪ **Low** - Minimal sharp activity
- **Public vs Sharp Money splits** with visual bar charts
- **Reverse Line Movement (RLM)** detection
- **Steam Move Alerts** for rapid line changes
- Market consensus picks

## 🚀 Quick Start

### 1. Start the Server

```bash
npm run dev
```

You should see:
```
🚀 Server is ready!
   ➜ Local:    http://localhost:3000
   ➜ WebSocket: ws://localhost:3000/api/socket
📊 Real-time updates enabled via WebSocket
```

### 2. Get an API Key (Optional - for real data)

**Free Option**: The Odds API
- Visit: https://the-odds-api.com
- Sign up for free account
- Get API key (500 requests/month free)
- Add to `.env.local`:
  ```env
  ODDS_API_KEY=your_key_here
  ```

**Without API Key**: Components will show placeholder/mock data

### 3. Navigate to Your Sports Dashboard

Click on any sport (NFL/NBA/MLB/NHL), then click any feature card to see the advanced components.

## 🎨 What's Different Now?

### Before (Basic Panels)
- Simple list of upcoming games
- Basic odds display
- Static content

### After (Enhanced Panels)
- ✅ **Real-time WebSocket updates** (or automatic REST fallback)
- ✅ **Multi-sportsbook comparison** with best odds highlighted
- ✅ **Line movement tracking** with historical data
- ✅ **Sharp money detection** and trend analysis
- ✅ **Professional-grade analytics** (RLM, steam moves, value bets)
- ✅ **Live connection indicators** showing WebSocket vs polling
- ✅ **Auto-refresh** every 5-30 seconds depending on data type

## 🔧 Features Breakdown

### Real-Time Updates
| Feature | Update Frequency | Method |
|---------|-----------------|---------|
| Live Scores | 5 seconds | WebSocket → REST fallback |
| Odds | 5 seconds | WebSocket → REST fallback |
| Line Movement | 15 seconds | REST API |
| Betting Trends | 30 seconds | REST API |

### Connection Status
- **Green "LIVE"** = WebSocket connected (fastest updates)
- **Gray "POLLING"** = REST API polling (still works great!)
- Components automatically handle failover

## 📊 Example Workflow

1. **Check Live Scores**:
   - Click "Live Scores" card
   - See real-time scores updating every 5 seconds
   - Watch the clock count down

2. **Compare Odds**:
   - Click "Upcoming Games & Odds"
   - Switch between Moneyline/Spread/Total tabs
   - Trophy icon shows best odds across all books

3. **Analyze Line Movement**:
   - Click "Line Movement"
   - See opening vs current odds
   - Green = line moved in bettor's favor
   - Alerts show significant movements

4. **Find Sharp Money**:
   - Click "Betting Trends"
   - Look for "Extreme" or "High" confidence indicators
   - Check for "RLM Detected" badges
   - See public vs sharp money splits

## 🎯 Pro Tips

### Finding Value
1. Check **Betting Trends** for sharp money indicators
2. Look for **Reverse Line Movement** (RLM) - strongest indicator
3. Compare **Best Odds** across books to maximize value
4. Monitor **Line Movement** for significant changes

### Using Multiple Features Together
1. **Line Movement** + **Betting Trends** = See where sharp money is moving the line
2. **Odds Grid** + **Line Movement** = Find the best book before line moves
3. **Live Scores** + **Odds** = Live betting during games

## 🆘 Troubleshooting

### Components Show "No Data Available"
- **Solution**: Add API key to `.env.local` or wait for games to be available
- Components work best during actual game days

### WebSocket Not Connecting (Shows "POLLING")
- **Solution**: This is normal! REST polling works perfectly fine
- To enable WebSocket: Ensure server started with `npm run dev` (not `npm run dev:next`)

### Page Not Found
- **Main Dashboard**: Should be accessible through your existing navigation
- **Demo Page**: Make sure you're visiting `http://localhost:3000/live-betting`

## 🚀 Next Steps

1. ✅ Start the server: `npm run dev`
2. ✅ Navigate to your Sports Dashboard
3. ✅ Click any feature card (Live Scores, Odds, Line Movement, etc.)
4. ✅ See real-time updates in action!
5. 🎯 Optional: Add API key for real data

## 📚 Additional Resources

- **Setup Guide**: [LIVE_BETTING_SETUP.md](LIVE_BETTING_SETUP.md)
- **WebSocket Guide**: [WEBSOCKET_QUICKSTART.md](WEBSOCKET_QUICKSTART.md)
- **Environment Setup**: [.env.example](.env.example)

---

**Ready to use!** The live betting features are fully integrated into your existing dashboard. Just click on any feature card to see them in action! 🎉
