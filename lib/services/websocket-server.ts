/**
 * WebSocket Server for Real-Time Sports Betting Data
 *
 * Provides real-time updates for:
 * - Live game scores and play-by-play
 * - Odds changes across sportsbooks
 * - Line movement tracking
 * - Betting trends updates
 *
 * Uses Socket.IO for bidirectional communication
 *
 * IMPORTANT: This requires a custom Next.js server setup.
 * See server.js in project root for implementation.
 */

import type { Server as HTTPServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import type { WebSocketMessage, LiveGameData, LiveOddsData } from "../types/live-betting"
import type { SupportedSportKey } from "../types"
import { getLiveGames, getLiveOdds, getLineMovement, getBettingTrends } from "./data-aggregator"

let io: SocketIOServer | null = null

// Active subscriptions tracking
const subscriptions = new Map<string, Set<string>>() // clientId -> Set of gameIds

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    path: "/api/socket",
    transports: ["websocket", "polling"],
  })

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`)

    // Send connection success message
    const connectionMessage: WebSocketMessage<{ clientId: string }> = {
      event: "connection",
      data: { clientId: socket.id },
      timestamp: new Date(),
    }
    socket.emit("message", connectionMessage)

    // Handle game subscription
    socket.on("subscribe-game", async (data: { sport: SupportedSportKey; gameId: string }) => {
      const { sport, gameId } = data
      const clientId = socket.id

      // Add to subscriptions
      if (!subscriptions.has(clientId)) {
        subscriptions.set(clientId, new Set())
      }
      subscriptions.get(clientId)?.add(`${sport}:${gameId}`)

      // Join room for this game
      socket.join(`${sport}:${gameId}`)

      console.log(`Client ${clientId} subscribed to ${sport}:${gameId}`)

      // Send initial data
      await sendGameUpdate(socket.id, sport, gameId)
    })

    // Handle game unsubscription
    socket.on("unsubscribe-game", (data: { sport: SupportedSportKey; gameId: string }) => {
      const { sport, gameId } = data
      const clientId = socket.id

      subscriptions.get(clientId)?.delete(`${sport}:${gameId}`)
      socket.leave(`${sport}:${gameId}`)

      console.log(`Client ${clientId} unsubscribed from ${sport}:${gameId}`)
    })

    // Handle sport subscription (all games for a sport)
    socket.on("subscribe-sport", async (data: { sport: SupportedSportKey }) => {
      const { sport } = data
      socket.join(`sport:${sport}`)

      console.log(`Client ${socket.id} subscribed to sport ${sport}`)

      // Send initial data for all live games
      await sendSportUpdate(socket.id, sport)
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`)
      subscriptions.delete(socket.id)
    })
  })

  // Start update loops
  startUpdateLoops()

  return io
}

/**
 * Send game update to specific client
 */
async function sendGameUpdate(clientId: string, sport: SupportedSportKey, gameId: string) {
  if (!io) return

  try {
    // Fetch all data for this game
    const [liveGameRes, liveOddsRes, lineMovementRes, trendsRes] = await Promise.all([
      getLiveGames(sport, gameId),
      getLiveOdds(sport, gameId),
      getLineMovement(sport, gameId),
      getBettingTrends(sport, gameId),
    ])

    // Send live game update
    if (liveGameRes.success && liveGameRes.data.length > 0) {
      const message: WebSocketMessage<LiveGameData> = {
        event: "live-game",
        gameId,
        sport,
        data: liveGameRes.data[0],
        timestamp: new Date(),
      }
      io.to(clientId).emit("live-game", message)
    }

    // Send odds update
    if (liveOddsRes.success && liveOddsRes.data.length > 0) {
      const message: WebSocketMessage<LiveOddsData> = {
        event: "odds-update",
        gameId,
        sport,
        data: liveOddsRes.data[0],
        timestamp: new Date(),
      }
      io.to(clientId).emit("odds-update", message)
    }

    // Send line movement update
    if (lineMovementRes.success) {
      const message: WebSocketMessage<typeof lineMovementRes.data> = {
        event: "line-movement",
        gameId,
        sport,
        data: lineMovementRes.data,
        timestamp: new Date(),
      }
      io.to(clientId).emit("line-movement", message)
    }

    // Send betting trends update
    if (trendsRes.success) {
      const message: WebSocketMessage<typeof trendsRes.data> = {
        event: "betting-trends",
        gameId,
        sport,
        data: trendsRes.data,
        timestamp: new Date(),
      }
      io.to(clientId).emit("betting-trends", message)
    }
  } catch (error) {
    console.error(`Error sending game update for ${sport}:${gameId}:`, error)

    const errorMessage: WebSocketMessage<{ error: string }> = {
      event: "error",
      gameId,
      sport,
      data: { error: "Failed to fetch game data" },
      timestamp: new Date(),
    }
    io.to(clientId).emit("error", errorMessage)
  }
}

