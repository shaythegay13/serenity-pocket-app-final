"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Target, Brain, Zap, ShoppingCart, Check, Lock, TrendingUp, AlertTriangle } from "lucide-react"

// SmartSlip AI Game Picker Data
const aiPicks = [
  {
    id: 1,
    game: "Baltimore Ravens @ Green Bay Packers",
    pick: "Green Bay Packers -2.5",
    confidence: 82,
    reasoning: "Sharp money leaning Packers, home field advantage, Ravens injury concerns with key defensive players",
    factors: { sharpMoney: "Aligned", lineMovement: "Favorable", value: "High" },
  },
  {
    id: 2,
    game: "Arizona Cardinals @ Cincinnati Bengals",
    pick: "Under 48.5",
    confidence: 75,
    reasoning:
      "Both defenses performing well, weather concerns with wind affecting passing game, historical trends favor under",
    factors: { sharpMoney: "Neutral", lineMovement: "Stable", value: "Medium" },
  },
  {
    id: 3,
    game: "Seattle Seahawks @ Carolina Panthers",
    pick: "Seattle Seahawks ML",
    confidence: 88,
    reasoning: "Seattle's offense clicking, Panthers struggling at home, significant mismatch in quarterback play",
    factors: { sharpMoney: "Heavy", lineMovement: "Favorable", value: "High" },
  },
]

// TiltLab Analysis Results
const tiltAnalysis = {
  currentState: "Elevated Risk",
  tiltScore: 68,
  recentPatterns: [
    { pattern: "Loss Chasing", detected: true, severity: "High" },
    { pattern: "Overconfidence", detected: false, severity: "Low" },
    { pattern: "Emotional Betting", detected: true, severity: "Medium" },
  ],
  recommendations: [
    "Take a 30-minute break before placing your next bet",
    "Review your bankroll management strategy",
    "Consider reducing stake size by 50% for next 3 bets",
  ],
}

// Marketplace Products
const marketplaceProducts = [
  {
    id: 1,
    name: "SmartSlip Credits",
    description: "10 AI-powered game picks",
    price: 9.99,
    credits: 10,
    popular: false,
  },
  {
    id: 2,
    name: "SmartSlip Pro Pack",
    description: "50 AI-powered game picks + priority access",
    price: 39.99,
    credits: 50,
    popular: true,
  },
  {
    id: 3,
    name: "TiltLab Sessions",
    description: "20 behavioral analysis sessions",
    price: 14.99,
    credits: 20,
    popular: false,
  },
  {
    id: 4,
    name: "Ultimate Bundle",
    description: "100 SmartSlip + 50 TiltLab + Premium Support",
    price: 79.99,
    credits: 150,
    popular: true,
  },
]

