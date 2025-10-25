"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BiasQuiz } from "@/components/bias-quiz"
import { BiasProfileChart } from "@/components/bias-profile-chart"
import { BiasEducation } from "@/components/bias-education"
import { storage } from "@/lib/storage"
import type { UserData, BiasProfile } from "@/lib/types"
import { Brain, BookOpen, BarChart3, Trophy } from "lucide-react"

interface BiasesTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => void
}

export function BiasesTab({ userData, updateUserData }: BiasesTabProps) {
  const [view, setView] = useState<"overview" | "quiz" | "education">("overview")
  const [biasProfile, setBiasProfile] = useState<BiasProfile>(storage.getBiasProfile())
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false)

  const handleQuizComplete = (results: Record<string, number>) => {
    const newProfile: BiasProfile = {
      confirmationBias: results.confirmationBias || 50,
      lossAversion: results.lossAversion || 50,
      anchoringBias: results.anchoringBias || 50,
      recencyBias: results.recencyBias || 50,
      overconfidenceBias: results.overconfidenceBias || 50,
      herdMentality: results.herdMentality || 50,
    }

    storage.setBiasProfile(newProfile)
    setBiasProfile(newProfile)
    setHasCompletedQuiz(true)

    // Calculate average bias score for userData
    const avgScore = Object.values(newProfile).reduce((a, b) => a + b, 0) / 6
    updateUserData({
      biasRecognitionScore: Math.round(100 - avgScore), // Lower bias = higher recognition
      xp: userData.xp + 50,
    })

    setView("overview")
  }

  const averageBiasScore = Object.values(biasProfile).reduce((a, b) => a + b, 0) / 6

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Bias Detection</h2>
          <p className="text-muted-foreground">Identify and overcome cognitive biases in trading</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "overview" ? "default" : "outline"}
            onClick={() => setView("overview")}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Profile
          </Button>
          <Button variant={view === "quiz" ? "default" : "outline"} onClick={() => setView("quiz")} className="gap-2">
            <Brain className="h-4 w-4" />
            Quiz
          </Button>
          <Button
            variant={view === "education" ? "default" : "outline"}
            onClick={() => setView("education")}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Learn
          </Button>
        </div>
      </div>

      {/* Overview View */}
      {view === "overview" && (
        <div className="space-y-6">
          {!hasCompletedQuiz && averageBiasScore === 50 ? (
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-blue/5 border-primary/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Take the Bias Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      Discover your cognitive bias profile and learn how to improve
                    </p>
                  </div>
                </div>
                <Button size="lg" onClick={() => setView("quiz")} className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Start Quiz (+50 XP)
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Your Bias Profile</h3>
                  <p className="text-sm text-muted-foreground">
                    Overall Bias Score: {Math.round(averageBiasScore)} / 100
                  </p>
                </div>
                <Button variant="outline" onClick={() => setView("quiz")}>
                  Retake Quiz
                </Button>
              </div>
              <BiasProfileChart profile={biasProfile} />
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Why Bias Awareness Matters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">Better Decisions</h4>
                <p className="text-sm text-muted-foreground">
                  Recognizing biases helps you make more rational, objective trading decisions based on data rather than
                  emotions.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue/5 border border-blue/20">
                <h4 className="font-semibold text-foreground mb-2">Improved Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Traders who actively work on bias awareness show significantly better long-term performance and risk
                  management.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <h4 className="font-semibold text-foreground mb-2">Emotional Control</h4>
                <p className="text-sm text-muted-foreground">
                  Understanding your biases helps you maintain emotional discipline during volatile market conditions.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">Pattern Recognition</h4>
                <p className="text-sm text-muted-foreground">
                  Identifying recurring biases allows you to break negative patterns and develop better trading habits.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quiz View */}
      {view === "quiz" && (
        <div className="space-y-6">
          <Card className="p-6 bg-primary/5 border border-primary/20">
            <h3 className="text-lg font-semibold text-foreground mb-2">Bias Assessment Quiz</h3>
            <p className="text-sm text-muted-foreground">
              Answer these questions honestly based on how you typically behave in trading situations. There are no
              right or wrong answers - this assessment helps identify your natural tendencies.
            </p>
          </Card>
          <BiasQuiz onComplete={handleQuizComplete} />
        </div>
      )}

      {/* Education View */}
      {view === "education" && (
        <div className="space-y-6">
          <BiasEducation />
        </div>
      )}
    </div>
  )
}
