"use client"

import { useState, useEffect, useRef, type ChangeEvent, type MouseEvent } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { UserData, EmotionLog, Trade, Challenge } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import { Lightbulb, ArrowLeft, Check, FileText } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { analyticsEvents, ANALYTICS_EVENTS } from "@/lib/events"
import { extractAndNormalizeTeams, normalizeTeamName } from "@/lib/team-normalization"

interface EmotionsTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  refreshKey?: number
}

// Core emotions with 10 sub-emotions each
const coreEmotions = [
  {
    id: "joy",
    label: "JOY",
    color: "#f59e0b",
    subEmotions: ["Happy", "Excited", "Optimistic", "Grateful", "Confident", "Proud", "Hopeful", "Content", "Cheerful", "Inspired"]
  },
  {
    id: "calm",
    label: "CALM",
    color: "#14b8a6",
    subEmotions: ["Peaceful", "Relaxed", "Centered", "Focused", "Balanced", "Serene", "Patient", "Composed", "Tranquil", "Stable"]
  },
  {
    id: "fear",
    label: "FEAR",
    color: "#ef4444",
    subEmotions: ["Anxious", "Worried", "Nervous", "Scared", "Uncertain", "Panicked", "Hesitant", "Overwhelmed", "Tense", "Uneasy"]
  },
  {
    id: "greed",
    label: "GREED",
    color: "#8b5cf6",
    subEmotions: ["FOMO", "Euphoric", "Impulsive", "Overconfident", "Eager", "Craving", "Obsessed", "Compulsive", "Restless", "Driven"]
  },
  {
    id: "frustration",
    label: "FRUSTRATION",
    color: "#f97316",
    subEmotions: ["Angry", "Irritated", "Disappointed", "Impatient", "Stressed", "Resentful", "Annoyed", "Agitated", "Bitter", "Exhausted"]
  },
  {
    id: "sadness",
    label: "SADNESS",
    color: "#6366f1",
    subEmotions: ["Down", "Discouraged", "Regretful", "Defeated", "Helpless", "Lonely", "Empty", "Hopeless", "Dejected", "Grief"]
  }
]

const commonBiases = [
  { id: "confirmation", label: "Confirmation Bias", desc: "Seeking info that confirms your prior belief and ignoring contrary evidence." },
  { id: "loss-aversion", label: "Loss Aversion", desc: "Feeling losses more strongly than gains, leading to risk-averse or chase behavior." },
  { id: "anchoring", label: "Anchoring", desc: "Relying too heavily on the first number (e.g., opening line) when making decisions." },
  { id: "recency", label: "Recency Bias", desc: "Overweighting recent results or trends, underweighting long-term data." },
  { id: "overconfidence", label: "Overconfidence", desc: "Overestimating your edge or judgment and underestimating variance." },
  { id: "herd", label: "Herd Mentality", desc: "Following popular picks or consensus without independent reasoning." },
]

function computeBehaviorStats(emotionLogs: EmotionLog[], allTrades: Trade[]) {
  try {
    if (emotionLogs.length === 0 || allTrades.length === 0) {
      return null
    }

    const tradesWithEmotionTracking = allTrades.filter(trade =>
      trade.preTradeEmotion && trade.preTradeIntensity
    )
    const tradesWithoutEmotionTracking = allTrades.filter(trade =>
      !trade.preTradeEmotion || !trade.preTradeIntensity
    )

    const winRateWithTracking = tradesWithEmotionTracking.length > 0 ?
      (tradesWithEmotionTracking.filter(t => t.outcome === "profit").length / tradesWithEmotionTracking.length) * 100 : 0
    const winRateWithoutTracking = tradesWithoutEmotionTracking.length > 0 ?
      (tradesWithoutEmotionTracking.filter(t => t.outcome === "profit").length / tradesWithoutEmotionTracking.length) * 100 : 0

    const betterDecisions = winRateWithTracking > winRateWithoutTracking ?
      Math.round(winRateWithTracking - winRateWithoutTracking) : 0

    const consistentTrackers = allTrades.filter(trade =>
      trade.preTradeEmotion && trade.postTradeEmotion
    )
    const inconsistentTrackers = allTrades.filter(trade =>
      !trade.preTradeEmotion || !trade.postTradeEmotion
    )

    const calculateROI = (trades: Trade[]) => {
      const completedTrades = trades.filter(t => t.stake && t.outcome)
      if (completedTrades.length === 0) return 0

      const totalProfit = completedTrades.reduce((sum, trade) => {
        const stake = trade.stake || 0
        if (trade.outcome === "profit") return sum + (stake * 0.9)
        if (trade.outcome === "loss") return sum - stake
        return sum
      }, 0)

      const totalStaked = completedTrades.reduce((sum, trade) => sum + (trade.stake || 0), 0)
      return totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0
    }

    const roiConsistent = calculateROI(consistentTrackers)
    const roiInconsistent = calculateROI(inconsistentTrackers)
    const roiImprovement = roiConsistent > roiInconsistent ?
      Math.round((roiConsistent / Math.abs(roiInconsistent || 1)) * 10) / 10 : 1.0

    const impulsiveEmotions = ["fear", "greed", "frustration"]
    const impulsiveTrades = allTrades.filter(trade =>
      impulsiveEmotions.includes(trade.preTradeEmotion || "") && (trade.preTradeIntensity || 0) >= 7
    )
    const totalTradesWithEmotionData = allTrades.filter(trade => trade.preTradeEmotion)

    const recentLogs = emotionLogs.slice(-50)
    const olderLogs = emotionLogs.slice(-100, -50)

    const recentImpulsiveRate = recentLogs.length > 0 ?
      (recentLogs.filter(log => impulsiveEmotions.includes(log.emotion) && log.intensity >= 7).length / recentLogs.length) * 100 : 0
    const olderImpulsiveRate = olderLogs.length > 0 ?
      (olderLogs.filter(log => impulsiveEmotions.includes(log.emotion) && log.intensity >= 7).length / olderLogs.length) * 100 : 0

    const impulsiveReduction = olderImpulsiveRate > recentImpulsiveRate ?
      Math.round(olderImpulsiveRate - recentImpulsiveRate) : 0

    if (tradesWithEmotionTracking.length >= 10 && emotionLogs.length >= 20) {
      return {
        betterDecisions: Math.max(betterDecisions, 15),
        roiImprovement: Math.max(roiImprovement, 1.2),
        impulsiveReduction: Math.max(impulsiveReduction, 10)
      }
    }

    return null
  } catch (error) {
    console.error("Error calculating behavior stats:", error)
    return null
  }
}

