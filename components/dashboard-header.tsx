"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, Heart, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import Image from "next/image"
import { computeArchetypeFromSnapshot, computeArchetype } from "@/lib/archetypes"
import type { SurveyAnswer } from "@/types/survey"
import type { UserData, EmotionLog, Trade } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { calculateEmotionalStability } from "@/lib/emotional-scoring"

interface DashboardHeaderProps {
  userData?: UserData
}

export function DashboardHeader({ userData }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme()

  const [emotionalScore, setEmotionalScore] = useState<number | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const emotionLogs: EmotionLog[] = await storage.getEmotionLogs()
        const trades: Trade[] = await storage.getTrades()
        const surveyScore = userData?.surveyData?.score

        if (emotionLogs.length === 0 && !surveyScore && trades.length === 0) {
          setEmotionalScore(null)
          return
        }

        const stability = calculateEmotionalStability(emotionLogs, surveyScore, trades)
        setEmotionalScore(stability.score)
      } catch {
        // On error, leave score as null so the pill simply doesn't render
        setEmotionalScore(null)
      }
    }

    init()
  }, [userData?.lastEmotionCheckIn])

  const getEmotionalScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500"
    if (score >= 40) return "text-yellow-500"
    return "text-red-500"
  }

  const getEmotionalScoreLabel = (score: number) => {
    if (score >= 70) return "Stable"
    if (score >= 40) return "Moderate"
    return "Volatile"
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Serenity Pocket" width={60} height={60} />
            <div>
              <h1 className="text-xl font-bold text-foreground">Serenity Pocket</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Your Behavioral Betting Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userData && (() => {
              let archetypeName: string | undefined = undefined
              try {
                const ans = userData.surveyData?.answers
                if (ans && typeof ans === "object") {
                  const allAnswers: SurveyAnswer[] = Object.entries(ans).map(
                    ([questionId, selectedOption]) => ({ questionId, selectedOption } as SurveyAnswer)
                  )

                  const hasFullSurvey = allAnswers.length >= 12
                  const at = hasFullSurvey
                    ? computeArchetype(allAnswers)
                    : computeArchetypeFromSnapshot(allAnswers)
                  archetypeName = at?.name
                }
              } catch {}

              return (
                <div className="flex flex-col items-end gap-2 max-w-[220px]">
                  {emotionalScore !== null && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 shadow-sm w-full">
                      <Heart className="h-4 w-4 text-primary" />
                      <div className="flex flex-col leading-tight">
                        <span className="text-xs font-medium text-foreground">Emotional Stability</span>
                        <span className={`text-xs font-semibold ${getEmotionalScoreColor(emotionalScore)}`}>
                          {emotionalScore}/100 · {getEmotionalScoreLabel(emotionalScore)}
                        </span>
                      </div>
                    </div>
                  )}

                  {archetypeName && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm bg-linear-to-r from-blue-500/10 to-violet-500/10 border-blue-500/30 w-full">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-foreground">Archetype:</span>
                      <span className="text-xs font-bold text-blue-700 truncate">{archetypeName}</span>
                    </div>
                  )}
                </div>
              )
            })()}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
