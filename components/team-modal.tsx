"use client"

import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TeamModalProps {
  team: {
    name: string
    record: string
    recentForm: string[]
    pointsPerGame: string
    pointsAllowed: string
    totalYards: string
    turnovers: string
  }
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

export function TeamModal({ team, roster, loadingRoster, onClose, onPlayerClick }: TeamModalProps) {
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
                LIVE ESPN DATA
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
                <div className="mt-1 text-xl font-bold text-foreground">{team.record}</div>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                <div className="text-xs text-muted-foreground">Points/Game</div>
                <div className="mt-1 text-xl font-bold text-foreground">{team.pointsPerGame}</div>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                <div className="text-xs text-muted-foreground">Points Allowed</div>
                <div className="mt-1 text-xl font-bold text-foreground">{team.pointsAllowed}</div>
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
              <div className="text-xs text-muted-foreground">Total Yards/Game</div>
              <div className="mt-1 text-xl font-bold text-foreground">{team.totalYards}</div>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/50 p-3">
              <div className="text-xs text-muted-foreground">Turnovers</div>
              <div className="mt-1 text-xl font-bold text-foreground">{team.turnovers}</div>
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
            ) : roster && roster.length > 0 ? (
              roster.map((player, index) => {
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
                      <div className="text-xs text-muted-foreground">{player.position}</div>
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
                No roster data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
