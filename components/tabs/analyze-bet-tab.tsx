"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Target, Brain, AlertTriangle, TrendingUp, Lock, Sparkles, Save, Check, Plus, Trash2 } from "lucide-react"
import type { UserData, BetAnalysis } from "@/lib/types"
import { canAccessFeature, getUpgradeMessage } from "@/lib/subscription-tiers"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"
import { calculateEmotionalStability } from "@/lib/emotional-scoring"
import { LineMovementSeries } from "@/components/odds/LineMovementSeries"
import { FeatureGate } from "@/components/feature-gate"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AnalyzeBetTabProps {
  userData: UserData
  onNavigateToTab: (tab: string) => void
}

export function AnalyzeBetTab({ userData, onNavigateToTab }: AnalyzeBetTabProps) {
  const [betDescription, setBetDescription] = useState("")
  const [odds, setOdds] = useState("")
  const [stake, setStake] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [slipText, setSlipText] = useState("")
  const [stability, setStability] = useState<{ score: number } | null>(null)
  // Bet Slip Builder state
  const [builderBook, setBuilderBook] = useState("DraftKings")
  const [builderSport, setBuilderSport] = useState("NBA")
  const [builderType, setBuilderType] = useState<"Moneyline" | "Spread" | "Total">("Moneyline")
  const [builderAwayTeam, setBuilderAwayTeam] = useState("")
  const [builderHomeTeam, setBuilderHomeTeam] = useState("")
  const [builderSide, setBuilderSide] = useState("Away") // Away/Home for ML/Spread, Over/Under for Total
  const [builderLine, setBuilderLine] = useState("") // Spread or Total value
  const [builderOdds, setBuilderOdds] = useState("")
  const [builderStake, setBuilderStake] = useState("")
  const [homeOddsByBook, setHomeOddsByBook] = useState<Record<string, number> | null>(null)
  const [awayOddsByBook, setAwayOddsByBook] = useState<Record<string, number> | null>(null)
  const [availableBooks, setAvailableBooks] = useState<string[]>([])
  // Parlay & Props
  const [parlayLegs, setParlayLegs] = useState<Array<{ type: 'Moneyline' | 'Spread' | 'Total' | 'Prop'; book: string; selection: string; line?: string; odds: number }>>([])
  const [parlayStake, setParlayStake] = useState<string>("")
  const [propPlayer, setPropPlayer] = useState<string>("")
  const [propType, setPropType] = useState<string>("Points")
  const [propSide, setPropSide] = useState<'Over' | 'Under'>("Over")
  const [propLine, setPropLine] = useState<string>("")
  const [propOdds, setPropOdds] = useState<string>("")
  const [propBook, setPropBook] = useState<string>("")
  // Line movement controls
  const [lineUnit, setLineUnit] = useState<'minutes' | 'hours' | 'days'>('hours')
  const [lineAmount, setLineAmount] = useState<string>('6')
  const [lineHistory, setLineHistory] = useState<Array<{ timestamp: number; home?: number; away?: number }>>([])
  // Parlay analysis state
  const [parlayAnalysis, setParlayAnalysis] = useState<any>(null)
  const [analyzingParlay, setAnalyzingParlay] = useState(false)
  // UI toggles
  const [showSlipBuilder, setShowSlipBuilder] = useState(false)
  const [showParlayBuilder, setShowParlayBuilder] = useState(false)

  const hasBasicAccess = canAccessFeature(userData.subscriptionTier || "free", "premium")
  const hasPsychAccess = canAccessFeature(userData.subscriptionTier || "free", "premium_plus")
  const isGuardActive = !!userData.cooldownEnabled || ((stability?.score ?? 100) < 50)
  const [dailyBetCount, setDailyBetCount] = useState(0)

  // Check for pending bet analysis from Live Odds tab
  useEffect(() => {
    const loadPendingBet = () => {
      const pendingBet = localStorage.getItem('pendingBetAnalysis')
      if (!pendingBet) return
      try {
        const betData = JSON.parse(pendingBet)
        // Pre-fill the form with the bet data
        const description = `${betData.sport}: ${betData.awayTeam} @ ${betData.homeTeam}\nBest odds: ${betData.bestHomeBookmaker} (${betData.bestHomeOdds}) vs ${betData.bestAwayBookmaker} (${betData.bestAwayOdds})`
        setBetDescription(description)
        // Prefill core odds/stake fields so user doesn't have to retype
        if (typeof betData.bestHomeOdds === 'number') {
          setOdds(String(betData.bestHomeOdds))
        } else if (typeof betData.bestAwayOdds === 'number') {
          setOdds(String(betData.bestAwayOdds))
        }
        if (typeof betData.defaultStake === 'number') {
          setStake(String(betData.defaultStake))
        }
        setBuilderAwayTeam(betData.awayTeam || "")
        setBuilderHomeTeam(betData.homeTeam || "")
        // Load per-book odds maps for autopopulating builder odds
        if (betData.homeOddsByBook) setHomeOddsByBook(betData.homeOddsByBook)
        if (betData.awayOddsByBook) setAwayOddsByBook(betData.awayOddsByBook)
        if (betData.bestAwayBookmaker || betData.bestHomeBookmaker) {
          setBuilderBook(betData.bestAwayBookmaker || betData.bestHomeBookmaker)
        }
        // Clear the pending bet data
        localStorage.removeItem('pendingBetAnalysis')
      } catch (error) {
        console.error('Failed to load pending bet:', error)
      }
    }

    loadPendingBet()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'pendingBetAnalysis' && event.newValue) {
        loadPendingBet()
      }
    }
    window.addEventListener('storage', handleStorage)

    ;(async () => {
      try {
        const emotionLogs = await storage.getEmotionLogs()
        const trades = await storage.getTrades()
        const s = calculateEmotionalStability(emotionLogs, userData.surveyData?.score, trades)
        setStability({ score: s.score })
      } catch {}
      try {
        const analyses = await storage.getBetAnalyses()
        const now = new Date()
        const todayCount = analyses.filter((b: any) => {
          const t = new Date(b.timestamp)
          return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth() && t.getDate() === now.getDate()
        }).length
        setDailyBetCount(todayCount)
      } catch {}
    })()

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Autopopulate builder odds when sportsbook/selection changes (Moneyline/Spread only)
  useEffect(() => {
    if (!builderBook) return
    if (builderType === "Total") return
    const map = builderSide === "Home" ? homeOddsByBook : awayOddsByBook
    const val = map?.[builderBook]
    if (typeof val === 'number') {
      setBuilderOdds(val > 0 ? `+${val}` : String(val))
    }
  }, [builderBook, builderSide, builderType, homeOddsByBook, awayOddsByBook])

  // Maintain dynamic list of sportsbook options from provided maps
  useEffect(() => {
    const books = new Set<string>()
    if (homeOddsByBook) Object.keys(homeOddsByBook).forEach(b => books.add(b))
    if (awayOddsByBook) Object.keys(awayOddsByBook).forEach(b => books.add(b))
    const list = Array.from(books)
    setAvailableBooks(list)
    if (list.length > 0 && !list.includes(builderBook)) {
      setBuilderBook(list[0])
    }
  }, [homeOddsByBook, awayOddsByBook])

  // Default props book to first available when maps arrive
  useEffect(() => {
    if (!propBook && availableBooks.length > 0) setPropBook(availableBooks[0])
  }, [availableBooks, propBook])

  // Persist line movement snapshots in localStorage and build time-series from history
  useEffect(() => {
    try {
      const raw = localStorage.getItem('lineMovementHistory')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setLineHistory(parsed)
        }
      }
    } catch (e) {
      console.warn('Failed to load line movement history', e)
    }
  }, [])

  useEffect(() => {
    if (!homeOddsByBook && !awayOddsByBook) return
    const avg = (m: Record<string, number> | null) => {
      if (!m) return undefined
      const vals = Object.values(m)
      if (!vals.length) return undefined
      return vals.reduce((a, b) => a + b, 0) / vals.length
    }
    const baseHome = avg(homeOddsByBook)
    const baseAway = avg(awayOddsByBook)
    if (baseHome == null && baseAway == null) return

    const snapshot = {
      timestamp: Date.now(),
      home: baseHome,
      away: baseAway,
    }

    setLineHistory((prev) => {
      const MAX_HISTORY_MS = 7 * 24 * 60 * 60 * 1000
      const cutoff = Date.now() - MAX_HISTORY_MS
      const filtered = prev.filter((p) => p.timestamp >= cutoff)
      const next = [...filtered, snapshot]
      try {
        localStorage.setItem('lineMovementHistory', JSON.stringify(next))
      } catch {}
      return next
    })
  }, [homeOddsByBook, awayOddsByBook])

  const lineSeriesPoints = useMemo(() => {
    if (!lineHistory.length) return [] as { time: string; home?: number; away?: number }[]

    const unitMs = lineUnit === 'minutes' ? 60_000 : lineUnit === 'hours' ? 3_600_000 : 86_400_000
    const totalMs = Math.max(1, parseInt(lineAmount || '1', 10)) * unitMs
    const cutoff = Date.now() - totalMs

    const windowed = lineHistory.filter((p) => p.timestamp >= cutoff)
    if (!windowed.length) return []

    return windowed.map((p) => {
      const t = new Date(p.timestamp)
      const label = lineUnit === 'days'
        ? t.toLocaleDateString()
        : t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return {
        time: label,
        home: typeof p.home === 'number' ? Math.round(p.home) : undefined,
        away: typeof p.away === 'number' ? Math.round(p.away) : undefined,
      }
    })
  }, [lineHistory, lineUnit, lineAmount])

  // Helpers for parlay math
  const americanToDecimal = (a: number) => a >= 100 ? 1 + a / 100 : 1 + 100 / Math.abs(a)
  const decimalToAmerican = (d: number) => {
    const x = d - 1
    if (x >= 1) return Math.round(x * 100)
    return Math.round(-100 / x)
  }
  const combinedAmerican = useMemo(() => {
    if (parlayLegs.length === 0) return 0
    const product = parlayLegs.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1)
    return decimalToAmerican(product)
  }, [parlayLegs])
  const parlayPayout = useMemo(() => {
    const stakeNum = parseFloat(parlayStake || '0')
    if (!stakeNum || parlayLegs.length === 0) return 0
    const dec = americanToDecimal(combinedAmerican)
    return Math.max(0, stakeNum * (dec - 1))
  }, [combinedAmerican, parlayLegs.length, parlayStake])

  const addCurrentSelectionAsLeg = () => {
    if (!builderBook || !builderType || !builderOdds) { toast.error('Fill builder fields first'); return }
    const parsedOdds = parseInt(String(builderOdds).replace('+',''))
    if (isNaN(parsedOdds)) { toast.error('Invalid odds'); return }
    const sel = builderType === 'Moneyline'
      ? `${builderSide === 'Away' ? builderAwayTeam : builderHomeTeam} ML`
      : builderType === 'Spread'
        ? `${builderSide === 'Away' ? builderAwayTeam : builderHomeTeam} ${builderLine}`
        : `${builderSide} ${builderLine}`
    setParlayLegs(legs => [...legs, { type: builderType, book: builderBook, selection: sel, line: builderType !== 'Moneyline' ? builderLine : undefined, odds: parsedOdds }])
  }
  const addPropLeg = () => {
    if (!propPlayer || !propLine || !propOdds || !propBook) { toast.error('Fill prop fields'); return }
    const parsedOdds = parseInt(String(propOdds).replace('+',''))
    if (isNaN(parsedOdds)) { toast.error('Invalid prop odds'); return }
    const sel = `${propPlayer} ${propSide} ${propLine} ${propType}`
    setParlayLegs(legs => [...legs, { type: 'Prop', book: propBook, selection: sel, line: propLine, odds: parsedOdds }])
  }
  const removeLeg = (idx: number) => setParlayLegs(legs => legs.filter((_, i) => i !== idx))
  const copyParlay = async () => {
    const text = `Parlay (${parlayLegs.length} legs) @ ${combinedAmerican > 0 ? '+' : ''}${combinedAmerican}\n` +
      parlayLegs.map((l, i) => `${i+1}. [${l.book}] ${l.selection} (${l.odds > 0 ? '+' : ''}${l.odds})`).join('\n') +
      (parlayStake ? `\nStake: $${parlayStake}  Potential Win: $${parlayPayout.toFixed(2)}` : '')
    try { await navigator.clipboard.writeText(text); toast.success('Copied parlay') } catch { toast.error('Copy failed') }
  }

  const handleAnalyzeParlay = async () => {
    if (parlayLegs.length < 2) {
      toast.error('Add at least 2 legs to analyze parlay')
      return
    }
    const parlayStakeNum = parseFloat(parlayStake)
    if (!parlayStake || isNaN(parlayStakeNum) || parlayStakeNum <= 0) {
      toast.error('Please enter a valid stake amount greater than $0')
      return
    }

    setAnalyzingParlay(true)
    setParlayAnalysis(null)

    try {
      const emotionLogs = await storage.getEmotionLogs()
      const lastEmotion = emotionLogs[emotionLogs.length - 1]
      const recentTrades = await storage.getTrades()
      const recentBets = recentTrades.slice(-5).map(t => ({
        outcome: t.outcome || 'pending'
      }))

      const response = await fetch('/api/analyze-parlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legs: parlayLegs,
          stake: parlayStake,
          emotionalState: lastEmotion?.emotion,
          recentBets
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze parlay')
      }

      const data = await response.json()
      setParlayAnalysis(data.analysis)
      toast.success('Parlay analyzed!')
    } catch (error) {
      console.error('Parlay analysis error:', error)
      toast.error('Failed to analyze parlay')
    } finally {
      setAnalyzingParlay(false)
    }
  }

  const handleAnalyze = async () => {
    if (!betDescription || !odds || !stake) {
      toast.error("Please fill in all fields")
      return
    }
    const stakeNum = parseFloat(stake)
    if (isNaN(stakeNum) || stakeNum <= 0) {
      toast.error("Please enter a valid stake amount greater than $0")
      return
    }
    const limitReached = userData.dailyBetLimit != null && dailyBetCount >= userData.dailyBetLimit
    const stakeTooHigh = userData.maxStakeLimit != null && !Number.isNaN(stakeNum) && stakeNum > (userData.maxStakeLimit as number)
    if (limitReached) {
      toast.warning("Daily Bet Limit Reached", { description: "You have reached your daily bet limit." })
      return
    }
    if (stakeTooHigh) {
      toast.warning("Stake exceeds your max limit", { description: `Your stake $${stakeNum} exceeds your max $${userData.maxStakeLimit}.` })
      return
    }
    if (userData.cooldownEnabled || (stability && stability.score < 50)) {
      toast.warning("Safety Guard Enabled", { description: "Your state suggests waiting before analyzing bets." })
      return
    }

    setAnalyzing(true)
    setSaved(false) // Reset saved state when analyzing again
    
    try {
      // Get recent bets for bias detection
      const recentEmotions = await storage.getEmotionLogs()
      const lastEmotion = recentEmotions[recentEmotions.length - 1]
      
      // Get recent trades/bets for pattern analysis
      const recentTrades = await storage.getTrades()
      const recentBets = recentTrades.slice(-5).map(trade => ({
        outcome: trade.outcome || 'pending',
        emotionalState: trade.preTradeEmotion
      }))

      // Call AI analysis API
      const response = await fetch('/api/analyze-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: betDescription,
          odds: parseFloat(odds),
          stake: parseFloat(stake),
          emotionalState: lastEmotion?.emotion,
          emotionalIntensity: lastEmotion?.intensity,
          recentBets: hasPsychAccess ? recentBets : undefined,
          includeBiasDetection: hasPsychAccess,
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      
      setAnalysis({
        probability: data.analysis.probability,
        expectedValue: data.analysis.expectedValue,
        biasWarnings: data.analysis.biasWarnings || [],
        recommendation: data.analysis.reasoning,
        emotionalAlignment: userData.surveyData?.score || 50,
        confidenceScore: data.analysis.confidenceScore,
        riskLevel: data.analysis.riskLevel,
        recommendationLevel: data.analysis.recommendation,
        usedAI: data.usedAI
      })

      // Auto-persist every analysis run to bet_analyses so Analytics stays in sync
      try {
        setSaving(true)
        const analysisId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`

        const betAnalysis: BetAnalysis = {
          id: analysisId,
          timestamp: new Date(),
          betType: "straight",
          sport: "Unknown",
          description: betDescription,
          odds: parseFloat(odds) || 0,
          stake: parseFloat(stake) || 0,
          emotionalState: lastEmotion?.emotion || "neutral",
          emotionalIntensity: lastEmotion?.intensity || 5,
          biasWarnings: hasPsychAccess ? (data.analysis.biasWarnings || []) : [],
          aiRecommendation: data.analysis.reasoning,
          expectedValue: data.analysis.expectedValue,
          probabilityEstimate: data.analysis.probability,
          outcome: "pending",
        }
        // @ts-ignore - Method added dynamically to storageHybrid
        await storage.addBetAnalysis(betAnalysis)
        setSaved(true)
        setDailyBetCount((c) => c + 1)
        toast.success("Analysis saved", {
          description: "Saved automatically to your betting history."
        })
      } catch (e) {
        console.warn("Auto-save analysis failed", e)
      } finally {
        setSaving(false)
      }

      if (!data.usedAI) {
        toast.info("Using mock analysis", {
          description: "Add OPENAI_API_KEY to .env.local for real AI analysis"
        })
      }
    } catch (error) {
      console.error('Error analyzing bet:', error)
      toast.error("Analysis failed", {
        description: "Please try again"
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const parseSlip = () => {
    const text = slipText.trim()
    if (!text) return
    const oddsMatch = text.match(/([+-]?\d{3,4})/)
    const stakeMatch = text.match(/\$\s*(\d+(?:\.\d{1,2})?)/)
    const teamMatch = text.match(/([A-Za-z\s]+)\s*@\s*([A-Za-z\s]+)/)
    const ouMatch = text.match(/\b(Over|Under)\s*(\d+(?:\.\d+)?)/i)
    const spreadMatch = text.match(/([A-Za-z\s]+)\s*([+-]\d+(?:\.\d+)?)/)
    if (oddsMatch) setOdds(oddsMatch[1])
    if (stakeMatch) setStake(stakeMatch[1])
    if (ouMatch) setBetDescription(`${ouMatch[1][0].toUpperCase()}${ouMatch[1].slice(1).toLowerCase()} ${ouMatch[2]}`)
    else if (teamMatch) setBetDescription(`${teamMatch[1].trim()} @ ${teamMatch[2].trim()}`)
    else if (spreadMatch) setBetDescription(`${spreadMatch[1].trim()} ${spreadMatch[2]}`)
    if (!oddsMatch && !stakeMatch && !teamMatch) {
      toast.info("Could not parse slip. Fill fields manually.")
    }
  }

  // Bet Slip Builder helpers
  const prefillBuilderFromInputs = () => {
    setBuilderOdds(odds)
    setBuilderStake(stake)
    const teamMatch = betDescription.match(/([A-Za-z\s]+)\s*@\s*([A-Za-z\s]+)/)
    const ouMatch = betDescription.match(/\b(Over|Under)\s*(\d+(?:\.\d+)?)/i)
    const spreadMatch = betDescription.match(/([A-Za-z\s]+)\s*([+-]\d+(?:\.\d+)?)/)
    if (teamMatch) {
      setBuilderAwayTeam(teamMatch[1].trim())
      setBuilderHomeTeam(teamMatch[2].trim())
    }
    if (ouMatch) {
      setBuilderType("Total")
      setBuilderSide(ouMatch[1][0].toUpperCase() + ouMatch[1].slice(1).toLowerCase())
      setBuilderLine(ouMatch[2])
    } else if (spreadMatch) {
      setBuilderType("Spread")
      const t = spreadMatch[1].trim()
      if (teamMatch) {
        setBuilderSide(t === builderAwayTeam || t === teamMatch[1].trim() ? "Away" : "Home")
      }
      setBuilderLine(spreadMatch[2])
    } else {
      setBuilderType("Moneyline")
    }
  }

  const buildSelectionText = () => {
    if (builderType === "Moneyline") {
      return `${builderSide === "Away" ? builderAwayTeam : builderHomeTeam} ML`
    }
    if (builderType === "Spread") {
      return `${builderSide === "Away" ? builderAwayTeam : builderHomeTeam} ${builderLine}`
    }
    return `${builderSide} ${builderLine}`
  }

  const buildFormattedSlip = (book: string) => {
    const selection = buildSelectionText()
    const base = `${builderSport} | ${builderAwayTeam} @ ${builderHomeTeam} | ${builderType} | ${selection} | Odds ${builderOdds} | Stake $${builderStake}`
    if (book === "DraftKings") return `DK Slip: ${base}`
    if (book === "FanDuel") return `FD Slip: ${base}`
    if (book === "Caesars") return `CZ Slip: ${base}`
    if (book === "BetMGM") return `MGM Slip: ${base}`
    return base
  }

  const copySlipFor = async (book: string) => {
    const text = buildFormattedSlip(book)
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Copied ${book === "Generic" ? "Generic" : book} format`)
    } catch {
      toast.error("Copy failed")
    }
  }

  const copySummary = async () => {
    if (!analysis) return
    const summary = `Bet: ${betDescription}\nOdds: ${odds}\nStake: $${stake}\nWin %: ${analysis.probability}%\nEV: ${analysis.expectedValue >= 0 ? '+' : ''}$${analysis.expectedValue.toFixed(2)}\nRisk: ${analysis.riskLevel}`
    try {
      await navigator.clipboard.writeText(summary)
      toast.success("Copied summary")
    } catch {
      toast.error("Copy failed")
    }
  }

  const shareSummary = async () => {
    if (!analysis) return
    const text = `Serenity Pocket analysis: ${betDescription} — Win ${analysis.probability}%, EV ${analysis.expectedValue >= 0 ? '+' : ''}$${analysis.expectedValue.toFixed(2)} (Risk ${analysis.riskLevel})`
    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ title: "Bet Analysis", text })
      } else {
        await navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
      }
    } catch {}
  }

  const handleSaveAnalysis = async () => {
    if (!analysis || !betDescription) return

    setSaving(true)
    try {
      // Get current emotional state from recent emotion logs
      const recentEmotions = await storage.getEmotionLogs()
      const lastEmotion = recentEmotions[recentEmotions.length - 1]

      // Create bet analysis object
      const analysisId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const betAnalysis: BetAnalysis = {
        id: analysisId,
        timestamp: new Date(),
        betType: "straight", // Default to straight bet
        sport: "Unknown", // Would be extracted from bet description in real implementation
        description: betDescription,
        odds: parseFloat(odds) || 0,
        stake: parseFloat(stake) || 0,
        emotionalState: lastEmotion?.emotion || "neutral",
        emotionalIntensity: lastEmotion?.intensity || 5,
        biasWarnings: hasPsychAccess ? analysis.biasWarnings : [],
        aiRecommendation: analysis.recommendation,
        expectedValue: analysis.expectedValue,
        probabilityEstimate: analysis.probability,
        outcome: "pending",
      }

      // Save to storage (will sync to database if user is logged in)
      // @ts-ignore - Method added dynamically to storageHybrid
      await storage.addBetAnalysis(betAnalysis)
      
      setSaved(true)
      setDailyBetCount((c) => c + 1)
      toast.success("Analysis saved successfully!", {
        description: "You can review this analysis in your bet history."
      })
    } catch (error) {
      console.error("Error saving analysis:", error)
      toast.error("Failed to save analysis", {
        description: "Please try again."
      })
    } finally {
      setSaving(false)
    }
  }

  if (!hasBasicAccess) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Analyze Your Bet</h2>
          <p className="text-muted-foreground">
            Get AI-powered analysis of your betting ideas
          </p>
        </div>

        <Card className="p-12 text-center bg-linear-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-purple-500/20">
              <Lock className="h-12 w-12 text-purple-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Premium Feature</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {getUpgradeMessage(userData.subscriptionTier || "free", "Bet Analysis")}
          </p>
          <Button size="lg" onClick={() => onNavigateToTab("account")}>
            Upgrade to Premium
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Analyze Your Bet</h2>
        <p className="text-muted-foreground">Get data-driven insights {hasPsychAccess && "+ psychological analysis"} for your bet</p>
      </div>

      {(!!userData.cooldownEnabled || ((stability?.score ?? 100) < 50)) && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Safety Guard Active</p>
              <p className="text-xs text-muted-foreground">Analysis is limited due to cooldown or low stability.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Input Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Describe Your Bet
            </label>
            <Textarea
              placeholder="e.g., Lakers -3.5 vs Warriors, Over 225.5 points..."
              value={betDescription}
              onChange={(e) => setBetDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Odds (American)
              </label>
              <Input
                type="text"
                placeholder="-110"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Stake Amount ($) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="100"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                required
                min="0.01"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground mb-1 block">Paste Bet Slip <span className="italic">(Optional)</span></label>
            <Textarea
              placeholder="Paste a bet slip or ticket text here"
              value={slipText}
              onChange={(e) => setSlipText(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={parseSlip}>Parse Slip</Button>
              <Button variant="outline" onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText()
                  setSlipText(text)
                } catch { toast.error("Clipboard read failed") }
              }}>Paste from Clipboard</Button>
            </div>
          </div>

          {/* Bet Slip Builder (Copy & Paste) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                id="toggle-slip-builder"
                type="checkbox"
                className="h-4 w-4"
                checked={showSlipBuilder}
                onChange={(e) => setShowSlipBuilder(e.target.checked)}
              />
              <label htmlFor="toggle-slip-builder" className="text-xs text-muted-foreground">
                Use Bet Slip Builder (optional)
              </label>
            </div>
            {showSlipBuilder && (
              <Card className="p-4 bg-background/40 border-dashed">
                <h4 className="text-sm font-semibold text-foreground mb-3">Bet Slip Builder (Copy for Sportsbooks)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Sportsbook</label>
                    <select className="w-full bg-background border rounded px-3 py-2 text-sm" value={builderBook} onChange={(e) => setBuilderBook(e.target.value)}>
                      {(availableBooks.length ? availableBooks : ["DraftKings", "FanDuel", "Caesars", "BetMGM"]).map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Sport</label>
                    <Input placeholder="NBA" value={builderSport} onChange={(e) => setBuilderSport(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Bet Type</label>
                    <select className="w-full bg-background border rounded px-3 py-2 text-sm" value={builderType} onChange={(e) => setBuilderType(e.target.value as any)}>
                      <option>Moneyline</option>
                      <option>Spread</option>
                      <option>Total</option>
                    </select>
                  </div>
                  <div className="hidden md:block" />
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Away Team</label>
                    <Input placeholder="Lakers" value={builderAwayTeam} onChange={(e) => setBuilderAwayTeam(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Home Team</label>
                    <Input placeholder="Warriors" value={builderHomeTeam} onChange={(e) => setBuilderHomeTeam(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Selection</label>
                    <select
                      className="w-full bg-background border rounded px-3 py-2 text-sm"
                      value={builderSide}
                      onChange={(e) => setBuilderSide(e.target.value)}
                    >
                      {builderType === "Total" ? (
                        <>
                          <option>Over</option>
                          <option>Under</option>
                        </>
                      ) : (
                        <>
                          <option>Away</option>
                          <option>Home</option>
                        </>
                      )}
                    </select>
                  </div>
                  {builderType !== "Moneyline" && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{builderType === "Spread" ? "Spread" : "Total"}</label>
                      <Input placeholder={builderType === "Spread" ? "+3.5" : "215.5"} value={builderLine} onChange={(e) => setBuilderLine(e.target.value)} />
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Odds</label>
                    <Input placeholder="-110" value={builderOdds} onChange={(e) => setBuilderOdds(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Stake ($)</label>
                    <Input placeholder="50" value={builderStake} onChange={(e) => setBuilderStake(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button variant="outline" onClick={prefillBuilderFromInputs}>Use Current Fields</Button>
                  <Button onClick={() => copySlipFor(builderBook)}>Copy {builderBook}</Button>
                  <Button variant="secondary" onClick={() => copySlipFor("Generic")}>Copy Generic</Button>
                </div>
              </Card>
            )}
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleAnalyze}
            disabled={!betDescription || !odds || !stake || analyzing || isGuardActive}
          >
            {analyzing ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Analyze Bet
              </>
            )}
          </Button>
          {isGuardActive && (
            <p className="text-xs text-muted-foreground mt-2 text-center">Analysis is limited while cooldown is active or stability is low. Try logging emotions first in Behavior.</p>
          )}
        </div>
      </Card>

      {/* Line Movement with Range Controls */}
      <FeatureGate
        currentTier={userData.subscriptionTier || "free"}
        requiredTier={"premium"}
        featureName="Line Movement Timeline"
        onUpgrade={() => onNavigateToTab('account')}
        preview={
          <Card className="p-4">
            <p className="text-sm font-semibold mb-2">Line Movement</p>
            <div className="h-24 bg-muted rounded" />
          </Card>
        }
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Line Movement</h3>
            <div className="flex items-center gap-2">
              <Select value={lineUnit} onValueChange={(v) => setLineUnit(v as any)}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={lineAmount} onValueChange={setLineAmount}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    lineUnit === 'minutes'
                      ? ['15','30','60']
                      : lineUnit === 'hours'
                        ? ['2','6','12','24']
                        : ['3','7']
                  ).map(v => (
                    <SelectItem key={v} value={v}>{v}{lineUnit === 'minutes' ? 'm' : lineUnit === 'hours' ? 'h' : 'd'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <LineMovementSeries title={undefined} points={lineSeriesPoints} />
        </Card>
      </FeatureGate>

      {/* Parlay Builder */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            id="toggle-parlay-builder"
            type="checkbox"
            className="h-4 w-4"
            checked={showParlayBuilder}
            onChange={(e) => setShowParlayBuilder(e.target.checked)}
          />
          <label htmlFor="toggle-parlay-builder" className="text-sm text-muted-foreground">
            Build my parlay
          </label>
        </div>
        {showParlayBuilder && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Parlay Builder
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <Button variant="outline" onClick={addCurrentSelectionAsLeg}>
                <Plus className="h-4 w-4 mr-1" /> Add Current Selection as Leg
              </Button>
            </div>
        {/* Player Prop Leg */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Player</label>
            <Input placeholder="e.g., LeBron James" value={propPlayer} onChange={(e) => setPropPlayer(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Prop Type</label>
            <select className="w-full bg-background border rounded px-3 py-2 text-sm" value={propType} onChange={(e) => setPropType(e.target.value)}>
              <option>Points</option>
              <option>Rebounds</option>
              <option>Assists</option>
              <option>Threes</option>
              <option>Receiving Yards</option>
              <option>Rushing Yards</option>
              <option>Passing Yards</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Side</label>
            <select className="w-full bg-background border rounded px-3 py-2 text-sm" value={propSide} onChange={(e) => setPropSide(e.target.value as any)}>
              <option>Over</option>
              <option>Under</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Line</label>
            <Input placeholder="28.5" value={propLine} onChange={(e) => setPropLine(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Odds</label>
            <Input placeholder="-110" value={propOdds} onChange={(e) => setPropOdds(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sportsbook</label>
            <select className="w-full bg-background border rounded px-3 py-2 text-sm" value={propBook} onChange={(e) => setPropBook(e.target.value)}>
              {(availableBooks.length ? availableBooks : ["DraftKings","FanDuel","Caesars","BetMGM"]).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="outline" onClick={addPropLeg}>
            <Plus className="h-4 w-4 mr-1" /> Add Prop Leg
          </Button>
        </div>

        {/* Legs List */}
        <div className="space-y-2 mb-4">
          {parlayLegs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No legs added yet.</p>
          ) : (
            parlayLegs.map((l, idx) => (
              <div key={`${l.selection}-${idx}`} className="flex items-center justify-between p-2 rounded border">
                <div className="text-sm">
                  <span className="font-medium">[{l.book}]</span> {l.selection} <span className="ml-1">({l.odds > 0 ? '+' : ''}{l.odds})</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeLeg(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Combined Odds / Stake */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Combined Odds</p>
            <p className="text-xl font-bold text-foreground">{combinedAmerican ? (combinedAmerican > 0 ? `+${combinedAmerican}` : combinedAmerican) : '—'}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Parlay Stake ($)</label>
            <Input placeholder="25" value={parlayStake} onChange={(e) => setParlayStake(e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Potential Win</p>
            <p className="text-xl font-bold text-foreground">{parlayPayout ? `$${parlayPayout.toFixed(2)}` : '—'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="outline" onClick={copyParlay}>Copy Parlay</Button>
          <FeatureGate
            currentTier={userData.subscriptionTier || "free"}
            requiredTier={"premium"}
            featureName="Parlay Analysis"
            onUpgrade={() => onNavigateToTab('account')}
            preview={
              <Button disabled className="gap-2">
                <Lock className="h-4 w-4" />
                Analyze Parlay (Premium)
              </Button>
            }
          >
            <Button 
              onClick={handleAnalyzeParlay}
              disabled={parlayLegs.length < 2 || !parlayStake || analyzingParlay}
              className="gap-2"
            >
              {analyzingParlay ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Analyze Parlay
                </>
              )}
            </Button>
          </FeatureGate>
        </div>
      </Card>
        )}

      </div>

      {/* Parlay Analysis Results */}
      {parlayAnalysis && (
        <Card className="p-6 bg-linear-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Parlay Analysis Results
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">Combined Odds</p>
              <p className="text-2xl font-bold text-purple-500">
                {parlayAnalysis.combinedOdds > 0 ? '+' : ''}{parlayAnalysis.combinedOdds}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">Win Probability</p>
              <p className="text-2xl font-bold text-blue-500">{parlayAnalysis.impliedProbability}%</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">Potential Payout</p>
              <p className="text-2xl font-bold text-green-500">${parlayAnalysis.potentialPayout}</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">Expected Value</p>
              <p className={`text-2xl font-bold ${parseFloat(parlayAnalysis.expectedValue) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {parseFloat(parlayAnalysis.expectedValue) >= 0 ? '+' : ''}${parlayAnalysis.expectedValue}
              </p>
            </div>
          </div>

          {/* Leg Breakdown */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-foreground mb-2">Leg Breakdown:</p>
            <div className="space-y-2">
              {parlayAnalysis.breakdown.map((leg: any) => (
                <div key={leg.leg} className="flex items-center justify-between p-2 rounded bg-background/50 text-sm">
                  <span className="text-muted-foreground">Leg {leg.leg}: {leg.selection}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{leg.odds > 0 ? '+' : ''}{leg.odds}</span>
                    <Badge variant="outline">{leg.probability}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="p-4 rounded-lg bg-background/50 mb-4">
            <div className="flex items-start gap-2">
              <Badge 
                variant="outline"
                className={`mt-1 ${
                  parlayAnalysis.riskLevel === 'VERY_HIGH' ? 'border-red-500 text-red-500' :
                  parlayAnalysis.riskLevel === 'HIGH' ? 'border-orange-500 text-orange-500' :
                  'border-yellow-500 text-yellow-500'
                }`}
              >
                {parlayAnalysis.riskLevel}
              </Badge>
              <p className="text-sm text-muted-foreground flex-1">{parlayAnalysis.recommendation}</p>
            </div>
          </div>

          {/* Bias Warnings */}
          {parlayAnalysis.biasWarnings && parlayAnalysis.biasWarnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground mb-2">Behavioral Alerts:</p>
              {parlayAnalysis.biasWarnings.map((warning: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border flex items-start gap-2 ${
                    warning.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                    'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                    warning.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{warning.type}</p>
                    <p className="text-xs text-muted-foreground">{warning.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Data Analysis */}
          <Card className="p-6 bg-linear-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Data Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">Win Probability</p>
                <p className="text-3xl font-bold text-blue-500">{analysis.probability}%</p>
              </div>
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">Expected Value</p>
                <p className={`text-3xl font-bold ${analysis.expectedValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analysis.expectedValue >= 0 ? '+' : ''}${analysis.expectedValue.toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                <p className="text-3xl font-bold text-cyan-500">{analysis.confidenceScore || 75}%</p>
              </div>
              <div className="p-4 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                <Badge 
                  variant="outline" 
                  className={`text-sm mt-2 ${
                    analysis.riskLevel === 'HIGH' ? 'border-red-500 text-red-500' :
                    analysis.riskLevel === 'MEDIUM' ? 'border-yellow-500 text-yellow-500' :
                    'border-green-500 text-green-500'
                  }`}
                >
                  {analysis.riskLevel || 'MEDIUM'}
                </Badge>
              </div>
            </div>
            
            {/* AI Recommendation */}
            <div className="mt-4 p-4 rounded-lg bg-background/50">
              <div className="flex items-start gap-3">
                <Sparkles className={`h-5 w-5 mt-0.5 ${
                  analysis.recommendationLevel === 'STRONG_BET' ? 'text-green-500' :
                  analysis.recommendationLevel === 'AVOID' ? 'text-red-500' :
                  'text-yellow-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">
                    {analysis.recommendationLevel === 'STRONG_BET' ? '✅ Strong Bet' :
                     analysis.recommendationLevel === 'MODERATE_BET' ? '⚠️ Moderate Bet' :
                     analysis.recommendationLevel === 'WEAK_BET' ? '⚠️ Weak Bet' :
                     '❌ Avoid This Bet'}
                  </p>
                  <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
                  {analysis.usedAI && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Powered by AI
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Psychological Analysis (Premium Plus) */}
          {hasPsychAccess ? (
            <Card className="p-6 bg-linear-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Psychological Analysis
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-background/50">
                  <p className="text-sm font-medium text-foreground mb-2">Detected Biases</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.biasWarnings.map((bias: string) => (
                      <Badge key={bias} variant="destructive">{bias}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <p className="text-sm font-medium text-foreground mb-2">Emotional Alignment</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${analysis.emotionalAlignment}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{analysis.emotionalAlignment}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on your current emotional stability score
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50">
                  <p className="text-sm font-medium text-foreground mb-2">Recommendation</p>
                  <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-linear-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-6 w-6 text-purple-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Psychological Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Unlock bias detection and emotional alignment analysis
                    </p>
                  </div>
                </div>
                <Button onClick={() => onNavigateToTab("account")}>
                  Upgrade to Premium Plus
                </Button>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              className="flex-1" 
              variant="outline"
              onClick={handleSaveAnalysis}
              disabled={saving || saved}
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Analysis"}
                </>
              )}
            </Button>
            <Button className="flex-1" onClick={() => onNavigateToTab("behavior")}>
              Log This Bet
            </Button>
            <Button className="flex-1" variant="outline" onClick={copySummary}>Copy Summary</Button>
            <Button className="flex-1" variant="outline" onClick={shareSummary}>Share</Button>
          </div>
        </div>
      )}
    </div>
  )
}
