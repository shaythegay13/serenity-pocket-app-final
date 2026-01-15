"use client"

import { X, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { normalizePosition } from "@/lib/position-mappings"
import { PropBetAnalytics, PropBetHitRate } from "@/lib/services/prop-bet-analytics"
import { useState, useEffect } from "react"

interface PlayerModalProps {
  player: {
    name: string
    position: string
    team: string
    number: string
    stats?: any // Player statistics from API
  }
  sport?: string
  onClose: () => void
}

export function PlayerModal({ player, sport = 'americanfootball_nfl', onClose }: PlayerModalProps) {
  const [propBetHitRates, setPropBetHitRates] = useState<PropBetHitRate[]>([]);
  const [isLoadingHitRates, setIsLoadingHitRates] = useState(true);
  
  // Normalize the position to standard abbreviation
  const normalizedPosition = normalizePosition(player.position, sport);
  
  // Get player statistics from API data or historical data
  const stats = player.stats || {}
  
  // Load prop bet hit rates
  useEffect(() => {
    const loadHitRates = async () => {
      setIsLoadingHitRates(true);
      try {
        // Use player.id if available, otherwise fallback to a generated ID
        const playerId = (player as any).id || `${player.name.replace(/\s+/g, '_').toLowerCase()}`;
        
        const hitRates = await PropBetAnalytics.calculatePlayerHitRates(
          sport,
          playerId,
          normalizedPosition,
          20 // Last 20 games
        );
        
        setPropBetHitRates(hitRates);
      } catch (error) {
        console.error('Error loading prop bet hit rates:', error);
      } finally {
        setIsLoadingHitRates(false);
      }
    };

    loadHitRates();
  }, [sport, player.name, normalizedPosition]);
  
  const getPlayerStats = () => {
    if (sport === 'americanfootball_nfl') {
      // NFL statistics
      let seasonStats = []
      
      if (!stats || Object.keys(stats).length === 0) {
        // No real data available
        seasonStats = [
          { label: "Passing Yards", value: "Data is currently unavailable", home: null, away: null },
          { label: "Passing TDs", value: "Data is currently unavailable", home: null, away: null },
          { label: "Rushing Yards", value: "Data is currently unavailable", home: null, away: null },
          { label: "Receptions", value: "Data is currently unavailable", home: null, away: null },
          { label: "Tackles", value: "Data is currently unavailable", home: null, away: null }
        ]
      } else if (normalizedPosition === 'QB') {
        seasonStats = [
          { label: "Passing Yards", value: stats.passingYards ? stats.passingYards.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Passing TDs", value: stats.passingTDs ? stats.passingTDs.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Passer Rating", value: stats.passerRating ? stats.passerRating.toFixed(1) : "Data is currently unavailable", home: null, away: null },
          { label: "Completions", value: stats.completions ? stats.completions.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Interceptions", value: stats.interceptions ? stats.interceptions.toString() : "Data is currently unavailable", home: null, away: null }
        ]
      } else if (['RB', 'FB'].includes(normalizedPosition)) {
        seasonStats = [
          { label: "Rushing Yards", value: stats.rushingYards ? stats.rushingYards.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Rushing TDs", value: stats.rushingTDs ? stats.rushingTDs.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Receptions", value: stats.receptions ? stats.receptions.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Receiving Yards", value: stats.receivingYards ? stats.receivingYards.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Fumbles", value: stats.fumbles ? stats.fumbles.toString() : "Data is currently unavailable", home: null, away: null }
        ]
      } else if (['WR', 'TE'].includes(normalizedPosition)) {
        seasonStats = [
          { label: "Receptions", value: stats.receptions ? stats.receptions.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Receiving Yards", value: stats.receivingYards ? stats.receivingYards.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Receiving TDs", value: stats.receivingTDs ? stats.receivingTDs.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Targets", value: stats.targets ? stats.targets.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Yards/Catch", value: stats.receivingYards && stats.receptions ? (stats.receivingYards / stats.receptions).toFixed(1) : "Data is currently unavailable", home: null, away: null }
        ]
      } else if (['K', 'P'].includes(normalizedPosition)) {
        seasonStats = [
          { label: "FG Made", value: stats.fieldGoalsMade ? stats.fieldGoalsMade.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "FG %", value: stats.fieldGoalPct ? `${(stats.fieldGoalPct * 100).toFixed(1)}%` : "Data is currently unavailable", home: null, away: null },
          { label: "Points", value: stats.points ? stats.points.toString() : "Data is currently unavailable", home: null, away: null }
        ]
      } else {
        // Defense/Special Teams (default for most defensive positions)
        seasonStats = [
          { label: "Tackles", value: stats.tackles ? stats.tackles.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Sacks", value: stats.sacks ? stats.sacks.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Interceptions", value: stats.interceptions ? stats.interceptions.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Forced Fumbles", value: stats.forcedFumbles ? stats.forcedFumbles.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "Passes Defended", value: stats.passesDefended ? stats.passesDefended.toString() : "Data is currently unavailable", home: null, away: null }
        ]
      }
      
      return {
        games: [], // Would need real game-by-game data from API
        seasonStats,
        propBets: propBetHitRates.map(hitRate => ({
          label: hitRate.label,
          rate: PropBetAnalytics.formatHitRate(hitRate),
          trend: hitRate.trend,
          confidence: PropBetAnalytics.getConfidenceLevel(hitRate.totalBets),
          totalBets: hitRate.totalBets
        }))
      }
    } else if (sport === 'basketball_nba') {
      // NBA statistics
      const seasonStats = [
        { label: "Points", value: stats.pointsPerGame ? stats.pointsPerGame.toFixed(1) : "N/A", home: null, away: null },
        { label: "Rebounds", value: stats.reboundsPerGame ? stats.reboundsPerGame.toFixed(1) : "N/A", home: null, away: null },
        { label: "Assists", value: stats.assistsPerGame ? stats.assistsPerGame.toFixed(1) : "N/A", home: null, away: null },
        { label: "Steals", value: stats.stealsPerGame ? stats.stealsPerGame.toFixed(1) : "N/A", home: null, away: null },
        { label: "Blocks", value: stats.blocksPerGame ? stats.blocksPerGame.toFixed(1) : "N/A", home: null, away: null },
        { label: "FG %", value: stats.nbaFieldGoalPct ? `${(stats.nbaFieldGoalPct * 100).toFixed(1)}%` : "N/A", home: null, away: null }
      ]
      
      return {
        games: [],
        seasonStats,
        propBets: propBetHitRates.map(hitRate => ({
          label: hitRate.label,
          rate: PropBetAnalytics.formatHitRate(hitRate),
          trend: hitRate.trend,
          confidence: PropBetAnalytics.getConfidenceLevel(hitRate.totalBets),
          totalBets: hitRate.totalBets
        }))
      }
    } else if (sport === 'baseball_mlb') {
      // MLB statistics
      let seasonStats = []
      
      if (!stats || Object.keys(stats).length === 0) {
        // No real data available
        seasonStats = [
          { label: "AVG", value: "Data is currently unavailable", home: null, away: null },
          { label: "HR", value: "Data is currently unavailable", home: null, away: null },
          { label: "RBI", value: "Data is currently unavailable", home: null, away: null },
          { label: "OBP", value: "Data is currently unavailable", home: null, away: null },
          { label: "SLG", value: "Data is currently unavailable", home: null, away: null }
        ]
      } else if (['P', 'SP', 'RP', 'CL'].includes(normalizedPosition)) {
        seasonStats = [
          { label: "ERA", value: stats.era ? stats.era.toFixed(2) : "Data is currently unavailable", home: null, away: null },
          { label: "Strikeouts", value: stats.strikeouts ? stats.strikeouts.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "WHIP", value: stats.whip ? stats.whip.toFixed(2) : "Data is currently unavailable", home: null, away: null },
          { label: "Saves", value: stats.saves ? stats.saves.toString() : "Data is currently unavailable", home: null, away: null }
        ]
      } else {
        // Position players
        seasonStats = [
          { label: "AVG", value: stats.avg ? stats.avg.toFixed(3) : "Data is currently unavailable", home: null, away: null },
          { label: "HR", value: stats.homeRuns ? stats.homeRuns.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "RBI", value: stats.rbis ? stats.rbis.toString() : "Data is currently unavailable", home: null, away: null },
          { label: "OBP", value: stats.obp ? stats.obp.toFixed(3) : "Data is currently unavailable", home: null, away: null },
          { label: "SLG", value: stats.slg ? stats.slg.toFixed(3) : "Data is currently unavailable", home: null, away: null }
        ]
      }
      
      return {
        games: [],
        seasonStats,
        propBets: propBetHitRates.map(hitRate => ({
          label: hitRate.label,
          rate: PropBetAnalytics.formatHitRate(hitRate),
          trend: hitRate.trend,
          confidence: PropBetAnalytics.getConfidenceLevel(hitRate.totalBets),
          totalBets: hitRate.totalBets
        }))
      }
    } else if (sport === 'icehockey_nhl') {
      // NHL statistics
      let seasonStats = []
      
      if (normalizedPosition === 'G') {
        seasonStats = [
          { label: "Save %", value: stats.savePct ? `${(stats.savePct * 100).toFixed(1)}%` : "N/A", home: null, away: null },
          { label: "GAA", value: stats.gaa ? stats.gaa.toFixed(2) : "N/A", home: null, away: null },
          { label: "Wins", value: stats.wins ? stats.wins.toString() : "N/A", home: null, away: null },
          { label: "Shutouts", value: stats.shutouts ? stats.shutouts.toString() : "N/A", home: null, away: null }
        ]
      } else {
        // Skaters
        seasonStats = [
          { label: "Goals", value: stats.goals ? stats.goals.toString() : "N/A", home: null, away: null },
          { label: "Assists", value: stats.assists ? stats.assists.toString() : "N/A", home: null, away: null },
          { label: "Points", value: stats.points ? stats.points.toString() : "N/A", home: null, away: null },
          { label: "+/-", value: stats.plusMinus ? stats.plusMinus.toString() : "N/A", home: null, away: null },
          { label: "Shots", value: stats.shots ? stats.shots.toString() : "N/A", home: null, away: null }
        ]
      }
      
      return {
        games: [],
        seasonStats,
        propBets: propBetHitRates.map(hitRate => ({
          label: hitRate.label,
          rate: PropBetAnalytics.formatHitRate(hitRate),
          trend: hitRate.trend,
          confidence: PropBetAnalytics.getConfidenceLevel(hitRate.totalBets),
          totalBets: hitRate.totalBets
        }))
      }
    }
    
    // Default fallback
    return {
      games: [],
      seasonStats: [{ label: "Games", value: stats.gamesPlayed || "N/A", home: null, away: null }],
      propBets: propBetHitRates.map(hitRate => ({
        label: hitRate.label,
        rate: PropBetAnalytics.formatHitRate(hitRate),
        trend: hitRate.trend,
        confidence: PropBetAnalytics.getConfidenceLevel(hitRate.totalBets),
        totalBets: hitRate.totalBets
      }))
    }
  }

  const sportConfig = getPlayerStats()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 ring-2 ring-secondary/20">
              <span className="text-2xl font-bold text-secondary">{player.number}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{player.name}</h2>
              <div className="mt-1 text-sm text-muted-foreground">
                {normalizedPosition && normalizedPosition !== '' ? (
                  <>{normalizedPosition} • #{player.number} • {player.team}</>
                ) : (
                  <>#{player.number} • {player.team}</>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-primary">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">Season Averages</span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {sportConfig.seasonStats.map((stat: any, index: any) => (
                <div key={index} className="rounded-lg border border-border/50 bg-background/50 p-3">
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                  <div className="mt-1 text-2xl font-bold text-foreground">{stat.value}</div>
                  {stat.home && stat.away && (
                    <div className="mt-2 flex gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Home: </span>
                        <span className="font-medium text-secondary">{stat.home}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Away: </span>
                        <span className="font-medium text-primary">{stat.away}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-primary">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <span className="font-semibold">Performance Splits</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                <div className="mb-2 text-xs text-muted-foreground">Home</div>
                <div className="space-y-1 text-sm">
                  {!stats || Object.keys(stats).length === 0 ? (
                    <div className="text-muted-foreground">Data is currently unavailable</div>
                  ) : sport === 'icehockey_nhl' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GOALS</span>
                        <span className="font-semibold text-secondary">{stats.goals ? stats.goals.toString() : "Data is currently unavailable"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ASSISTS</span>
                        <span className="font-semibold text-secondary">{stats.assists ? stats.assists.toString() : "Data is currently unavailable"}</span>
                      </div>
                    </>
                  ) : sport === 'basketball_nba' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">POINTS</span>
                        <span className="font-semibold text-secondary">{stats.pointsPerGame ? stats.pointsPerGame.toFixed(1) : "Data is currently unavailable"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">REBOUNDS</span>
                        <span className="font-semibold text-secondary">{stats.reboundsPerGame ? stats.reboundsPerGame.toFixed(1) : "Data is currently unavailable"}</span>
                      </div>
                    </>
                  ) : sport === 'baseball_mlb' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AVG</span>
                        <span className="font-semibold text-secondary">{stats.avg ? stats.avg.toFixed(3) : "Data is currently unavailable"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">HR</span>
                        <span className="font-semibold text-secondary">{stats.homeRuns ? stats.homeRuns.toString() : "Data is currently unavailable"}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TACKLES</span>
                        <span className="font-semibold text-secondary">{stats.tackles ? stats.tackles.toString() : "Data is currently unavailable"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">INTS</span>
                        <span className="font-semibold text-secondary">{stats.interceptions ? stats.interceptions.toString() : "Data is currently unavailable"}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                <div className="mb-2 text-xs text-muted-foreground">Away</div>
                <div className="space-y-1 text-sm">
                  {!stats || Object.keys(stats).length === 0 ? (
                    <div className="text-muted-foreground">Data is currently unavailable</div>
                  ) : sport === 'icehockey_nhl' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GOALS</span>
                        <span className="font-semibold text-primary">{stats.goals ? stats.goals.toString() : "Data is currently unavailable"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ASSISTS</span>
                        <span className="font-semibold text-primary">{stats.assists ? stats.assists.toString() : "Data is currently unavailable"}</span>
                      </div>
                    </>
                  ) : sport === 'basketball_nba' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">POINTS</span>
                        <span className="font-semibold text-primary">{stats.pointsPerGame ? stats.pointsPerGame.toFixed(1) : "Data is currently unavailable"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">REBOUNDS</span>
                        <span className="font-semibold text-primary">{stats.reboundsPerGame ? stats.reboundsPerGame.toFixed(1) : "Data is currently unavailable"}</span>
                      </div>
                    </>
                  ) : sport === 'baseball_mlb' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AVG</span>
                        <span className="font-semibold text-primary">{stats.avg ? stats.avg.toFixed(3) : "Data is currently unavailable"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">HR</span>
                        <span className="font-semibold text-primary">{stats.homeRuns ? stats.homeRuns.toString() : "Data is currently unavailable"}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TACKLES</span>
                        <span className="font-semibold text-primary">{stats.tackles ? stats.tackles.toString() : "Data is currently unavailable"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">INTS</span>
                        <span className="font-semibold text-primary">{stats.interceptions ? stats.interceptions.toString() : "Data is currently unavailable"}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-primary">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <span className="font-semibold">Last 10 Games</span>
            </div>
            <div className="space-y-2">
              {sportConfig.games.map((game: any, index: any) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">Game {game.game}</span>
                    <span className="text-xs text-muted-foreground">{game.stats}</span>
                  </div>
                  <Badge
                    className={game.result === "W" ? "bg-secondary/20 text-secondary" : "bg-red-500/20 text-red-500"}
                  >
                    {game.result}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-secondary/20 bg-secondary/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-secondary">
              <div className="h-1 w-1 rounded-full bg-secondary" />
              Prop Bet Hit Rates
              {isLoadingHitRates && <span className="text-xs text-muted-foreground ml-2">Loading...</span>}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {isLoadingHitRates ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-lg border border-border/30 bg-background/50 p-3 animate-pulse">
                    <div className="h-3 w-20 bg-muted rounded mb-2"></div>
                    <div className="h-6 w-12 bg-muted rounded"></div>
                  </div>
                ))
              ) : sportConfig.propBets.length > 0 ? (
                sportConfig.propBets.map((prop: any, index: any) => (
                  <div key={index} className="rounded-lg border border-border/30 bg-background/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{prop.label}</div>
                      {prop.confidence && (
                        <div className={`text-xs ${PropBetAnalytics.getConfidenceColor(prop.confidence)}`}>
                          {PropBetAnalytics.getConfidenceLevel(prop.confidence)}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="text-2xl font-bold text-secondary">{prop.rate}</div>
                      {prop.trend && prop.totalBets > 0 && (
                        <span className="text-sm">{PropBetAnalytics.getTrendIndicator(prop.trend)}</span>
                      )}
                    </div>
                    {prop.totalBets > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {prop.totalBets} games
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // No data state
                <div className="col-span-3 text-center py-8">
                  <div className="text-muted-foreground mb-2">
                    This information is currently unavailable. Please try again another time.
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Historical player performance data is required to calculate prop bet hit rates.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
              <TrendingUp className="h-4 w-4" />
              Recent Trends & Insights
            </div>
            <div className="space-y-2">
              {sport === 'icehockey_nhl' ? (
                <>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Points:</span> <span className="text-primary font-semibold">{stats.points ? `+${(stats.points * 0.1).toFixed(1)}` : '+'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Shots:</span> <span className="text-muted-foreground">{stats.shots ? `-${(stats.shots * 0.05).toFixed(1)}` : '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Streak:</span> <span className="text-primary font-semibold">{stats.streak || 'Data Unavailable Currently'}</span>
                    </div>
                  </div>
                </>
              ) : sport === 'basketball_nba' ? (
                <>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Points:</span> <span className="text-primary font-semibold">{stats.pointsPerGame ? `+${(stats.pointsPerGame * 0.1).toFixed(1)}` : '+'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">FG%:</span> <span className="text-muted-foreground">{stats.nbaFieldGoalPct ? `-${(stats.nbaFieldGoalPct * 5).toFixed(1)}%` : '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Streak:</span> <span className="text-primary font-semibold">{stats.streak || 'Data Unavailable Currently'}</span>
                    </div>
                  </div>
                </>
              ) : sport === 'baseball_mlb' ? (
                <>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">AVG:</span> <span className="text-primary font-semibold">{stats.avg ? `+${(stats.avg * 0.01).toFixed(3)}` : '+'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">OBP:</span> <span className="text-muted-foreground">{stats.obp ? `-${(stats.obp * 3).toFixed(3)}` : '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Streak:</span> <span className="text-primary font-semibold">{stats.streak || 'Data Unavailable Currently'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Tackles:</span> <span className="text-primary font-semibold">{stats.tackles ? `+${(stats.tackles * 0.1).toFixed(1)}` : '+'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Ints:</span> <span className="text-muted-foreground">{stats.interceptions ? `-${(stats.interceptions * 0.2).toFixed(2)}` : '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Streak:</span> <span className="text-primary font-semibold">{stats.streak || 'Data Unavailable Currently'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              {sport === 'icehockey_nhl' ? (
                <>
                  <p>• Use these trends alongside current matchup analysis for informed betting decisions</p>
                  <p>• Consider home/away splits and opponent strength when evaluating prop bets</p>
                  <p>• Power play time on ice can significantly impact performance</p>
                </>
              ) : sport === 'basketball_nba' ? (
                <>
                  <p>• Use these trends alongside current matchup analysis for informed betting decisions</p>
                  <p>• Consider home/away splits and opponent strength when evaluating prop bets</p>
                  <p>• Minutes played and usage rate can significantly impact performance</p>
                </>
              ) : sport === 'baseball_mlb' ? (
                <>
                  <p>• Use these trends alongside current matchup analysis for informed betting decisions</p>
                  <p>• Consider home/away splits and opponent strength when evaluating prop bets</p>
                  <p>• Weather conditions and ballpark factors can significantly impact performance</p>
                </>
              ) : (
                <>
                  <p>• Use these trends alongside current matchup analysis for informed betting decisions</p>
                  <p>• Consider home/away splits and opponent strength when evaluating prop bets</p>
                  <p>• Weather conditions can significantly impact outdoor performance</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