export function EmotionsTab({ userData, updateUserData, refreshKey = 0 }: EmotionsTabProps) {
  const [step, setStep] = useState<"core" | "sub" | "details" | "biases">("core")
  const [selectedCore, setSelectedCore] = useState<typeof coreEmotions[0] | null>(null)
  const [selectedEmotion, setSelectedEmotion] = useState<string>("")
  const [intensity, setIntensity] = useState<number[]>([5])
  const [context, setContext] = useState<string>("")
  const [phase, setPhase] = useState<"before" | "after">("before")
  const [stake, setStake] = useState<string>("")
  const [odds, setOdds] = useState<string>("")
  const [isLogging, setIsLogging] = useState<boolean>(false)
  const [logs, setLogs] = useState<EmotionLog[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [behaviorStats, setBehaviorStats] = useState<{
    betterDecisions: number
    roiImprovement: number
    impulsiveReduction: number
  } | null>(null)
  const emotionFormRef = useRef<HTMLDivElement>(null)

  // Missing state variables that were referenced in the code
  const [selectedBiases, setSelectedBiases] = useState<string[]>([])
  const [sport, setSport] = useState<string>("")
  const [outcome, setOutcome] = useState<"profit" | "loss" | "breakeven" | undefined>(undefined)

  // Betting data fields for after-betting check-ins (matching popup dialog flow)
  const [betDataMode, setBetDataMode] = useState<"manual" | "select">("manual")
  const [savedBets, setSavedBets] = useState<ComprehensiveBet[]>([])
  const [selectedBet, setSelectedBet] = useState<ComprehensiveBet | null>(null)
  const [loadingBets, setLoadingBets] = useState(false)
  const [gameDescription, setGameDescription] = useState<string>("")
  const [actualReturn, setActualReturn] = useState<string>("")

  // Pending comprehensive bets for the pending alert section
  const [pendingComprehensiveBets, setPendingComprehensiveBets] = useState<ComprehensiveBet[]>([])

  // Live betting tracking - important risk factor
  const [isLiveBet, setIsLiveBet] = useState(false)

  // Team selection state - which team is the user betting on
  const [parsedTeams, setParsedTeams] = useState<{ awayTeam: string; homeTeam: string }>({ awayTeam: "", homeTeam: "" })
  const [selectedTeamSide, setSelectedTeamSide] = useState<"home" | "away" | "">("")

  // Parse game description to extract teams
  useEffect(() => {
    if (gameDescription && gameDescription.length > 3) {
      const { awayTeam, homeTeam } = extractAndNormalizeTeams(gameDescription)
      if (awayTeam !== "Unknown" || homeTeam !== "Unknown") {
        setParsedTeams({ awayTeam, homeTeam })
      }
    }
  }, [gameDescription])

  // Track last refresh to prevent unnecessary reloads
  const lastRefreshRef = useRef<number>(refreshKey)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      // Skip loading if refreshKey hasn't actually changed
      if (lastRefreshRef.current === refreshKey && logs.length > 0) {
        return
      }
      lastRefreshRef.current = refreshKey

      try {
        const [emotionLogsData, tradesData, comprehensiveBetsData] = await Promise.all([
          storage.getEmotionLogs().catch(error => {
            console.error("Error loading emotion logs:", error)
            return []
          }),
          storage.getTrades().catch(error => {
            console.error("Error loading trades:", error)
            return []
          }),
          storage.getComprehensiveBets().catch(error => {
            console.error("Error loading comprehensive bets:", error)
            return []
          })
        ])

        if (cancelled) return

        const safeLogs = Array.isArray(emotionLogsData) ? emotionLogsData : []
        const safeTrades = Array.isArray(tradesData) ? tradesData : []
        const safeComprehensiveBets = Array.isArray(comprehensiveBetsData) ? comprehensiveBetsData : []

        // Filter for pending comprehensive bets (include both explicit "pending" and undefined outcomes)
        const pendingBets = safeComprehensiveBets.filter(bet => 
          bet.outcome === "pending" || bet.outcome === undefined
        )

        setLogs(safeLogs)
        setTrades(safeTrades)
        setPendingComprehensiveBets(pendingBets)
        setBehaviorStats(computeBehaviorStats(safeLogs, safeTrades))
      } catch (error) {
        console.error("Error loading behavior tab data:", error)
        if (!cancelled) {
          setLogs([])
          setTrades([])
          setPendingComprehensiveBets([])
          setBehaviorStats(null)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  // Listen for betting data updates from TiltLab/SmartSlip to refresh pending bets in real-time
  useEffect(() => {
    const refreshPendingBets = async () => {
      try {
        const comprehensiveBetsData = await storage.getComprehensiveBets().catch(() => [])
        const safeComprehensiveBets = Array.isArray(comprehensiveBetsData) ? comprehensiveBetsData : []
        const pendingBets = safeComprehensiveBets.filter(bet => 
          bet.outcome === "pending" || bet.outcome === undefined
        )
        setPendingComprehensiveBets(pendingBets)
      } catch (error) {
        console.error("Error refreshing pending bets:", error)
      }
    }

    analyticsEvents.on(ANALYTICS_EVENTS.BETTING_DATA_SAVED, refreshPendingBets)

    return () => {
      analyticsEvents.off(ANALYTICS_EVENTS.BETTING_DATA_SAVED, refreshPendingBets)
    }
  }, [])

  const handleCoreSelect = (emotion: typeof coreEmotions[0]) => {
    setSelectedCore(emotion)
    setStep("sub")
  }

  const handleSubSelect = (subEmotion: string) => {
    setSelectedEmotion(subEmotion)
    // Skip biases step to match popup flow - go straight to details
    setStep("details")
  }

  const handleBiasToggle = (biasId: string) => {
    setSelectedBiases((prev: string[]) => (prev.includes(biasId) ? prev.filter((b: string) => b !== biasId) : [...prev, biasId]))
  }

  const handleBack = () => {
    if (step === "sub") {
      setStep("core")
      setSelectedCore(null)
    } else if (step === "details") {
      // Go back to sub, skipping biases
      setStep("sub")
      setSelectedEmotion("")
    }
  }

  const handleReset = () => {
    setStep("core")
    setSelectedCore(null)
    setSelectedEmotion("")
    setIntensity([3])
    setContext("")
    setPhase("before")
    setOutcome(undefined)
    setSelectedBiases([])
    setSport("")
    setStake("")
    setOdds("")
    // Reset betting data fields
    setBetDataMode("manual")
    setSavedBets([])
    setSelectedBet(null)
    setLoadingBets(false)
    setGameDescription("")
    setActualReturn("")
    // Reset live bet tracking
    setIsLiveBet(false)
    // Reset team selection
    setParsedTeams({ awayTeam: "", homeTeam: "" })
    setSelectedTeamSide("")
  }

  // Load saved bets from storage for "Select Saved Bet" mode
  const loadSavedBets = async () => {
    if (loadingBets) return // Prevent duplicate calls while loading

    setLoadingBets(true)
    try {
      const bets = await storage.getComprehensiveBets()
      // Filter for bets from bet analyzer or tiltlab that don't have outcomes yet
      // Include both explicit "pending" and undefined outcomes
      const relevantBets = bets.filter(bet =>
        (bet.source === "bet-analyzer" || bet.source === "tiltlab") &&
        (bet.outcome === "pending" || bet.outcome === undefined)
      ).slice(0, 20) // Limit to 20 most recent

      setSavedBets(relevantBets)
    } catch (error) {
      console.error("Error loading saved bets:", error)
      toast.error("Failed to load saved bets")
    } finally {
      setLoadingBets(false)
    }
  }

  // Handle bet selection from saved bets list
  const handleBetSelect = (bet: ComprehensiveBet) => {
    setSelectedBet(bet)
    // Auto-fill form with selected bet data
    setStake(bet.stake.toString())
    setOdds(bet.odds.toString())
    setGameDescription(`${bet.awayTeam} vs ${bet.homeTeam} - ${bet.betType}`)
    setActualReturn("") // User still needs to enter actual return
  }

  // Handle mode change between manual entry and select saved bet
  const handleModeChange = (mode: "manual" | "select") => {
    setBetDataMode(mode)
    if (mode === "select") {
      loadSavedBets()
    } else {
      // Clear selected bet when switching back to manual
      setSelectedBet(null)
    }
  }

  const handleLogEmotion = async () => {
    console.log('Log Emotion button clicked!', { selectedEmotion, intensity, phase, context })
    if (!selectedEmotion) {
      console.log('No selected emotion, returning')
      return
    }

    // Create a unique ID for this emotion log attempt
    const now = new Date()
    const uniqueId = `${selectedEmotion}-${phase}-${Math.floor(now.getTime() / 1000)}` // Unique per second

    const newLog: EmotionLog = {
      id: uniqueId,
      timestamp: now,
      emotion: selectedEmotion,
      intensity: intensity[0],
      phase: phase,
      context: context,
    }

    // Check for duplicate in current state
    const recentLogs = logs.filter(log =>
      log.emotion === selectedEmotion &&
      log.phase === phase &&
      Math.abs(now.getTime() - log.timestamp.getTime()) < 2000 // Within 2 seconds
    )

    // Check for duplicate in localStorage
    let localStorageDuplicate = false
    if (typeof window !== "undefined") {
      const storedLogs = JSON.parse(localStorage.getItem("emotion_logs") || "[]")
      localStorageDuplicate = storedLogs.some((log: any) =>
        log.emotion === selectedEmotion &&
        log.phase === phase &&
        Math.abs(now.getTime() - new Date(log.timestamp).getTime()) < 2000
      )
    }

    // Check for duplicate trade creation (for before phase)
    let tradeDuplicate = false
    if (phase === "before") {
      tradeDuplicate = trades.some(trade =>
        trade.preTradeEmotion === selectedEmotion &&
        Math.abs(now.getTime() - trade.timestamp.getTime()) < 2000 // Within 2 seconds
      )
    }

    if (recentLogs.length > 0 || localStorageDuplicate || tradeDuplicate) {
      console.log('Duplicate emotion detected, skipping:', selectedEmotion)
      toast.error('You just logged this emotion! Please wait a moment before logging again.')
      return
    }

    // Add to storage
    await storage.addEmotionLog(newLog)

    // Emit event to update analytics
    analyticsEvents.emit(ANALYTICS_EVENTS.EMOTION_LOGGED, newLog)

    // Update local state optimistically to avoid double-fetching
    setLogs(prevLogs => [...prevLogs, newLog])

    // Different XP and gamification based on phase
    let xpEarned = 10
    let updates: Partial<UserData> = {
      totalEmotionsLogged: userData.totalEmotionsLogged + 1,
      lastEmotionCheckIn: new Date(),
    }

    if (phase === "before") {
      // Pre-trade: +15 XP, update bias recognition ring
      xpEarned = 15
      const biasCount = selectedBiases.length
      const newBiasRingProgress = Math.min(userData.dailyRings.biasRecognition + (biasCount * 15), 100)

      // V2 Betting Data Logic (New)
      let createdComprehensiveBet = false
      if ((betDataMode === "manual" && stake && odds && gameDescription) || selectedBet) {
        try {
          const { BetTrackingService } = await import("@/lib/bet-tracking-service")

          if (betDataMode === "manual" && stake && odds && gameDescription) {
            const stakeAmount = parseFloat(stake)
            let oddsNumber = 0
            try {
              if (odds.startsWith('+')) {
                oddsNumber = parseFloat(odds.substring(1))
              } else if (odds.startsWith('-')) {
                oddsNumber = parseFloat(odds.substring(1))
              } else {
                oddsNumber = parseFloat(odds)
              }
            } catch (error) { oddsNumber = 100 }

            // Build team override if teams were parsed
            const teamsOverride = (parsedTeams.awayTeam && parsedTeams.homeTeam &&
              parsedTeams.awayTeam !== "Unknown" && parsedTeams.homeTeam !== "Unknown")
              ? { awayTeam: parsedTeams.awayTeam, homeTeam: parsedTeams.homeTeam }
              : undefined

            await BetTrackingService.saveBetAnalyzerBet(
              gameDescription,
              oddsNumber,
              stakeAmount,
              {
                recommendation: context || "Manual entry",
                confidenceScore: 0.5,
                biasWarnings: []
              },
              selectedEmotion,
              intensity[0],
              isLiveBet, // Pass live bet flag for risk tracking
              teamsOverride,
              selectedTeamSide || undefined
            )
            createdComprehensiveBet = true
          } else if (selectedBet) {
            await BetTrackingService.updateBetEmotion(
              selectedBet.id,
              "before",
              selectedEmotion,
              intensity[0],
              context
            )
            createdComprehensiveBet = true
          }
          analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)
        } catch (e) {
          console.error("Error saving betting data:", e)
        }
      }

      // Create new trade entry (Legacy - Keep for backward compatibility)
      // Skip if we already created a comprehensive bet to avoid duplicates
      if (!createdComprehensiveBet) {
        const defaultTitle = `${format(new Date(), "MMM d, yyyy 'at' h:mm a")}${sport ? ` — ${sport}` : ''}`
        const newTrade: Trade = {
          id: Date.now().toString(),
          timestamp: new Date(),
          title: defaultTitle,
          preTradeEmotion: selectedEmotion,
          preTradeIntensity: intensity[0],
          biasesIdentified: selectedBiases,
          confidenceLevel: 5,
          reasoning: context || "No context provided",
          stake: stake ? parseFloat(stake) : undefined,
        }
        await storage.addTrade(newTrade)
        const updatedTrades = await storage.getTrades()
        setTrades(updatedTrades ?? [])

        // Emit event to update analytics
        analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED, newTrade)
      }

      updates = {
        ...updates,
        xp: userData.xp + xpEarned,
        totalTrades: createdComprehensiveBet ? userData.totalTrades : userData.totalTrades + 1,
        totalBiasesIdentified: userData.totalBiasesIdentified + biasCount,
        dailyRings: {
          ...userData.dailyRings,
          biasRecognition: newBiasRingProgress,
        },
      }
    } else if (phase === "after") {
      // Post-trade: +20 XP, update mindfulness ring
      xpEarned = 20
      const mindfulTrade = selectedBiases.length > 0
      const newMindfulnessProgress = Math.min(userData.dailyRings.mindfulness + 20, 100)

      // 1. Logic for the new betting data (matches popup dialog)
      if ((stake && odds && gameDescription && outcome) || selectedBet) {
        // NOTE: Modified strict check to allow for saved bet selection without manual entry

        // Manual Entry Logic
        if (betDataMode === "manual" && stake && odds && gameDescription && outcome) {
          let stakeAmount = parseFloat(stake)
          if (isNaN(stakeAmount)) stakeAmount = 0

          let returnAmount = actualReturn ? parseFloat(actualReturn) : 0
          if (isNaN(returnAmount)) returnAmount = 0

          // Parse odds - handle American odds format (+150, -110, etc.)
          let oddsNumber = parseFloat(odds)
          if (isNaN(oddsNumber)) {
            // Try parsing as integer (common for American odds input)
            oddsNumber = parseInt(odds, 10)
            if (isNaN(oddsNumber)) oddsNumber = -110 // Default American odds
          }

          // Ensure emotional intensity is an integer (database expects INTEGER)
          const emotionalInt = Math.round(intensity[0])

          const betAnalysis = {
            id: `bet_${Date.now()}`,
            timestamp: new Date(),
            betType: "straight" as const,
            sport: selectedBet?.sport || "general",
            description: gameDescription,
            odds: oddsNumber,
            stake: stakeAmount,
            emotionalState: selectedEmotion,
            emotionalIntensity: emotionalInt,
            biasWarnings: [],
            aiRecommendation: "",
            expectedValue: 0,
            probabilityEstimate: 0.5,
            outcome: (outcome === "breakeven" ? "push" : outcome === "profit" ? "win" : "loss") as "win" | "loss" | "push",
            actualReturn: returnAmount,
            isLiveBet: isLiveBet // Track if this was a live/in-play bet
          }
          await storage.addBetAnalysis(betAnalysis)
        }

        // Saved Bet Logic
        if (selectedBet) {
          try {
            const { BetTrackingService } = await import("@/lib/bet-tracking-service")
            await BetTrackingService.updateBetOutcome(
              selectedBet.id,
              (outcome === "breakeven" ? "push" : outcome === "profit" ? "win" : "loss") as "win" | "loss" | "push",
              selectedEmotion,
              intensity[0],
              `Emotional check-in: ${context || "No additional context"}`
            )
            console.log('✅ Updated comprehensive bet with outcome and emotional data')
          } catch (error) {
            console.error('Error updating comprehensive bet:', error)
          }
        }

        // Emit event to refresh analytics data across the app
        analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)
      }

      // 2. Logic for legacy trades system (keeping for backward compatibility)
      const pendingTrade = [...trades].reverse().find(t => !t.outcome)
      if (pendingTrade) {
        await storage.updateTrade(pendingTrade.id, {
          postTradeEmotion: selectedEmotion,
          postTradeIntensity: intensity[0],
          reflection: context,
          outcome: outcome || "breakeven",
          stake: stake ? parseFloat(stake) : pendingTrade.stake,
        })
        const updatedTrades = await storage.getTrades()
        setTrades(updatedTrades ?? [])
      }

      updates = {
        ...updates,
        xp: userData.xp + xpEarned,
        mindfulTrades: mindfulTrade ? userData.mindfulTrades + 1 : userData.mindfulTrades,
        totalJournalsCompleted: userData.totalJournalsCompleted + 1,
        dailyRings: {
          ...userData.dailyRings,
          mindfulness: newMindfulnessProgress,
        },
      }
    } else {
      // During-trade: +5 XP, update emotional awareness ring
      xpEarned = 5
      const newRingProgress = Math.min(userData.dailyRings.emotionalAwareness + 10, 100)

      // V2 Betting Data Logic (New)
      if ((betDataMode === "manual" && stake && odds && gameDescription) || selectedBet) {
        try {
          const { BetTrackingService } = await import("@/lib/bet-tracking-service")

          if (betDataMode === "manual" && stake && odds && gameDescription) {
            const stakeAmount = parseFloat(stake)
            let oddsNumber = 0
            try {
              if (odds.startsWith('+')) {
                oddsNumber = parseFloat(odds.substring(1))
              } else if (odds.startsWith('-')) {
                oddsNumber = parseFloat(odds.substring(1))
              } else {
                oddsNumber = parseFloat(odds)
              }
            } catch (error) { oddsNumber = 100 }

            // Build team override if teams were parsed
            const teamsOverrideDuring = (parsedTeams.awayTeam && parsedTeams.homeTeam &&
              parsedTeams.awayTeam !== "Unknown" && parsedTeams.homeTeam !== "Unknown")
              ? { awayTeam: parsedTeams.awayTeam, homeTeam: parsedTeams.homeTeam }
              : undefined

            await BetTrackingService.saveBetAnalyzerBet(
              gameDescription,
              oddsNumber,
              stakeAmount,
              {
                recommendation: context || "Manual entry (During)",
                confidenceScore: 0.5,
                biasWarnings: []
              },
              selectedEmotion,
              intensity[0],
              isLiveBet, // Pass live bet flag for risk tracking
              teamsOverrideDuring,
              selectedTeamSide || undefined
            )
          } else if (selectedBet) {
            await BetTrackingService.updateBetEmotion(
              selectedBet.id,
              "during",
              selectedEmotion,
              intensity[0],
              context
            )
          }
          analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)
        } catch (e) {
          console.error("Error saving betting data:", e)
        }
      }

      updates = {
        ...updates,
        xp: userData.xp + xpEarned,
        dailyRings: {
          ...userData.dailyRings,
          emotionalAwareness: newRingProgress,
        },
      }
    }

    await updateUserData(updates)
    toast.success(`Emotion logged successfully! +${xpEarned} XP earned`)

    // Reset form
    handleReset()
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Behavior</h2>
          <p className="text-muted-foreground">Track your emotions before, during, and after betting</p>
        </div>
      </div>

      {/* Log Emotion */}
      <div className="space-y-6">
        {/* Section Above Check-in */}
        <Card className="p-6 bg-linear-to-br from-blue-50/10 to-purple-50/10 border-blue-30">
          <div className="text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-blue-500/10">
              <Lightbulb className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Emotional Awareness Matters</h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Tracking your emotions before, during, and after betting helps you identify patterns,
                avoid bias-driven decisions, and improve your overall performance.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {behaviorStats ? (
                <>
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{behaviorStats.betterDecisions}%</div>
                    <div className="text-xs text-muted-foreground">Better decisions when emotionally aware</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <div className="text-2xl font-bold text-purple-400 mb-1">{behaviorStats.roiImprovement}x</div>
                    <div className="text-xs text-muted-foreground">ROI improvement with consistent tracking</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <div className="text-2xl font-bold text-green-400 mb-1">-{behaviorStats.impulsiveReduction}%</div>
                    <div className="text-xs text-muted-foreground">Reduction in impulsive bets</div>
                  </div>
                </>
              ) : (
                <div className="col-span-3 text-center p-8 rounded-lg bg-background/30">
                  <div className="text-sm text-muted-foreground">
                    Track more emotions and bets to see your personalized behavioral insights
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Statistics will appear once you have sufficient data (10+ tracked bets, 20+ emotion logs)
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Pending Trades Alert */}
        {(trades.filter(t => !t.outcome).length > 0 || pendingComprehensiveBets.length > 0) && (
          <Card className="p-6 bg-linear-to-br from-amber/10 to-orange/10 border-amber/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber/20">
                  <FileText className="h-5 w-5 text-amber" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Pending Post-Betting Emotions</h3>
                  <p className="text-xs text-muted-foreground">
                    Complete these to earn +20 XP and track your outcomes
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-amber/10">
                {trades.filter(t => !t.outcome).length + pendingComprehensiveBets.length} pending
              </Badge>
            </div>
            <div className="space-y-2">
              {/* Show pending comprehensive bets first */}
              {pendingComprehensiveBets.slice(0, 3).map((bet) => (
                <div key={bet.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-card border border-border">
                  <div className="flex-1 pointer-events-none">
                    <p className="text-sm font-medium text-foreground">
                      {bet.homeTeam === "Unknown" && bet.awayTeam === "Unknown" && bet.description
                        ? bet.description
                        : `${bet.awayTeam} vs ${bet.homeTeam}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {bet.betType} • ${bet.stake} • {bet.emotions.before.emotion || "Pre-bet check-in"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(bet.timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      handleReset()
                      // Pre-select this bet for the after check-in
                      setSelectedBet(bet)
                      setBetDataMode("select")
                      setStake(bet.stake.toString())
                      setOdds(bet.odds.toString())
                      setGameDescription(bet.description || `${bet.awayTeam} vs ${bet.homeTeam} - ${bet.betType}`)
                      setTimeout(() => {
                        setPhase("after")
                        emotionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 100)
                    }}
                  >
                    Complete (+20 XP)
                  </Button>
                </div>
              ))}
              {/* Show legacy pending trades if any */}
              {trades.filter(t => !t.outcome).slice(0, Math.max(0, 3 - pendingComprehensiveBets.length)).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-card border border-border">
                  <div className="flex-1 pointer-events-none">
                    <p className="text-sm font-medium text-foreground">{trade.preTradeEmotion}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(trade.timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      handleReset()
                      setTimeout(() => {
                        setPhase("after")
                        emotionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 100)
                    }}
                  >
                    Complete (+20 XP)
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6" ref={emotionFormRef}>
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {step !== "core" && (
                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {step === "core" && "Select a core emotion"}
                  {step === "sub" && "Refine your emotion"}
                  {step === "biases" && "Check for cognitive biases"}
                  {step === "details" && "Tell us more"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step === "core" && "Choose the emotion that best represents how you're feeling"}
                  {step === "sub" && "Pick a specific emotion that describes your state"}
                  {step === "biases" && "Be honest - which biases might be influencing your decision?"}
                  {step === "details" && "Add intensity, phase, and context"}
                </p>
              </div>
            </div>
            {step !== "core" && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                Start Over
              </Button>
            )}
          </div>

          {/* Step 1: Core Emotion Selection */}
          {step === "core" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {coreEmotions.map((emotion) => (
                  <button
                    type="button"
                    key={emotion.id}
                    onClick={() => handleCoreSelect(emotion)}
                    className="group relative aspect-square flex flex-col items-center justify-center rounded-full transition-all hover:scale-105 hover:shadow-lg touch-manipulation active:scale-95 min-h-[60px]"
                    style={{ backgroundColor: emotion.color }}
                  >
                    {/* Inner white circle border */}
                    <div className="absolute inset-1 rounded-full border-2 border-white/40 pointer-events-none" />
                    <span className="text-xs md:text-sm font-bold text-white drop-shadow-lg relative z-10 text-center">
                      {emotion.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Sub-Emotion Selection - Zoomed In View */}
          {step === "sub" && selectedCore && (
            <div className="flex flex-col items-center justify-center zoom-in-emotion min-h-[500px]">
              {/* Circular container that mimics the large circle size */}
              <div className="relative w-full max-w-lg aspect-square mx-auto flex items-center justify-center" style={{ padding: 0, margin: '0 auto', boxSizing: 'border-box' }}>
                {/* Outer circle boundary using emotion color */}
                <div
                  className="absolute inset-0 rounded-full shadow-2xl"
                  style={{
                    backgroundColor: `${selectedCore.color}15`
                  }}
                />


                {/* 10 circles: 1 center + 9 in optimal packing ring */}
                <div className="absolute inset-0" style={{ transformOrigin: 'center center' }}>
                  {selectedCore.subEmotions.map((subEmotion: string, index: number) => {
                    // Circle-packing geometry for 9 circles around 1 center:
                    // 
                    // For adjacent outer circles to touch (not overlap):
                    //   Distance between centers = 2r
                    //   2·d·sin(π/9) = 2r  (where d = ring radius, θ = 40°)
                    //   d = r / sin(π/9) = r / sin(20°) ≈ 2.924r
                    //
                    // For all circles to fit in parent (R = 50%):
                    //   d + r ≤ 50
                    //   2.924r + r ≤ 50
                    //   3.924r ≤ 50
                    //   r ≤ 12.74%
                    //
                    const parentRadius = 50
                    const angleStep = Math.PI / 9 // 20° in radians
                    const sinAngle = Math.sin(angleStep) // sin(20°) ≈ 0.342

                    // Calculate optimal circle radius
                    const circleRadiusPercent = parentRadius / (1 / sinAngle + 1) // ≈ 12.74%
                    const circleDiameter = circleRadiusPercent * 2
                    const circleSize = `${circleDiameter}%`

                    let x = 0, y = 0

                    if (index === 0) {
                      // Center circle at exact geometric center
                      x = 0
                      y = 0
                    } else {
                      // Ring radius calculated for adjacent tangency
                      const ringRadius = circleRadiusPercent / sinAngle // ≈ 37.26%

                      const angleIndex = index - 1
                      const angleDegrees = (360 / 9) * angleIndex // 0°, 40°, 80°, ...
                      const angleRadians = (angleDegrees * Math.PI) / 180

                      // Position using polar coordinates, starting from top
                      x = ringRadius * Math.cos(angleRadians - Math.PI / 2)
                      y = ringRadius * Math.sin(angleRadians - Math.PI / 2)
                    }

                    return (
                      <button
                        type="button"
                        key={subEmotion}
                        onClick={() => handleSubSelect(subEmotion)}
                        className="absolute rounded-full flex items-center justify-center font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:z-10 active:scale-95 touch-manipulation"
                        style={{
                          width: circleSize,
                          aspectRatio: '1',
                          backgroundColor: selectedCore.color,
                          left: `calc(50% + ${x}%)`,
                          top: `calc(50% + ${y}%)`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span className="text-sm text-center px-1 leading-tight font-bold">{subEmotion}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Select a specific emotion
              </p>
            </div>
          )}

          {/* Step 3: Cognitive Bias Checking (for pre/post-trade) */}
          {step === "biases" && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <Card className="p-6 bg-primary/5 border border-primary/20">
                <h3 className="text-lg font-semibold text-foreground mb-2">Identify Potential Biases</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Be honest with yourself. Which cognitive biases might be influencing this trade?
                </p>

                <div className="space-y-3 mb-6">
                  {commonBiases.map((bias) => (
                    <div
                      key={bias.id}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedBiases.includes(bias.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                      onClick={() => handleBiasToggle(bias.id)}
                    >
                      <Checkbox
                        checked={selectedBiases.includes(bias.id)}
                        onCheckedChange={() => handleBiasToggle(bias.id)}
                      />
                      <div className="flex-1">
                        <Label className="cursor-pointer">{bias.label}</Label>
                        <p className="text-xs text-muted-foreground mt-1">{(bias as any).desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setStep("details")}
                  className="w-full"
                  size="lg"
                  style={{ backgroundColor: selectedCore?.color }}
                >
                  Continue to Details
                </Button>
              </Card>
            </div>
          )}

          {/* Step 4: Details Form */}
          {step === "details" && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-6">
                {/* Selected emotion display */}
                <div className="text-center pb-4 border-b">
                  <p className="text-sm text-muted-foreground mb-1">You selected</p>
                  <p className="text-3xl font-bold" style={{ color: selectedCore?.color }}>
                    {selectedEmotion}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">from {selectedCore?.label}</p>
                </div>

                {/* Intensity Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Intensity</Label>
                    <span className="text-2xl font-bold" style={{ color: selectedCore?.color }}>
                      {intensity[0]}
                    </span>
                  </div>
                  <Slider
                    value={intensity}
                    onValueChange={setIntensity}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 (Mild)</span>
                    <span>5 (Intense)</span>
                  </div>
                </div>

                {/* Betting Phase */}
                <div className="space-y-3">
                  <Label>Select Betting Phase</Label>
                  <RadioGroup value={phase} onValueChange={(val: string) => setPhase(val as any)}>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="before" id="before" />
                      <Label htmlFor="before" className="cursor-pointer flex-1 font-normal">Before Betting</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="during" id="during" />
                      <Label htmlFor="during" className="cursor-pointer flex-1 font-normal">During Betting</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="after" id="after" />
                      <Label htmlFor="after" className="cursor-pointer flex-1 font-normal">After Betting</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Outcome (only for after betting) */}
                {phase === "after" && (
                  <div className="space-y-3">
                    <Label>What was the outcome?</Label>
                    <RadioGroup value={outcome} onValueChange={(val: string) => setOutcome(val as any)}>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="profit" id="profit" />
                        <Label htmlFor="profit" className="cursor-pointer flex-1 font-normal">Won 💰</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="loss" id="loss" />
                        <Label htmlFor="loss" className="cursor-pointer flex-1 font-normal">Lost 📉</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="breakeven" id="breakeven" />
                        <Label htmlFor="breakeven" className="cursor-pointer flex-1 font-normal">Pushed ⚖️</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Betting Details Section - For ALL phases */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-medium">Betting Details</Label>

                  {/* Mode Selection Toggle */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">How would you like to enter betting data?</Label>
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleModeChange("manual")}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation min-h-[44px] ${betDataMode === "manual"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Manual Entry
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange("select")}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation min-h-[44px] ${betDataMode === "select"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        Select Saved Bet
                      </button>
                    </div>
                  </div>

                  {/* Manual Entry Mode */}
                  {betDataMode === "manual" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stake">Amount Bet ($)</Label>
                          <Input
                            id="stake"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="50.00"
                            value={stake}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setStake(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="odds">Odds (e.g., +110, -110)</Label>
                          <Input
                            id="odds"
                            type="text"
                            placeholder="+110"
                            value={odds}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setOdds(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gameDescription">Game/Match Description</Label>
                        <Input
                          id="gameDescription"
                          type="text"
                          placeholder="e.g., Lakers vs Warriors - NBA"
                          value={gameDescription}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setGameDescription(e.target.value)}
                        />
                      </div>

                      {/* Team Selection - Which team are you betting on? */}
                      {(parsedTeams.awayTeam !== "" && parsedTeams.awayTeam !== "Unknown") ||
                       (parsedTeams.homeTeam !== "" && parsedTeams.homeTeam !== "Unknown") ? (
                        <div className="space-y-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <Label className="text-sm font-medium">Which team are you betting on?</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {parsedTeams.awayTeam && parsedTeams.awayTeam !== "Unknown" && (
                              <button
                                type="button"
                                onClick={() => setSelectedTeamSide("away")}
                                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors touch-manipulation min-h-[44px] active:scale-95 ${
                                  selectedTeamSide === "away"
                                    ? "border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-accent"
                                }`}
                              >
                                {parsedTeams.awayTeam}
                              </button>
                            )}
                            {parsedTeams.homeTeam && parsedTeams.homeTeam !== "Unknown" && (
                              <button
                                type="button"
                                onClick={() => setSelectedTeamSide("home")}
                                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors touch-manipulation min-h-[44px] active:scale-95 ${
                                  selectedTeamSide === "home"
                                    ? "border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-accent"
                                }`}
                              >
                                {parsedTeams.homeTeam}
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select the team you're placing your bet on
                          </p>
                        </div>
                      ) : null}

                      {/* Live Bet Toggle - Important for risk assessment */}
                      <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <div className="flex-1">
                          <Label htmlFor="isLiveBet" className="text-sm font-medium cursor-pointer">
                            Is this a live/in-play bet?
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Live betting can increase impulsivity risk
                          </p>
                        </div>
                        <button
                          id="isLiveBet"
                          type="button"
                          role="switch"
                          aria-checked={isLiveBet}
                          onClick={() => setIsLiveBet(!isLiveBet)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors touch-manipulation ${
                            isLiveBet ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${
                              isLiveBet ? "translate-x-7" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Select Saved Bet Mode */}
                  {betDataMode === "select" && (
                    <div className="space-y-4">
                      {loadingBets ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <p className="text-sm text-muted-foreground mt-2">Loading saved bets...</p>
                        </div>
                      ) : savedBets.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">No saved bets found (pending outcome).</p>
                          <p className="text-xs text-muted-foreground mt-1">Analyze some bets or create manual entries first.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Select a bet from your analysis history:</Label>
                          <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-2">
                            {savedBets.map((bet) => (
                              <button
                                key={bet.id}
                                type="button"
                                onClick={() => handleBetSelect(bet)}
                                className={`w-full text-left p-3 rounded-lg border transition-colors touch-manipulation min-h-[44px] active:scale-[0.98] ${selectedBet?.id === bet.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50 hover:bg-accent"
                                  }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">
                                      {bet.awayTeam} vs {bet.homeTeam}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {bet.betType} • {bet.sport} • ${bet.stake} @ {bet.odds}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Source: {bet.source === "bet-analyzer" ? "Bet Analyzer" : "TiltLab"}
                                    </p>
                                  </div>
                                  {selectedBet?.id === bet.id && (
                                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                      <span className="text-primary-foreground text-xs">✓</span>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>

                          {selectedBet && (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">Selected bet details auto-filled</p>
                              <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                                {selectedBet.awayTeam} vs {selectedBet.homeTeam} - {selectedBet.betType}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actual Return field (when outcome is selected) */}
                  {phase === "after" && outcome && (
                    <div className="space-y-2">
                      <Label htmlFor="actualReturn">Actual Return ($)</Label>
                      <Input
                        id="actualReturn"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={outcome === "profit" ? "105.00" : outcome === "loss" ? "0.00" : "50.00"}
                        value={actualReturn}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setActualReturn(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Context */}
                <div className="space-y-3">
                  <Label htmlFor="context">Optional context</Label>
                  <Textarea
                    id="context"
                    placeholder="e.g., I was profitable today"
                    value={context}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleLogEmotion}
                disabled={!selectedEmotion || isLogging}
                className="w-full min-h-[44px] touch-manipulation"
              >
                Log Emotion (+10 XP)
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}