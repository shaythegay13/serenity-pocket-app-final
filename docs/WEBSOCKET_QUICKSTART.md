# WebSocket Server Quick Start Guide

## ✅ WebSocket Server Setup Complete!

Your custom Next.js server with Socket.IO WebSocket support is now configured and ready to use.

## What Was Set Up

### 1. Custom Server File
- **File**: [server.js](server.js)
- **Purpose**: Runs Next.js with integrated Socket.IO WebSocket server
- **Features**:
  - Real-time bidirectional communication
  - Room-based subscriptions (game-specific or sport-wide)
  - Automatic fallback to REST polling if WebSocket unavailable
  - Graceful shutdown handling

### 2. Updated Package.json Scripts
- `npm run dev` → Uses custom server with WebSocket support
- `npm run dev:next` → Fallback to standard Next.js server (no WebSocket)
- `npm start` → Production server with WebSocket
- `npm run start:next` → Production Next.js server (no WebSocket)

### 3. Dependencies
Socket.IO is already installed in your project:
- `socket.io` v4.8.1 (server)
- `socket.io-client` v4.8.1 (client)

## How to Start the Server

### Development Mode

```bash
npm run dev
```

You should see output like:

```
🚀 Server is ready!
   ➜ Local:    http://localhost:3000
   ➜ Network:  http://localhost:3000
   ➜ WebSocket: ws://localhost:3000/api/socket

📊 Real-time updates enabled via WebSocket

   Environment: development
   Press Ctrl+C to stop
```

### Production Mode

```bash
npm run build
npm start
```

## Testing WebSocket Connection

### 1. Using the Live Betting Dashboard

Navigate to: `http://localhost:3000/live-betting`

You should see:
- **Green "LIVE" indicator** on components if WebSocket is connected
- **Gray "POLLING" indicator** if using REST fallback
- Real-time updates without page refresh

### 2. Using Browser Console

Open browser DevTools (F12) and run:

```javascript
// Connect to WebSocket
const socket = io("http://localhost:3000", {
  path: "/api/socket",
  transports: ["websocket", "polling"]
})

// Listen for connection
socket.on("connect", () => {
  console.log("✅ Connected:", socket.id)
})

// Subscribe to a game
socket.emit("subscribe-game", {
  sport: "nfl",
  gameId: "game-123"
})

// Listen for live game updates
socket.on("live-game", (message) => {
  console.log("📊 Live game update:", message)
})

// Listen for odds updates
socket.on("odds-update", (message) => {
  console.log("💰 Odds update:", message)
})
```

## WebSocket Events Reference

### Client → Server Events

| Event | Data | Description |
|-------|------|-------------|
| `subscribe-game` | `{ sport: string, gameId: string }` | Subscribe to specific game updates |
| `unsubscribe-game` | `{ sport: string, gameId: string }` | Unsubscribe from game |
| `subscribe-sport` | `{ sport: string }` | Subscribe to all games for a sport |

### Server → Client Events

| Event | Data | Description |
|-------|------|-------------|
| `connection` | `{ clientId: string }` | Connection established |
| `live-game` | `LiveGameData` | Real-time game score update |
| `odds-update` | `LiveOddsData` | Live odds change |
| `line-movement` | `LineMovementData` | Line movement detected |
| `betting-trends` | `BettingTrendsData` | Betting trends update |
| `error` | `{ error: string }` | Error occurred |

## Environment Variables

Create a `.env.local` file (or copy from [.env.example](.env.example)):

```env
# Required: At least one data provider API key
ODDS_API_KEY=your_api_key_here

# Optional: App configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000
```

### Getting API Keys

**The Odds API** (Recommended - Free Tier Available)
1. Visit: https://the-odds-api.com
2. Sign up for free account
3. Get API key from dashboard
4. Free tier: 500 requests/month
5. Add to `.env.local`: `ODDS_API_KEY=your_key_here`

## Troubleshooting

### WebSocket Not Connecting

**Symptom**: Components show "POLLING" instead of "LIVE"

**Solutions**:
1. Verify server is running with `node server.js`
2. Check console for errors
3. Ensure port 3000 is not blocked
4. Try accessing: `http://localhost:3000/api/socket`
5. Check browser console for connection errors

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Find process using port 3000
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :3000

# Kill the process or change port in .env.local
PORT=3001
```

### Dependencies Not Found

**Error**: `Cannot find module 'socket.io'`

**Solution**:
```bash
npm install socket.io socket.io-client
```

### TypeScript Errors in Server.js

The server.js file is plain JavaScript and doesn't require TypeScript compilation. If you see TypeScript errors, they can be ignored or you can add `// @ts-nocheck` at the top of server.js.

## Performance Tips

### 1. Connection Pooling
The server automatically manages connections. Each client maintains one WebSocket connection and subscribes to multiple game rooms.

### 2. Rate Limiting
WebSocket updates follow these intervals:
- Live games: 5 seconds
- Odds: 5 seconds
- Line movement: 15 seconds
- Trends: 30 seconds

### 3. Memory Management
Subscriptions are automatically cleaned up when clients disconnect.

## Fallback to REST Polling

If WebSocket is unavailable, all components **automatically fall back** to REST API polling:

- Client hooks detect connection failure
- Switch to polling after 5 seconds
- Poll intervals: 10-30 seconds (configurable)
- No code changes required

## Next Steps

1. ✅ Start the server: `npm run dev`
2. ✅ Get API key from The Odds API
3. ✅ Add API key to `.env.local`
4. ✅ Navigate to `/live-betting` page
5. ✅ See real-time updates in action!

## Advanced Configuration

### Custom Update Intervals

Edit `server.js` to change broadcast intervals:

```javascript
// Example: Update live games every 3 seconds instead of 5
setInterval(async () => {
  // ... broadcast logic
}, 3000) // Changed from 5000
```

### Custom CORS Settings

Edit `server.js` CORS configuration:

```javascript
io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://yourdomain.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
  path: "/api/socket",
})
```

### Production Deployment

For production deployment (Vercel, Heroku, etc.):

1. **Vercel**: WebSocket requires custom serverless functions
   - Consider using Vercel's Edge Functions
   - Or deploy WebSocket server separately (Railway, Render)

2. **Railway/Render**: Works out of the box
   - Set environment variables in dashboard
   - Deploy with: `npm start`

3. **Docker**:
   ```dockerfile
   FROM node:18
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   CMD ["npm", "start"]
   ```

## Support

For issues or questions:
- Review: [LIVE_BETTING_SETUP.md](LIVE_BETTING_SETUP.md)
- Check: Socket.IO docs at https://socket.io/docs/
- Debug: Enable verbose logging in browser console

---

**Status**: ✅ WebSocket Server Ready
**Mode**: Development
**Features**: Real-time updates, Room subscriptions, Auto-fallback
