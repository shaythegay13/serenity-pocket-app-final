"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Sparkles, BarChart3, Target, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const lineMovementData = [
  { time: "4h", texans: +182, chargers: +725 },
  { time: "3h", texans: +180, chargers: +720 },
  { time: "2h", texans: +175, chargers: +700 },
  { time: "1h", texans: +170, chargers: +680 },
  { time: "30m", texans: +168, chargers: +650 },
  { time: "now", texans: +164, chargers: +600 },
]

export default function AnalyzePage() {
  const [betDescription, setBetDescription] = useState("")
  const [odds, setOdds] = useState("")
  const [stake, setStake] = useState("")
  const [showAnalysis, setShowAnalysis] = useState(false)

  const handleAnalyze = () => {
    if (betDescription && odds && stake) {
      setShowAnalysis(true)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 glass">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Serenity Pocket"
              width={72}
              height={72}
              className="h-18 w-18"
            />
            <span className="text-xl font-bold">Serenity Pocket</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/analyze" className="text-sm text-foreground font-medium">
              Analyze
            </Link>
            <Link href="/insights" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Insights
            </Link>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            Upgrade Pro
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl glass p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <div className="relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary border border-primary/20">
              <Sparkles className="h-4 w-4" />
              AI-Powered Bet Analysis
            </div>
            <h1 className="text-4xl font-bold md:text-5xl">Analyze Your Bet</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get instant insights on expected value, line movement, sharp money, and psychological risk factors
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left Column - Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Bet Details
                  </h2>
                  <p className="text-sm text-muted-foreground">Enter your bet information for analysis</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Describe Your Bet</Label>
                    <Textarea
                      id="description"
                      placeholder="e.g., Lakers -3.5 vs Warriors, Over 225.5 points..."
                      value={betDescription}
                      onChange={(e) => setBetDescription(e.target.value)}
                      className="min-h-[100px] bg-background/50 resize-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="odds">Odds (American)</Label>
                      <Input
                        id="odds"
                        placeholder="-110"
                        value={odds}
                        onChange={(e) => setOdds(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stake">
                        Stake Amount ($) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="stake"
                        placeholder="100"
                        value={stake}
                        onChange={(e) => setStake(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slip">
                      Paste Bet Slip <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Textarea
                      id="slip"
                      placeholder="Paste your bet slip text here for auto-parsing"
                      className="min-h-[80px] bg-background/50 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Parse Slip
                      </Button>
                      <Button variant="outline" size="sm">
                        From Clipboard
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={!betDescription || !odds || !stake}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    size="lg"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Analyze Bet
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="glass border-primary/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-semibold">Analysis Includes</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Expected value calculation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Line movement tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Sharp vs public money analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Psychological risk assessment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Actionable betting insights</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Analysis Results */}
          <div className="lg:col-span-3 space-y-6">
            {showAnalysis ? (
              <>
                {/* Quick Metrics */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="glass">
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Expected Value</p>
                        <p className="text-3xl font-bold text-success">+2.8%</p>
                        <Badge variant="outline" className="text-xs border-success/50 text-success">
                          Positive EV
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Win Probability</p>
                        <p className="text-3xl font-bold text-primary">62%</p>
                        <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                          Above Average
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Risk Level</p>
                        <p className="text-3xl font-bold text-warning">Medium</p>
                        <Badge variant="outline" className="text-xs border-warning/50 text-warning">
                          Manageable
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Line Movement Chart */}
                <Card className="glass">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Line Movement History</h3>
                      </div>
                      <Badge variant="secondary">Last 4 Hours</Badge>
                    </div>

                    <div className="rounded-lg bg-background/50 p-4 space-y-2">
                      <p className="font-semibold">Houston Texans @ Los Angeles Chargers</p>
                      <p className="text-sm text-muted-foreground">Saturday, December 27 at 4:32 PM</p>
                    </div>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineMovementData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.01 250)" />
                          <XAxis dataKey="time" stroke="oklch(0.55 0.01 250)" fontSize={12} />
                          <YAxis stroke="oklch(0.55 0.01 250)" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "oklch(0.12 0.01 250)",
                              border: "1px solid oklch(0.18 0.01 250)",
                              borderRadius: "8px",
                              color: "oklch(0.98 0 0)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="texans"
                            stroke="oklch(0.65 0.25 260)"
                            strokeWidth={3}
                            dot={{ fill: "oklch(0.65 0.25 260)", r: 4 }}
                            name="Texans"
                          />
                          <Line
                            type="monotone"
                            dataKey="chargers"
                            stroke="oklch(0.7 0.18 70)"
                            strokeWidth={3}
                            dot={{ fill: "oklch(0.7 0.18 70)", r: 4 }}
                            name="Chargers"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                        <p className="text-sm text-muted-foreground mb-1">Houston Texans</p>
                        <p className="text-2xl font-bold text-primary">+164</p>
                        <p className="text-xs text-muted-foreground mt-1">Opening: +182 (-18 pts)</p>
                      </div>
                      <div className="rounded-lg bg-warning/10 p-4 border border-warning/20">
                        <p className="text-sm text-muted-foreground mb-1">Los Angeles Chargers</p>
                        <p className="text-2xl font-bold text-warning">+600</p>
                        <p className="text-xs text-muted-foreground mt-1">Opening: +725 (-125 pts)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="glass border-primary/20">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">AI Analysis</h3>
                        <p className="text-sm text-muted-foreground">Smart insights based on data patterns</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-lg bg-success/10 p-4 border border-success/20">
                        <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="font-medium text-success">Sharp Money Detected</p>
                          <p className="text-sm text-muted-foreground">
                            Professional bettors are heavily backing Houston despite public favoring LA
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-lg bg-primary/10 p-4 border border-primary/20">
                        <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="font-medium text-primary">Strong Line Movement</p>
                          <p className="text-sm text-muted-foreground">
                            18-point line move indicates significant market activity and potential value
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-lg bg-warning/10 p-4 border border-warning/20">
                        <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="font-medium text-warning">Timing Consideration</p>
                          <p className="text-sm text-muted-foreground">
                            Line may continue to move closer to game time. Consider waiting for better value
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Recommendation */}
                <Card className="glass border-success/20 bg-success/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                          <Target className="h-6 w-6 text-success" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-xl font-semibold text-success">Recommended Action: Place Bet</h3>
                        <p className="text-muted-foreground">
                          This bet shows positive expected value with favorable line movement. The risk level is
                          manageable for your bankroll, and sharp money indicators support this play.
                        </p>
                        <Button className="bg-gradient-to-r from-success to-emerald-600 hover:opacity-90 mt-4">
                          Save to Watchlist <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="glass">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6">
                    <Brain className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Ready to Analyze</h3>
                  <p className="text-muted-foreground max-w-md">
                    Fill in your bet details on the left and click "Analyze Bet" to receive comprehensive AI-powered
                    insights
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
