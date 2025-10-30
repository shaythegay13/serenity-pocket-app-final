"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmotionWheel } from "@/components/emotion-wheel"
import { EmotionHistory } from "@/components/emotion-history"
import { EmotionInsights } from "@/components/emotion-insights"
import { storage } from "@/lib/storage"
import type { UserData, EmotionLog } from "@/lib/types"
import { Plus, History, Lightbulb } from "lucide-react"

interface EmotionsTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => void
}

export function EmotionsTab({ userData, updateUserData }: EmotionsTabProps) {
  const [view, setView] = useState<"log" | "history" | "insights">("log")
  const [selectedEmotion, setSelectedEmotion] = useState<string>("")
  const [intensity, setIntensity] = useState<number>(3)
  const [context, setContext] = useState<string>("")
  const [phase, setPhase] = useState<"before" | "during" | "after">("before")
  const [logs, setLogs] = useState<EmotionLog[]>(storage.getEmotionLogs())

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion)
  }

  const handleLogEmotion = () => {
    if (!selectedEmotion) return

    const newLog: EmotionLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      emotion: selectedEmotion,
      intensity,
      context,
      phase,
    }

    storage.addEmotionLog(newLog)
    setLogs(storage.getEmotionLogs())

    // Award XP, increment total emotions logged, and update daily ring
    const newRingProgress = Math.min(userData.dailyRings.emotionalAwareness + 10, 100)
    updateUserData({ 
      xp: userData.xp + 5,
      totalEmotionsLogged: userData.totalEmotionsLogged + 1,
      dailyRings: {
        ...userData.dailyRings,
        emotionalAwareness: newRingProgress,
      },
    })

    // Reset form
    setSelectedEmotion("")
    setIntensity(3)
    setContext("")
    setPhase("before")
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header with View Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Emotion Tracking</h2>
          <p className="text-muted-foreground">Understand your emotional patterns in trading</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "log" ? "default" : "outline"} onClick={() => setView("log")} className="gap-2">
            <Plus className="h-4 w-4" />
            Log
          </Button>
          <Button
            variant={view === "history" ? "default" : "outline"}
            onClick={() => setView("history")}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
          <Button
            variant={view === "insights" ? "default" : "outline"}
            onClick={() => setView("insights")}
            className="gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            Insights
          </Button>
        </div>
      </div>

      {/* Log Emotion View */}
      {view === "log" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">How are you feeling?</h3>
            <EmotionWheel onEmotionSelect={handleEmotionSelect} selectedEmotion={selectedEmotion} />
          </Card>

          {selectedEmotion && (
            <Card className="p-6 fade-in">
              <h3 className="text-xl font-semibold text-foreground mb-4">Tell us more</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="intensity">Intensity Level</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      id="intensity"
                      min="1"
                      max="5"
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-semibold text-foreground w-8">{intensity}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mild</span>
                    <span>Intense</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phase">Trading Phase</Label>
                  <Select value={phase} onValueChange={(value: any) => setPhase(value)}>
                    <SelectTrigger id="phase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before Trade</SelectItem>
                      <SelectItem value="during">During Trade</SelectItem>
                      <SelectItem value="after">After Trade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Context (Optional)</Label>
                  <Textarea
                    id="context"
                    placeholder="What triggered this emotion? What were you thinking about?"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleLogEmotion} className="w-full" size="lg">
                  Log Emotion (+5 XP)
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* History View */}
      {view === "history" && (
        <div className="space-y-6">
          <EmotionInsights logs={logs} />
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Recent Emotion Logs</h3>
            <EmotionHistory logs={logs} />
          </div>
        </div>
      )}

      {/* Insights View */}
      {view === "insights" && (
        <div className="space-y-6">
          <EmotionInsights logs={logs} />

          <Card className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Emotional Patterns</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">Pre-Trade Emotions</h4>
                <p className="text-sm text-muted-foreground">
                  Track emotions before trades to identify patterns that lead to impulsive decisions. Anxiety and
                  excitement often precede risky trades.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue/5 border border-blue/20">
                <h4 className="font-semibold text-foreground mb-2">During-Trade Emotions</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor emotions while positions are open. Fear and greed can cause premature exits or holding too
                  long.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <h4 className="font-semibold text-foreground mb-2">Post-Trade Emotions</h4>
                <p className="text-sm text-muted-foreground">
                  Reflect on emotions after closing trades. Regret and frustration can lead to revenge trading.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
