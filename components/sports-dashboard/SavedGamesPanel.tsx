"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bookmark, Trash2, ExternalLink, Clock } from "lucide-react"
import { SavedGamesService, type SavedGame } from "@/lib/saved-games-service"
import { toast } from "sonner"

interface SavedGamesPanelProps {
  onGameClick?: (game: SavedGame) => void
}

export function SavedGamesPanel({ onGameClick }: SavedGamesPanelProps) {
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const [loading, setLoading] = useState(true)

  const loadSavedGames = () => {
    try {
      setLoading(true)
      const games = SavedGamesService.getSavedGames()
      // Sort by saved date (most recent first)
      games.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      setSavedGames(games)
    } catch (error) {
      console.error("Error loading saved games:", error)
      toast.error("Failed to load saved games")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSavedGames()
    // Clean up old games on mount
    SavedGamesService.cleanupOldGames()
  }, [])

  const handleRemove = (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      SavedGamesService.removeSavedGame(gameId)
      setSavedGames(prev => prev.filter(g => g.id !== gameId))
      toast.success("Game removed from saved games")
    } catch (error) {
      console.error("Error removing game:", error)
      toast.error("Failed to remove game")
    }
  }

  const formatGameTime = (gameTime: string | Date): string => {
    const date = typeof gameTime === "string" ? new Date(gameTime) : gameTime
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const hours = Math.abs(diff / (1000 * 60 * 60))

    if (hours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-red-500/20 text-red-400 border-red-500/40"
      case "UPCOMING":
        return "bg-gray-500/20 text-gray-400 border-gray-500/40"
      case "COMPLETED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/40"
    }
  }

  const handleBetOnSportsbook = (game: SavedGame, sportsbook: "fanduel" | "draftkings", e: React.MouseEvent) => {
    e.stopPropagation()
    // In a real implementation, these would be deep links or affiliate links
    // For now, we'll just show a toast
    const sportsbookName = sportsbook === "fanduel" ? "FanDuel" : "DraftKings"
    toast.success(`Opening ${sportsbookName} for ${game.awayTeam} @ ${game.homeTeam}...`)

    // You could add actual deep links here
    // window.open(`https://sportsbook.${sportsbook}.com/...`, '_blank')
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    )
  }

  if (savedGames.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Saved Games</h3>
        <p className="text-sm text-muted-foreground">
          Save games from the sports dashboard to quickly access them later
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Saved Games</h3>
          <Badge variant="secondary">{savedGames.length}</Badge>
        </div>
        {savedGames.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              SavedGamesService.clearAllSavedGames()
              setSavedGames([])
              toast.success("All saved games cleared")
            }}
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {savedGames.map((game) => (
          <Card
            key={game.id}
            className="p-4 bg-card/50 hover:bg-card/70 transition-colors cursor-pointer"
            onClick={() => onGameClick?.(game)}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-foreground">
                    {game.awayTeam} @ {game.homeTeam}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatGameTime(game.gameTime)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(game.status)}`}>
                    {game.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleRemove(game.id, e)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Odds */}
              {(game.spread !== undefined || game.total !== undefined) && (
                <div className="flex gap-4 text-sm">
                  {game.spread !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Spread: </span>
                      <span className="text-primary font-semibold">
                        {game.spread > 0 ? "+" : ""}{game.spread}
                      </span>
                    </div>
                  )}
                  {game.total !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="text-warning font-semibold">
                        {game.total}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Sportsbook Quick Links */}
              {game.status === "UPCOMING" || game.status === "LIVE" ? (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={(e) => handleBetOnSportsbook(game, "fanduel", e)}
                  >
                    <ExternalLink className="h-3 w-3" />
                    FanDuel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={(e) => handleBetOnSportsbook(game, "draftkings", e)}
                  >
                    <ExternalLink className="h-3 w-3" />
                    DraftKings
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}
