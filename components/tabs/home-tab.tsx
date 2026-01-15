"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { UserData } from "@/lib/types"
import {
  Brain,
  TrendingUp,
  Target,
  Zap,
  ArrowRight,
  BarChart3,
  Heart,
  Shield,
} from "lucide-react"

interface HomeTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  onNavigateToTab: (tab: string) => void
  refreshKey: number
}

export function HomeTab({ userData, updateUserData, onNavigateToTab, refreshKey }: HomeTabProps) {
  // Calculate emotionally aware decisions percentage
  const emotionallyAwarePercentage = userData.mindfulDecisionPercentage

  // Get subscription tier display
  const tierDisplay = {
    free: { name: "Free", color: "text-gray-400", bg: "bg-gray-500/10" },
    premium: { name: "Premium", color: "text-blue-400", bg: "bg-blue-500/10" },
    premium_plus: { name: "Premium+", color: "text-purple-400", bg: "bg-purple-500/10" },
    elite: { name: "Elite", color: "text-amber-400", bg: "bg-amber-500/10" },
  }[userData.subscriptionTier || "free"]

  return (
    <div className="space-y-6">
      {/* Welcome Hero Section */}
      <div className="relative overflow-hidden rounded-2xl glass p-6 md:p-10">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
                Welcome back, {userData.name}!
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl md:text-2xl">
                Your emotional awareness companion for smarter, safer betting
              </p>
            </div>
            <Badge className={`${tierDisplay.bg} ${tierDisplay.color} border-0 px-4 py-2 text-sm font-semibold shrink-0`}>
              {tierDisplay.name}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Emotions Logged */}
        <Card className="glass glass-hover">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start mb-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500/10 to-cyan-500/10">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold">{userData.totalEmotionsLogged}</p>
              <p className="text-sm sm:text-base text-muted-foreground">Emotions Logged</p>
            </div>
          </CardContent>
        </Card>

        {/* Mindful Bets */}
        <Card className="glass glass-hover">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start mb-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-linear-to-br from-purple-500/10 to-pink-500/10">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold">{userData.totalTrades}</p>
              <p className="text-sm sm:text-base text-muted-foreground">Total Bets</p>
            </div>
          </CardContent>
        </Card>

        {/* Emotionally Aware Decisions */}
        <Card className="glass glass-hover">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start mb-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-linear-to-br from-green-500/10 to-emerald-500/10">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold">{emotionallyAwarePercentage}%</p>
              <p className="text-sm sm:text-base text-muted-foreground">Emotionally Aware Decisions</p>
            </div>
          </CardContent>
        </Card>

        {/* Biases Identified */}
        <Card className="glass glass-hover">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start mb-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-500/10 to-orange-500/10">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold">{userData.totalBiasesIdentified}</p>
              <p className="text-sm sm:text-base text-muted-foreground">Biases Identified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Rings Progress */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl sm:text-3xl font-semibold">Daily Progress Rings</h3>
              <Badge variant="outline">
                {userData.perfectDays} perfect days
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
              {/* Emotionally Aware Decisions Ring */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                    <span className="text-base sm:text-lg sm:font-medium">Emotionally Aware Decisions</span>
                  </div>
                  <span className="text-sm sm:text-base text-muted-foreground">
                    {userData.mindfulDecisionPercentage}%
                  </span>
                </div>
                <Progress value={userData.mindfulDecisionPercentage} className="h-2" />
              </div>

              {/* Journal Completion Ring */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                    <span className="text-base sm:text-lg sm:font-medium">Journal Completion</span>
                  </div>
                  <span className="text-sm sm:text-base text-muted-foreground">
                    {userData.dailyRings.mindfulness}%
                  </span>
                </div>
                <Progress value={userData.dailyRings.mindfulness} className="h-2" />
              </div>

              {/* Bias Recognition Ring */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                    <span className="text-base sm:text-lg sm:font-medium">Bias Recognition</span>
                  </div>
                  <span className="text-sm sm:text-base text-muted-foreground">
                    {userData.dailyRings.biasRecognition}%
                  </span>
                </div>
                <Progress value={userData.dailyRings.biasRecognition} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          {/* Analyze a Bet */}
          <Card className="glass glass-hover group cursor-pointer" onClick={() => onNavigateToTab("analyze")}>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/10 to-secondary/10">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">Analyze a Bet</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Get AI-powered insights on your next bet
                </p>
              </div>
              <div className="flex items-center text-primary text-sm sm:text-base font-medium group-hover:translate-x-1 transition-transform">
                Start Analysis <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Track Behavior */}
          <Card className="glass glass-hover group cursor-pointer" onClick={() => onNavigateToTab("behavior")}>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-linear-to-br from-success/10 to-emerald-500/10">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">Track Behavior</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Log emotions and identify biases
                </p>
              </div>
              <div className="flex items-center text-primary text-sm sm:text-base font-medium group-hover:translate-x-1 transition-transform">
                Track Now <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </CardContent>
          </Card>

          {/* View Analytics */}
          <Card className="glass glass-hover group cursor-pointer" onClick={() => onNavigateToTab("analytics")}>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-linear-to-br from-warning/10 to-orange-500/10">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">View Analytics</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Track your performance and insights
                </p>
              </div>
              <div className="flex items-center text-primary text-sm sm:text-base font-medium group-hover:translate-x-1 transition-transform">
                View Stats <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-2xl sm:text-3xl font-semibold">Activity Summary</h3>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-card/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Heart className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-base text-muted-foreground">Emotions Logged</p>
                  <p className="text-3xl font-bold">{userData.totalEmotionsLogged}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-card/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-base text-muted-foreground">Biases Identified</p>
                  <p className="text-3xl font-bold">{userData.totalBiasesIdentified}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA (for free tier users) */}
      {userData.subscriptionTier === "free" && (
        <Card className="glass border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-secondary">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-3xl sm:text-4xl font-bold">Unlock Premium Features</h3>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Get unlimited AI analysis, advanced analytics, and personalized insights. We're the seatbelt, not the gas pedal.
                </p>
              </div>
              <Button 
                onClick={() => onNavigateToTab("account")}
                className="bg-linear-to-r from-primary to-secondary hover:opacity-90 shrink-0"
              >
                Upgrade Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
