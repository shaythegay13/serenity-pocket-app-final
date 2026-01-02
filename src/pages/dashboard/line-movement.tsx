"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const lineMovementData = [
  { time: "4h ago", texans: +182, chargers: +725 },
  { time: "3h ago", texans: +180, chargers: +720 },
  { time: "2h ago", texans: +175, chargers: +700 },
  { time: "1h ago", texans: +170, chargers: +680 },
  { time: "30m ago", texans: +168, chargers: +650 },
  { time: "15m ago", texans: +165, chargers: +620 },
  { time: "now", texans: +164, chargers: +600 },
]

export default function LineMovementPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Line Movement History</h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">Houston Texans @ Los Angeles Chargers</h2>
              <p className="mt-1 text-sm text-muted-foreground">Sat, Dec 27 at 04:32 PM</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Moneyline Movement Over Time</h3>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Hours
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    6h
                  </Badge>
                </div>
              </div>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineMovementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4a" />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a2332",
                        border: "1px solid #2a3a4a",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="texans"
                      name="Houston Texans"
                      stroke="#4fd1c5"
                      strokeWidth={3}
                      dot={{ fill: "#4fd1c5", r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="chargers"
                      name="Los Angeles Chargers"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: "#f59e0b", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                <div className="text-sm text-muted-foreground">Houston Texans Current</div>
                <div className="mt-2 text-3xl font-bold text-primary">+164</div>
                <div className="mt-2 text-sm text-muted-foreground">Opening: +182</div>
              </div>

              <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-4">
                <div className="text-sm text-muted-foreground">Los Angeles Chargers Current</div>
                <div className="mt-2 text-3xl font-bold text-secondary">+600</div>
                <div className="mt-2 text-sm text-muted-foreground">Opening: +725</div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                <Info className="h-4 w-4" />
                Understanding Line Movement
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Lines move based on betting volume and sharp money activity</li>
                <li>• Significant movement may indicate injuries, weather, or insider information</li>
                <li>• Track across 6 sportsbooks to find value opportunities</li>
                <li>• Reverse line movement (RLM) = public bets one side, line moves the other way</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
