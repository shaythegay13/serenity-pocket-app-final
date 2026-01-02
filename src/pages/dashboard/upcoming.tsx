"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const upcomingGames = [
  {
    id: 1,
    awayTeam: "Baltimore Ravens",
    homeTeam: "Green Bay Packers",
    date: "Sat, Dec 27",
    time: "08:01 PM",
    status: "6h away",
    awayOdds: { moneyline: "+120", book: "DraftKings" },
    homeOdds: { moneyline: "+100", book: "LowVig.ag" },
    totalBooks: 9,
  },
  {
    id: 2,
    awayTeam: "Arizona Cardinals",
    homeTeam: "Cincinnati Bengals",
    date: "Sun, Dec 28",
    time: "01:00 PM",
    status: "17h away",
    awayOdds: { moneyline: "+280", book: "DraftKings" },
    homeOdds: { moneyline: "+107", book: "LowVig.ag" },
    totalBooks: 9,
  },
  {
    id: 3,
    awayTeam: "Seattle Seahawks",
    homeTeam: "Carolina Panthers",
    date: "Sun, Dec 28",
    time: "01:00 PM",
    status: "17h away",
    awayOdds: { moneyline: "-102", book: "DraftKings" },
    homeOdds: { moneyline: "+295", book: "LowVig.ag" },
    totalBooks: 9,
  },
]

export default function UpcomingGamesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Upcoming Games & Live Odds</h1>
        </div>

        <div className="space-y-4">
          {upcomingGames.map((game) => (
            <Card key={game.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    {game.awayTeam} @ {game.homeTeam}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span>
                      {game.date} • {game.time}
                    </span>
                    <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                      {game.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border/30 bg-background/30 p-4">
                    <div className="mb-2 text-sm text-muted-foreground">
                      {game.awayTeam} <span className="text-xs">(Away)</span>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Best Moneyline</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">{game.awayOdds.moneyline}</span>
                        <span className="text-xs text-muted-foreground">{game.awayOdds.book}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/30 bg-background/30 p-4">
                    <div className="mb-2 text-sm text-muted-foreground">
                      {game.homeTeam} <span className="text-xs">(Home)</span>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Best Moneyline</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-secondary">{game.homeOdds.moneyline}</span>
                        <span className="text-xs text-muted-foreground">{game.homeOdds.book}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center text-xs text-muted-foreground">
                  Odds from {game.totalBooks} sportsbooks • Compare lines to find the best value
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
