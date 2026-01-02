"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const liveGames = [
  {
    id: 1,
    status: "LIVE",
    time: "Dec 27, 04:32 PM",
    awayTeam: "Houston Texans",
    homeTeam: "Los Angeles Chargers",
    awayOdds: "+164",
    homeOdds: "+600",
    awayBook: "FanDuel",
    homeBook: "FanDuel",
  },
]

const upcomingGames = [
  {
    id: 2,
    status: "UPCOMING",
    time: "Dec 27, 08:01 PM",
    awayTeam: "Baltimore Ravens",
    homeTeam: "Green Bay Packers",
    awayOdds: "+120",
    homeOdds: "+100",
    awayBook: "DraftKings",
    homeBook: "LowVig.ag",
  },
  {
    id: 3,
    status: "UPCOMING",
    time: "Dec 28, 01:00 PM",
    awayTeam: "Arizona Cardinals",
    homeTeam: "Cincinnati Bengals",
    awayOdds: "+280",
    homeOdds: "+107",
    awayBook: "DraftKings",
    homeBook: "LowVig.ag",
  },
]

export default function LiveScoresPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Live Scores & In-Game Updates</h1>
        </div>

        <div className="space-y-6">
          {liveGames.map((game) => (
            <Card key={game.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Badge className="bg-red-500 text-white">
                    <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                    {game.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{game.time}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Away</span>
                      <div className="text-lg font-semibold text-foreground">{game.awayTeam}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{game.awayOdds}</div>
                      <div className="text-xs text-muted-foreground">{game.awayBook}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Home</span>
                      <div className="text-lg font-semibold text-foreground">{game.homeTeam}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-secondary">{game.homeOdds}</div>
                      <div className="text-xs text-muted-foreground">{game.homeBook}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {upcomingGames.map((game) => (
            <Card key={game.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Badge className="bg-blue-600 text-white">{game.status}</Badge>
                  <span className="text-sm text-muted-foreground">{game.time}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Away</span>
                      <div className="text-lg font-semibold text-foreground">{game.awayTeam}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{game.awayOdds}</div>
                      <div className="text-xs text-muted-foreground">{game.awayBook}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Home</span>
                      <div className="text-lg font-semibold text-foreground">{game.homeTeam}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-secondary">{game.homeOdds}</div>
                      <div className="text-xs text-muted-foreground">{game.homeBook}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