/**
 * Send sport update (all games) to specific client
 */
async function sendSportUpdate(clientId: string, sport: SupportedSportKey) {
  if (!io) return

  try {
    const [liveGamesRes, liveOddsRes] = await Promise.all([
      getLiveGames(sport),
      getLiveOdds(sport),
    ])

    if (liveGamesRes.success) {
      io.to(clientId).emit("sport-games", {
        event: "sport-games",
        sport,
        data: liveGamesRes.data,
        timestamp: new Date(),
      })
    }

    if (liveOddsRes.success) {
      io.to(clientId).emit("sport-odds", {
        event: "sport-odds",
        sport,
        data: liveOddsRes.data,
        timestamp: new Date(),
      })
    }
  } catch (error) {
    console.error(`Error sending sport update for ${sport}:`, error)
  }
}

/**
 * Broadcast update to all clients in a room
 */
function broadcastToRoom(room: string, event: string, message: WebSocketMessage<any>) {
  if (!io) return
  io.to(room).emit(event, message)
}

/**
 * Start periodic update loops
 */
function startUpdateLoops() {
  // Live games update loop (every 5 seconds)
  setInterval(async () => {
    if (!io) return

    const rooms = Array.from(io.sockets.adapter.rooms.keys())
    const gameRooms = rooms.filter(room => room.includes(":") && !room.includes("sport:"))

    for (const room of gameRooms) {
      const [sport, gameId] = room.split(":") as [SupportedSportKey, string]

      try {
        const liveGameRes = await getLiveGames(sport, gameId)

        if (liveGameRes.success && liveGameRes.data.length > 0) {
          const message: WebSocketMessage<LiveGameData> = {
            event: "live-game",
            gameId,
            sport,
            data: liveGameRes.data[0],
            timestamp: new Date(),
          }
          broadcastToRoom(room, "live-game", message)
        }
      } catch (error) {
        console.error(`Error in live game update loop for ${room}:`, error)
      }
    }
  }, 5000) // 5 seconds

  // Odds update loop (every 5 seconds)
  setInterval(async () => {
    if (!io) return

    const rooms = Array.from(io.sockets.adapter.rooms.keys())
    const gameRooms = rooms.filter(room => room.includes(":") && !room.includes("sport:"))

    for (const room of gameRooms) {
      const [sport, gameId] = room.split(":") as [SupportedSportKey, string]

      try {
        const liveOddsRes = await getLiveOdds(sport, gameId)

        if (liveOddsRes.success && liveOddsRes.data.length > 0) {
          const message: WebSocketMessage<LiveOddsData> = {
            event: "odds-update",
            gameId,
            sport,
            data: liveOddsRes.data[0],
            timestamp: new Date(),
          }
          broadcastToRoom(room, "odds-update", message)
        }
      } catch (error) {
        console.error(`Error in odds update loop for ${room}:`, error)
      }
    }
  }, 5000) // 5 seconds

  // Betting trends update loop (every 30 seconds)
  setInterval(async () => {
    if (!io) return

    const rooms = Array.from(io.sockets.adapter.rooms.keys())
    const gameRooms = rooms.filter(room => room.includes(":") && !room.includes("sport:"))

    for (const room of gameRooms) {
      const [sport, gameId] = room.split(":") as [SupportedSportKey, string]

      try {
        const trendsRes = await getBettingTrends(sport, gameId)

        if (trendsRes.success) {
          const message: WebSocketMessage<typeof trendsRes.data> = {
            event: "betting-trends",
            gameId,
            sport,
            data: trendsRes.data,
            timestamp: new Date(),
          }
          broadcastToRoom(room, "betting-trends", message)
        }
      } catch (error) {
        console.error(`Error in trends update loop for ${room}:`, error)
      }
    }
  }, 30000) // 30 seconds
}

/**
 * Get WebSocket server instance
 */
export function getIO(): SocketIOServer | null {
  return io
}

/**
 * Cleanup on server shutdown
 */
export function closeWebSocket() {
  if (io) {
    io.close()
    io = null
  }
}
