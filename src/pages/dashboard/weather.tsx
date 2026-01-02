"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cloud, Wind, Droplets, Thermometer, Info } from "lucide-react"

const games = [
  {
    id: 1,
    awayTeam: "Buffalo Bills",
    homeTeam: "New England Patriots",
    date: "Sun, Dec 29 at 01:00 PM",
    venue: "Gillette Stadium",
    weather: {
      condition: "Snow",
      temp: 28,
      wind: 15,
      humidity: 85,
      precipitation: 70,
    },
    impact: "HIGH",
  },
  {
    id: 2,
    awayTeam: "Green Bay Packers",
    homeTeam: "Chicago Bears",
    date: "Sun, Dec 29 at 01:00 PM",
    venue: "Soldier Field",
    weather: {
      condition: "Partly Cloudy",
      temp: 35,
      wind: 8,
      humidity: 60,
      precipitation: 10,
    },
    impact: "LOW",
  },
]

export default function WeatherPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Weather Impact</h1>
          <p className="mt-2 text-muted-foreground">Real-time weather forecasts and historical impact data</p>
        </div>

        <div className="space-y-6">
          {games.map((game) => (
            <Card key={game.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        {game.awayTeam} @ {game.homeTeam}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">{game.date}</p>
                      <p className="text-sm text-muted-foreground">{game.venue}</p>
                    </div>
                    <Badge
                      className={
                        game.impact === "HIGH" ? "bg-red-500/20 text-red-500" : "bg-secondary/20 text-secondary"
                      }
                    >
                      {game.impact} IMPACT
                    </Badge>
                  </div>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Cloud className="h-4 w-4" />
                      Condition
                    </div>
                    <div className="text-lg font-semibold text-foreground">{game.weather.condition}</div>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Thermometer className="h-4 w-4" />
                      Temperature
                    </div>
                    <div className="text-lg font-semibold text-foreground">{game.weather.temp}°F</div>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Wind className="h-4 w-4" />
                      Wind Speed
                    </div>
                    <div className="text-lg font-semibold text-foreground">{game.weather.wind} mph</div>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Droplets className="h-4 w-4" />
                      Precipitation
                    </div>
                    <div className="text-lg font-semibold text-foreground">{game.weather.precipitation}%</div>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                    <Info className="h-4 w-4" />
                    Weather Impact Analysis
                  </div>
                  {game.impact === "HIGH" ? (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Heavy snow conditions expected to significantly impact passing game</li>
                      <li>• Wind speeds over 15 mph will affect field goal accuracy</li>
                      <li>• Consider UNDER on total points - historical avg drops 8-12 points in snow</li>
                      <li>• Ground game and defense likely to dominate</li>
                    </ul>
                  ) : (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Favorable conditions for normal game flow</li>
                      <li>• Minimal impact on passing or kicking game expected</li>
                      <li>• Standard betting considerations apply</li>
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Understanding Weather Impact</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Weather conditions can significantly impact outdoor sports performance, particularly in football where
                wind, precipitation, and temperature affect passing accuracy, ball control, and scoring totals.
              </p>
              <p className="font-medium text-foreground">Key Weather Factors:</p>
              <ul className="ml-4 space-y-1">
                <li>• Wind speeds over 15 mph reduce passing efficiency by 20-30%</li>
                <li>• Snow/rain conditions favor rushing attacks and defensive play</li>
                <li>• Temperatures below 32°F impact ball handling and kicking accuracy</li>
                <li>• Dome teams playing outdoors in adverse weather show decreased performance</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
