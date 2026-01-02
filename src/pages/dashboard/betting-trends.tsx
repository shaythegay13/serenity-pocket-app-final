"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, Info } from "lucide-react"

const games = [
  {
    id: 1,
    awayTeam: "Houston Texans",
    homeTeam: "Los Angeles Chargers",
    date: "Sat, Dec 27 at 04:32 PM",
    publicBetting: {
      away: { team: "Houston Texans", percent: 54.0, bets: "52.0% of bets" },
      home: { team: "Los Angeles Chargers", percent: 46.0, bets: "48.0% of bets" },
    },
    sharpMoney: {
      away: { team: "Houston Texans", percent: 39.4, bets: "38.4% of bets" },
      home: { team: "Los Angeles Chargers", percent: 60.6, bets: "63.6% of bets" },
    },
    consensus: { team: "LOS ANGELES CHARGERS", percent: 59 },
    tabs: ["Moneyline", "Spread", "Total"],
  },
  {
    id: 2,
    awayTeam: "Baltimore Ravens",
    homeTeam: "Green Bay Packers",
    date: "Sat, Dec 27 at 08:01 PM",
    publicBetting: {
      away: { team: "Baltimore Ravens", percent: 62.0, bets: "58.0% of bets" },
      home: { team: "Green Bay Packers", percent: 38.0, bets: "42.0% of bets" },
    },
    sharpMoney: {
      away: { team: "Baltimore Ravens", percent: 45.2, bets: "42.1% of bets" },
      home: { team: "Green Bay Packers", percent: 54.8, bets: "57.9% of bets" },
    },
    consensus: { team: "GREEN BAY PACKERS", percent: 55 },
    tabs: ["Moneyline", "Spread", "Total"],
  },
]

export default function BettingTrendsPage() {
  const [activeTab, setActiveTab] = useState<{ [key: number]: string }>({
    1: "Spread",
    2: "Spread",
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Betting Trends & Public Action</h1>
        </div>

        <div className="space-y-6">
          {games.map((game) => (
            <Card key={game.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Betting Trends & Sharp Money</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {game.awayTeam} @ {game.homeTeam}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {game.tabs.map((tab) => (
                      <Button
                        key={tab}
                        variant={activeTab[game.id] === tab ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab({ ...activeTab, [game.id]: tab })}
                        className={
                          activeTab[game.id] === tab
                            ? "bg-primary text-primary-foreground"
                            : "bg-transparent hover:bg-muted"
                        }
                      >
                        {tab}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mb-6 rounded-lg border border-border/50 bg-background/50 p-4">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    Public vs Sharp Money
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Public Bettors</span>
                        <span className="text-muted-foreground">Sharp/Professional</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{game.publicBetting.away.team}</span>
                            <span className="font-bold text-primary">{game.publicBetting.away.percent}%</span>
                          </div>
                          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${game.publicBetting.away.percent}%` }}
                            />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{game.publicBetting.away.bets}</div>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{game.publicBetting.home.team}</span>
                            <span className="font-bold text-primary">{game.publicBetting.home.percent}%</span>
                          </div>
                          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${game.publicBetting.home.percent}%` }}
                            />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{game.publicBetting.home.bets}</div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border/50 pt-4">
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{game.sharpMoney.away.team}</span>
                            <span className="font-bold text-secondary">{game.sharpMoney.away.percent}%</span>
                          </div>
                          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-secondary transition-all"
                              style={{ width: `${game.sharpMoney.away.percent}%` }}
                            />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{game.sharpMoney.away.bets}</div>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{game.sharpMoney.home.team}</span>
                            <span className="font-bold text-secondary">{game.sharpMoney.home.percent}%</span>
                          </div>
                          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-secondary transition-all"
                              style={{ width: `${game.sharpMoney.home.percent}%` }}
                            />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{game.sharpMoney.home.bets}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4 rounded-lg border border-border/50 bg-background/50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Market Consensus
                  </div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-xs text-muted-foreground">Sharp Money Leaning</div>
                    <div className="text-2xl font-bold text-primary">{game.consensus.team}</div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-sm text-muted-foreground">Sharp %</div>
                    <div className="text-3xl font-bold text-secondary">{game.consensus.percent}%</div>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                    <Info className="h-4 w-4" />
                    Reading the Trends
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Public betting percentages show where casual bettors are placing their money</li>
                    <li>• Sharp money represents professional and informed betting action</li>
                    <li>• When sharp money contradicts public betting, it often signals value</li>
                    <li>• Track consensus across multiple sportsbooks for the most accurate picture</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
