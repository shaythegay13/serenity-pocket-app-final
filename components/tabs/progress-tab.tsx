"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BreathingExercise } from "@/components/breathing-exercise"
import { MindfulnessTimer } from "@/components/mindfulness-timer"
import { EmotionChart } from "@/components/emotion-chart"
import { TradePerformanceChart } from "@/components/trade-performance-chart"
import { storage } from "@/lib/storage"
import type { UserData } from "@/lib/types"
import { BarChart3, Wind, Timer, TrendingUp } from "lucide-react"

interface ProgressTabProps {
  userData: UserData
}

export function ProgressTab({ userData }: ProgressTabProps) {
  const [view, setView] = useState<"analytics" | "breathing" | "timer">("analytics")
  const emotionLogs = storage.getEmotionLogs()
  const trades = storage.getTrades()

  return (
    <div className="space-y-4 sm:space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Progress & Tools</h2>
          <p className="text-sm text-muted-foreground">Track your growth and practice mindfulness</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            variant={view === "analytics" ? "default" : "outline"}
            onClick={() => setView("analytics")}
            className="gap-2 flex-1"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant={view === "breathing" ? "default" : "outline"}
            onClick={() => setView("breathing")}
            className="gap-2 flex-1"
          >
            <Wind className="h-4 w-4" />
            Breathing
          </Button>
          <Button
            variant={view === "timer" ? "default" : "outline"}
            onClick={() => setView("timer")}
            className="gap-2 flex-1"
          >
            <Timer className="h-4 w-4" />
            Timer
          </Button>
        </div>
      </div>

      {/* Analytics View */}
      {view === "analytics" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
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
                <div className="p-1.5 sm:p-2 rounded-lg bg-teal/10 flex-shrink-0">
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
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue/10 flex-shrink-0">
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
                <div className="p-1.5 sm:p-2 rounded-lg bg-amber/10 flex-shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-amber" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Trades</p>
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

          {/* Insights */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Your Progress Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">Emotional Awareness</h4>
                <p className="text-sm text-muted-foreground">
                  You've logged {emotionLogs.length} emotions. Keep tracking to identify patterns that affect your
                  trading decisions.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue/5 border border-blue/20">
                <h4 className="font-semibold text-foreground mb-2">Mindful Trading</h4>
                <p className="text-sm text-muted-foreground">
                  {userData.mindfulDecisionPercentage}% of your trades include bias awareness. Aim for consistent
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
        </div>
      )}

      {/* Breathing Exercise View */}
      {view === "breathing" && (
        <div className="space-y-6">
          <Card className="p-6 bg-primary/5 border border-primary/20">
            <h3 className="text-lg font-semibold text-foreground mb-2">Box Breathing Exercise</h3>
            <p className="text-sm text-muted-foreground">
              Box breathing is a powerful stress-relief technique. Use it before making trading decisions to calm your
              mind and reduce emotional reactivity. Follow the visual guide: inhale for 4 seconds, hold for 4 seconds,
              exhale for 6 seconds, and repeat.
            </p>
          </Card>
          <BreathingExercise />
        </div>
      )}

      {/* Mindfulness Timer View */}
      {view === "timer" && (
        <div className="space-y-6">
          <Card className="p-6 bg-primary/5 border border-primary/20">
            <h3 className="text-lg font-semibold text-foreground mb-2">Mindfulness Meditation</h3>
            <p className="text-sm text-muted-foreground">
              Take a few minutes to practice mindfulness meditation. Focus on your breath, observe your thoughts without
              judgment, and return your attention to the present moment. Regular practice improves emotional regulation
              and decision-making.
            </p>
          </Card>
          <MindfulnessTimer />
        </div>
      )}
    </div>
  )
}
