"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Heart, DollarSign, Link2, TrendingUp, TrendingDown, Brain, Smile, Meh } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts"

// Mental Health Data
const moodHistory = [
  { date: "Mon", joy: 3, calm: 4, fear: 1, greed: 2, frustration: 1, sadness: 0 },
  { date: "Tue", joy: 2, calm: 2, fear: 3, greed: 4, frustration: 3, sadness: 2 },
  { date: "Wed", joy: 4, calm: 5, fear: 0, greed: 1, frustration: 0, sadness: 0 },
  { date: "Thu", joy: 3, calm: 3, fear: 2, greed: 3, frustration: 2, sadness: 1 },
  { date: "Fri", joy: 1, calm: 1, fear: 4, greed: 5, frustration: 4, sadness: 3 },
  { date: "Sat", joy: 5, calm: 4, fear: 0, greed: 1, frustration: 1, sadness: 0 },
  { date: "Sun", joy: 4, calm: 5, fear: 1, greed: 1, frustration: 0, sadness: 0 },
]

const emotionDistribution = [
  { name: "Joy", value: 22, color: "#fbbf24" },
  { name: "Calm", value: 24, color: "#2dd4bf" },
  { name: "Fear", value: 11, color: "#f87171" },
  { name: "Greed", value: 17, color: "#a78bfa" },
  { name: "Frustration", value: 11, color: "#fb923c" },
  { name: "Sadness", value: 6, color: "#60a5fa" },
]

// Betting Data
const weeklyProfitLoss = [
  { day: "Mon", profit: 150, bets: 5 },
  { day: "Tue", profit: -80, bets: 8 },
  { day: "Wed", profit: 220, bets: 4 },
  { day: "Thu", profit: 180, bets: 6 },
  { day: "Fri", profit: -150, bets: 12 },
  { day: "Sat", profit: 300, bets: 7 },
  { day: "Sun", profit: 190, bets: 5 },
]

const betTypePerformance = [
  { type: "Moneyline", wins: 18, losses: 12, roi: 8.5 },
  { type: "Spread", wins: 22, losses: 14, roi: 12.3 },
  { type: "Total", wins: 14, losses: 10, roi: 6.2 },
  { type: "Parlay", wins: 4, losses: 16, roi: -15.8 },
]

// Correlation Data
const correlationData = [
  { emotion: "Joy", winRate: 72, avgStake: 45 },
  { emotion: "Calm", winRate: 78, avgStake: 50 },
  { emotion: "Fear", winRate: 42, avgStake: 25 },
  { emotion: "Greed", winRate: 38, avgStake: 120 },
  { emotion: "Frustration", winRate: 35, avgStake: 85 },
  { emotion: "Sadness", winRate: 48, avgStake: 30 },
]

