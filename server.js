/**
 * Custom Next.js Server with Socket.IO WebSocket Support
 *
 * This server enables real-time WebSocket connections for live betting data.
 * It runs alongside Next.js and handles both HTTP requests and WebSocket connections.
 */

const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")

// Load environment variables using Next.js's built-in loader
const { loadEnvConfig } = require("@next/env")
const projectDir = process.cwd()
loadEnvConfig(projectDir)

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME || "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

console.log('ENV PERPLEXITY_API_KEY PRESENT?', !!process.env.PERPLEXITY_API_KEY);
console.log(
  'ENV PERPLEXITY_API_KEY PREFIX:',
  process.env.PERPLEXITY_API_KEY ? process.env.PERPLEXITY_API_KEY.slice(0, 12) : 'none',
);

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling request:", err)
      res.statusCode = 500
      res.end("Internal server error")
    }
  })

  // Initialize WebSocket server
  let io = null

  const initWebSocket = async () => {
    try {
      // Check if socket.io is installed
      require.resolve("socket.io")

      const { Server } = require("socket.io")

      // Create Socket.IO server
      io = new Server(server, {
        cors: {
          origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
        },
        path: "/api/socket",
        transports: ["websocket", "polling"],
      })

      // Active subscriptions tracking
      const subscriptions = new Map()

      // Connection handler
      io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`)

        // Send connection success message
        socket.emit("message", {
          event: "connection",
          data: { clientId: socket.id },
          timestamp: new Date(),
        })

        // Handle game subscription
        socket.on("subscribe-game", async (data) => {
          const { sport, gameId } = data
          const clientId = socket.id

          // Add to subscriptions
          if (!subscriptions.has(clientId)) {
            subscriptions.set(clientId, new Set())
          }
          subscriptions.get(clientId).add(`${sport}:${gameId}`)

          // Join room for this game
          socket.join(`${sport}:${gameId}`)

          console.log(`Client ${clientId} subscribed to ${sport}:${gameId}`)
        })

        // Handle game unsubscription
        socket.on("unsubscribe-game", (data) => {
          const { sport, gameId } = data
          const clientId = socket.id

          subscriptions.get(clientId)?.delete(`${sport}:${gameId}`)
          socket.leave(`${sport}:${gameId}`)

          console.log(`Client ${clientId} unsubscribed from ${sport}:${gameId}`)
        })

        // Handle sport subscription (all games for a sport)
        socket.on("subscribe-sport", (data) => {
          const { sport } = data
          socket.join(`sport:${sport}`)
          console.log(`Client ${socket.id} subscribed to sport ${sport}`)
        })

        // Handle disconnect
        socket.on("disconnect", () => {
          console.log(`Client disconnected: ${socket.id}`)
          subscriptions.delete(socket.id)
        })
      })

      console.log("✅ WebSocket server initialized successfully")
    } catch (error) {
      console.warn("⚠️  WebSocket server not available:", error.message)
      console.warn("   To enable real-time updates, ensure socket.io is installed")
      console.warn("   App will use REST polling fallback")
    }
  }

  // Initialize WebSocket (non-blocking)
  initWebSocket()

  // Start the server
  server.listen(port, (err) => {
    if (err) throw err
    console.log("\n🚀 Server is ready!")
    console.log(`   ➜ Local:    http://${hostname}:${port}`)
    console.log(`   ➜ Network:  http://localhost:${port}`)

    if (io) {
      console.log(`   ➜ WebSocket: ws://${hostname}:${port}/api/socket`)
      console.log("\n📊 Real-time updates enabled via WebSocket")
    } else {
      console.log("\n📡 Using REST API polling (install socket.io for WebSocket)")
    }

    console.log(`\n   Environment: ${dev ? "development" : "production"}`)
    console.log("   Press Ctrl+C to stop\n")
  })

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`)

    if (io) {
      try {
        // Close all WebSocket connections
        io.close()
        console.log("✅ WebSocket connections closed")
      } catch (error) {
        console.warn("⚠️  Error closing WebSocket:", error.message)
      }
    }

    server.close(() => {
      console.log("✅ HTTP server closed")
      process.exit(0)
    })

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error("⚠️  Forced shutdown after timeout")
      process.exit(1)
    }, 10000)
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"))
  process.on("SIGINT", () => shutdown("SIGINT"))
})
