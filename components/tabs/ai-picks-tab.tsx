"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sparkles, Lock, TrendingUp, Brain, Shield, RefreshCw, Target, AlertTriangle, CheckCircle2, HelpCircle, ShoppingCart, Check, ExternalLink, X, Activity } from "lucide-react"
import type { UserData, EmotionLog } from "@/lib/types"
import { useEmotionalStability } from "@/lib/hooks/use-emotional-stability"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"
import AIBetAdvisor from "@/components/ai-bet-advisor"
import { ParlayCard } from "@/components/parlay-card"
import type { ParlayRecommendation } from "@/lib/types/ai-models"
import { supabase } from "@/lib/supabase"
import { AIUsageIndicator } from "@/components/ai-usage-indicator"
import { PremiumFeatureWall } from "@/components/premium-feature-wall"
import { getPopularSports, getSportById, getSportsGrouped, isSportInSeason, getSportAvailabilityStatus, getAvailabilityDotClasses, getAvailabilityTextClasses, type SportAvailabilityStatus } from "@/lib/sports-config"
import { SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"

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
    const evText = typeof pick.evPercentage === 'number' && Number.isFinite(pick.evPercentage)
      ? `+$${pick.expectedValue.toFixed(2)} (+${pick.evPercentage.toFixed(1)}%)`
      : `+$${pick.expectedValue.toFixed(2)}`
    reasons.push({
      icon: TrendingUp,
      title: "Positive Expected Value",
      explanation: `This bet has an expected value of ${evText}, meaning over time, this type of bet should be profitable based on the current odds and win probability.`,
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
  const [propPicks, setPropPicks] = useState<any[]>([])
  const [parlayPicks, setParlayPicks] = useState<ParlayRecommendation[]>([])
  const { score: emotionalScore, shouldReceiveAIPicks, color, level, recommendation } = useEmotionalStability(userData)
  const [selectedSport, setSelectedSport] = useState('basketball_nba')
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')
  const [dailyBetCount, setDailyBetCount] = useState(0)
  const [sportsWithData, setSportsWithData] = useState<Set<string>>(new Set())
  const [sportsInSeason, setSportsInSeason] = useState<Set<string>>(new Set())
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Get active section from URL
  const sectionFromPathname = (): 'picks' | 'advisor' | 'marketplace' => {
    if (pathname === '/betlab/smartslip') return 'picks'
    if (pathname === '/betlab/tiltlab') return 'advisor'
    if (pathname === '/betlab/marketplace') return 'marketplace'
    return 'picks' // default
  }

  // Local state for instant UI response; synced with pathname once route change lands
  const [localSection, setLocalSection] = useState<'picks' | 'advisor' | 'marketplace'>(sectionFromPathname())

  useEffect(() => {
    setLocalSection(sectionFromPathname())
  }, [pathname])

  const activeSection = localSection

  const setActiveSection = useCallback((section: 'picks' | 'advisor' | 'marketplace') => {
    setLocalSection(section) // instant UI update
    const routes = {
      'picks': '/betlab/smartslip',
      'advisor': '/betlab/tiltlab',
      'marketplace': '/betlab/marketplace'
    }
    router.push(routes[section])
  }, [router])

  // Anchored Risk state (research-backed risk assessment)
  const [anchoredRisk, setAnchoredRisk] = useState<{
    overallRisk: number
    riskLevel: string
    riskColor: string
    riskDescription: string
    confidence: number
    clinicalContext: string
    intervention: {
      type: string
      urgency: string
      message: string
      options: string[]
    }
    breakdown: {
      emotional: number
      behavioral: number
      demographic: number
    }
    researchIntegration: string[]
  } | null>(null)

  // Get available sports dynamically
  const availableSports = getPopularSports()
  const sportGroups = getSportsGrouped()

  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([])
  const [marketplaceLoading, setMarketplaceLoading] = useState(false)
  const [marketplacePurchasing, setMarketplacePurchasing] = useState<string | null>(null)

  // If coming from a previous flow wanting AI Analyze My Bet, switch to advisor tab
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      // Check for target section from URL parameters
      const targetSection = sessionStorage.getItem('targetSection')
      if (targetSection && ['picks', 'advisor', 'marketplace'].includes(targetSection)) {
        setActiveSection(targetSection as 'picks' | 'advisor' | 'marketplace')
        sessionStorage.removeItem('targetSection')
      }

      const flag = localStorage.getItem('aiAdvisorFromLiveOdds')
      if (flag) {
        setActiveSection('advisor')
        localStorage.removeItem('aiAdvisorFromLiveOdds')

        // Check for pre-filled game data
        const pendingGame = sessionStorage.getItem('pendingBetGame')
        if (pendingGame) {
          try {
            const gameData = JSON.parse(pendingGame)
            console.log('Pre-filled game data from live scores:', gameData)
            // Store the game data to be used by TiltLab
            sessionStorage.setItem('tiltLabPrefillData', pendingGame)
            // Show toast notification
            toast.success(`Game pre-filled: ${gameData.awayTeam} @ ${gameData.homeTeam}`, {
              description: "TiltLab is ready with your selected game"
            })
          } catch (e) {
            console.error('Error parsing pending game data:', e)
          }
        }
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
      } catch (error) {
        console.warn('[AI Picks] Failed to load daily bet count:', error)
      }
    })()
  }, [])

  // Fetch sports availability data to show accurate green/yellow/red indicators
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setAvailabilityLoading(true)
        const response = await fetch('/api/sports/availability')
        const data = await response.json()
        if (data.success) {
          if (Array.isArray(data.sportsWithData)) {
            setSportsWithData(new Set(data.sportsWithData))
          }
          if (Array.isArray(data.sportsInSeason)) {
            setSportsInSeason(new Set(data.sportsInSeason))
          }
        }
      } catch (error) {
        console.warn('[AI Picks] Failed to fetch sports availability:', error)
      } finally {
        setAvailabilityLoading(false)
      }
    }
    fetchAvailability()
    // Refresh availability every 5 minutes
    const interval = setInterval(fetchAvailability, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Previously, AI Picks would auto-fetch when sport or risk changed.
  // Now we only fetch when the user explicitly requests it (e.g., via the Refresh button),
  // so we don't consume weekly usage automatically.

  const fetchAIPicks = async (force: boolean = false) => {
    if (cooldown) {
      setPicks([])
      setPropPicks([])
      setParlayPicks([])
      return
    }
    if (!emotionalScore) {
      console.log('AI Picks: No emotional stability data yet')
      return
    }

    const now = Date.now()
    if (isFetchingPicks) {
      console.log('AI Picks: Skipping fetch because a request is already in flight')
      return
    }
    // Reduce cache to 30s to ensure user picks up my new multi-market logic
    if (!force && lastPicksFetchAt && now - lastPicksFetchAt < 1000 * 30) {
      console.log('AI Picks: Using cached picks (30s TTL)')
      setLoading(false)
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
      emotionalScore: emotionalScore,
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
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log('AI Picks: Request timeout, aborting...')
        controller.abort()
      }, 60000) // Increased timeout to 60 seconds for AI analysis + ML predictions

      let response: Response
      try {
        response = await fetch('/api/picker/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            sport: selectedSport,
            riskTolerance
          }),
          signal: controller.signal,
        })
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out. The AI analysis is taking longer than expected. Please try again.')
        }
        throw error
      } finally {
        clearTimeout(timeoutId)
      }
      console.log('AI Picks: Fetch completed, status:', response.status)

      let responseData: any = null
      try {
        responseData = await response.json()
        console.log('AI Picks: Response JSON parsed successfully')
      } catch (e) {
        console.warn('AI Picks: Failed to parse JSON response', e)
      }

      if (!response.ok) {
        console.log('AI Picks: Response not OK, handling error')
        // Handle usage-limit / access errors (403) more gracefully
        if (response.status === 403 && responseData && (responseData.error || responseData.usage_limit_reached || responseData.upgrade_required)) {
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
          // Reset loading states before returning
          setLoading(false)
          setIsFetchingPicks(false)
          setLastPicksFetchAt(now)
          // Don't throw error for handled 403 cases
          return
        } else {
          console.error('AI Picks: API error:', responseData || response.statusText)
          throw new Error(`Failed to fetch AI picks: ${response.status}`)
        }
      }

      const data = responseData as any
      console.log('AI Picks: Response data:', data)

      // Extract anchored risk data from response
      if (data.anchoredRisk) {
        console.log('AI Picks: Anchored risk data:', data.anchoredRisk)
        setAnchoredRisk(data.anchoredRisk)
      }

      // Show emotional warning as toast but ALWAYS process recommendations
      // so users can see game assessments regardless of emotional state
      if (!data.shouldBet && data.message) {
        console.log('AI Picks: shouldBet is false, showing emotional warning banner')
        toast.warning('Emotional Stability Check', {
          description: data.message
        })
      }

      {
        console.log('AI Picks: Processing recommendations (shouldBet=' + data.shouldBet + ')')
        const recs = data.recommendations || []
        const probsByGameId = (data.probsByGameId || {}) as Record<
          string,
          { pLoss?: number; pPush?: number; pWin?: number }
        >
        console.log('AI Picks: Processing', recs.length, 'recommendations')

        if (data.parlayRecommendations) {
          console.log('AI Picks: Setting', data.parlayRecommendations.length, 'parlay recommendations')
          setParlayPicks(data.parlayRecommendations)
        }

        // Set player prop recommendations
        if (data.propPicks) {
          console.log('AI Picks: Setting', data.propPicks.length, 'player prop recommendations')
          setPropPicks(data.propPicks)
        } else {
          setPropPicks([])
        }

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
          suggestedStake: (() => {
            // suggestedStakeAbsolute is already Kelly-sized from the API.
            // Apply the behavioral risk multiplier exactly once here.
            const stake = Number(rec.suggestedStakeAbsolute)
            const baseStake = Number.isFinite(stake) && stake > 0 ? stake : 5
            const multiplier = rec.riskAdjusted?.suggestedBetMultiplier ?? 1.0
            return Math.max(1, Math.round(baseStake * multiplier))
          })(),
          riskLevel: rec.riskAdjusted?.riskLevel || rec.riskLevel || 'MEDIUM',
          // Pass the risk-adjusted metadata to the UI
          riskAdjusted: rec.riskAdjusted,
          emotionalAlignment: (() => {
            // Try API-returned emotional alignment from recommendation first
            if (typeof rec.emotionalAlignment === 'number' && Number.isFinite(rec.emotionalAlignment) && rec.emotionalAlignment > 0) {
              return clampPct(rec.emotionalAlignment)
            }

            // Try the emotional score passed to API
            if (typeof data.emotionalScore === 'number' && Number.isFinite(data.emotionalScore) && data.emotionalScore > 0) {
              return clampPct(data.emotionalScore)
            }

            // Try to get emotional score from userData if available
            if (typeof userData.dailyRings?.emotionalAwareness === 'number' && userData.dailyRings.emotionalAwareness > 0) {
              return clampPct(userData.dailyRings.emotionalAwareness)
            }

            // Fallback to a reasonable default
            return 75
          })(),
          reasoning: rec.shortExplanation || '',
          commenceTime: rec.startTime,
          expectedValue: (() => {
            if (rec.numericRisk && typeof rec.numericRisk.ev === 'number' && Number.isFinite(rec.numericRisk.ev)) {
              return rec.numericRisk.ev
            }
            return 0
          })(),
          evPercentage: (() => {
            if (rec.numericRisk && typeof rec.numericRisk.evPercentage === 'number' && Number.isFinite(rec.numericRisk.evPercentage)) {
              return rec.numericRisk.evPercentage
            }
            return 0
          })(),
          // isRecommended is set by the backend based on relative value comparison
          // This is used for badge display, decoupled from EV sign
          isRecommended: rec.isRecommended ?? undefined,
          informational: rec.informational ?? false,
          informationalLabel: rec.informationalLabel ?? undefined,
        }))

        console.log('AI Picks: Mapped picks created, setting picks state')
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
          console.log('AI Picks: No picks available after mapping')
          toast.info('No Picks Available', {
            description: data.message || 'No games available for this sport at the moment.'
          })
        }
      }
    } catch (error) {
      console.error('AI Picks: Error in fetchAIPicks:', error)

      // Provide more specific error messages
      let errorMessage = 'Please try again'
      const isAbort = (error as any)?.name === 'AbortError'
      if (isAbort) {
        errorMessage = 'SmartSlip timed out. Please try again in a moment.'
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Unable to connect to the server. Check your internet connection or try restarting the dev server.'
        console.error('AI Picks: Network error - server may not be running or unreachable')
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast.error('Failed to load SmartSlip picks', {
        description: errorMessage
      })
      setPicks([])
      setPropPicks([])
      setParlayPicks([])
    } finally {
      console.log('AI Picks: Reached finally block, clearing loading states')
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
      } catch (error) {
        console.warn('[AI Picks] Failed to save pending bet to localStorage:', error)
      }

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

    // Only block if pick is explicitly NOT recommended (not just negative EV)
    // Recommended picks can have negative EV due to sportsbook vig
    if (pick.isRecommended === false) {
      toast.warning('Not Recommended', { description: 'The opposite team offers better value. Consider that pick instead.' })
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
      } catch (error) {
        console.warn('[AI Picks] Failed to save pending bet to localStorage:', error)
      }

      setActiveSection('advisor')
      toast.info('TiltLab ready', { description: 'We pre-filled your bet. Review and run the AI analysis.' })
    } catch (e) {
      toast.error('Failed to open TiltLab')
    }
  }


  const handleAnalyzeParlay = (parlay: ParlayRecommendation) => {
    try {
      window.localStorage.setItem('pendingParlayAnalysis', JSON.stringify(parlay))
      // Notify TiltLab component (may already be mounted and won't re-read on its own)
      window.dispatchEvent(new Event('loadParlayAnalysis'))
      setActiveSection('advisor')
      toast.info('TiltLab Ready', { description: 'Parlay loaded into TiltLab for risk analysis.' })
    } catch (e) {
      toast.error('Failed to load parlay')
    }
  }

  const handleBuildParlaySlip = (parlay: ParlayRecommendation) => {
    // For now, redirect to advisor/slip builder.
    // In future, this could open a quick-bet slip drawer.
    handleAnalyzeParlay(parlay)
  }

  const handleEmotionCheckInParlay = (parlay: ParlayRecommendation) => {
    // Save parlay to localStorage and open emotion check-in dialog
    try {
      window.localStorage.setItem('pendingParlayEmotionCheckIn', JSON.stringify(parlay))
      // Trigger emotion check-in dialog
      const event = new CustomEvent('openEmotionCheckIn', {
        detail: { preSelectedParlay: parlay }
      })
      window.dispatchEvent(event)
      toast.info('Emotion Check-In Ready', { description: 'How are you feeling about this parlay?' })
    } catch (e) {
      toast.error('Failed to open emotion check-in')
    }
  }

  if (!hasAccess) {
    return (
      <PremiumFeatureWall
        title="Insight Hub"
        description="Personalized bet suggestions based on your psychology + real-time data"
        featureName="SmartSlip and TiltLab"
        onUpgrade={() => onNavigateToTab("account")}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeSection} onValueChange={(v: string) => setActiveSection(v as 'picks' | 'advisor' | 'marketplace')} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="picks" className="flex-col xs:flex-row gap-1 xs:gap-2 py-2 px-1 xs:px-3 text-xs xs:text-sm min-h-[44px]">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="truncate">SmartSlip</span>
          </TabsTrigger>
          <TabsTrigger value="advisor" className="flex-col xs:flex-row gap-1 xs:gap-2 py-2 px-1 xs:px-3 text-xs xs:text-sm min-h-[44px]">
            <Brain className="h-4 w-4 shrink-0" />
            <span className="truncate">TiltLab</span>
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex-col xs:flex-row gap-1 xs:gap-2 py-2 px-1 xs:px-3 text-xs xs:text-sm min-h-[44px]">
            <ShoppingCart className="h-4 w-4 shrink-0" />
            <span className="truncate">Shop</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="picks" className="space-y-6 mt-6">
          <div>
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
            {emotionalScore !== null && (
              <Card className="p-6 bg-linear-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Your Emotional State
                  </h3>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Emotional Stability</p>
                    <p className={`text-3xl font-bold ${color}`}>
                      {emotionalScore}%
                    </p>
                    <Badge
                      variant={emotionalScore >= 60 ? 'default' : 'destructive'}
                      className="mt-2"
                    >
                      {level?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <p className={`text-2xl font-bold ${emotionalScore >= 60 ? 'text-green-500' : 'text-yellow-500'}`}>
                      {emotionalScore >= 60 ? 'Ready' : 'Caution'}
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">AI Access</p>
                    <p className={`text-2xl font-bold ${shouldReceiveAIPicks ? 'text-green-500' : 'text-red-500'}`}>
                      {shouldReceiveAIPicks ? 'Available' : 'Limited'}
                    </p>
                  </div>
                  <Button
                    onClick={() => fetchAIPicks(true)}
                    variant="ghost"
                    className="h-full w-full flex flex-col items-center justify-center p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border-none"
                    disabled={loading || cooldown || isFetchingPicks}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Action</p>
                    <div className="flex items-center gap-2">
                      {loading || isFetchingPicks ? (
                        <RefreshCw className="h-5 w-5 animate-spin text-purple-500" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-purple-500" />
                      )}
                      <span className="text-2xl font-bold text-foreground">
                        {lastPicksFetchAt === null ? 'Run' : 'Run Again'}
                      </span>
                    </div>
                  </Button>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-background/50">
                  <div className="flex items-start gap-2">
                    {emotionalScore >= 60 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    )}
                    <p className="text-sm text-muted-foreground">{recommendation}</p>
                  </div>
                </div>

                {!hasAccess && (
                  <div className="mt-4 p-4 rounded-lg bg-linear-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Want AI Picks?</p>
                        <p className="text-xs text-muted-foreground">Upgrade to get personalized betting recommendations</p>
                      </div>
                      <Button size="sm" onClick={() => setActiveSection('marketplace')}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Upgrade
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Sport and Risk Controls */}
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Select Sport / League</label>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger className="w-full h-12 border-2 border-border bg-muted/40 hover:bg-muted/70 transition-colors rounded-lg px-4 text-base">
                      <SelectValue placeholder="Choose a sport / league...">
                        {(() => {
                          const sport = getSportById(selectedSport);
                          if (!sport) return 'Choose a sport / league...';
                          const availability = getSportAvailabilityStatus(sport.id, sportsWithData, sportsInSeason);
                          const groupLabel = sportGroups.find(g => g.sports.some(s => s.id === sport.id))
                          return (
                            <span className="flex items-center gap-2">
                              <span className="text-lg">{sport.icon}</span>
                              <span className="font-medium">{sport.displayName}</span>
                              {groupLabel && (
                                <span className="text-xs text-muted-foreground">({groupLabel.label})</span>
                              )}
                              <span className={`inline-block w-2.5 h-2.5 rounded-full ${getAvailabilityDotClasses(availability.status)}`} />
                            </span>
                          );
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {sportGroups.map((group, gi) => (
                        <SelectGroup key={group.label}>
                          {gi > 0 && <SelectSeparator />}
                          <SelectLabel className="font-semibold text-xs uppercase tracking-wider py-2">
                            {group.icon} {group.label} ({group.sports.length})
                          </SelectLabel>
                          {group.sports.map((sport) => {
                            const availability = getSportAvailabilityStatus(sport.id, sportsWithData, sportsInSeason);
                            return (
                              <SelectItem
                                key={sport.id}
                                value={sport.id}
                                className={getAvailabilityTextClasses(availability.status)}
                              >
                                <span className="flex items-center gap-2 w-full">
                                  <span>{sport.icon}</span>
                                  <span className="flex-1">{sport.displayName}</span>
                                  <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${getAvailabilityDotClasses(availability.status)}`} />
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500"></div>
                      <span>Live Data</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500"></div>
                      <span>In Season (No Games)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500"></div>
                      <span>Off Season</span>
                    </div>
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
                <p className="text-sm text-muted-foreground mt-2">Analyzing available data and your emotional state</p>
              </Card>
            )}

            {/* Emotional Warning Banner — shows ABOVE picks, doesn't hide them */}
            {!loading && emotionalScore !== null && emotionalScore < 60 && (
              <Card className="p-4 bg-linear-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Emotional stability: {emotionalScore}/100 — We recommend caution before placing wagers.
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Game analysis is shown below for informational purposes.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onNavigateToTab('behavior')}>
                    Log Emotions
                  </Button>
                </div>
              </Card>
            )}
            {/* True empty state — no games found at all */}
            {!loading && picks.length === 0 && emotionalScore !== null && (
              <Card className="p-8 text-center bg-linear-to-br from-slate-500/10 to-slate-900/10 border-slate-500/30">
                <Sparkles className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Games Available</h3>
                <p className="text-muted-foreground mb-4">
                  SmartSlip couldn&apos;t find any upcoming games for this league right now.
                </p>
                <p className="text-xs text-muted-foreground">
                  Try a different sport or check back closer to game time.
                </p>
              </Card>
            )}

            {/* SmartSlip Picks - Primary Recommendations */}
            {!loading && picks.length > 0 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    <h3 className="text-lg font-semibold text-foreground">SmartSlip Analysis</h3>
                    <Badge variant="secondary" className="bg-slate-500/10 text-slate-400 border-slate-500/20">
                      {picks.length} {picks.length === 1 ? 'Game' : 'Games'} Assessed
                    </Badge>
                    {picks.filter(p => p.isRecommended).length > 0 && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                        {picks.filter(p => p.isRecommended).length} AI Edge{picks.filter(p => p.isRecommended).length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {picks.filter(p => p.informational).length > 0 && picks.filter(p => p.isRecommended).length === 0 && (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        No edges — markets are efficient
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {picks.map((pick: any, idx: number) => (
                      <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-2 items-center flex-wrap">
                            <Badge variant="outline">{pick.sport.split('_')[1]?.toUpperCase() || 'SPORT'}</Badge>
                            {pick.riskAdjusted && pick.riskAdjusted.recommendation !== 'PROCEED' && (
                              <Badge variant="outline" className={`
                            ${pick.riskAdjusted.recommendation === 'TAKE_BREAK' ? 'border-red-500 text-red-500 bg-red-500/10' :
                                  pick.riskAdjusted.recommendation === 'SKIP' ? 'border-orange-500 text-orange-500 bg-orange-500/10' :
                                    'border-yellow-500 text-yellow-500 bg-yellow-500/10'
                                }
                          `}>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {pick.riskAdjusted.recommendation === 'TAKE_BREAK' ? 'Risk: Take Break' :
                                  pick.riskAdjusted.recommendation === 'SKIP' ? 'Risk: Skip' :
                                    'Risk: Caution'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {pick.isRecommended ? (
                              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                AI Edge
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                {pick.informationalLabel ?? "Market Efficient"}
                              </Badge>
                            )}
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-semibold text-amber-500 tabular-nums">
                              {pick.confidence}%
                            </span>
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
                            <div className="text-right">
                              <span
                                className={`text-lg font-bold tabular-nums ${pick.expectedValue >= 0 ? 'text-green-500' : 'text-red-500'
                                  }`}
                              >
                                {pick.expectedValue >= 0 ? '+' : ''}
                                {pick.expectedValue.toFixed(2)}
                              </span>
                              {typeof pick.evPercentage === 'number' && Number.isFinite(pick.evPercentage) && (
                                <span
                                  className={`text-sm ml-2 tabular-nums ${pick.evPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                                    }`}
                                >
                                  ({pick.evPercentage >= 0 ? '+' : ''}
                                  {pick.evPercentage.toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Show warning only for NOT recommended picks (not just negative EV, since recommended picks can have negative EV due to vig) */}
                          {pick.isRecommended === false && (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                              <p className="text-sm font-semibold text-red-500">Not Recommended</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                The opposite team offers better relative value. Look for the "Recommended" badge on the other team.
                              </p>
                            </div>
                          )}
                          {/* Show EV info for recommended picks with negative EV (explains vig situation) */}
                          {pick.isRecommended === true && typeof pick.expectedValue === 'number' && Number.isFinite(pick.expectedValue) && pick.expectedValue < 0 && (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                              <p className="text-sm font-semibold text-amber-600">Negative EV Due to Vig</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Both teams show negative EV due to sportsbook vig. This team offers the best relative value.
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
                              className={`${pick.riskLevel === 'HIGH' ? 'border-red-500 text-red-500' :
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
                              pick.isRecommended === false
                            }
                          >
                            Log Bet
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Player Props Section */}
                  {!loading && propPicks.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-foreground">Player Props</h3>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          {propPicks.filter(p => p.isRecommended).length} Recommended
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {propPicks.map((prop, idx) => (
                          <Card key={idx} className={`p-4 border ${prop.isRecommended ? 'border-green-500/30 bg-green-500/5' : 'border-muted'}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-foreground">{prop.playerName}</p>
                                <p className="text-sm text-muted-foreground">{prop.teams}</p>
                              </div>
                              <Badge variant={prop.isRecommended ? "default" : "secondary"} className={prop.isRecommended ? "bg-green-500" : ""}>
                                {prop.isRecommended ? "BET" : "PASS"}
                              </Badge>
                            </div>
                            <div className="mb-3">
                              <p className="text-lg font-bold text-foreground">
                                {prop.propDirection === 'over' ? 'Over' : 'Under'} {prop.propLine} {prop.line?.split(' ').slice(-1)[0] || ''}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Odds: {prop.odds > 0 ? '+' : ''}{prop.odds}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="bg-background/50 p-2 rounded">
                                <p className="text-xs text-muted-foreground">EV</p>
                                <p className={`font-semibold ${(prop.numericRisk?.evPercentage || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {(prop.numericRisk?.evPercentage || 0) > 0 ? '+' : ''}{(prop.numericRisk?.evPercentage || 0).toFixed(1)}%
                                </p>
                              </div>
                              <div className="bg-background/50 p-2 rounded">
                                <p className="text-xs text-muted-foreground">Confidence</p>
                                <p className="font-semibold text-foreground">{prop.confidence}%</p>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleAnalyzePick(prop)}
                              >
                                <Brain className="h-4 w-4 mr-1" />
                                Analyze
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleLogBet(prop)}
                                disabled={!prop.isRecommended}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Log Bet
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Smart Parlays Section - Additional Options */}
                  {!loading && parlayPicks.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        <h3 className="text-lg font-semibold text-foreground">Smart Parlays</h3>
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                          High Value Combinations
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {parlayPicks.map((parlay, idx) => (
                          <ParlayCard
                            key={idx}
                            parlay={parlay}
                            onAnalyze={handleAnalyzeParlay}
                            onLogBet={handleBuildParlaySlip}
                            onEmotionCheckIn={handleEmotionCheckInParlay}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Anchored Risk Assessment Card - shown after picks */}
            {anchoredRisk && (
              <Card className={`p-6 border-2 ${anchoredRisk.riskColor === 'green' ? 'border-green-500/30 bg-green-500/5' :
                anchoredRisk.riskColor === 'yellow' ? 'border-yellow-500/30 bg-yellow-500/5' :
                  anchoredRisk.riskColor === 'orange' ? 'border-orange-500/30 bg-orange-500/5' :
                    'border-red-500/30 bg-red-500/5'
                }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Activity className={`h-5 w-5 ${anchoredRisk.riskColor === 'green' ? 'text-green-500' :
                      anchoredRisk.riskColor === 'yellow' ? 'text-yellow-500' :
                        anchoredRisk.riskColor === 'orange' ? 'text-orange-500' :
                          'text-red-500'
                      }`} />
                    Research-Anchored Risk Assessment
                  </h3>
                  <Badge variant="outline" className={`${anchoredRisk.riskColor === 'green' ? 'border-green-500 text-green-500' :
                    anchoredRisk.riskColor === 'yellow' ? 'border-yellow-500 text-yellow-500' :
                      anchoredRisk.riskColor === 'orange' ? 'border-orange-500 text-orange-500' :
                        'border-red-500 text-red-500'
                    }`}>
                    {anchoredRisk.riskLevel} Risk
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Overall Risk</p>
                    <p className={`text-3xl font-bold ${anchoredRisk.riskColor === 'green' ? 'text-green-500' :
                      anchoredRisk.riskColor === 'yellow' ? 'text-yellow-500' :
                        anchoredRisk.riskColor === 'orange' ? 'text-orange-500' :
                          'text-red-500'
                      }`}>
                      {(anchoredRisk.overallRisk * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <p className="text-3xl font-bold text-foreground">
                      {(anchoredRisk.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Intervention</p>
                    <p className={`text-lg font-bold capitalize ${anchoredRisk.intervention.urgency === 'none' ? 'text-green-500' :
                      anchoredRisk.intervention.urgency === 'low' ? 'text-yellow-500' :
                        anchoredRisk.intervention.urgency === 'medium' ? 'text-orange-500' :
                          'text-red-500'
                      }`}>
                      {anchoredRisk.intervention.urgency === 'none' ? 'None Needed' : anchoredRisk.intervention.urgency}
                    </p>
                  </div>
                </div>

                {/* Risk Breakdown */}
                {anchoredRisk.breakdown && (
                  <div className="p-4 rounded-lg bg-background/50 mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Risk Breakdown (Research-Weighted)</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Emotional Tilt (80%)</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (anchoredRisk.breakdown.emotional ?? 0) * 125)}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums w-12 text-right">{((anchoredRisk.breakdown.emotional ?? 0) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Behavioral (10%)</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (anchoredRisk.breakdown.behavioral ?? 0) * 1000)}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums w-12 text-right">{((anchoredRisk.breakdown.behavioral ?? 0) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Demographic (10%)</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-amber-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (anchoredRisk.breakdown.demographic ?? 0) * 1000)}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums w-12 text-right">{((anchoredRisk.breakdown.demographic ?? 0) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clinical Context */}
                <div className="p-3 rounded-lg bg-muted mb-4">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-foreground font-medium">{anchoredRisk.clinicalContext}</p>
                      {anchoredRisk.intervention.urgency !== 'none' && (
                        <p className="text-xs text-muted-foreground mt-1">{anchoredRisk.intervention.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Research Citations */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Backed by:</span>
                  {anchoredRisk.researchIntegration.map((study, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {study}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Disclaimer */}
            <Card className="p-4 bg-muted">
              <p className="text-xs text-muted-foreground text-center">
                <strong>Disclaimer:</strong> SmartSlip picks are suggestions based on data analysis and your behavioral profile.
                Always bet responsibly and never wager more than you can afford to lose.
              </p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advisor" className="space-y-6 mt-6">
          <AIBetAdvisor onNavigateToTab={onNavigateToTab} />
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
                  className={`p-6 flex flex-col transition-all hover:shadow-lg ${product.is_bundle ? 'border-purple-500/50 bg-linear-to-br from-purple-500/5 to-blue-500/5' : ''
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
