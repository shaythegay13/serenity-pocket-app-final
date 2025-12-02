"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Lock, TrendingUp, Brain, Shield, RefreshCw, Target, AlertTriangle, CheckCircle2 } from "lucide-react"
import type { UserData } from "@/lib/types"
import { canAccessFeature, getUpgradeMessage } from "@/lib/subscription-tiers"
import { calculateEmotionalStability, getScoreColor, shouldReceiveAIPicks } from "@/lib/emotional-scoring"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"
import AIBetAdvisor from "@/components/ai-bet-advisor"
import { supabase } from "@/lib/supabase"

interface AIPicksTabProps {
  userData: UserData
  onNavigateToTab: (tab: string) => void
}

export function AIPicksTab({ userData, onNavigateToTab }: AIPicksTabProps) {
  const hasAccess = canAccessFeature(userData.subscriptionTier || "free", "elite")
  const cooldown = !!userData.cooldownEnabled
  
  const [loading, setLoading] = useState(false)
  const [isFetchingPicks, setIsFetchingPicks] = useState(false)
  const [lastPicksFetchAt, setLastPicksFetchAt] = useState<number | null>(null)
  const [picks, setPicks] = useState<any[]>([])
  const [emotionalStability, setEmotionalStability] = useState<any>(null)
  const [selectedSport, setSelectedSport] = useState('basketball_nba')
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')
  const [dailyBetCount, setDailyBetCount] = useState(0)
  const [activeSection, setActiveSection] = useState<'picks' | 'advisor'>('picks')

  // Calculate emotional stability on mount
  useEffect(() => {
    if (hasAccess) {
      calculateUserStability()
    }
  }, [hasAccess])

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

  // Fetch picks when sport or risk tolerance changes
  useEffect(() => {
    if (hasAccess && emotionalStability) {
      fetchAIPicks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSport, riskTolerance, hasAccess, emotionalStability])

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
      toast.info('AI Picks Cooldown', {
        description: 'Please wait at least 60 seconds between AI Picks runs.',
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
      } catch (e) {
        console.warn("AI Picks: Failed to get Supabase session for JWT auth", e)
      }

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

      console.log('AI Picks: Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('AI Picks: API error:', errorText)
        throw new Error(`Failed to fetch AI picks: ${response.status}`)
      }

      const data = await response.json()
      console.log('AI Picks: Response data:', data)

      if (!data.shouldBet) {
        toast.warning('Emotional Stability Check', {
          description: data.message
        })
        setPicks([])
      } else {
        const recs = data.recommendations || []

        const mappedPicks = recs.map((rec: any) => ({
          sport: selectedSport,
          event: rec.teams || 'Matchup',
          pick: rec.line ? `${rec.betType} ${rec.line}` : rec.betType,
          odds: rec.odds,
          confidence: typeof rec.emotionalAlignment === 'number' ? rec.emotionalAlignment : 0,
          expectedValue: 0,
          suggestedStake: rec.suggestedStakeAbsolute ?? 0,
          riskLevel: rec.riskLevel || 'MEDIUM',
          emotionalAlignment: rec.emotionalAlignment ?? 0,
          reasoning: rec.shortExplanation || '',
          commenceTime: rec.startTime,
        }))

        setPicks(mappedPicks)
        if (mappedPicks.length > 0) {
          console.log(`AI Picks: Loaded ${mappedPicks.length} picks`)
          const meta = data.meta || {}
          if (!meta.usedClaude && !meta.usedSageMaker && !meta.usedPerplexity) {
            toast.info('Using Fallback Picks', {
              description: 'Real-time AI stack (Perplexity + SageMaker + Claude) is unavailable; using safer fallback logic.'
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
      toast.error('Failed to load AI picks', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
      setPicks([])
    } finally {
      setLoading(false)
      setIsFetchingPicks(false)
      setLastPicksFetchAt(now)
    }
  }

  const handleAnalyzePick = (pick: any) => {
    // Navigate to analyze tab with pre-filled data
    onNavigateToTab('analyze')
    toast.info('Pick loaded', {
      description: 'Fill in remaining details to analyze this pick'
    })
  }

  const handleLogBet = async (pick: any) => {
    if (cooldown) {
      toast.warning('Safety Guard Active', { description: 'Logging bets is limited while cooldown is enabled.' })
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
      const bet = {
        id: Date.now().toString(),
        timestamp: new Date(),
        betType: 'straight',
        sport: pick.sport || 'Unknown',
        description: `${pick.event} — ${pick.pick} (${pick.odds > 0 ? '+' : ''}${pick.odds})`,
        odds: Number(pick.odds) || 0,
        stake: Number(pick.suggestedStake) || 0,
        emotionalState: 'neutral',
        emotionalIntensity: 5,
        biasWarnings: [],
        aiRecommendation: pick.reasoning || '',
        expectedValue: pick.expectedValue || 0,
        probabilityEstimate: pick.confidence || 0,
        outcome: 'pending',
      }
      // @ts-ignore
      await storage.addBetAnalysis(bet)
      setDailyBetCount(c => c + 1)
      toast.success('Bet logged', { description: `${pick.pick} added to your betting history` })
    } catch (e) {
      toast.error('Failed to log bet')
    }
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">AI-Powered Picks</h2>
          <p className="text-muted-foreground">
            Personalized bet suggestions based on your psychology + real-time data
          </p>
        </div>

        <Card className="p-12 text-center bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-amber-500/20">
              <Lock className="h-12 w-12 text-amber-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Elite Feature</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {getUpgradeMessage(userData.subscriptionTier || "free", "AI Picks")}
          </p>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-4">What you'll get with Elite:</p>
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
            Upgrade to Elite
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
        <h2 className="text-3xl font-bold text-foreground">AI-Powered Features</h2>
        <p className="text-muted-foreground">
          Get AI-generated picks or analyze your own bets with comprehensive psychological insights
        </p>
      </div>

      <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as 'picks' | 'advisor')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="picks">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Picks
          </TabsTrigger>
          <TabsTrigger value="advisor">
            <Brain className="h-4 w-4 mr-2" />
            Analyze My Bet
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
              <p className="text-xs text-muted-foreground">AI picks are limited while cooldown is enabled.</p>
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
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
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
          <p className="text-lg font-semibold text-foreground">Generating AI Picks...</p>
          <p className="text-sm text-muted-foreground mt-2">Analyzing live odds and your emotional state</p>
        </Card>
      )}

      {/* No Picks State */}
      {!loading && picks.length === 0 && emotionalStability && emotionalStability.score < 70 && (
        <Card className="p-8 text-center bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
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
          {picks.map((pick, idx) => (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">{pick.sport.split('_')[1]?.toUpperCase() || 'SPORT'}</Badge>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-500">{pick.confidence}% Confidence</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">{pick.event}</h3>

              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 mb-4">
                <p className="text-2xl font-bold text-primary text-center">{pick.pick}</p>
                <p className="text-sm text-center text-muted-foreground mt-1">
                  {pick.odds > 0 ? '+' : ''}{pick.odds}
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expected Value:</span>
                  <span className={`text-lg font-bold ${pick.expectedValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {pick.expectedValue >= 0 ? '+' : ''}${pick.expectedValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Suggested Stake:</span>
                  <span className="text-lg font-semibold text-foreground">${pick.suggestedStake}</span>
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
                    <span className="text-sm font-semibold">{pick.emotionalAlignment}%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted mb-4">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">{pick.reasoning}</p>
                </div>
              </div>

              {pick.commenceTime && (
                <p className="text-xs text-muted-foreground mb-4 text-center">
                  Starts: {new Date(pick.commenceTime).toLocaleString()}
                </p>
              )}

              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => handleAnalyzePick(pick)}>
                  <Target className="h-4 w-4 mr-2" />
                  Analyze
                </Button>
                <Button className="flex-1" onClick={() => handleLogBet(pick)} disabled={cooldown || (userData.dailyBetLimit != null && dailyBetCount >= userData.dailyBetLimit)}>
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
          <strong>Disclaimer:</strong> AI picks are suggestions based on data analysis and your behavioral profile.
          Always bet responsibly and never wager more than you can afford to lose.
        </p>
      </Card>
        </TabsContent>

        <TabsContent value="advisor" className="space-y-6 mt-6">
          <AIBetAdvisor />
        </TabsContent>
      </Tabs>
    </div>
  )
}
