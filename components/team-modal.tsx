"use client"

import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { normalizePosition } from "@/lib/position-mappings"
import { fetchTeamStats, formatTeamRecord, TeamStats } from "@/lib/services/team-data-service"
import { useState, useEffect } from "react"

interface TeamModalProps {
  team: {
    id?: string
    name: string
    record: string
    recentForm: string[]
    pointsPerGame: string
    pointsAllowed: string
    totalYards: string
    turnovers: string
    offensiveRating?: string
    defensiveRating?: string
    pace?: string
    atsRecord?: string
    marginOfVictory?: string
    runsScored?: string
    runsAllowed?: string
    teamOps?: string
    era?: string
    whip?: string
    goalsFor?: string
    goalsAgainst?: string
    powerPlayPercentage?: string
    penaltyKillPercentage?: string
    corsiPercentage?: string
    fenwickPercentage?: string
  }
  sport?: string
  roster?: Array<{
    playerName?: string
    name?: string
    displayName?: string
    position: string
    jerseyNumber?: string
    number?: string
  }>
  loadingRoster?: boolean
  onClose: () => void
  onPlayerClick?: (player: any) => void
}

export function TeamModal({ team, sport = 'americanfootball_nfl', roster, loadingRoster, onClose, onPlayerClick }: TeamModalProps) {
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Load real team statistics
  useEffect(() => {
    const loadTeamStats = async () => {
      setIsLoadingStats(true);
      try {
        if (team.id) {
          const stats = await fetchTeamStats(sport, team.id);
          setTeamStats(stats);
        }
      } catch (error) {
        console.error('Error loading team stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadTeamStats();
  }, [sport, team.id]);
  
  // Normalize player positions in the roster
  const normalizedRoster = roster?.map(player => ({
    ...player,
    normalizedPosition: normalizePosition(player.position, sport)
  })) || [];
  
  // Sport-specific statistics configuration
  const getSportStatsConfig = () => {
    // Use real team stats if available, otherwise fall back to props
    const stats = teamStats || team;
    
    switch (sport) {
      case 'americanfootball_nfl':
        return {
          stat1Label: 'Points/Game',
          stat1Value: typeof stats.pointsPerGame === 'number' ? stats.pointsPerGame.toFixed(1) : (stats.pointsPerGame ? parseFloat(stats.pointsPerGame).toFixed(1) : "Data is currently unavailable"),
          stat2Label: 'Points Allowed',
          stat2Value: typeof stats.pointsAllowed === 'number' ? stats.pointsAllowed.toFixed(1) : (stats.pointsAllowed ? parseFloat(stats.pointsAllowed).toFixed(1) : "Data is currently unavailable"),
          stat3Label: 'Total Yards/Game',
          stat3Value: typeof stats.totalYards === 'number' ? stats.totalYards.toFixed(0) : (stats.totalYards ? parseFloat(stats.totalYards).toFixed(0) : "Data is currently unavailable"),
          stat4Label: 'Turnover Differential',
          stat4Value: typeof stats.turnovers === 'number' ? stats.turnovers.toString() : (stats.turnovers ? stats.turnovers.toString() : "Data is currently unavailable")
        }
      case 'basketball_nba':
        return {
          stat1Label: 'Offensive Rating',
          stat1Value: typeof stats.offensiveRating === 'number' ? stats.offensiveRating.toFixed(1) : (stats.offensiveRating ? parseFloat(stats.offensiveRating).toFixed(1) : (typeof stats.pointsPerGame === 'number' ? stats.pointsPerGame.toFixed(1) : (stats.pointsPerGame ? parseFloat(stats.pointsPerGame).toFixed(1) : "Data is currently unavailable"))),
          stat2Label: 'Defensive Rating',
          stat2Value: typeof stats.defensiveRating === 'number' ? stats.defensiveRating.toFixed(1) : (stats.defensiveRating ? parseFloat(stats.defensiveRating).toFixed(1) : (typeof stats.pointsAllowed === 'number' ? stats.pointsAllowed.toFixed(1) : (stats.pointsAllowed ? parseFloat(stats.pointsAllowed).toFixed(1) : "Data is currently unavailable"))),
          stat3Label: 'Pace',
          stat3Value: typeof stats.pace === 'number' ? stats.pace.toFixed(1) : (stats.pace ? parseFloat(stats.pace).toFixed(1) : (typeof stats.totalYards === 'number' ? stats.totalYards.toFixed(1) : (stats.totalYards ? parseFloat(stats.totalYards).toFixed(1) : "Data is currently unavailable"))),
          stat4Label: 'ATS Record',
          stat4Value: (stats as any).atsRecord || (typeof stats.turnovers === 'number' ? stats.turnovers.toString() : (stats.turnovers ? stats.turnovers.toString() : "Data is currently unavailable"))
        }
      case 'baseball_mlb':
        return {
          stat1Label: 'Runs/Game',
          stat1Value: typeof stats.runsScored === 'number' ? stats.runsScored.toFixed(1) : (stats.runsScored ? parseFloat(stats.runsScored).toFixed(1) : (typeof stats.pointsPerGame === 'number' ? stats.pointsPerGame.toFixed(1) : (stats.pointsPerGame ? parseFloat(stats.pointsPerGame).toFixed(1) : "Data is currently unavailable"))),
          stat2Label: 'Runs Allowed',
          stat2Value: typeof stats.runsAllowed === 'number' ? stats.runsAllowed.toFixed(1) : (stats.runsAllowed ? parseFloat(stats.runsAllowed).toFixed(1) : (typeof stats.pointsAllowed === 'number' ? stats.pointsAllowed.toFixed(1) : (stats.pointsAllowed ? parseFloat(stats.pointsAllowed).toFixed(1) : "Data is currently unavailable"))),
          stat3Label: 'Team OPS',
          stat3Value: typeof stats.teamOps === 'number' ? stats.teamOps.toFixed(3) : (stats.teamOps ? parseFloat(stats.teamOps).toFixed(3) : (typeof stats.totalYards === 'number' ? stats.totalYards.toFixed(3) : (stats.totalYards ? parseFloat(stats.totalYards).toFixed(3) : "Data is currently unavailable"))),
          stat4Label: 'ERA',
          stat4Value: typeof stats.era === 'number' ? stats.era.toFixed(2) : (stats.era ? parseFloat(stats.era).toFixed(2) : (typeof stats.turnovers === 'number' ? stats.turnovers.toString() : (stats.turnovers ? stats.turnovers.toString() : "Data is currently unavailable")))
        }
      case 'icehockey_nhl':
        return {
          stat1Label: 'Goals/Game',
          stat1Value: typeof stats.goalsFor === 'number' ? stats.goalsFor.toFixed(1) : (stats.goalsFor ? parseFloat(stats.goalsFor).toFixed(1) : (typeof stats.pointsPerGame === 'number' ? stats.pointsPerGame.toFixed(1) : (stats.pointsPerGame ? parseFloat(stats.pointsPerGame).toFixed(1) : "Data is currently unavailable"))),
          stat2Label: 'Goals Against',
          stat2Value: typeof stats.goalsAgainst === 'number' ? stats.goalsAgainst.toFixed(1) : (stats.goalsAgainst ? parseFloat(stats.goalsAgainst).toFixed(1) : (typeof stats.pointsAllowed === 'number' ? stats.pointsAllowed.toFixed(1) : (stats.pointsAllowed ? parseFloat(stats.pointsAllowed).toFixed(1) : "Data is currently unavailable"))),
          stat3Label: 'Power Play %',
          stat3Value: typeof stats.powerPlayPercentage === 'number' ? `${(stats.powerPlayPercentage * 100).toFixed(1)}%` : (stats.powerPlayPercentage ? `${(parseFloat(stats.powerPlayPercentage) * 100).toFixed(1)}%` : (stats.totalYards ? stats.totalYards.toString() : "Data is currently unavailable")),
          stat4Label: 'Corsi %',
          stat4Value: typeof stats.corsiPercentage === 'number' ? `${(stats.corsiPercentage * 100).toFixed(1)}%` : (stats.corsiPercentage ? `${(parseFloat(stats.corsiPercentage) * 100).toFixed(1)}%` : (typeof stats.turnovers === 'number' ? stats.turnovers.toString() : (stats.turnovers ? stats.turnovers.toString() : "Data is currently unavailable")))
        }
      default:
        return {
          stat1Label: 'Points/Game',
          stat1Value: typeof stats.pointsPerGame === 'number' ? stats.pointsPerGame.toFixed(1) : (stats.pointsPerGame ? parseFloat(stats.pointsPerGame).toFixed(1) : "Data is currently unavailable"),
          stat2Label: 'Points Allowed',
          stat2Value: typeof stats.pointsAllowed === 'number' ? stats.pointsAllowed.toFixed(1) : (stats.pointsAllowed ? parseFloat(stats.pointsAllowed).toFixed(1) : "Data is currently unavailable"),
          stat3Label: 'Total Yards/Game',
          stat3Value: typeof stats.totalYards === 'number' ? stats.totalYards.toFixed(0) : (stats.totalYards ? parseFloat(stats.totalYards).toFixed(0) : "Data is currently unavailable"),
          stat4Label: 'Turnovers',
          stat4Value: typeof stats.turnovers === 'number' ? stats.turnovers.toString() : (stats.turnovers ? stats.turnovers.toString() : "Data is currently unavailable")
        }
    }
  }

  // Get formatted team record with ties
  const getTeamRecord = () => {
    if (teamStats && teamStats.gamesPlayed > 0) {
      const record = formatTeamRecord(teamStats.wins, teamStats.losses, teamStats.ties);
      return record.formatted;
    }
    return 'Data is currently unavailable';
  }

  const statsConfig = getSportStatsConfig()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <span className="text-2xl font-bold text-primary">{team.name.substring(0, 2)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{team.name}</h2>
              <Badge className="mt-1 bg-secondary/20 text-secondary">
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-secondary" />
                {teamStats && teamStats.gamesPlayed > 0 ? 'LIVE API DATA' : 'Data is currently unavailable'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-primary">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <span className="font-semibold">Team Statistics</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                <div className="text-xs text-muted-foreground">Record</div>
                <div className="mt-1 text-xl font-bold text-foreground">
                  {isLoadingStats ? 'Loading...' : getTeamRecord()}
                </div>
                {teamStats && teamStats.gamesPlayed > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {teamStats.gamesPlayed} games played
                  </div>
                )}
                {!teamStats && !isLoadingStats && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Unable to fetch team data
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                <div className="text-xs text-muted-foreground">{statsConfig.stat1Label}</div>
                <div className="mt-1 text-xl font-bold text-foreground">{statsConfig.stat1Value}</div>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                <div className="text-xs text-muted-foreground">{statsConfig.stat2Label}</div>
                <div className="mt-1 text-xl font-bold text-foreground">{statsConfig.stat2Value}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs text-muted-foreground">Recent Form (L5)</div>
            <div className="flex gap-2">
              {team.recentForm.map((result, index) => (
                <div
                  key={index}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${
                    result === "W" ? "bg-secondary/20 text-secondary" : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/50 bg-background/50 p-3">
              <div className="text-xs text-muted-foreground">{statsConfig.stat3Label}</div>
              <div className="mt-1 text-xl font-bold text-foreground">{statsConfig.stat3Value}</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/50 p-3">
              <div className="text-xs text-muted-foreground">{statsConfig.stat4Label}</div>
              <div className="mt-1 text-xl font-bold text-foreground">{statsConfig.stat4Value}</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
            <div className="h-1 w-1 rounded-full bg-primary" />
            Full Roster {roster && `(${roster.length} players)`}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loadingRoster ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading roster...
              </div>
            ) : normalizedRoster && normalizedRoster.length > 0 ? (
              normalizedRoster.map((player, index) => {
                const playerName = player.playerName || player.name || player.displayName || 'Unknown Player'
                const jerseyNum = player.jerseyNumber || player.number || '0'
                return (
                  <button
                    key={index}
                    onClick={() => onPlayerClick?.(player)}
                    className="w-full flex items-center gap-3 rounded-lg border border-border/30 bg-background/50 p-3 hover:bg-background/80 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
                      <span className="text-sm font-bold text-secondary">#{jerseyNum}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-foreground">{playerName}</div>
                      {player.normalizedPosition && player.normalizedPosition !== '' && (
                        <div className="text-xs text-muted-foreground">{player.normalizedPosition}</div>
                      )}
                    </div>
                    <Badge className="bg-primary/10 text-xs text-primary">
                      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                      Active
                    </Badge>
                  </button>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mb-2">
                  <div className="text-sm font-semibold text-red-400">Data Currently Unavailable</div>
                  <div className="text-xs mt-1">We are unable to access current team and player data.</div>
                  <div className="text-xs mt-1">Please try again soon for accurate betting information.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
