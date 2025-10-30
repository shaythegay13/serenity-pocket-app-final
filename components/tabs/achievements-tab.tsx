"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { UserData } from "@/lib/types"
import { storage } from "@/lib/storage"
import { Lock } from "lucide-react"
import { ProgressBar } from "@/components/progress-bar"

interface AchievementsTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => void
}

export function AchievementsTab({ userData, updateUserData }: AchievementsTabProps) {
  const [achievements, setAchievements] = useState(storage.getAchievements())

  // Refresh achievements when component mounts or becomes visible
  useEffect(() => {
    setAchievements(storage.getAchievements())
  }, [])

  const streakBadges = achievements.filter((a) => a.category === "streak")
  const biasBusterBadges = achievements.filter((a) => a.category === "bias-buster")
  const behaviorChangeBadges = achievements.filter((a) => a.category === "behavior-change")
  const learningBadges = achievements.filter((a) => a.category === "learning")

  const renderAchievementCard = (achievement: any) => (
    <Card
      key={achievement.id}
      className={`p-4 transition-all ${
        achievement.unlocked
          ? "bg-gradient-to-br from-primary/10 to-blue/10 border-primary/30 shadow-md"
          : "bg-card/50 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`text-3xl sm:text-4xl transition-all flex-shrink-0 ${achievement.unlocked ? "scale-110" : "grayscale"}`}
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
            </div>
          )}
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-primary font-medium">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Achievements</h2>
        <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
          Unlock badges by building mindful trading habits and mastering behavioral finance
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
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Streak Badges</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {streakBadges.map(renderAchievementCard)}
            </div>
          </TabsContent>

          <TabsContent value="bias" className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Bias Buster Badges</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {biasBusterBadges.map(renderAchievementCard)}
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Behavior Change Badges</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {behaviorChangeBadges.map(renderAchievementCard)}
            </div>
          </TabsContent>

          <TabsContent value="learning" className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Learning Badges</h3>
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
    </div>
  )
}
