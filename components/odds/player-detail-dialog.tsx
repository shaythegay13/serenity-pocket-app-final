"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { User, TrendingUp, Target, Activity } from "lucide-react"
import { fetchPlayerDetails, type PlayerDetail } from "@/lib/sports-data-api"

interface PlayerDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playerId: string
  playerName: string
  teamName?: string
  sport?: string
}

export function PlayerDetailDialog({ open, onOpenChange, playerId, playerName, teamName, sport }: PlayerDetailDialogProps) {
  const [player, setPlayer] = useState<PlayerDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Only load when dialog opens with a player name
    if (!open || !playerName) {
      return
    }

    // Prevent loading if already loading
    if (loading) {
      return
    }

    // Load player details
    const loadPlayerDetails = async () => {
      setLoading(true)

      try {
        // Pass team and sport to get real ESPN stats
        const details = await fetchPlayerDetails(playerId, playerName, teamName, sport)
        setPlayer(details)
      } catch (error) {
        console.error('[PlayerDetailDialog] Error loading player:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayerDetails()
  }, [open, playerId, playerName, teamName, sport])

  // Reset player data when dialog closes
  useEffect(() => {
    if (!open) {
      setPlayer(null)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Player Profile</DialogTitle>
          <DialogDescription>Detailed stats and betting insights</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : player ? (
          <div className="space-y-6">
            {/* Player Header with Image */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                {player.imageUrl ? (
                  <img
                    src={player.imageUrl}
                    alt={player.name}
                    className="w-48 h-48 object-contain rounded-lg bg-muted"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={`w-48 h-48 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg ${player.imageUrl ? 'hidden' : ''}`}>
                  <User className="h-24 w-24 text-muted-foreground" />
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-3xl font-bold text-foreground">{player.name}</h3>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {player.position && <Badge variant="outline">{player.position}</Badge>}
                    {player.number && <Badge variant="outline">#{player.number}</Badge>}
                    {player.team && <Badge>{player.team}</Badge>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {player.height && (
                    <div>
                      <p className="text-muted-foreground">Height</p>
                      <p className="font-medium">{player.height}</p>
                    </div>
                  )}
                  {player.weight && (
                    <div>
                      <p className="text-muted-foreground">Weight</p>
                      <p className="font-medium">{player.weight}</p>
                    </div>
                  )}
                  {player.dateOfBirth && (
                    <div>
                      <p className="text-muted-foreground">Born</p>
                      <p className="font-medium">{new Date(player.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                  )}
                  {player.nationality && (
                    <div>
                      <p className="text-muted-foreground">Nationality</p>
                      <p className="font-medium">{player.nationality}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {player.bio && (
              <Card className="p-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Biography
                </h4>
                <p className="text-sm text-foreground line-clamp-4">{player.bio}</p>
              </Card>
            )}

            {/* Season Stats */}
            {player.stats && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Season Stats
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {player.stats.gamesPlayed !== undefined && (
                    <StatCard label="Games Played" value={player.stats.gamesPlayed} />
                  )}
                  {player.stats.pointsPerGame !== undefined && (
                    <StatCard label="PPG" value={player.stats.pointsPerGame.toFixed(1)} />
                  )}
                  {player.stats.assistsPerGame !== undefined && (
                    <StatCard label="APG" value={player.stats.assistsPerGame.toFixed(1)} />
                  )}
                  {player.stats.reboundsPerGame !== undefined && (
                    <StatCard label="RPG" value={player.stats.reboundsPerGame.toFixed(1)} />
                  )}
                  {player.stats.stealsPerGame !== undefined && (
                    <StatCard label="SPG" value={player.stats.stealsPerGame.toFixed(1)} />
                  )}
                  {player.stats.blocksPerGame !== undefined && (
                    <StatCard label="BPG" value={player.stats.blocksPerGame.toFixed(1)} />
                  )}
                  {player.stats.fieldGoalPercentage !== undefined && (
                    <StatCard label="FG%" value={`${player.stats.fieldGoalPercentage.toFixed(1)}%`} />
                  )}
                  {player.stats.threePointPercentage !== undefined && (
                    <StatCard label="3P%" value={`${player.stats.threePointPercentage.toFixed(1)}%`} />
                  )}
                  {player.stats.freeThrowPercentage !== undefined && (
                    <StatCard label="FT%" value={`${player.stats.freeThrowPercentage.toFixed(1)}%`} />
                  )}
                  {player.stats.minutesPerGame !== undefined && (
                    <StatCard label="MPG" value={player.stats.minutesPerGame.toFixed(1)} />
                  )}

                  {/* Football Stats */}
                  {player.stats.passingYards !== undefined && (
                    <StatCard label="Pass Yds" value={player.stats.passingYards.toFixed(0)} />
                  )}
                  {player.stats.passingTouchdowns !== undefined && (
                    <StatCard label="Pass TD" value={player.stats.passingTouchdowns} />
                  )}
                  {player.stats.rushingYards !== undefined && (
                    <StatCard label="Rush Yds" value={player.stats.rushingYards.toFixed(0)} />
                  )}
                  {player.stats.receivingYards !== undefined && (
                    <StatCard label="Rec Yds" value={player.stats.receivingYards.toFixed(0)} />
                  )}
                  {player.stats.receptions !== undefined && (
                    <StatCard label="Receptions" value={player.stats.receptions} />
                  )}

                  {/* Baseball Batting Stats */}
                  {player.stats.battingAverage !== undefined && (
                    <StatCard label="AVG" value={player.stats.battingAverage.toFixed(3)} />
                  )}
                  {player.stats.homeRuns !== undefined && (
                    <StatCard label="HR" value={player.stats.homeRuns} />
                  )}
                  {player.stats.rbi !== undefined && (
                    <StatCard label="RBI" value={player.stats.rbi} />
                  )}
                  {player.stats.hits !== undefined && (
                    <StatCard label="Hits" value={player.stats.hits} />
                  )}
                  {player.stats.runs !== undefined && (
                    <StatCard label="Runs" value={player.stats.runs} />
                  )}
                  {player.stats.stolenBases !== undefined && (
                    <StatCard label="SB" value={player.stats.stolenBases} />
                  )}
                  {player.stats.onBasePercentage !== undefined && (
                    <StatCard label="OBP" value={player.stats.onBasePercentage.toFixed(3)} />
                  )}
                  {player.stats.sluggingPercentage !== undefined && (
                    <StatCard label="SLG" value={player.stats.sluggingPercentage.toFixed(3)} />
                  )}

                  {/* Baseball Pitching Stats */}
                  {player.stats.era !== undefined && (
                    <StatCard label="ERA" value={player.stats.era.toFixed(2)} />
                  )}
                  {player.stats.wins !== undefined && player.stats.era !== undefined && (
                    <StatCard label="Wins" value={player.stats.wins} />
                  )}
                  {player.stats.losses !== undefined && player.stats.era !== undefined && (
                    <StatCard label="Losses" value={player.stats.losses} />
                  )}
                  {player.stats.strikeouts !== undefined && (
                    <StatCard label="K" value={player.stats.strikeouts} />
                  )}
                  {player.stats.walks !== undefined && (
                    <StatCard label="BB" value={player.stats.walks} />
                  )}
                  {player.stats.whip !== undefined && (
                    <StatCard label="WHIP" value={player.stats.whip.toFixed(2)} />
                  )}
                  {player.stats.inningsPitched !== undefined && (
                    <StatCard label="IP" value={player.stats.inningsPitched.toFixed(1)} />
                  )}
                  {player.stats.saves !== undefined && (
                    <StatCard label="Saves" value={player.stats.saves} />
                  )}

                  {/* Hockey Skater Stats */}
                  {player.stats.goals !== undefined && !player.stats.savePercentage && (
                    <StatCard label="Goals" value={player.stats.goals} />
                  )}
                  {player.stats.assists !== undefined && (
                    <StatCard label="Assists" value={player.stats.assists} />
                  )}
                  {player.stats.points !== undefined && (
                    <StatCard label="Points" value={player.stats.points} />
                  )}
                  {player.stats.plusMinus !== undefined && (
                    <StatCard label="+/-" value={player.stats.plusMinus > 0 ? `+${player.stats.plusMinus}` : player.stats.plusMinus} />
                  )}
                  {player.stats.penaltyMinutes !== undefined && (
                    <StatCard label="PIM" value={player.stats.penaltyMinutes} />
                  )}
                  {player.stats.shots !== undefined && (
                    <StatCard label="Shots" value={player.stats.shots} />
                  )}
                  {player.stats.powerPlayGoals !== undefined && (
                    <StatCard label="PPG" value={player.stats.powerPlayGoals} />
                  )}
                  {player.stats.gameWinningGoals !== undefined && (
                    <StatCard label="GWG" value={player.stats.gameWinningGoals} />
                  )}

                  {/* Hockey Goalie Stats */}
                  {player.stats.savePercentage !== undefined && (
                    <StatCard label="SV%" value={player.stats.savePercentage.toFixed(3)} />
                  )}
                  {player.stats.goalsAgainstAverage !== undefined && (
                    <StatCard label="GAA" value={player.stats.goalsAgainstAverage.toFixed(2)} />
                  )}
                  {player.stats.shutouts !== undefined && (
                    <StatCard label="Shutouts" value={player.stats.shutouts} />
                  )}
                  {player.stats.wins !== undefined && player.stats.savePercentage !== undefined && (
                    <StatCard label="Wins" value={player.stats.wins} />
                  )}
                  {player.stats.losses !== undefined && player.stats.savePercentage !== undefined && (
                    <StatCard label="Losses" value={player.stats.losses} />
                  )}
                </div>

                {/* Betting-Related Stats */}
                <Card className="p-4 bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Betting Insights
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {player.stats.overUnderRecord && (
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">O/U Record</p>
                          <p className="text-sm font-semibold">{player.stats.overUnderRecord}</p>
                        </div>
                      </div>
                    )}
                    {player.stats.performanceAgainstSpread && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">vs Spread</p>
                          <p className="text-sm font-semibold">{player.stats.performanceAgainstSpread}</p>
                        </div>
                      </div>
                    )}
                    {player.stats.recentForm && (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Recent Form</p>
                          <p className="text-sm font-semibold">{player.stats.recentForm}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Player information not available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </Card>
  )
}
