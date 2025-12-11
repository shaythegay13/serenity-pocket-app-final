/**
 * WebSocket Client Hook
 *
 * React hook for real-time sports betting data subscriptions
 * Automatically falls back to REST polling if WebSocket unavailable
 */

"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import type {
  LiveGameData,
  LiveOddsData,
  LineMovementData,
  BettingTrendsData,
  WebSocketMessage,
} from "../types/live-betting"
import type { SupportedSportKey } from "../types"

interface WebSocketConfig {
  enabled: boolean
  fallbackPollingInterval: number // milliseconds
  reconnectAttempts: number
}

const DEFAULT_CONFIG: WebSocketConfig = {
  enabled: true,
  fallbackPollingInterval: 10000, // 10 seconds
  reconnectAttempts: 5,
}

/**
 * Hook for live game data with real-time updates
 */
export function useLiveGame(
  sport: SupportedSportKey,
  gameId: string,
  config: Partial<WebSocketConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const [data, setData] = useState<LiveGameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!finalConfig.enabled || socketRef.current?.connected) return

    const socket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnectionAttempts: finalConfig.reconnectAttempts,
    })

    socket.on("connect", () => {
      console.log("WebSocket connected")
      setIsConnected(true)
      setError(null)

      // Subscribe to game updates
      socket.emit("subscribe-game", { sport, gameId })
    })

    socket.on("live-game", (message: WebSocketMessage<LiveGameData>) => {
      if (message.gameId === gameId) {
        setData(message.data)
        setLastUpdate(new Date(message.timestamp))
        setLoading(false)
      }
    })

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected")
      setIsConnected(false)
    })

    socket.on("error", (message: WebSocketMessage<{ error: string }>) => {
      console.error("WebSocket error:", message.data.error)
      setError(message.data.error)
    })

    socketRef.current = socket
  }, [sport, gameId, finalConfig.enabled, finalConfig.reconnectAttempts])

  // REST polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return

    const poll = async () => {
      try {
        const response = await fetch(`/api/live-games?sport=${sport}&gameId=${gameId}`)
        const result = await response.json()

        if (result.success && result.data.length > 0) {
          setData(result.data[0])
          setLastUpdate(new Date())
          setError(null)
        }
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch game data")
        setLoading(false)
      }
    }

    poll() // Initial fetch
    pollingIntervalRef.current = setInterval(poll, finalConfig.fallbackPollingInterval)
  }, [sport, gameId, finalConfig.fallbackPollingInterval])

  useEffect(() => {
    if (finalConfig.enabled) {
      connectWebSocket()

      // Start polling as fallback after 5 seconds if not connected
      const fallbackTimeout = setTimeout(() => {
        if (!socketRef.current?.connected) {
          console.log("WebSocket not connected, falling back to polling")
          startPolling()
        }
      }, 5000)

      return () => {
        clearTimeout(fallbackTimeout)
        if (socketRef.current) {
          socketRef.current.emit("unsubscribe-game", { sport, gameId })
          socketRef.current.disconnect()
        }
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    } else {
      startPolling()

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
  }, [sport, gameId, finalConfig.enabled, connectWebSocket, startPolling])

  return { data, loading, error, isConnected, lastUpdate }
}

/**
 * Hook for live odds data with real-time updates
 */
export function useLiveOdds(
  sport: SupportedSportKey,
  gameId: string,
  config: Partial<WebSocketConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const [data, setData] = useState<LiveOddsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const connectWebSocket = useCallback(() => {
    if (!finalConfig.enabled || socketRef.current?.connected) return

    const socket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnectionAttempts: finalConfig.reconnectAttempts,
    })

    socket.on("connect", () => {
      setIsConnected(true)
      socket.emit("subscribe-game", { sport, gameId })
    })

    socket.on("odds-update", (message: WebSocketMessage<LiveOddsData>) => {
      if (message.gameId === gameId) {
        setData(message.data)
        setLastUpdate(new Date(message.timestamp))
        setLoading(false)
      }
    })

    socket.on("disconnect", () => setIsConnected(false))
    socket.on("error", (message: WebSocketMessage<{ error: string }>) => {
      setError(message.data.error)
    })

    socketRef.current = socket
  }, [sport, gameId, finalConfig.enabled, finalConfig.reconnectAttempts])

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return

    const poll = async () => {
      try {
        const response = await fetch(`/api/live-odds?sport=${sport}&gameId=${gameId}`)
        const result = await response.json()

        if (result.success && result.data.length > 0) {
          setData(result.data[0])
          setLastUpdate(new Date())
          setError(null)
        }
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch odds data")
        setLoading(false)
      }
    }

    poll()
    pollingIntervalRef.current = setInterval(poll, finalConfig.fallbackPollingInterval)
  }, [sport, gameId, finalConfig.fallbackPollingInterval])

  useEffect(() => {
    if (finalConfig.enabled) {
      connectWebSocket()

      const fallbackTimeout = setTimeout(() => {
        if (!socketRef.current?.connected) {
          startPolling()
        }
      }, 5000)

      return () => {
        clearTimeout(fallbackTimeout)
        if (socketRef.current) {
          socketRef.current.emit("unsubscribe-game", { sport, gameId })
          socketRef.current.disconnect()
        }
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    } else {
      startPolling()

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
  }, [sport, gameId, finalConfig.enabled, connectWebSocket, startPolling])

  return { data, loading, error, isConnected, lastUpdate }
}

/**
 * Hook for betting trends with real-time updates
 */
export function useBettingTrends(
  sport: SupportedSportKey,
  gameId: string,
  config: Partial<WebSocketConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config, fallbackPollingInterval: 30000 } // 30s for trends
  const [data, setData] = useState<BettingTrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return

    const poll = async () => {
      try {
        const response = await fetch(`/api/betting-trends?sport=${sport}&gameId=${gameId}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
          setLastUpdate(new Date())
          setError(null)
        }
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch trends data")
        setLoading(false)
      }
    }

    poll()
    pollingIntervalRef.current = setInterval(poll, finalConfig.fallbackPollingInterval)
  }, [sport, gameId, finalConfig.fallbackPollingInterval])

  useEffect(() => {
    startPolling()

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [startPolling])

  return { data, loading, error, lastUpdate }
}
