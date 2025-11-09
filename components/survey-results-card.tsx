"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, Activity, Brain } from "lucide-react"
import type { SurveyData } from "@/lib/types"

interface SurveyResultsCardProps {
  surveyData: SurveyData
}

export function SurveyResultsCard({ surveyData }: SurveyResultsCardProps) {
  const getUserTypeLabel = () => {
    if (surveyData.userType === "sports-bettor") return "Sports Bettor"
    if (surveyData.userType === "day-trader") return "Day Trader"
    return "Sports Bettor & Day Trader"
  }

  const getExperienceLabel = () => {
    if (surveyData.experience === "beginner") return "Beginner"
    if (surveyData.experience === "intermediate") return "Intermediate"
    return "Advanced"
  }

  const getPrimaryGoalLabel = () => {
    switch (surveyData.primaryGoal) {
      case "emotional-control":
        return "Better emotional control during trades/bets"
      case "reduce-losses":
        return "Reduce emotionally-driven losses"
      case "bias-awareness":
        return "Identify and overcome cognitive biases"
      case "discipline":
        return "Build consistent discipline and routines"
      default:
        return surveyData.primaryGoal
    }
  }

  const getActivityLabel = () => {
    switch (surveyData.weeklyActivity) {
      case "daily":
        return "Daily (5-7 days/week)"
      case "frequent":
        return "Frequent (3-4 days/week)"
      case "occasional":
        return "Occasional (1-2 days/week)"
      default:
        return surveyData.weeklyActivity
    }
  }

  return (
    <Card className="p-6 bg-linear-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Serenity Profile</h3>
          <Badge variant="outline" className="bg-background/50">
            Survey Completed
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User Type */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Activity Type</p>
              <p className="text-sm font-semibold mt-1">{getUserTypeLabel()}</p>
            </div>
          </div>

          {/* Experience Level */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Experience Level</p>
              <p className="text-sm font-semibold mt-1">{getExperienceLabel()}</p>
            </div>
          </div>

          {/* Primary Goal */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <Target className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Primary Goal</p>
              <p className="text-sm font-semibold mt-1">{getPrimaryGoalLabel()}</p>
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border">
            <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Weekly Activity</p>
              <p className="text-sm font-semibold mt-1">{getActivityLabel()}</p>
            </div>
          </div>
        </div>

        {/* Emotional Challenges */}
        {surveyData.emotionalChallenges.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Emotional Challenges You're Working On
            </p>
            <div className="flex flex-wrap gap-2">
              {surveyData.emotionalChallenges.map((challenge, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {challenge}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          We'll use this information to personalize your Serenity Pocket experience
        </p>
      </div>
    </Card>
  )
}
