"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sparkles, Lock, TrendingUp, Brain, Shield, RefreshCw, Target, AlertTriangle, CheckCircle2, HelpCircle, ShoppingCart, Check, ExternalLink, X } from "lucide-react"
import type { UserData, EmotionLog } from "@/lib/types"
import { useEmotionalStability } from "@/lib/hooks/use-emotional-stability"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"
import AIBetAdvisor from "@/components/ai-bet-advisor"
import { supabase } from "@/lib/supabase"
import { AIUsageIndicator } from "@/components/ai-usage-indicator"
import { PremiumFeatureWall } from "@/components/premium-feature-wall"
import { getPopularSports, getSportById } from "@/lib/sports-config"

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
  const { score: emotionalScore, shouldReceiveAIPicks, color, level, recommendation } = useEmotionalStability(userData)
  const [selectedSport, setSelectedSport] = useState('basketball_nba')
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')
  const [dailyBetCount, setDailyBetCount] = useState(0)
  const [activeSection, setActiveSection] = useState<'picks' | 'advisor' | 'marketplace'>('picks')
  
  // Get available sports dynamically
  const availableSports = getPopularSports()

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
      } catch {}
    })()
  }, [])

  // Previously, AI Picks would auto-fetch when sport or risk changed.
  // Now we only fetch when the user explicitly requests it (e.g., via the Refresh button),
  // so we don't consume weekly usage automatically.

  const fetchAIPicks = async () => {
    if (cooldown) {
      setPicks([])
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

      if (!data.shouldBet) {
        console.log('AI Picks: shouldBet is false, showing warning')
        toast.warning('Emotional Stability Check', {
          description: data.message
        })
        setPicks([])
      } else {
        console.log('AI Picks: shouldBet is true, processing recommendations')
        const recs = data.recommendations || []
        const probsByGameId = (data.probsByGameId || {}) as Record<
          string,
          { pLoss?: number; pPush?: number; pWin?: number }
        >
        console.log('AI Picks: Processing', recs.length, 'recommendations')

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
            // Debug logging
            console.log('AI Picks: Emotional alignment data', {
              recAlignment: rec.emotionalAlignment,
              emotionalScore: data.emotionalScore,
              recData: rec
            })

            // Try API-returned emotional alignment first
            if (typeof rec.emotionalAlignment === 'number' && Number.isFinite(rec.emotionalAlignment) && rec.emotionalAlignment > 0) {
              const aligned = clampPct(rec.emotionalAlignment)
              console.log('AI Picks: Using rec.emotionalAlignment:', aligned)
              return aligned
            }

            // Try the emotional score passed to API
            if (typeof data.emotionalScore === 'number' && Number.isFinite(data.emotionalScore) && data.emotionalScore > 0) {
              const aligned = clampPct(data.emotionalScore)
              console.log('AI Picks: Using data.emotionalScore:', aligned)
              return aligned
            }

            // Try to get emotional score from userData if available
            if (typeof userData.dailyRings?.emotionalAwareness === 'number' && userData.dailyRings.emotionalAwareness > 0) {
              const aligned = clampPct(userData.dailyRings.emotionalAwareness)
              console.log('AI Picks: Using userData.dailyRings.emotionalAwareness:', aligned)
              return aligned
            }

            // Fallback to a reasonable default instead of 0
            console.log('AI Picks: Using fallback emotional alignment: 75')
            return 75
          })(),
          reasoning: rec.shortExplanation || '',
          commenceTime: rec.startTime,
          expectedValue: (() => {
            // Try to use EV from API response first (from numericRisk.ev)
            if (rec.numericRisk && typeof rec.numericRisk.ev === 'number' && Number.isFinite(rec.numericRisk.ev)) {
              console.log('AI Picks: Using EV from API response:', rec.numericRisk.ev)
              return rec.numericRisk.ev
            }

            // Fallback to calculating EV if not provided
            const odds = Number(rec.odds)
            const stake = Number(rec.suggestedStakeAbsolute ?? 0)

            // Debug logging
            console.log('AI Picks: EV calculation data', {
              odds,
              stake,
              suggestedStakeAbsolute: rec.suggestedStakeAbsolute,
              rec
            })

            if (!Number.isFinite(odds) || odds === 0 || stake <= 0) {
              console.log('AI Picks: EV calculation returning 0 - invalid odds or stake')
              return 0
            }

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
                const ev = computeExpectedValueDollars({
                  stake,
                  odds,
                  pWin: pWinHome,
                  pLoss: clamp01(1 - pWinHome - pPush),
                  pPush,
                })
                console.log('AI Picks: EV calculated (home side):', ev)
                return ev
              }
              if (side === "away") {
                const ev = computeExpectedValueDollars({
                  stake,
                  odds,
                  pWin: pWinAway,
                  pLoss: clamp01(1 - pWinAway - pPush),
                  pPush,
                })
                console.log('AI Picks: EV calculated (away side):', ev)
                return ev
              }
            }

            const implied = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)
            const pWin = clamp01(implied)
            const pLoss = clamp01(1 - pWin)
            const ev = computeExpectedValueDollars({
              stake,
              odds,
              pWin,
              pLoss,
            })
            console.log('AI Picks: EV calculated (implied probability):', ev)
            return ev
          })(),
          evPercentage: (() => {
            // Try to use evPercentage from API response first (from numericRisk.evPercentage)
            if (rec.numericRisk && typeof rec.numericRisk.evPercentage === 'number' && Number.isFinite(rec.numericRisk.evPercentage)) {
              console.log('AI Picks: Using evPercentage from API response:', rec.numericRisk.evPercentage)
              return rec.numericRisk.evPercentage
            }

            // Fallback to calculating evPercentage if not provided
            const stake = Number(rec.suggestedStakeAbsolute ?? 0)
            if (stake <= 0) {
              console.log('AI Picks: evPercentage calculation returning 0 - invalid stake')
              return 0
            }

            // Use the EV we already calculated or will calculate
            let ev = 0
            if (rec.numericRisk && typeof rec.numericRisk.ev === 'number' && Number.isFinite(rec.numericRisk.ev)) {
              ev = rec.numericRisk.ev
            } else {
              // Recalculate EV for percentage calculation
              const odds = Number(rec.odds)
              if (Number.isFinite(odds) && odds !== 0) {
                const implied = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)
                const pWin = clamp01(implied)
                const pLoss = clamp01(1 - pWin)
                ev = computeExpectedValueDollars({ stake, odds, pWin, pLoss })
              }
            }

            const evPct = (ev / stake) * 100
            console.log('AI Picks: Calculated evPercentage:', evPct)
            return evPct
          })(),
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
      {emotionalScore !== null && (
        <Card className="p-6 bg-linear-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Your Emotional State
            </h3>
            {hasAccess ? (
              <Button
                onClick={() => {
                  fetchAIPicks()
                }}
                variant="outline"
                size="sm"
                className="bg-background/50 hover:bg-background/80"
                disabled={loading || cooldown || isFetchingPicks}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Upgrade to refresh
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">Emotional Stability</p>
              <p className={`text-3xl font-bold ${color}`}>
                {emotionalScore}%
              </p>
              <Badge 
                variant={emotionalScore >= 70 ? 'default' : 'destructive'} 
                className="mt-2"
              >
                {level?.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <p className={`text-2xl font-bold ${emotionalScore >= 70 ? 'text-green-500' : 'text-yellow-500'}`}>
                {emotionalScore >= 70 ? 'Ready' : 'Caution'}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground mb-1">AI Access</p>
              <p className={`text-2xl font-bold ${shouldReceiveAIPicks ? 'text-green-500' : 'text-red-500'}`}>
                {shouldReceiveAIPicks ? 'Available' : 'Limited'}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-background/50">
            <div className="flex items-start gap-2">
              {emotionalScore >= 70 ? (
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
            <label className="text-sm font-medium text-foreground mb-2 block">Sport</label>
            <div className="flex flex-wrap gap-2">
              {availableSports.map((sport) => (
                <Button
                  key={sport.id}
                  variant={selectedSport === sport.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSport(sport.id)}
                  title={sport.displayName}
                >
                  {sport.icon} {sport.name}
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
          <p className="text-sm text-muted-foreground mt-2">Analyzing available data and your emotional state</p>
        </Card>
      )}

      {/* No Picks State */}
      {!loading && picks.length === 0 && emotionalScore !== null && emotionalScore < 70 && (
        <Card className="p-8 text-center bg-linear-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Take a Break</h3>
          <p className="text-muted-foreground mb-4">
            Your emotional stability score is {emotionalScore}/100. We recommend waiting until you're in a more stable state (70+) before placing bets.
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
                  <div className="text-right">
                    <span className={`text-lg font-bold tabular-nums ${pick.expectedValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pick.expectedValue >= 0 ? '+' : ''}${pick.expectedValue.toFixed(2)}
                    </span>
                    {typeof pick.evPercentage === 'number' && Number.isFinite(pick.evPercentage) && (
                      <span className={`text-sm ml-2 tabular-nums ${pick.evPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ({pick.evPercentage >= 0 ? '+' : ''}{pick.evPercentage.toFixed(1)}%)
                      </span>
                    )}
                  </div>
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