const scatterData = [
  { tiltScore: 20, profit: 150, emotion: "Calm" },
  { tiltScore: 35, profit: 80, emotion: "Joy" },
  { tiltScore: 45, profit: 50, emotion: "Calm" },
  { tiltScore: 55, profit: -30, emotion: "Fear" },
  { tiltScore: 65, profit: -80, emotion: "Greed" },
  { tiltScore: 75, profit: -150, emotion: "Frustration" },
  { tiltScore: 85, profit: -200, emotion: "Greed" },
  { tiltScore: 30, profit: 120, emotion: "Joy" },
  { tiltScore: 40, profit: 90, emotion: "Calm" },
  { tiltScore: 60, profit: -60, emotion: "Fear" },
]

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("mental-health")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 shadow-lg shadow-cyan-500/20">
              <BarChart3 className="h-10 w-10 text-cyan-400" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-5xl font-bold text-transparent">
                Analytics
              </h1>
              <p className="mt-2 text-lg text-slate-400">
                Deep insights into your mental state and betting performance
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid w-full max-w-xl grid-cols-3 bg-slate-900/50 p-1">
            <TabsTrigger
              value="mental-health"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
            >
              <Heart className="mr-2 h-4 w-4" />
              Mental Health
            </TabsTrigger>
            <TabsTrigger
              value="betting"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Betting
            </TabsTrigger>
            <TabsTrigger
              value="correlation"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Correlation
            </TabsTrigger>
          </TabsList>

          {/* Mental Health Tab */}
          <TabsContent value="mental-health" className="space-y-6">
            {/* Summary Cards */}
            <div className="mb-8 grid gap-6 md:grid-cols-3">
              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20">
                    <Smile className="h-6 w-6 text-teal-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">Calm</div>
                  <div className="text-sm text-slate-400">Most Frequent Emotion</div>
                </CardContent>
              </Card>
              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">+15%</div>
                  <div className="text-sm text-slate-400">Emotional Stability (vs Last Week)</div>
                </CardContent>
              </Card>
              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                    <Meh className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">32</div>
                  <div className="text-sm text-slate-400">Average Tilt Score</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="mb-6 text-xl font-bold text-white">Emotion Trends (7 Days)</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={moodHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                        />
                        <Line type="monotone" dataKey="joy" stroke="#fbbf24" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="calm" stroke="#2dd4bf" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="fear" stroke="#f87171" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="greed" stroke="#a78bfa" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="mb-6 text-xl font-bold text-white">Emotion Distribution</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={emotionDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {emotionDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Betting Tab */}
          <TabsContent value="betting" className="space-y-6">
            {/* Summary Cards */}
            <div className="mb-8 grid gap-6 md:grid-cols-4">
              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    <DollarSign className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">+$810</div>
                  <div className="text-sm text-slate-400">Weekly Profit</div>
                </CardContent>
              </Card>
              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                    <BarChart3 className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">64%</div>
                  <div className="text-sm text-slate-400">Win Rate</div>
                </CardContent>
              </Card>
              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20">
                    <TrendingUp className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">47</div>
                  <div className="text-sm text-slate-400">Total Bets</div>
                </CardContent>
              </Card>
              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                    <TrendingDown className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">8.2%</div>
                  <div className="text-sm text-slate-400">ROI</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="mb-6 text-xl font-bold text-white">Daily Profit/Loss</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyProfitLoss}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="profit" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="mb-6 text-xl font-bold text-white">Bet Type Performance</h3>
                  <div className="space-y-4">
                    {betTypePerformance.map((bet) => (
                      <div key={bet.type} className="rounded-lg border border-slate-800/50 bg-slate-950/50 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-semibold text-white">{bet.type}</span>
                          <span className={bet.roi >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {bet.roi >= 0 ? "+" : ""}
                            {bet.roi}% ROI
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-emerald-400">{bet.wins}W</span>
                          <span className="text-red-400">{bet.losses}L</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                              style={{ width: `${(bet.wins / (bet.wins + bet.losses)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Correlation Tab */}
          <TabsContent value="correlation" className="space-y-6">
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Brain className="h-6 w-6 text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-purple-300">Mind-Money Connection</h3>
                    <p className="text-sm text-slate-400">
                      Discover how your emotional state directly impacts your betting outcomes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="mb-6 text-xl font-bold text-white">Win Rate by Emotion</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={correlationData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                        <YAxis dataKey="emotion" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="winRate" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="mb-6 text-xl font-bold text-white">Tilt Score vs Profit</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="tiltScore" name="Tilt Score" stroke="#94a3b8" fontSize={12} />
                        <YAxis dataKey="profit" name="Profit" stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                          formatter={(value, name) => [
                            name === "tiltScore" ? value : `$${value}`,
                            name === "tiltScore" ? "Tilt Score" : "Profit",
                          ]}
                        />
                        <Scatter name="Bets" data={scatterData} fill="#06b6d4" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Insights */}
            <Card className="border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl">
              <CardContent className="p-6">
                <h3 className="mb-6 text-xl font-bold text-white">Key Insights</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="mb-2 text-sm font-medium text-slate-400">Best Emotional State</div>
                    <div className="text-2xl font-bold text-emerald-400">CALM</div>
                    <div className="mt-1 text-sm text-slate-400">78% win rate when calm</div>
                  </div>
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    <div className="mb-2 text-sm font-medium text-slate-400">Worst Emotional State</div>
                    <div className="text-2xl font-bold text-red-400">FRUSTRATION</div>
                    <div className="mt-1 text-sm text-slate-400">35% win rate when frustrated</div>
                  </div>
                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                    <div className="mb-2 text-sm font-medium text-slate-400">Tilt Threshold</div>
                    <div className="text-2xl font-bold text-purple-400">Score 50+</div>
                    <div className="mt-1 text-sm text-slate-400">Profits decline sharply above 50</div>
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
