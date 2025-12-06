"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Filter,
  Search,
  Calendar,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3
} from "lucide-react"
import type { UserData, BetAnalysis } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"

interface HistoryTabProps {
  userData: UserData
  onNavigateToTab: (tab: string) => void
}

// Available sports (same as Live Odds tab)
const AVAILABLE_SPORTS = [
  { key: "basketball_nba", label: "NBA" },
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "baseball_mlb", label: "MLB" },
  { key: "icehockey_nhl", label: "NHL" },
]

export function HistoryTab({ userData, onNavigateToTab }: HistoryTabProps) {
  const [loading, setLoading] = useState(true)
  const [analyses, setAnalyses] = useState<BetAnalysis[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = useState<BetAnalysis[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOutcome, setFilterOutcome] = useState<string>("all")
  const [filterSport, setFilterSport] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "ev" | "stake">("date")
  const [selectedBet, setSelectedBet] = useState<BetAnalysis | null>(null)

  // Load bet analyses on mount
  useEffect(() => {
    loadAnalyses()
  }, [])

  // Filter and sort when criteria change
  useEffect(() => {
    filterAndSortAnalyses()
  }, [analyses, searchTerm, filterOutcome, filterSport, sortBy])

  const loadAnalyses = async () => {
    setLoading(true)
    try {
      // @ts-ignore - Method added dynamically to storageHybrid
      const data = await storage.getBetAnalyses()
      setAnalyses(data || [])
    } catch (error) {
      console.error('Error loading bet analyses:', error)
      toast.error('Failed to load bet history')
      setAnalyses([])
    } finally {
      setLoading(false)
    }
  }

  const calculateWinReturn = (stake: number, odds: number): number => {
    if (odds > 0) {
      // American odds positive (e.g., +150)
      return stake + (stake * odds / 100)
    } else {
      // American odds negative (e.g., -110)
      return stake + (stake * 100 / Math.abs(odds))
    }
  }

  const handleUpdateOutcome = async (betId: string, outcome: 'win' | 'loss' | 'push') => {
    try {
      // Find the bet
      const betIndex = analyses.findIndex(bet => bet.id === betId)
      if (betIndex === -1) return

      const bet = analyses[betIndex]
      const actualReturn = 
        outcome === 'win' ? calculateWinReturn(bet.stake, bet.odds) :
        outcome === 'push' ? bet.stake :
        0

      const updatedBet = {
        ...bet,
        outcome,
        actualReturn
      }

      // Update in local state
      const updatedAnalyses = [...analyses]
      updatedAnalyses[betIndex] = updatedBet
      setAnalyses(updatedAnalyses)
      setSelectedBet(updatedBet)
      
      // Save to storage
      await storage.updateBetAnalysis(updatedBet)
      
      toast.success('Outcome updated', {
        description: `Bet marked as ${outcome.toUpperCase()} - Return: $${actualReturn.toFixed(2)}`
      })
    } catch (error) {
      console.error('Error updating outcome:', error)
      toast.error('Failed to update outcome')
    }
  }

  const filterAndSortAnalyses = () => {
    let filtered = [...analyses]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(bet => 
        bet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bet.sport.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Outcome filter
    if (filterOutcome !== "all") {
      filtered = filtered.filter(bet => bet.outcome === filterOutcome)
    }

    // Sport filter - match both key and label formats
    if (filterSport !== "all") {
      filtered = filtered.filter(bet => {
        // Check if bet.sport matches the filter key directly
        if (bet.sport === filterSport) return true
        
        // Check if bet.sport matches the label of the selected sport
        const selectedSport = AVAILABLE_SPORTS.find(s => s.key === filterSport)
        if (selectedSport && bet.sport === selectedSport.label) return true
        
        return false
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case "ev":
          return (b.expectedValue || 0) - (a.expectedValue || 0)
        case "stake":
          return b.stake - a.stake
        default:
          return 0
      }
    })

    setFilteredAnalyses(filtered)
  }

  // Calculate performance metrics
  const calculateMetrics = () => {
    const completed = analyses.filter(bet => bet.outcome && bet.outcome !== 'pending')
    const wins = completed.filter(bet => bet.outcome === 'win')
    const losses = completed.filter(bet => bet.outcome === 'loss')
    
    const totalStaked = completed.reduce((sum, bet) => sum + bet.stake, 0)
    const totalReturns = completed.reduce((sum, bet) => sum + (bet.actualReturn || 0), 0)
    const profit = totalReturns - totalStaked
    const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0
    const winRate = completed.length > 0 ? (wins.length / completed.length) * 100 : 0
    
    const avgEV = analyses.reduce((sum, bet) => sum + (bet.expectedValue || 0), 0) / (analyses.length || 1)

    return {
      totalBets: analyses.length,
      completedBets: completed.length,
      pendingBets: analyses.filter(bet => bet.outcome === 'pending').length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      totalStaked,
      totalReturns,
      profit,
      roi,
      avgEV
    }
  }

  const metrics = calculateMetrics()

  // Get unique sports from user's bets for additional filtering
  const userSports = Array.from(new Set(analyses.map(bet => bet.sport)))
  
  // Combine available sports with any custom sports the user has bet on
  const allSportOptions = [
    ...AVAILABLE_SPORTS,
    ...userSports
      .filter(sport => !AVAILABLE_SPORTS.some(s => s.key === sport || s.label === sport))
      .map(sport => ({ key: sport, label: sport }))
  ]

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Bet History</h2>
          <p className="text-muted-foreground">Loading your betting history...</p>
        </div>
        <Card className="p-12 text-center">
          <History className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Bet History</h2>
          <p className="text-muted-foreground">Track your betting performance over time</p>
        </div>

        <Card className="p-12 text-center">
          <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Bets Yet</h3>
          <p className="text-muted-foreground mb-6">
            Start analyzing bets to build your history and track your performance.
          </p>
          <Button onClick={() => onNavigateToTab('analyze')}>
            <Target className="h-4 w-4 mr-2" />
            Analyze Your First Bet
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Bet History</h2>
        <p className="text-muted-foreground">
          {analyses.length} total bet{analyses.length !== 1 ? 's' : ''} analyzed
        </p>
      </div>

      {/* Performance Metrics Dashboard */}
      <Card className="p-6 bg-linear-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Performance Overview
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Win Rate */}
          <div className="p-4 rounded-lg bg-background/50 text-center">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-foreground">{metrics.winRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.wins}W - {metrics.losses}L
            </p>
          </div>

          {/* Total Profit/Loss */}
          <div className="p-4 rounded-lg bg-background/50 text-center">
            <DollarSign className={`h-6 w-6 mx-auto mb-2 ${metrics.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <p className="text-xs text-muted-foreground mb-1">Total P/L</p>
            <p className={`text-2xl font-bold ${metrics.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.profit >= 0 ? '+' : ''}${metrics.profit.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ${metrics.totalStaked.toFixed(0)} staked
            </p>
          </div>

          {/* ROI */}
          <div className="p-4 rounded-lg bg-background/50 text-center">
            {metrics.roi >= 0 ? (
              <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-500 mx-auto mb-2" />
            )}
            <p className="text-xs text-muted-foreground mb-1">ROI</p>
            <p className={`text-2xl font-bold ${metrics.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.roi >= 0 ? '+' : ''}{metrics.roi.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Return on investment
            </p>
          </div>

          {/* Average EV */}
          <div className="p-4 rounded-lg bg-background/50 text-center">
            <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Avg EV</p>
            <p className={`text-2xl font-bold ${metrics.avgEV >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.avgEV >= 0 ? '+' : ''}${metrics.avgEV.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Expected value
            </p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Completed: {metrics.completedBets}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">Pending: {metrics.pendingBets}</span>
            </div>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">Total: {metrics.totalBets}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Outcome Filter */}
          <div>
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">All Outcomes</option>
              <option value="win">Wins</option>
              <option value="loss">Losses</option>
              <option value="push">Pushes</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Sport Filter */}
          <div>
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">All Sports</option>
              {allSportOptions.map(sport => (
                <option key={sport.key} value={sport.key}>{sport.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('date')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Date
            </Button>
            <Button
              variant={sortBy === 'ev' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('ev')}
            >
              <Target className="h-4 w-4 mr-1" />
              EV
            </Button>
            <Button
              variant={sortBy === 'stake' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('stake')}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Stake
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      {filteredAnalyses.length !== analyses.length && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredAnalyses.length} of {analyses.length} bets
        </div>
      )}

      {/* Bet List */}
      {filteredAnalyses.length === 0 ? (
        <Card className="p-8 text-center">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No bets match your filters</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchTerm("")
              setFilterOutcome("all")
              setFilterSport("all")
            }}
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAnalyses.map((bet) => (
            <Card
              key={bet.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedBet(bet)}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Bet Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {bet.sport}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {bet.betType}
                    </Badge>
                    {bet.outcome && (
                      <Badge
                        className={`text-xs ${
                          bet.outcome === 'win' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                          bet.outcome === 'loss' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                          bet.outcome === 'push' ? 'bg-gray-500/20 text-gray-500 border-gray-500/30' :
                          'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                        }`}
                      >
                        {bet.outcome.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground mb-1 truncate">
                    {bet.description}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(bet.timestamp).toLocaleDateString()} at {new Date(bet.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                {/* Right: Metrics */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-foreground mb-1">
                    ${bet.stake.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Odds: {bet.odds > 0 ? '+' : ''}{bet.odds}
                  </div>
                  {bet.expectedValue !== undefined && (
                    <div className={`text-xs font-medium ${bet.expectedValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      EV: {bet.expectedValue >= 0 ? '+' : ''}${bet.expectedValue.toFixed(2)}
                    </div>
                  )}
                  {bet.actualReturn !== undefined && bet.outcome !== 'pending' && (
                    <div className={`text-xs font-medium ${bet.actualReturn >= bet.stake ? 'text-green-500' : 'text-red-500'}`}>
                      Return: ${bet.actualReturn.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Bias Warnings */}
              {bet.biasWarnings && bet.biasWarnings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {bet.biasWarnings.slice(0, 2).map((warning, idx) => (
                        <span key={idx} className="text-xs text-muted-foreground">
                          {warning}{idx < Math.min(bet.biasWarnings.length, 2) - 1 ? ',' : ''}
                        </span>
                      ))}
                      {bet.biasWarnings.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{bet.biasWarnings.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Bet Detail Modal (Simple version - can be enhanced) */}
      {selectedBet && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedBet(null)}
        >
          <Card
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {selectedBet.description}
                  </h3>
                  <div className="flex gap-2">
                    <Badge variant="outline">{selectedBet.sport}</Badge>
                    <Badge variant="outline">{selectedBet.betType}</Badge>
                    {selectedBet.outcome && (
                      <Badge
                        className={`${
                          selectedBet.outcome === 'win' ? 'bg-green-500/20 text-green-500' :
                          selectedBet.outcome === 'loss' ? 'bg-red-500/20 text-red-500' :
                          selectedBet.outcome === 'push' ? 'bg-gray-500/20 text-gray-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}
                      >
                        {selectedBet.outcome.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedBet(null)}>
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                {/* Bet Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Stake</p>
                    <p className="text-lg font-semibold">${selectedBet.stake.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Odds</p>
                    <p className="text-lg font-semibold">
                      {selectedBet.odds > 0 ? '+' : ''}{selectedBet.odds}
                    </p>
                  </div>
                  {selectedBet.expectedValue !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Value</p>
                      <p className={`text-lg font-semibold ${selectedBet.expectedValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {selectedBet.expectedValue >= 0 ? '+' : ''}${selectedBet.expectedValue.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {selectedBet.probabilityEstimate !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Win Probability</p>
                      <p className="text-lg font-semibold">{selectedBet.probabilityEstimate}%</p>
                    </div>
                  )}
                </div>

                {/* Emotional State */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Emotional State</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedBet.emotionalState}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Intensity: {selectedBet.emotionalIntensity}/10
                    </span>
                  </div>
                </div>

                {/* AI Recommendation */}
                {selectedBet.aiRecommendation && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">AI Recommendation</p>
                    <p className="text-sm text-foreground">{selectedBet.aiRecommendation}</p>
                  </div>
                )}

                {/* Bias Warnings */}
                {selectedBet.biasWarnings && selectedBet.biasWarnings.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Bias Warnings</p>
                    <div className="space-y-1">
                      {selectedBet.biasWarnings.map((warning, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{warning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Update Outcome Section */}
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium text-foreground mb-3">Update Bet Outcome</p>
                  {selectedBet.outcome === 'pending' ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        Mark this bet as won, lost, or pushed to track your performance
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          onClick={() => handleUpdateOutcome(selectedBet.id, 'win')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Won
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleUpdateOutcome(selectedBet.id, 'loss')}
                        >
                          ✕ Lost
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleUpdateOutcome(selectedBet.id, 'push')}
                        >
                          Push
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Result</p>
                          <p className={`text-lg font-semibold ${
                            selectedBet.outcome === 'win' ? 'text-green-500' :
                            selectedBet.outcome === 'loss' ? 'text-red-500' :
                            'text-gray-500'
                          }`}>
                            {selectedBet.outcome.toUpperCase()}
                          </p>
                        </div>
                        {selectedBet.actualReturn !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground">Return</p>
                            <p className={`text-lg font-semibold ${
                              selectedBet.actualReturn >= selectedBet.stake ? 'text-green-500' : 'text-red-500'
                            }`}>
                              ${selectedBet.actualReturn.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleUpdateOutcome(selectedBet.id, 'pending')}
                      >
                        Reset to Pending
                      </Button>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Analyzed on {new Date(selectedBet.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
