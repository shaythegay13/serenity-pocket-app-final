"use client"

import { X, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PlayerModalProps {
  player: {
    name: string
    position: string
    team: string
    number: string
  }
  onClose: () => void
}

export function PlayerModal({ player, onClose }: PlayerModalProps) {
  const games = [
    { game: 7, stats: "REC • YDS • TD", result: "L" },
    { game: 6, stats: "REC • YDS • TD", result: "L" },
    { game: 5, stats: "REC • YDS • TD", result: "W" },
  ]

  const seasonStats = [
    { label: "Tackles", value: "5.3", home: "5.4", away: "4.9" },
    { label: "Pass Deflections", value: "1.4", home: "0.45", away: "0.17" },
    { label: "Interceptions", value: "0.30", home: null, away: null },
  ]

  const propBets = [
    { label: "Over0.5 Tackles", rate: "56%" },
    { label: "Over0.5 Interceptions", rate: "24%" },
    { label: "Over0.5 Pass Deflections", rate: "59%" },
  ]

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
                {player.position} • #{player.number} • {player.team}
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
              {seasonStats.map((stat, index) => (
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TACKLES</span>
                    <span className="font-semibold text-secondary">5.4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">INTS</span>
                    <span className="font-semibold text-secondary">0.45</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                <div className="mb-2 text-xs text-muted-foreground">Away</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TACKLES</span>
                    <span className="font-semibold text-primary">4.9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">INTS</span>
                    <span className="font-semibold text-primary">0.17</span>
                  </div>
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
              {games.map((game, index) => (
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
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {propBets.map((prop, index) => (
                <div key={index} className="rounded-lg border border-border/30 bg-background/50 p-3">
                  <div className="text-xs text-muted-foreground">{prop.label}</div>
                  <div className="mt-1 text-2xl font-bold text-secondary">{prop.rate}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
              <TrendingUp className="h-4 w-4" />
              Recent Trends & Insights
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                <div className="text-sm text-foreground">
                  <span className="font-medium">Tackles:</span> <span className="text-primary font-semibold">+</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                <div className="text-sm text-foreground">
                  <span className="font-medium">Ints:</span> <span className="text-muted-foreground">-</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary" />
                <div className="text-sm text-foreground">
                  <span className="font-medium">Streak:</span> <span className="text-primary font-semibold">3L</span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>• Use these trends alongside current matchup analysis for informed betting decisions</p>
              <p>• Consider home/away splits and opponent strength when evaluating prop bets</p>
              <p>• Weather conditions can significantly impact outdoor performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
