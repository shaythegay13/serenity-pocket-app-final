"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmotionChart } from "@/components/emotion-chart"
import { TradePerformanceChart } from "@/components/trade-performance-chart"
import { BiasHistoryChart } from "@/components/bias-history-chart"
import { ProgressBar } from "@/components/progress-bar"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { UserData, BiasQuizHistory } from "@/lib/types"
import { BarChart3, TrendingUp, Wind, Lock } from "lucide-react"

interface ProgressTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  refreshKey?: number
}

export function ProgressTab({ userData, updateUserData, refreshKey = 0 }: ProgressTabProps) {
  const [achievements, setAchievements] = useState<any[]>([])
  const [emotionLogs, setEmotionLogs] = useState<any[]>([])
  const [trades, setTrades] = useState<any[]>([])
  const [biasHistory, setBiasHistory] = useState<BiasQuizHistory[]>([])

  useEffect(() => {
    const fetchAchievements = async () => {
      const achievements = await storage.getAchievements()
      setAchievements(achievements)
    }
    fetchAchievements()
  }, [refreshKey])

  useEffect(() => {
    const fetchEmotionLogs = async () => {
      const emotionLogs = await storage.getEmotionLogs()
      setEmotionLogs(emotionLogs)
    }
    fetchEmotionLogs()
  }, [refreshKey])

  useEffect(() => {
    const fetchTrades = async () => {
      const trades = await storage.getTrades()
      setTrades(trades)
    }
    fetchTrades()
  }, [refreshKey])

  useEffect(() => {
    const fetchBiasHistory = async () => {
      const history = await storage.getBiasQuizHistory()
      setBiasHistory(history)
    }
    fetchBiasHistory()
  }, [refreshKey])

  const streakBadges = achievements.filter((a) => a.category === "streak")
  const biasBusterBadges = achievements.filter((a) => a.category === "bias-buster")
  const behaviorChangeBadges = achievements.filter((a) => a.category === "behavior-change")
  const learningBadges = achievements.filter((a) => a.category === "learning")

  const renderAchievementCard = (achievement: any) => (
    <Card
      key={achievement.id}
      className={`p-4 transition-all ${
        achievement.unlocked
          ? "bg-linear-to-br from-primary/10 to-blue/10 border-primary/30 shadow-md"
          : "bg-card/50 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`text-3xl sm:text-4xl transition-all shrink-0 ${achievement.unlocked ? "scale-110" : "grayscale"}`}
        >
          {achievement.unlocked ? achievement.icon : <Lock className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />}
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground">{achievement.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{achievement.description}</p>
          </div>
          {!achievement.unlocked && (
            <div className="space-y-1">
              <ProgressBar
                current={achievement.progress}
                max={achievement.maxProgress}
                label=""
                showPercentage={false}
              />
              <p className="text-xs text-muted-foreground">
                {achievement.progress} / {achievement.maxProgress}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                Not Achieved Yet
              </p>
            </div>
          )}
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-primary font-medium">
              Achieved {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-4 sm:space-y-6 fade-in">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Progress</h2>
        <p className="text-sm text-muted-foreground">Track your metrics and view your achievements</p>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="w-full mb-4 sm:mb-6 grid grid-cols-2">
          <TabsTrigger value="metrics" className="text-xs sm:text-sm">
            Metrics
          </TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs sm:text-sm">
            Achievements
          </TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4 sm:space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total XP</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{userData.xp}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-teal/10 shrink-0">
                  <Wind className="h-4 w-4 sm:h-5 sm:w-5 text-teal" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Streak</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground truncate">
                    {userData.emotionalAwarenessStreak}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue/10 shrink-0">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Emotions</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{emotionLogs.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-amber/10 shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-amber" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Bets</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{trades.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <EmotionChart logs={emotionLogs} />
            <TradePerformanceChart trades={trades} />
          </div>

          {/* Bias Awareness Progress */}
          <BiasHistoryChart history={biasHistory} />

          {/* Insights */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Your Progress Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">Emotional Awareness</h4>
                <p className="text-sm text-muted-foreground">
                  You've logged {emotionLogs.length} emotions. Keep tracking to identify patterns that affect your
                  betting decisions.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue/5 border border-blue/20">
                <h4 className="font-semibold text-foreground mb-2">Mindful Betting</h4>
                <p className="text-sm text-muted-foreground">
                  {userData.mindfulDecisionPercentage}% of your bets include bias awareness. Aim for consistent
                  mindfulness in every decision.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <h4 className="font-semibold text-foreground mb-2">Consistency</h4>
                <p className="text-sm text-muted-foreground">
                  Your current streak is {userData.emotionalAwarenessStreak} days. Daily practice builds lasting habits.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">Bias Recognition</h4>
                <p className="text-sm text-muted-foreground">
                  Your bias recognition score is {userData.biasRecognitionScore}%. Understanding your biases is the
                  first step to overcoming them.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Achievements</h3>
            <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
              Unlock badges by building mindful betting habits and mastering behavioral finance
            </p>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full mb-4 sm:mb-6 h-auto flex-wrap sm:grid sm:grid-cols-5 gap-1">
                <TabsTrigger value="all" className="flex-1 min-w-[70px] text-xs sm:text-sm">
                  All
                </TabsTrigger>
                <TabsTrigger value="streak" className="flex-1 min-w-[70px] text-xs sm:text-sm">
                  Streaks
                </TabsTrigger>
                <TabsTrigger value="bias" className="flex-1 min-w-[70px] text-xs sm:text-sm">
                  Bias
                </TabsTrigger>
                <TabsTrigger value="behavior" className="flex-1 min-w-[70px] text-xs sm:text-sm">
                  Behavior
                </TabsTrigger>
                <TabsTrigger value="learning" className="flex-1 min-w-[70px] text-xs sm:text-sm">
                  Learning
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {achievements.map(renderAchievementCard)}
                </div>
              </TabsContent>

              <TabsContent value="streak" className="space-y-3 sm:space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Streak Badges</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {streakBadges.map(renderAchievementCard)}
                </div>
              </TabsContent>

              <TabsContent value="bias" className="space-y-3 sm:space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Bias Buster Badges</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {biasBusterBadges.map(renderAchievementCard)}
                </div>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-3 sm:space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Behavior Change Badges</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {behaviorChangeBadges.map(renderAchievementCard)}
                </div>
              </TabsContent>

              <TabsContent value="learning" className="space-y-3 sm:space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Learning Badges</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {learningBadges.map(renderAchievementCard)}
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Your Progress</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-0">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {achievements.filter((a) => a.unlocked).length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Badges Earned</p>
              </div>
              <div className="text-center p-3 sm:p-0">
                <p className="text-2xl sm:text-3xl font-bold text-primary">{userData.longestStreak}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Longest Streak</p>
              </div>
              <div className="text-center p-3 sm:p-0">
                <p className="text-2xl sm:text-3xl font-bold text-primary">{userData.perfectDays}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Perfect Days</p>
              </div>
              <div className="text-center p-3 sm:p-0">
                <p className="text-2xl sm:text-3xl font-bold text-primary">{userData.serenityTokens}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Serenity Tokens</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
