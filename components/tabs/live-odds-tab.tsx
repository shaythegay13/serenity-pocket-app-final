"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { TrendingUp, Search, Filter, ExternalLink, Lock, RefreshCw, AlertCircle } from "lucide-react"
import type { UserData } from "@/lib/types"
import { canAccessFeature, getUpgradeMessage } from "@/lib/subscription-tiers"
import { fetchLiveOdds, getMockOddsData, transformOddsForDisplay, fetchPlayerProps, transformPlayerPropsForDisplay, getMockPlayerProps } from "@/lib/odds-api"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FeatureGate } from "@/components/feature-gate"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { fetchTeamRoster, type Player } from "@/lib/sports-data-api"
import { PlayerDetailDialog } from "@/components/odds/player-detail-dialog"

interface LiveOddsTabProps {
  userData: UserData
  onNavigateToTab: (tab: string) => void
}

export function LiveOddsTab({ userData, onNavigateToTab }: LiveOddsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [oddsData, setOddsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSport, setSelectedSport] = useState("basketball_nba")
  const hasAccess = canAccessFeature(userData.subscriptionTier || "free", "premium")
  const cooldown = !!userData.cooldownEnabled
  const [dailyBetCount, setDailyBetCount] = useState(0)
  // Player props modal state
  const [propsOpenId, setPropsOpenId] = useState<string | null>(null)
  const [propsLoading, setPropsLoading] = useState(false)
  const [propsRows, setPropsRows] = useState<Array<{ bookmaker: string; market: string; outcome: string; price: number }>>([])
  const [propsSearch, setPropsSearch] = useState("")
  const [propsMarket, setPropsMarket] = useState("all")
  const [propsContext, setPropsContext] = useState<{ title: string } | null>(null)
  // Enhanced search with team expansion
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [teamRosters, setTeamRosters] = useState<Record<string, Player[]>>({})
  const [loadingRosters, setLoadingRosters] = useState<Set<string>>(new Set())
  // Player detail dialog state
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string; team: string; sport: string } | null>(null)

  // Fetch live odds on mount and when sport changes
  useEffect(() => {
    if (hasAccess) {
      loadOdds()
    }
  }, [hasAccess, selectedSport])

  // Load player props for a given event and open modal
  const openPlayerProps = async (odds: any) => {
    setPropsOpenId(odds.id)
    setPropsContext({ title: `${odds.awayTeam} @ ${odds.homeTeam}` })
    setPropsLoading(true)
    setPropsRows([])
    setPropsSearch("")
    setPropsMarket("all")
    try {
      const res = await fetchPlayerProps(odds.sportKey, odds.id)
      if (res.success && res.data) {
        let rows = transformPlayerPropsForDisplay(res.data)
        if (!rows.length) rows = getMockPlayerProps(odds.homeTeam, odds.awayTeam)
        setPropsRows(rows)
      } else {
        setPropsRows(getMockPlayerProps(odds.homeTeam, odds.awayTeam) as any)
      }
    } catch {
      setPropsRows(getMockPlayerProps(odds.homeTeam, odds.awayTeam) as any)
    } finally {
      setPropsLoading(false)
    }
  }

  // Load daily bet count (for dailyBetLimit enforcement)
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

  const loadOdds = async () => {
    setLoading(true)
    setError(null)

    const result = await fetchLiveOdds(selectedSport)

    if (result.success && result.data) {
      const transformed = transformOddsForDisplay(result.data)
      setOddsData(transformed)
      
      if (result.remainingRequests !== undefined) {
        console.log(`API requests remaining: ${result.remainingRequests}`)
      }
    } else {
      // Fallback to mock data if API fails
      console.warn('Using mock data:', result.error)
      setOddsData(getMockOddsData())
      setError(result.error || 'Failed to load odds')
    }

    setLoading(false)
  }

  // Mock odds data for locked state preview
  const mockOddsPreview = [
    {
      id: "1",
      sport: "NBA",
      event: "Lakers vs Warriors",
      eventTime: new Date(Date.now() + 3600000),
      betType: "Moneyline",
      comparisons: [
        { sportsbook: "DraftKings", odds: -110 },
        { sportsbook: "FanDuel", odds: -105 },
        { sportsbook: "BetMGM", odds: -115 },
        { sportsbook: "Caesars", odds: -108 },
      ],
      bestOdds: -105,
      bestSportsbook: "FanDuel",
    },
    {
      id: "2",
      sport: "NFL",
      event: "Chiefs vs Bills",
      eventTime: new Date(Date.now() + 7200000),
      betType: "Spread",
      comparisons: [
        { sportsbook: "DraftKings", odds: -3.5 },
        { sportsbook: "FanDuel", odds: -3 },
        { sportsbook: "BetMGM", odds: -3.5 },
        { sportsbook: "Caesars", odds: -3 },
      ],
      bestOdds: -3,
      bestSportsbook: "FanDuel",
    },
  ]

  // Sports options
  const sports = [
    { key: "basketball_nba", label: "NBA" },
    { key: "americanfootball_nfl", label: "NFL" },
    { key: "baseball_mlb", label: "MLB" },
    { key: "icehockey_nhl", label: "NHL" },
    { key: "soccer_epl", label: "Soccer (EPL)" },
  ]

  if (!hasAccess) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Live Odds Comparison</h2>
          <p className="text-muted-foreground">
            Compare real-time odds across all major sportsbooks
          </p>
        </div>

        <Card className="p-12 text-center bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-blue-500/20">
              <Lock className="h-12 w-12 text-blue-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Premium Feature</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {getUpgradeMessage(userData.subscriptionTier || "free", "Live Odds Comparison")}
          </p>
          <Button size="lg" onClick={() => onNavigateToTab("account")}>
            Upgrade to Premium
          </Button>
        </Card>

        {/* Preview of what's available */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 pointer-events-none blur-sm">
          {mockOddsPreview.map((odds) => (
            <Card key={odds.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge variant="outline">{odds.sport}</Badge>
                  <h3 className="text-lg font-semibold text-foreground mt-2">{odds.event}</h3>
                  <p className="text-xs text-muted-foreground">{odds.eventTime.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="space-y-2">
                {odds.comparisons.map((comp) => (
                  <div key={comp.sportsbook} className="flex items-center justify-between p-2 rounded bg-muted">
                    <span className="text-sm font-medium">{comp.sportsbook}</span>
                    <span className="text-sm">{comp.odds}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Live Odds Comparison</h2>
        <p className="text-muted-foreground">
          Real-time odds from all major sportsbooks - find the best value
        </p>
      </div>

      {cooldown && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Safety Guard Active</p>
              <p className="text-xs text-muted-foreground">Analysis actions may be limited while cooldown is enabled.</p>
            </div>
          </div>
        </Card>
      )}

      {userData.dailyBetLimit != null && dailyBetCount >= userData.dailyBetLimit && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Daily Bet Limit Reached</p>
              <p className="text-xs text-muted-foreground">You have reached your daily bet limit.</p>
            </div>
          </div>
        </Card>
      )}

      {userData.behaviorNudgesEnabled && (
        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <div className="text-xs text-muted-foreground">
            Behavior Nudges: Keep stakes under your max, avoid decisions during cooldown, and log emotions in Behavior before big bets.
          </div>
        </Card>
      )}

      {/* Sport Selection and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 flex-wrap">
            {sports.map((sport) => (
              <Button
                key={sport.key}
                size="sm"
                variant={selectedSport === sport.key ? "default" : "outline"}
                onClick={() => setSelectedSport(sport.key)}
              >
                {sport.label}
              </Button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={loadOdds} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Using Mock Data</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Check that NEXT_PUBLIC_ODDS_API_KEY is set in .env.local and restart the server.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading live odds...</p>
        </div>
      )}

      {/* Odds Listings */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {oddsData
            .filter((odds) => {
              if (!searchQuery) return true
              const query = searchQuery.toLowerCase()
              // Search across teams, sport, event time
              const matchesBasic = (
                odds.homeTeam.toLowerCase().includes(query) ||
                odds.awayTeam.toLowerCase().includes(query) ||
                odds.sport.toLowerCase().includes(query) ||
                odds.commenceTime.toLocaleString().toLowerCase().includes(query)
              )
              // Also search in player rosters if available
              const homeRoster = teamRosters[odds.homeTeam] || []
              const awayRoster = teamRosters[odds.awayTeam] || []
              const matchesPlayer = [...homeRoster, ...awayRoster].some(p => p.name.toLowerCase().includes(query))
              return matchesBasic || matchesPlayer
            })
            .map((odds) => (
            <Card key={odds.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge variant="outline" className="mb-2">{odds.sport}</Badge>
                  <h3 className="text-lg font-semibold text-foreground">
                    {odds.awayTeam} @ {odds.homeTeam}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {odds.commenceTime.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>

              {/* Home Team Odds */}
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Home: {odds.homeTeam}</p>
                <div className="space-y-1">
                  {odds.homeOdds.all.slice(0, 3).map((comp: any, idx: number) => (
                    <div
                      key={`home-${comp.bookmaker}-${idx}`}
                      className={`flex items-center justify-between p-2 rounded-lg border text-sm ${
                        comp.bookmaker === odds.homeOdds.best.bookmaker
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-muted border-border"
                      }`}
                    >
                      <span className="font-medium">{comp.bookmaker}</span>
                      <span className={comp.bookmaker === odds.homeOdds.best.bookmaker ? "text-green-500 font-semibold" : ""}>
                        {comp.odds > 0 ? '+' : ''}{comp.odds}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Team Odds */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Away: {odds.awayTeam}</p>
                <div className="space-y-1">
                  {odds.awayOdds.all.slice(0, 3).map((comp: any, idx: number) => (
                    <div
                      key={`away-${comp.bookmaker}-${idx}`}
                      className={`flex items-center justify-between p-2 rounded-lg border text-sm ${
                        comp.bookmaker === odds.awayOdds.best.bookmaker
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-muted border-border"
                      }`}
                    >
                      <span className="font-medium">{comp.bookmaker}</span>
                      <span className={comp.bookmaker === odds.awayOdds.best.bookmaker ? "text-green-500 font-semibold" : ""}>
                        {comp.odds > 0 ? '+' : ''}{comp.odds}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <FeatureGate
                    currentTier={userData.subscriptionTier || "free"}
                    requiredTier={"premium_plus"}
                    featureName="Expert Commentary"
                    onUpgrade={() => onNavigateToTab("account")}
                    preview={
                      <Card className="p-4">
                        <p className="text-sm font-semibold mb-1">Expert Commentary</p>
                        <p className="text-xs text-muted-foreground">Game context, injury notes, and situational edges.</p>
                      </Card>
                    }
                  >
                    <Card className="p-4">
                      <p className="text-sm font-semibold mb-1">Expert Commentary</p>
                      {(() => {
                        const homeBest = odds.homeOdds.best
                        const awayBest = odds.awayOdds.best
                        const imp = (a: number) => a > 0 ? (100 / (a + 100)) * 100 : (Math.abs(a) / (Math.abs(a) + 100)) * 100
                        const homeImp = imp(homeBest.odds)
                        const awayImp = imp(awayBest.odds)
                        const edge = Math.abs(homeImp - awayImp)
                        return (
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>Best price Home at {homeBest.bookmaker} ({homeBest.odds > 0 ? '+' : ''}{homeBest.odds}).</p>
                            <p>Best price Away at {awayBest.bookmaker} ({awayBest.odds > 0 ? '+' : ''}{awayBest.odds}).</p>
                            <p>Implied probability gap ≈ {edge.toFixed(1)}%. Favor value where your model differs most.</p>
                          </div>
                        )
                      })()}
                    </Card>
                  </FeatureGate>
                  <Button
                    onClick={() => {
                      if (cooldown) return
                      if (userData.dailyBetLimit != null && dailyBetCount >= userData.dailyBetLimit) return
                      const betData = {
                        sport: odds.sport,
                        homeTeam: odds.homeTeam,
                        awayTeam: odds.awayTeam,
                        eventTime: odds.commenceTime.toISOString(),
                        bestHomeOdds: odds.homeOdds.best.odds,
                        bestAwayOdds: odds.awayOdds.best.odds,
                        bestHomeBookmaker: odds.homeOdds.best.bookmaker,
                        bestAwayBookmaker: odds.awayOdds.best.bookmaker,
                        homeOddsByBook: odds.homeOdds.all.slice(0, 12).reduce((acc: any, comp: any) => { acc[comp.bookmaker] = comp.odds; return acc }, {}),
                        awayOddsByBook: odds.awayOdds.all.slice(0, 12).reduce((acc: any, comp: any) => { acc[comp.bookmaker] = comp.odds; return acc }, {}),
                      }
                      localStorage.setItem('pendingBetAnalysis', JSON.stringify(betData))
                      toast.success('Bet loaded! Fill in your analysis details.')
                      onNavigateToTab("analyze")
                    }}
                    disabled={cooldown || (userData.dailyBetLimit != null && dailyBetCount >= userData.dailyBetLimit)}
                  >
                    Analyze This Bet
                  </Button>
                </div>

              <div className="mt-2 space-y-2">
                {/* Team Rosters Expandable Section */}
                {(expandedTeams.has(odds.homeTeam) || expandedTeams.has(odds.awayTeam)) && (
                  <Card className="p-3 bg-muted/30">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Team Rosters</p>
                    {loadingRosters.has(odds.homeTeam) || loadingRosters.has(odds.awayTeam) ? (
                      <p className="text-xs text-muted-foreground">Loading rosters...</p>
                    ) : (
                      <>
                        {expandedTeams.has(odds.homeTeam) && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-foreground mb-1">{odds.homeTeam}:</p>
                            <div className="flex flex-wrap gap-1">
                              {(teamRosters[odds.homeTeam] || []).map((player) => (
                                <Button
                                  key={player.id}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 px-2"
                                  onClick={() => setSelectedPlayer({
                                    id: player.id,
                                    name: player.name,
                                    team: odds.homeTeam,
                                    sport: odds.sport
                                  })}
                                >
                                  {player.name}
                                  {player.number && <span className="ml-1 text-muted-foreground">#{player.number}</span>}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        {expandedTeams.has(odds.awayTeam) && (
                          <div>
                            <p className="text-xs font-medium text-foreground mb-1">{odds.awayTeam}:</p>
                            <div className="flex flex-wrap gap-1">
                              {(teamRosters[odds.awayTeam] || []).map((player) => (
                                <Button
                                  key={player.id}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 px-2"
                                  onClick={() => setSelectedPlayer({
                                    id: player.id,
                                    name: player.name,
                                    team: odds.awayTeam,
                                    sport: odds.sport
                                  })}
                                >
                                  {player.name}
                                  {player.number && <span className="ml-1 text-muted-foreground">#{player.number}</span>}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      const newExpanded = new Set(expandedTeams)
                      if (newExpanded.has(odds.homeTeam)) {
                        newExpanded.delete(odds.homeTeam)
                        newExpanded.delete(odds.awayTeam)
                        setExpandedTeams(newExpanded)
                      } else {
                        newExpanded.add(odds.homeTeam)
                        newExpanded.add(odds.awayTeam)
                        setExpandedTeams(newExpanded)

                        // Fetch real roster data from API
                        const newLoadingRosters = new Set(loadingRosters)
                        newLoadingRosters.add(odds.homeTeam)
                        newLoadingRosters.add(odds.awayTeam)
                        setLoadingRosters(newLoadingRosters)

                        try {
                          const [homeRoster, awayRoster] = await Promise.all([
                            fetchTeamRoster(odds.homeTeam, odds.sport),
                            fetchTeamRoster(odds.awayTeam, odds.sport)
                          ])

                          setTeamRosters(prev => ({
                            ...prev,
                            [odds.homeTeam]: homeRoster,
                            [odds.awayTeam]: awayRoster
                          }))
                        } catch (error) {
                          console.error('Error fetching rosters:', error)
                          toast.error('Failed to load rosters')
                        } finally {
                          const updatedLoadingRosters = new Set(loadingRosters)
                          updatedLoadingRosters.delete(odds.homeTeam)
                          updatedLoadingRosters.delete(odds.awayTeam)
                          setLoadingRosters(updatedLoadingRosters)
                        }
                      }
                    }}
                    disabled={loadingRosters.has(odds.homeTeam) || loadingRosters.has(odds.awayTeam)}
                  >
                    {expandedTeams.has(odds.homeTeam) ? 'Hide' : 'Show'} Rosters
                  </Button>
                </div>
                <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">Preview Bet</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bet Preview</DialogTitle>
                      <DialogDescription>{odds.awayTeam} @ {odds.homeTeam}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Card className="p-3">
                          <p className="text-xs text-muted-foreground">Best Home</p>
                          <p className="text-sm font-medium">{odds.homeOdds.best.bookmaker}: {odds.homeOdds.best.odds}</p>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-muted-foreground">Best Away</p>
                          <p className="text-sm font-medium">{odds.awayOdds.best.bookmaker}: {odds.awayOdds.best.odds}</p>
                        </Card>
                      </div>
                      <Button onClick={() => {
                        const betData = {
                          sport: odds.sport,
                          homeTeam: odds.homeTeam,
                          awayTeam: odds.awayTeam,
                          eventTime: odds.commenceTime.toISOString(),
                          bestHomeOdds: odds.homeOdds.best.odds,
                          bestAwayOdds: odds.awayOdds.best.odds,
                          bestHomeBookmaker: odds.homeOdds.best.bookmaker,
                          bestAwayBookmaker: odds.awayOdds.best.bookmaker,
                          homeOddsByBook: odds.homeOdds.all.slice(0, 12).reduce((acc: any, comp: any) => { acc[comp.bookmaker] = comp.odds; return acc }, {}),
                          awayOddsByBook: odds.awayOdds.all.slice(0, 12).reduce((acc: any, comp: any) => { acc[comp.bookmaker] = comp.odds; return acc }, {}),
                        }
                        if (!(cooldown || (userData.dailyBetLimit != null && dailyBetCount >= userData.dailyBetLimit))) {
                          localStorage.setItem('pendingBetAnalysis', JSON.stringify(betData))
                          onNavigateToTab('analyze')
                        }
                      }}>Analyze</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" className="flex-1" onClick={() => openPlayerProps(odds)}>
                  Player Props
                </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && oddsData.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No odds available for this sport right now.</p>
          <p className="text-sm text-muted-foreground mt-2">Try selecting a different sport or refreshing.</p>
        </Card>
      )}

      {/* Player Props Dialog */}
      <Dialog open={!!propsOpenId} onOpenChange={(open) => { if (!open) { setPropsOpenId(null); setPropsRows([]); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Player Props</DialogTitle>
            {propsContext && (
              <DialogDescription>{propsContext.title}</DialogDescription>
            )}
          </DialogHeader>
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search player or prop..." value={propsSearch} onChange={(e) => setPropsSearch(e.target.value)} />
            <Select value={propsMarket} onValueChange={setPropsMarket}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Markets</SelectItem>
                {Array.from(new Set(propsRows.map(r => r.market))).map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {propsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading player props...</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {propsRows
                .filter(r => (propsMarket === 'all' || r.market === propsMarket))
                .filter(r => r.outcome.toLowerCase().includes(propsSearch.toLowerCase().trim()))
                .map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border-b text-sm">
                    <div>
                      <p className="font-medium text-foreground">{r.outcome}</p>
                      <p className="text-xs text-muted-foreground">{r.market} • {r.bookmaker}</p>
                    </div>
                    <div className={`text-right font-semibold ${r.price >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {r.price > 0 ? '+' : ''}{r.price}
                    </div>
                  </div>
                ))}
              {propsRows.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">No props available.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Player Detail Dialog */}
      {selectedPlayer && (
        <PlayerDetailDialog
          open={!!selectedPlayer}
          onOpenChange={(open) => !open && setSelectedPlayer(null)}
          playerId={selectedPlayer.id}
          playerName={selectedPlayer.name}
          teamName={selectedPlayer.team}
          sport={selectedPlayer.sport}
        />
      )}
    </div>
  )
}
