"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sparkles, Lock, TrendingUp, Brain, Shield, RefreshCw, Target, AlertTriangle, CheckCircle2, HelpCircle, ShoppingCart, Check } from "lucide-react"
import type { UserData } from "@/lib/types"
import { calculateEmotionalStability, getScoreColor, shouldReceiveAIPicks } from "@/lib/emotional-scoring"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"
import AIBetAdvisor from "@/components/ai-bet-advisor"
import { supabase } from "@/lib/supabase"
import { AIUsageIndicator } from "@/components/ai-usage-indicator"

interface MarketplaceProduct {
  id: string
  product_key: string
  display_name: string
  description: string
  price: number
  ai_picker_credits: number
  ai_bet_analyzer_credits: number
  is_bundle: boolean
}

interface AIPicksTabProps {
  userData: UserData
  onNavigateToTab: (tab: string) => void
}

function profitForAmericanOdds(stake: number, odds: number): number {
  if (!Number.isFinite(stake) || stake <= 0) return 0
  if (!Number.isFinite(odds) || odds === 0) return 0

  if (odds > 0) {
    return stake * (odds / 100)
  }
  return stake * (100 / Math.abs(odds))
}

function computeExpectedValueDollars(args: {
  stake: number
  odds: number
  pWin: number
  pLoss: number
  pPush?: number
}): number {
  const stake = Number.isFinite(args.stake) && args.stake > 0 ? args.stake : 0
  if (stake <= 0) return 0

  const pWin = Number.isFinite(args.pWin) ? args.pWin : 0.5
  const pLoss = Number.isFinite(args.pLoss) ? args.pLoss : 0.5
  const pPush = Number.isFinite(args.pPush) ? (args.pPush as number) : 0

  const profit = profitForAmericanOdds(stake, args.odds)
  return pWin * profit - pLoss * stake + pPush * 0
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function guessSideFromLine(args: {
  teamsText: string
  line: string
}): "home" | "away" | null {
  const teams = args.teamsText || ""
  const line = args.line || ""
  const parts = teams.split(" @ ")
  if (parts.length !== 2) return null
  const away = parts[0].trim()
  const home = parts[1].trim()

  const l = line.toLowerCase()
  if (home && l.includes(home.toLowerCase())) return "home"
  if (away && l.includes(away.toLowerCase())) return "away"
  return null
}

function getTop3Reasons(pick: any): { icon: any; title: string; explanation: string }[] {
  const reasons: { icon: any; title: string; explanation: string; priority: number }[] = []

  // Reason 1: High Confidence
  if (pick.confidence >= 75) {
    reasons.push({
      icon: Sparkles,
      title: "High Confidence Match",
      explanation: `Our AI model shows ${pick.confidence}% confidence in this pick based on historical data, team performance, and real-time odds analysis.`,
      priority: pick.confidence >= 85 ? 3 : 2
    })
  }

  // Reason 2: Positive Expected Value
  if (typeof pick.expectedValue === 'number' && Number.isFinite(pick.expectedValue) && pick.expectedValue > 0) {
    reasons.push({
      icon: TrendingUp,
      title: "Positive Expected Value",
      explanation: `This bet has an expected value of +$${pick.expectedValue.toFixed(2)}, meaning over time, this type of bet should be profitable based on the current odds and win probability.`,
      priority: pick.expectedValue > 10 ? 3 : pick.expectedValue > 5 ? 2 : 1
    })
  }

  // Reason 3: Strong Emotional Alignment
  if (pick.emotionalAlignment >= 75) {
    reasons.push({
      icon: Brain,
      title: "Strong Emotional Alignment",
      explanation: `Your current mental state (${pick.emotionalAlignment}% alignment) is well-suited for this type of bet, reducing the risk of emotionally-driven mistakes.`,
      priority: pick.emotionalAlignment >= 85 ? 3 : 2
    })
  }

  // Reason 4: Low Risk Profile
  if (pick.riskLevel === 'LOW') {
    reasons.push({
      icon: Shield,
      title: "Conservative Risk Profile",
      explanation: `This pick is classified as low-risk, making it a safer option that aligns with bankroll preservation strategies.`,
      priority: 2
    })
  }

  // Reason 5: Reasonable Suggested Stake
  if (pick.suggestedStake > 0 && pick.suggestedStake <= 100) {
    reasons.push({
      icon: Target,
      title: "Optimized Stake Size",
      explanation: `The suggested stake of $${pick.suggestedStake} is calculated using Kelly Criterion principles to maximize long-term growth while managing risk.`,
      priority: 1
    })
  }

  // Reason 6: Favorable Odds
  if (pick.odds > 0 && pick.odds >= 150) {
    reasons.push({
      icon: TrendingUp,
      title: "Favorable Underdog Odds",
      explanation: `At +${pick.odds}, this underdog pick offers strong potential returns while our models suggest the actual probability is higher than the implied odds.`,
      priority: 2
    })
  } else if (pick.odds < 0 && pick.odds >= -150) {
    reasons.push({
      icon: CheckCircle2,
      title: "Value on Favorite",
      explanation: `This favorite pick at ${pick.odds} odds represents good value based on our probability models and recent team performance trends.`,
      priority: 1
    })
  }

  // Sort by priority (highest first) and return top 3
  return reasons
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
}

export function AIPicksTab({ userData, onNavigateToTab }: AIPicksTabProps) {
  const tier = userData.subscriptionTier || "free"
  const hasAccess = tier !== "free" // All paid tiers get AI Picks; free sees paywall
  const cooldown = !!userData.cooldownEnabled
  
  const [loading, setLoading] = useState(false)
  const [isFetchingPicks, setIsFetchingPicks] = useState(false)
  const [lastPicksFetchAt, setLastPicksFetchAt] = useState<number | null>(null)
  const [picks, setPicks] = useState<any[]>([])
  const [emotionalStability, setEmotionalStability] = useState<any>(null)
  const [selectedSport, setSelectedSport] = useState('basketball_nba')
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')
  const [dailyBetCount, setDailyBetCount] = useState(0)
  const [activeSection, setActiveSection] = useState<'picks' | 'advisor' | 'marketplace'>('picks')

  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([])
  const [marketplaceLoading, setMarketplaceLoading] = useState(false)
  const [marketplacePurchasing, setMarketplacePurchasing] = useState<string | null>(null)

  // Calculate emotional stability when access changes or the user logs a new check-in
  useEffect(() => {
    if (hasAccess) {
      calculateUserStability()
    }
  }, [hasAccess, userData.lastEmotionCheckIn, userData.surveyData?.score])

  // If coming from Live Odds wanting AI Analyze My Bet, switch to advisor tab
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const flag = localStorage.getItem('aiAdvisorFromLiveOdds')
      if (flag) {
        setActiveSection('advisor')
        localStorage.removeItem('aiAdvisorFromLiveOdds')
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    if (!hasAccess) return
    if (activeSection !== 'marketplace') return
    if (marketplaceProducts.length > 0) return
    fetchMarketplaceProducts()
  }, [activeSection, hasAccess])

  const fetchMarketplaceProducts = async () => {
    setMarketplaceLoading(true)
    try {
      const res = await fetch('/api/marketplace/products')
      const data = await res.json()
      if (data?.success) {
        setMarketplaceProducts(data.products || [])
      } else {
        toast.error('Failed to load marketplace')
      }
    } catch (e) {
      toast.error('Failed to load marketplace')
    } finally {
      setMarketplaceLoading(false)
    }
  }

  const startMarketplacePurchase = async (productKey: string) => {
    setMarketplacePurchasing(productKey)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.info('Sign in required', { description: 'Please sign in to purchase additional AI uses.' })
        onNavigateToTab('account')
        return
      }

      const res = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ productKey }),
      })

      const data = await res.json()
      if (data?.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      toast.error('Purchase failed', { description: data?.error || 'Failed to start checkout.' })
    } catch (e: any) {
      toast.error('Purchase failed', { description: e?.message || 'Failed to start checkout.' })
    } finally {
      setMarketplacePurchasing(null)
    }
  }

  const calculateMarketplaceSavings = (product: MarketplaceProduct): string => {
    if (!product.is_bundle) return '0.00'

    const singlePickerPrice = 30
    const singleAnalyzerPrice = 30

    const separateTotal =
      product.ai_picker_credits * singlePickerPrice + product.ai_bet_analyzer_credits * singleAnalyzerPrice

    const savings = separateTotal - product.price
    return savings.toFixed(2)
  }

  // Initialize daily bet count to enforce daily limit when logging bets
  useEffect(() => {
    (async () => {
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
  }, [])

  // Previously, AI Picks would auto-fetch when sport or risk changed.
  // Now we only fetch when the user explicitly requests it (e.g., via the Refresh button),
  // so we don't consume weekly usage automatically.

  const calculateUserStability = async () => {
    try {
      const emotionLogs = await storage.getEmotionLogs()
      const trades = await storage.getTrades()
      const surveyScore = userData.surveyData?.score

      const stability = calculateEmotionalStability(emotionLogs, surveyScore, trades)
      setEmotionalStability(stability)
    } catch (error) {
      console.error('Error calculating emotional stability:', error)
      // Set default moderate stability
      setEmotionalStability({
        score: 50,
        level: 'MODERATE',
        recommendation: 'Unable to calculate stability. Proceed with caution.',
        factors: { recentEmotions: 50, emotionalVariance: 50, surveyScore: 50, bettingPatterns: 50 }
      })
    }
  }

  const fetchAIPicks = async () => {
    if (cooldown) {
      setPicks([])
      return
    }
    if (!emotionalStability) {
      console.log('AI Picks: No emotional stability data yet')
      return
    }

    const now = Date.now()
    if (isFetchingPicks) {
      console.log('AI Picks: Skipping fetch because a request is already in flight')
      return
    }
    if (lastPicksFetchAt && now - lastPicksFetchAt < 60_000) {
      console.log('AI Picks: Skipping fetch because last run was less than 60s ago')
      toast.info('SmartSlip Cooldown', {
        description: 'Please wait at least 60 seconds between SmartSlip runs.',
      })
      return
    }

    console.log('AI Picks: Fetching picks...', {
      sport: selectedSport,
      emotionalScore: emotionalStability.score,
      riskTolerance
    })
    setLoading(true)
    setIsFetchingPicks(true)
    try {
      let accessToken: string | undefined
      try {
        const { data } = await supabase.auth.getSession()
        accessToken = data.session?.access_token
        console.log('AI Picks: Got session, token exists:', !!accessToken)
      } catch (e) {
        console.warn("AI Picks: Failed to get Supabase session for JWT auth", e)
      }

      console.log('AI Picks: Making fetch request to /api/picker/recommend')
      const response = await fetch('/api/picker/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          sport: selectedSport,
          emotionalScore: emotionalStability.score,
          riskTolerance
        })
      })
      console.log('AI Picks: Fetch completed, status:', response.status)

      let responseData: any = null
      try {
        responseData = await response.json()
      } catch (e) {
        console.warn('AI Picks: Failed to parse JSON response', e)
      }

      if (!response.ok) {
        // Handle usage-limit / access errors (403) more gracefully
        if (response.status === 403 && responseData) {
          console.error('AI Picks: Usage or access error:', responseData)
          const description =
            responseData.error ||
            'Your current plan or weekly usage does not allow more SmartSlip picks right now.'

          toast.warning('SmartSlip Unavailable', {
            description,
          })

          if (responseData.marketplace_url) {
            toast.info('Need more AI uses?', {
              description: 'You can purchase additional AI credits in the marketplace.',
            })
          }
        } else {
          console.error('AI Picks: API error:', responseData || response.statusText)
        }

        throw new Error(`Failed to fetch AI picks: ${response.status}`)
      }

      const data = responseData as any
      console.log('AI Picks: Response data:', data)

      if (!data.shouldBet) {
        toast.warning('Emotional Stability Check', {
          description: data.message
        })
        setPicks([])
      } else {
        const recs = data.recommendations || []
        const probsByGameId = (data.probsByGameId || {}) as Record<
          string,
          { pLoss?: number; pPush?: number; pWin?: number }
        >

        const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
        const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
        const impliedProbFromAmericanOdds = (odds: number) => {
          if (!Number.isFinite(odds) || odds === 0) return 0.5
          return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)
        }

        const mappedPicks = recs.map((rec: any) => ({
          ...(rec.gameId ? { gameId: rec.gameId } : {}),
          sport: selectedSport,
          event: rec.teams || 'Matchup',
          pick: rec.line ? `${rec.betType} ${rec.line}` : rec.betType,
          odds: rec.odds,
          confidence: (() => {
            if (typeof rec.confidence === 'number' && Number.isFinite(rec.confidence)) {
              return clampPct(rec.confidence)
            }
            const odds = Number(rec.odds)
            return clampPct(impliedProbFromAmericanOdds(odds) * 100)
          })(),
          suggestedStake: rec.suggestedStakeAbsolute ?? 0,
          riskLevel: rec.riskLevel || 'MEDIUM',
          emotionalAlignment: (() => {
            if (typeof rec.emotionalAlignment === 'number' && Number.isFinite(rec.emotionalAlignment)) {
              return clampPct(rec.emotionalAlignment)
            }
            if (typeof data.emotionalScore === 'number' && Number.isFinite(data.emotionalScore)) {
              return clampPct(data.emotionalScore)
            }
            return 0
          })(),
          reasoning: rec.shortExplanation || '',
          commenceTime: rec.startTime,
          expectedValue: (() => {
            const odds = Number(rec.odds)
            const stake = Number(rec.suggestedStakeAbsolute ?? 0) || 0
            if (!Number.isFinite(odds) || odds === 0) return 0

            const gameId = rec.gameId ? String(rec.gameId) : undefined
            const probs = gameId ? probsByGameId[gameId] : undefined

            const side = guessSideFromLine({
              teamsText: String(rec.teams ?? ""),
              line: String(rec.line ?? ""),
            })

            if (probs && (typeof probs.pWin === "number" || typeof probs.pLoss === "number")) {
              const pWinHome = clamp01(Number(probs.pWin ?? 0.5))
              const pWinAway = clamp01(Number(probs.pLoss ?? (1 - pWinHome)))
              const pPush = clamp01(Number(probs.pPush ?? 0))

              if (side === "home") {
                return computeExpectedValueDollars({
                  stake: stake || 100,
                  odds,
                  pWin: pWinHome,
                  pLoss: clamp01(1 - pWinHome - pPush),
                  pPush,
                })
              }
              if (side === "away") {
                return computeExpectedValueDollars({
                  stake: stake || 100,
                  odds,
                  pWin: pWinAway,
                  pLoss: clamp01(1 - pWinAway - pPush),
                  pPush,
                })
              }
            }

            const implied = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)
            const pWin = clamp01(implied)
            const pLoss = clamp01(1 - pWin)
            return computeExpectedValueDollars({
              stake: stake || 100,
              odds,
              pWin,
              pLoss,
            })
          })(),
        }))

        setPicks(mappedPicks)
        if (mappedPicks.length > 0) {
          console.log(`AI Picks: Loaded ${mappedPicks.length} picks`)
          const meta = data.meta || {}
          if (!meta.usedGemini && !meta.usedSageMaker) {
            toast.info('Using Fallback Picks', {
              description: 'Real-time AI stack (heuristics + Gemini) is unavailable; using safer fallback logic.'
            })
          }
        } else {
          console.log('AI Picks: No picks available')
          toast.info('No Picks Available', {
            description: data.message || 'No games available for this sport at the moment.'
          })
        }
      }
    } catch (error) {
      console.error('Error fetching AI picks:', error)

      // Provide more specific error messages
      let errorMessage = 'Please try again'
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Unable to connect to the server. Check your internet connection or try restarting the dev server.'
        console.error('AI Picks: Network error - server may not be running or unreachable')
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error('Failed to load SmartSlip picks', {
        description: errorMessage
      })
      setPicks([])
    } finally {
      setLoading(false)
      setIsFetchingPicks(false)
      setLastPicksFetchAt(now)
    }
  }

  const handleAnalyzePick = (pick: any) => {
    try {
      const event = String(pick.event || '')
      const parts = event.split(' @ ')
      const awayTeam = parts[0]?.trim() || ''
      const homeTeam = parts[1]?.trim() || ''

      const payload = {
        sport: String(pick.sport || selectedSport || ''),
        homeTeam,
        awayTeam,
        defaultStake: Number(pick.suggestedStake) || 0,
        bestHomeOdds: undefined as any,
        bestAwayOdds: undefined as any,
      }

      try {
        window.localStorage.setItem('pendingBetAnalysis', JSON.stringify(payload))
      } catch {}

      setActiveSection('advisor')
      toast.info('TiltLab ready', { description: 'We pre-filled your bet. Review and run the AI analysis.' })
    } catch (e) {
      toast.error('Failed to open TiltLab')
    }
  }

  const handleLogBet = async (pick: any) => {
    if (cooldown) {
      toast.warning('Safety Guard Active', { description: 'Logging bets is limited while cooldown is enabled.' })
      return
    }

    if (typeof pick.expectedValue === 'number' && Number.isFinite(pick.expectedValue) && pick.expectedValue < 0) {
      toast.warning('Do not bet', { description: 'This pick has negative expected value based on current odds/probabilities.' })
      return
    }
    const limitReached = userData.dailyBetLimit != null && dailyBetCount >= userData.dailyBetLimit
    if (limitReached) {
      toast.warning('Daily Bet Limit Reached', { description: 'You have reached your daily bet limit.' })
      return
    }
    const suggested = Number(pick.suggestedStake)
    if (userData.maxStakeLimit != null && !Number.isNaN(suggested) && suggested > (userData.maxStakeLimit as number)) {
      toast.warning('Stake exceeds your max limit', { description: `Suggested stake $${suggested} exceeds your max $${userData.maxStakeLimit}.` })
      return
    }

    try {
      const event = String(pick.event || '')
      const parts = event.split(' @ ')
      const awayTeam = parts[0]?.trim() || ''
      const homeTeam = parts[1]?.trim() || ''

      const payload = {
        sport: String(pick.sport || selectedSport || ''),
        homeTeam,
        awayTeam,
        defaultStake: Number(pick.suggestedStake) || 0,
        bestHomeOdds: undefined as any,
        bestAwayOdds: undefined as any,
      }

      try {
        window.localStorage.setItem('pendingBetAnalysis', JSON.stringify(payload))
      } catch {}

      setActiveSection('advisor')
      toast.info('TiltLab ready', { description: 'We pre-filled your bet. Review and run the AI analysis.' })
    } catch (e) {
      toast.error('Failed to open TiltLab')
    }
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Insight Hub</h2>
          <p className="text-muted-foreground">
            Personalized bet suggestions based on your psychology + real-time data
          </p>
        </div>

        <Card className="p-12 text-center bg-linear-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-amber-500/20">
              <Lock className="h-12 w-12 text-amber-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Paid Feature</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            SmartSlip and TiltLab are available on paid plans (Premium, Premium Plus, Elite).
            Upgrade to unlock personalized bet recommendations and analysis.
          </p>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-4">
              What you'll get with paid plans (Elite includes more weekly uses):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-lg bg-background/50">
                <Sparkles className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-medium">AI-Generated Picks</p>
                <p className="text-xs text-muted-foreground mt-1">Straight bets, parlays, and props</p>
              </div>
              <div className="p-4 rounded-lg bg-background/50">
                <Brain className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Psychology-Filtered</p>
                <p className="text-xs text-muted-foreground mt-1">Aligned with your emotional state</p>
              </div>
              <div className="p-4 rounded-lg bg-background/50">
                <Shield className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Bankroll Optimization</p>
                <p className="text-xs text-muted-foreground mt-1">Personalized stake recommendations</p>
              </div>
            </div>
          </div>
          <Button size="lg" onClick={() => onNavigateToTab("account")}>
            View Subscription Plans
          </Button>
        </Card>

        {/* Preview of what's available */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 pointer-events-none blur-sm">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline">NBA</Badge>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-500">78% Confidence</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Lakers vs Warriors</h3>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 mb-3">
              <p className="text-xl font-bold text-primary">Lakers -3.5</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Value:</span>
                <span className="font-semibold text-green-500">+$8.50</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Emotional Alignment:</span>
                <span className="font-semibold">85%</span>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline">NFL</Badge>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-500">72% Confidence</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Chiefs vs Bills</h3>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 mb-3">
              <p className="text-xl font-bold text-primary">Over 52.5</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Value:</span>
                <span className="font-semibold text-green-500">+$6.20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Emotional Alignment:</span>
                <span className="font-semibold">90%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Insight Hub</h2>
        <p className="text-muted-foreground">
          Get AI-generated picks or analyze your own bets with comprehensive psychological insights
        </p>
      </div>

      <Tabs value={activeSection} onValueChange={(v: string) => setActiveSection(v as 'picks' | 'advisor' | 'marketplace')} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="picks">
            <Sparkles className="h-4 w-4 mr-2" />
            SmartSlip
          </TabsTrigger>
          <TabsTrigger value="advisor">
            <Brain className="h-4 w-4 mr-2" />
            TiltLab
          </TabsTrigger>
          <TabsTrigger value="marketplace">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Marketplace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="picks" className="space-y-6 mt-6">
      {/* Existing AI Picks content */}

      {(cooldown) && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Safety Guard Active</p>
              <p className="text-xs text-muted-foreground">SmartSlip picks are limited while cooldown is enabled.</p>
            </div>
          </div>
        </Card>
      )}
      {userData.dailyBetLimit != null && dailyBetCount >= userData.dailyBetLimit && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Daily Bet Limit Reached</p>
              <p className="text-xs text-muted-foreground">You have reached your daily bet limit.</p>
            </div>
          </div>
        </Card>
      )}

      {/* User Status Card */}
      {emotionalStability && (
        <Card className="p-6 bg-linear-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Your Current State
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                calculateUserStability()
                fetchAIPicks()
              }}
              disabled={loading || cooldown || isFetchingPicks}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">Emotional Stability</p>
              <p className={`text-3xl font-bold ${getScoreColor(emotionalStability.score)}`}>
                {emotionalStability.score}%
              </p>
              <Badge 
                variant={emotionalStability.score >= 70 ? 'default' : 'destructive'} 
                className="mt-2"
              >
                {emotionalStability.level.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">Recent Emotions</p>
              <p className="text-2xl font-bold text-blue-500">{emotionalStability.factors.recentEmotions}%</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">Consistency</p>
              <p className="text-2xl font-bold text-cyan-500">{emotionalStability.factors.emotionalVariance}%</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">Betting Patterns</p>
              <p className="text-2xl font-bold text-green-500">{emotionalStability.factors.bettingPatterns}%</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-background/50">
            <div className="flex items-start gap-2">
              {emotionalStability.score >= 70 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              )}
              <p className="text-sm text-muted-foreground">{emotionalStability.recommendation}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Sport and Risk Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Sport</label>
            <div className="flex flex-wrap gap-2">
              {['basketball_nba', 'americanfootball_nfl', 'baseball_mlb', 'icehockey_nhl'].map((sport) => (
                <Button
                  key={sport}
                  variant={selectedSport === sport ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSport(sport)}
                >
                  {sport.split('_')[1].toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Risk Tolerance</label>
            <div className="flex gap-2">
              {(['conservative', 'moderate', 'aggressive'] as const).map((risk) => (
                <Button
                  key={risk}
                  variant={riskTolerance === risk ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRiskTolerance(risk)}
                  className="flex-1 capitalize"
                >
                  {risk}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-spin" />
          <p className="text-lg font-semibold text-foreground">Generating SmartSlip Picks...</p>
          <p className="text-sm text-muted-foreground mt-2">Analyzing live odds and your emotional state</p>
        </Card>
      )}

      {/* No Picks State */}
      {!loading && picks.length === 0 && emotionalStability && emotionalStability.score < 70 && (
        <Card className="p-8 text-center bg-linear-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Take a Break</h3>
          <p className="text-muted-foreground mb-4">
            Your emotional stability score is {emotionalStability.score}/100. We recommend waiting until you're in a more stable state (70+) before placing bets.
          </p>
          <Button variant="outline" onClick={() => onNavigateToTab('behavior')}>
            Log Your Emotions
          </Button>
        </Card>
      )}

      {/* AI Picks */}
      {!loading && picks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {picks.map((pick: any, idx: number) => (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">{pick.sport.split('_')[1]?.toUpperCase() || 'SPORT'}</Badge>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-500 tabular-nums">{pick.confidence}% Confidence</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">{pick.event}</h3>

              <div className="p-4 rounded-lg bg-linear-to-br from-primary/20 to-accent/20 border border-primary/30 mb-4">
                <p className="text-2xl font-bold text-primary text-center">{pick.pick}</p>
                <p className="text-sm text-center text-muted-foreground mt-1 tabular-nums">
                  {pick.odds > 0 ? '+' : ''}{pick.odds}
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expected Value:</span>
                  <span className={`text-lg font-bold tabular-nums ${pick.expectedValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {pick.expectedValue >= 0 ? '+' : ''}${pick.expectedValue.toFixed(2)}
                  </span>
                </div>

                {typeof pick.expectedValue === 'number' && Number.isFinite(pick.expectedValue) && pick.expectedValue < 0 && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                    <p className="text-sm font-semibold text-red-500">Do not bet on this game</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This pick is currently negative EV. Consider skipping or waiting for a better line.
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Suggested Stake:</span>
                  <span className="text-lg font-semibold text-foreground tabular-nums">${pick.suggestedStake}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Risk Level:</span>
                  <Badge 
                    variant="outline"
                    className={`${
                      pick.riskLevel === 'HIGH' ? 'border-red-500 text-red-500' :
                      pick.riskLevel === 'MEDIUM' ? 'border-yellow-500 text-yellow-500' :
                      'border-green-500 text-green-500'
                    }`}
                  >
                    {pick.riskLevel}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Emotional Alignment:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${pick.emotionalAlignment}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{pick.emotionalAlignment}%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted mb-4">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{pick.reasoning}</p>
                </div>
              </div>

              {/* Why this pick? Accordion */}
              <Accordion type="single" collapsible className="mb-4">
                <AccordionItem value="reasons" className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <HelpCircle className="h-4 w-4" />
                      Why this pick?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 pt-2">
                    <div className="space-y-3">
                      {getTop3Reasons(pick).map((reason, reasonIdx) => {
                        const IconComponent = reason.icon
                        return (
                          <div key={reasonIdx} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                            <div className="shrink-0 p-2 rounded-lg bg-primary/10">
                              <IconComponent className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-semibold text-foreground mb-1">{reason.title}</h5>
                              <p className="text-xs text-muted-foreground leading-relaxed">{reason.explanation}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {(() => {
                const raw = pick.commenceTime
                if (!raw) return null
                const d = new Date(raw)
                if (!Number.isFinite(d.getTime())) return null
                return (
                  <p className="text-xs text-muted-foreground mb-4 text-center">
                    Starts: {d.toLocaleString()}
                  </p>
                )
              })()}

              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => handleAnalyzePick(pick)}>
                  <Target className="h-4 w-4 mr-2" />
                  Analyze
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleLogBet(pick)}
                  disabled={
                    cooldown ||
                    (userData.dailyBetLimit != null && dailyBetCount >= userData.dailyBetLimit) ||
                    (typeof pick.expectedValue === 'number' && Number.isFinite(pick.expectedValue) && pick.expectedValue < 0)
                  }
                >
                  Log Bet
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <Card className="p-4 bg-muted">
        <p className="text-xs text-muted-foreground text-center">
          <strong>Disclaimer:</strong> SmartSlip picks are suggestions based on data analysis and your behavioral profile.
          Always bet responsibly and never wager more than you can afford to lose.
        </p>
      </Card>
        </TabsContent>

        <TabsContent value="advisor" className="space-y-6 mt-6">
          <AIBetAdvisor />
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6 mt-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Buy More AI Uses</h3>
            <p className="text-muted-foreground">
              Purchase additional SmartSlip and TiltLab uses on top of your weekly plan limits.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <AIUsageIndicator />
          </div>

          {marketplaceLoading && (
            <Card className="p-8 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-muted-foreground">Loading marketplace…</p>
            </Card>
          )}

          {!marketplaceLoading && marketplaceProducts.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No products are available right now.</p>
              <div className="mt-4">
                <Button variant="outline" onClick={fetchMarketplaceProducts}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </Card>
          )}

          {!marketplaceLoading && marketplaceProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketplaceProducts.map((product) => (
                <Card
                  key={product.id}
                  className={`p-6 flex flex-col transition-all hover:shadow-lg ${
                    product.is_bundle ? 'border-purple-500/50 bg-linear-to-br from-purple-500/5 to-blue-500/5' : ''
                  }`}
                >
                  {product.is_bundle && (
                    <Badge className="w-fit mb-3" variant="default">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Bundle Deal - Save ${calculateMarketplaceSavings(product)}
                    </Badge>
                  )}

                  <h4 className="text-lg font-semibold mb-2">{product.display_name}</h4>
                  <p className="text-sm text-muted-foreground mb-4 grow">{product.description}</p>

                  <div className="mb-4 space-y-2 text-sm">
                    {product.ai_picker_credits > 0 && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>
                          SmartSlip:{' '}
                          <span className="font-medium">
                            +{product.ai_picker_credits} use{product.ai_picker_credits > 1 ? 's' : ''}
                          </span>
                        </span>
                      </div>
                    )}
                    {product.ai_bet_analyzer_credits > 0 && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>
                          TiltLab:{' '}
                          <span className="font-medium">
                            +{product.ai_bet_analyzer_credits} use{product.ai_bet_analyzer_credits > 1 ? 's' : ''}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <span className="text-2xl font-bold tabular-nums">${product.price.toFixed(2)}</span>
                      {product.is_bundle && <p className="text-xs text-muted-foreground">Best value!</p>}
                    </div>
                    <Button
                      onClick={() => startMarketplacePurchase(product.product_key)}
                      disabled={marketplacePurchasing === product.product_key}
                      className="gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {marketplacePurchasing === product.product_key ? 'Processing...' : 'Buy Now'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
