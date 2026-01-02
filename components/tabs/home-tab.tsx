"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { UserData } from "@/lib/types"
import {
  Brain,
  TrendingUp,
  Activity,
  Target,
  Zap,
  ArrowRight,
  BarChart3,
  Heart,
  Shield,
  Award,
  Flame,
} from "lucide-react"

interface HomeTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  onNavigateToTab: (tab: string) => void
  refreshKey: number
}

export function HomeTab({ userData, updateUserData, onNavigateToTab, refreshKey }: HomeTabProps) {
  // Calculate progress percentage for level
  const levelProgress = (userData.xp / userData.xpToNextLevel) * 100

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
      <div className="relative overflow-hidden rounded-2xl glass p-8 md:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold md:text-5xl">
                Welcome back, {userData.name}!
              </h1>
              <p className="text-muted-foreground text-lg">
                Your emotional awareness companion for smarter, safer betting
              </p>
            </div>
            <Badge className={`${tierDisplay.bg} ${tierDisplay.color} border-0 px-4 py-2 text-sm font-semibold`}>
              {tierDisplay.name}
            </Badge>
          </div>

          {/* Level Progress */}
          <div className="space-y-2 max-w-md">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Level {userData.level}</span>
              <span className="text-muted-foreground">
                {userData.xp} / {userData.xpToNextLevel} XP
              </span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Emotional Awareness Streak */}
        <Card className="glass glass-hover">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <Flame className="h-6 w-6 text-blue-400" />
              </div>
              <Badge variant="outline" className="text-xs">
                {userData.longestStreak} best
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{userData.emotionalAwarenessStreak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Trades */}
        <Card className="glass glass-hover">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <BarChart3 className="h-6 w-6 text-purple-400" />
              </div>
              <Badge variant="outline" className="text-xs">
                {userData.mindfulTrades} mindful
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{userData.totalTrades}</p>
              <p className="text-sm text-muted-foreground">Total Bets</p>
            </div>
          </CardContent>
        </Card>

        {/* Bias Recognition Score */}
        <Card className="glass glass-hover">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <Brain className="h-6 w-6 text-green-400" />
              </div>
              <Badge variant="outline" className="text-xs">
                {userData.totalBiasesIdentified} found
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{userData.biasRecognitionScore}%</p>
              <p className="text-sm text-muted-foreground">Bias Recognition</p>
            </div>
          </CardContent>
        </Card>

        {/* Mindful Decision % */}
        <Card className="glass glass-hover">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10">
                <Target className="h-6 w-6 text-orange-400" />
              </div>
              <Badge variant="outline" className="text-xs">
                +{Math.round(userData.mindfulDecisionPercentage * 0.1)}%
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{userData.mindfulDecisionPercentage}%</p>
              <p className="text-sm text-muted-foreground">Mindful Decisions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Rings Progress */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Daily Progress Rings</h3>
              <Badge variant="outline">
                {userData.perfectDays} perfect days
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Emotional Awareness Ring */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-blue-400" />
                    <span className="font-medium">Emotional Awareness</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {userData.dailyRings.emotionalAwareness}%
                  </span>
                </div>
                <Progress value={userData.dailyRings.emotionalAwareness} className="h-2" />
              </div>

              {/* Bias Recognition Ring */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    <span className="font-medium">Bias Recognition</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {userData.dailyRings.biasRecognition}%
                  </span>
                </div>
                <Progress value={userData.dailyRings.biasRecognition} className="h-2" />
              </div>

              {/* Mindfulness Ring */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-400" />
                    <span className="font-medium">Mindfulness</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {userData.dailyRings.mindfulness}%
                  </span>
                </div>
                <Progress value={userData.dailyRings.mindfulness} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Analyze a Bet */}
          <Card className="glass glass-hover group cursor-pointer" onClick={() => onNavigateToTab("analyze")}>
            <CardContent className="p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Analyze a Bet</h3>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered insights on your next bet
                </p>
              </div>
              <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          {/* Track Behavior */}
          <Card className="glass glass-hover group cursor-pointer" onClick={() => onNavigateToTab("behavior")}>
            <CardContent className="p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-success/10 to-emerald-500/10">
                <Brain className="h-6 w-6 text-success" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Track Behavior</h3>
                <p className="text-sm text-muted-foreground">
                  Log emotions and identify biases
                </p>
              </div>
              <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                Track Now <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          {/* View Analytics */}
          <Card className="glass glass-hover group cursor-pointer" onClick={() => onNavigateToTab("analytics")}>
            <CardContent className="p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-warning/10 to-orange-500/10">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">View Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Review your performance and trends
                </p>
              </div>
              <div className="flex items-center text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                View Stats <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Activity Summary</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-card/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Heart className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Emotions Logged</p>
                  <p className="text-2xl font-bold">{userData.totalEmotionsLogged}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-card/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Biases Identified</p>
                  <p className="text-2xl font-bold">{userData.totalBiasesIdentified}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-card/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Activity className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Breathing Exercises</p>
                  <p className="text-2xl font-bold">{userData.totalBreathingExercises}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-card/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Award className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Modules Completed</p>
                  <p className="text-2xl font-bold">{userData.totalModulesCompleted}</p>
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
              <div className="flex-shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="text-2xl font-bold">Unlock Premium Features</h3>
                <p className="text-muted-foreground">
                  Get unlimited AI analysis, advanced analytics, and personalized insights. We're the seatbelt, not the gas pedal.
                </p>
              </div>
              <Button 
                onClick={() => onNavigateToTab("account")}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shrink-0"
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
