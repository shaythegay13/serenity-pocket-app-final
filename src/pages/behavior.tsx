"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Heart,
  Smile,
  Frown,
  Meh,
  Target,
  Calendar,
  Clock,
} from "lucide-react"

const emotions = [
  { name: "JOY", color: "bg-amber-500", icon: Smile },
  { name: "CALM", color: "bg-cyan-500", icon: Heart },
  { name: "FEAR", color: "bg-red-500", icon: Frown },
  { name: "GREED", color: "bg-purple-500", icon: Target },
  { name: "FRUSTRATION", color: "bg-orange-500", icon: Meh },
  { name: "SADNESS", color: "bg-blue-400", icon: Frown },
]

const recentCheckIns = [
  { emotion: "CALM", date: "Today", time: "2:30 PM", color: "bg-cyan-500" },
  { emotion: "JOY", date: "Yesterday", time: "11:00 AM", color: "bg-amber-500" },
  { emotion: "GREED", date: "2 days ago", time: "4:15 PM", color: "bg-purple-500" },
  { emotion: "CALM", date: "3 days ago", time: "9:00 AM", color: "bg-cyan-500" },
  { emotion: "FRUSTRATION", date: "4 days ago", time: "6:45 PM", color: "bg-orange-500" },
]

export default function BehaviorPage() {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [streak] = useState(5)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 shadow-lg shadow-primary/20">
              <Activity className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-foreground">Behavior Tracking</h1>
              <p className="mt-2 text-lg text-muted-foreground">Monitor your emotional states and betting patterns</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-6 md:grid-cols-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                <Badge className="bg-secondary/20 text-secondary">Active</Badge>
              </div>
              <div className="text-3xl font-bold text-foreground">{streak} Days</div>
              <div className="mt-1 text-sm text-muted-foreground">Current Streak</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <Badge className="bg-success/20 text-success">Good</Badge>
              </div>
              <div className="text-3xl font-bold text-foreground">72%</div>
              <div className="mt-1 text-sm text-muted-foreground">Discipline Score</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/20">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <Badge className="bg-destructive/20 text-destructive">3 Times</Badge>
              </div>
              <div className="text-3xl font-bold text-foreground">Loss Chasing</div>
              <div className="mt-1 text-sm text-muted-foreground">This Week</div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <Badge className="bg-primary/20 text-primary">28</Badge>
              </div>
              <div className="text-3xl font-bold text-foreground">Check-ins</div>
              <div className="mt-1 text-sm text-muted-foreground">This Month</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Quick Emotion Check-In */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardContent className="p-8">
              <h2 className="mb-2 text-2xl font-bold text-foreground">Quick Check-In</h2>
              <p className="mb-6 text-muted-foreground">How are you feeling right now?</p>

              <div className="grid grid-cols-3 gap-4">
                {emotions.map((emotion) => {
                  const Icon = emotion.icon
                  return (
                    <button
                      key={emotion.name}
                      onClick={() => setSelectedEmotion(emotion.name)}
                      className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 p-6 transition-all hover:scale-105 ${
                        selectedEmotion === emotion.name
                          ? `border-white/50 ${emotion.color}`
                          : "border-border/50 bg-muted/50 hover:border-border"
                      }`}
                    >
                      <Icon
                        className={`mb-2 h-8 w-8 ${selectedEmotion === emotion.name ? "text-white" : "text-muted-foreground"}`}
                      />
                      <span
                        className={`text-sm font-semibold ${selectedEmotion === emotion.name ? "text-white" : "text-foreground"}`}
                      >
                        {emotion.name}
                      </span>
                    </button>
                  )
                })}
              </div>

              <Button
                className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!selectedEmotion}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Log Check-In
              </Button>
            </CardContent>
          </Card>

          {/* Recent Check-Ins */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardContent className="p-8">
              <h2 className="mb-6 text-2xl font-bold text-foreground">Recent Check-Ins</h2>
              <div className="space-y-4">
                {recentCheckIns.map((checkIn, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full ${checkIn.color} flex items-center justify-center`}>
                        <Smile className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{checkIn.emotion}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {checkIn.time}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{checkIn.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Section */}
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-4 text-xl font-bold text-primary">AI Insights & Recommendations</h3>
                <div className="space-y-4 text-foreground">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                    <p className="font-medium">Pattern Detected: Frustration After Losses</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your emotional state tracking shows elevated frustration after consecutive losses. Consider taking
                      a 24-hour break after 2 losing bets to maintain discipline.
                    </p>
                  </div>
                  <div className="rounded-lg border border-success/20 bg-success/10 p-4">
                    <p className="font-medium text-success">Best Performance State: CALM</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your win rate is 23% higher when betting in a CALM state. Try meditation or breathing exercises
                      before placing bets.
                    </p>
                  </div>
                  <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
                    <p className="font-medium text-warning">Warning: GREED Correlation</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Bets placed when feeling GREED have a -18% ROI. Consider this a red flag to skip betting sessions
                      when experiencing this emotion.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