export default function InsightHubPage() {
  const [activeTab, setActiveTab] = useState("smartslip")
  const [smartSlipCredits] = useState(5)
  const [tiltLabCredits] = useState(12)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/20 shadow-lg shadow-secondary/20">
              <Sparkles className="h-10 w-10 text-secondary" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-foreground">Insight Hub</h1>
              <p className="mt-2 text-lg text-muted-foreground">AI-powered tools to elevate your betting game</p>
            </div>
          </div>
        </div>

        {/* Credits Display */}
        <div className="mb-8 flex gap-4">
          <div className="flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2">
            <Zap className="h-4 w-4 text-secondary" />
            <span className="text-sm text-secondary">SmartSlip: {smartSlipCredits} credits</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">TiltLab: {tiltLabCredits} credits</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid w-full max-w-xl grid-cols-3 bg-muted p-1">
            <TabsTrigger
              value="smartslip"
              className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
            >
              <Zap className="mr-2 h-4 w-4" />
              SmartSlip
            </TabsTrigger>
            <TabsTrigger
              value="tiltlab"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Brain className="mr-2 h-4 w-4" />
              TiltLab
            </TabsTrigger>
            <TabsTrigger
              value="marketplace"
              className="data-[state=active]:bg-success data-[state=active]:text-success-foreground"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Marketplace
            </TabsTrigger>
          </TabsList>

          {/* SmartSlip Tab */}
          <TabsContent value="smartslip" className="space-y-6">
            <div className="mb-8 grid gap-6 md:grid-cols-3">
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20">
                    <Target className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">78%</div>
                  <div className="text-sm text-muted-foreground">Pick Accuracy (30 Days)</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">+12.4%</div>
                  <div className="text-sm text-muted-foreground">ROI This Month</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">156</div>
                  <div className="text-sm text-muted-foreground">Picks Generated</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Today's AI Picks</h2>
              <Badge className="bg-secondary/20 text-secondary">Live Updates</Badge>
            </div>

            {aiPicks.map((pick) => (
              <Card
                key={pick.id}
                className="group border-border/50 bg-card/50 backdrop-blur-xl transition-all hover:shadow-xl hover:shadow-secondary/10"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="mb-2 text-sm text-muted-foreground">{pick.game}</div>
                      <div className="text-2xl font-bold text-secondary">{pick.pick}</div>
                    </div>
                    <Badge
                      className={pick.confidence >= 80 ? "bg-success/20 text-success" : "bg-primary/20 text-primary"}
                    >
                      {pick.confidence}% Confidence
                    </Badge>
                  </div>

                  <div className="mb-4 rounded-lg border border-border/50 bg-muted/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <Brain className="h-4 w-4 text-secondary" />
                      AI Reasoning
                    </div>
                    <p className="text-sm text-muted-foreground">{pick.reasoning}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-success/10 p-3 text-center">
                      <div className="text-xs text-muted-foreground">Sharp Money</div>
                      <div className="font-semibold text-success">{pick.factors.sharpMoney}</div>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3 text-center">
                      <div className="text-xs text-muted-foreground">Line Movement</div>
                      <div className="font-semibold text-primary">{pick.factors.lineMovement}</div>
                    </div>
                    <div className="rounded-lg bg-secondary/10 p-3 text-center">
                      <div className="text-xs text-muted-foreground">Value</div>
                      <div className="font-semibold text-secondary">{pick.factors.value}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* TiltLab Tab */}
          <TabsContent value="tiltlab" className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Your Behavioral Analysis</h2>
                  <Badge
                    className={
                      tiltAnalysis.tiltScore > 50 ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                    }
                  >
                    {tiltAnalysis.currentState}
                  </Badge>
                </div>

                {/* Tilt Score Gauge */}
                <div className="mb-8">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tilt Score</span>
                    <span className="text-2xl font-bold text-warning">{tiltAnalysis.tiltScore}/100</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-success via-warning to-destructive transition-all"
                      style={{ width: `${tiltAnalysis.tiltScore}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Calm</span>
                    <span>Elevated</span>
                    <span>Critical</span>
                  </div>
                </div>

                {/* Detected Patterns */}
                <div className="mb-8">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Detected Patterns</h3>
                  <div className="space-y-3">
                    {tiltAnalysis.recentPatterns.map((pattern, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-lg border p-4 ${
                          pattern.detected ? "border-warning/30 bg-warning/10" : "border-border/50 bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {pattern.detected ? (
                            <AlertTriangle className="h-5 w-5 text-warning" />
                          ) : (
                            <Check className="h-5 w-5 text-success" />
                          )}
                          <span className={pattern.detected ? "text-warning" : "text-muted-foreground"}>
                            {pattern.pattern}
                          </span>
                        </div>
                        <Badge
                          className={
                            pattern.severity === "High"
                              ? "bg-destructive/20 text-destructive"
                              : pattern.severity === "Medium"
                                ? "bg-warning/20 text-warning"
                                : "bg-muted text-muted-foreground"
                          }
                        >
                          {pattern.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-foreground">AI Recommendations</h3>
                  <div className="space-y-3">
                    {tiltAnalysis.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                          {i + 1}
                        </div>
                        <p className="text-primary">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="mt-8 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Brain className="mr-2 h-4 w-4" />
                  Run Full Analysis (1 Credit)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Purchase Credits</h2>
              <p className="text-muted-foreground">Power up your betting intelligence with AI credits</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {marketplaceProducts.map((product) => (
                <Card
                  key={product.id}
                  className={`relative border-border/50 bg-card/50 backdrop-blur-xl transition-all hover:shadow-xl ${
                    product.popular ? "ring-2 ring-success/50" : ""
                  }`}
                >
                  {product.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-success text-success-foreground">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="mb-2 text-xl font-bold text-foreground">{product.name}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">{product.description}</p>
                    <div className="mb-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">${product.price}</span>
                    </div>
                    <Button
                      className={`w-full ${
                        product.popular
                          ? "bg-success text-success-foreground hover:bg-success/90"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Purchase
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-secondary/20 bg-secondary/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Lock className="h-6 w-6 text-secondary" />
                  <div>
                    <h3 className="font-semibold text-secondary">Secure Payments</h3>
                    <p className="text-sm text-muted-foreground">
                      All transactions are encrypted and processed securely via Stripe
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
