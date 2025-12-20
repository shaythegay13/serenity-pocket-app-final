"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ActivityRing } from "@/components/activity-ring"
import { StatCard } from "@/components/stat-card"
import { ProgressBar } from "@/components/progress-bar"
import { BreathingExercise } from "@/components/breathing-exercise"
import { MindfulnessTimer } from "@/components/mindfulness-timer"
import { Heart, Brain, TrendingUp, Sparkles, Trophy, Flame, Wind, Timer, FileText } from "lucide-react"
import type { UserData } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { EmotionCheckInDialog } from "@/components/emotion-check-in-dialog"
import { getLevelTitle, checkPerfectDay, shouldResetRings } from "@/lib/gamification"
import { PerfectDayNotification } from "@/components/perfect-day-notification"

interface DashboardTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  onNavigateToEmotions?: () => void
}

export function DashboardTab({ userData, updateUserData, onNavigateToEmotions }: DashboardTabProps) {
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [showPerfectDay, setShowPerfectDay] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const [showMeditation, setShowMeditation] = useState(false)
  const [trades, setTrades] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const pendingTrades = trades.filter((t: any) => !t.outcome)

  useEffect(() => {
    const init = async () => {
      const lastCheckIn = await storage.getLastCheckIn()
      if (lastCheckIn) {
        const today = new Date().toDateString()
        const lastCheckInDate = new Date(lastCheckIn).toDateString()
        setHasCheckedInToday(today === lastCheckInDate)
      }
      
      const tradesData = await storage.getTrades()
      setTrades(tradesData)
      
      const challengesData = await storage.getChallenges()
      setChallenges(challengesData)
    }
    init()

    if (shouldResetRings(userData.lastRingReset)) {
      updateUserData({
        dailyRings: {
          emotionalAwareness: 0,
          biasRecognition: 0,
          mindfulness: 0,
        },
        lastRingReset: new Date(),
      })
    }

    if (checkPerfectDay(userData)) {
      setShowPerfectDay(true)
      if (userData.perfectDays === 0 || !checkPerfectDay(userData)) {
        updateUserData({
          perfectDays: userData.perfectDays + 1,
        })
      }
    }
  }, [userData, updateUserData])

  const handleCheckInComplete = async () => {
    setShowCheckIn(false)
    setHasCheckedInToday(true)
    await storage.setLastCheckIn(new Date())

    const newStreak = userData.emotionalAwarenessStreak + 1
    const newRingProgress = Math.min(userData.dailyRings.emotionalAwareness + 33.33, 100)

    await updateUserData({
      lastEmotionCheckIn: new Date(),
      emotionalAwarenessStreak: newStreak,
      longestStreak: Math.max(newStreak, userData.longestStreak),
      xp: userData.xp + 10,
      serenityTokens: userData.serenityTokens + 1,
      totalEmotionsLogged: userData.totalEmotionsLogged + 1,
      dailyRings: {
        ...userData.dailyRings,
        emotionalAwareness: newRingProgress,
      },
    })
    
    // Update emotion log challenge
    const updatedChallenges = challenges.map((c: any) => {
      if (c.id === "emotion-log-challenge" && c.progress < c.maxProgress) {
        return { ...c, progress: c.progress + 1 }
      }
      return c
    })
    if (JSON.stringify(updatedChallenges) !== JSON.stringify(challenges)) {
      await storage.setChallenges(updatedChallenges)
      setChallenges(updatedChallenges)
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-primary">
            Level {userData.level} - {getLevelTitle(userData.level)}
          </span>
        </div>
        <h2 className="text-3xl font-bold text-foreground">The Odds Don't Just Affect Your Wallet—They Shape Your Life.</h2>
        <p className="text-muted-foreground">
          Hi {userData.name}, ready to explore the true impact of your bets?
        </p>
        {userData.emotionalAwarenessStreak > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-semibold text-foreground">{userData.emotionalAwarenessStreak} day streak</span>
          </div>
        )}
      </div>


      {/* Daily Check-In CTA */}
      {!hasCheckedInToday && (
        <Card className="p-6 bg-linear-to-br from-primary/10 to-accent/10 border-primary/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Daily Emotion Check-In</h3>
                <p className="text-sm text-muted-foreground">Track your emotional state before making decisions</p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => setShowCheckIn(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Check In Now
            </Button>
          </div>
        </Card>
      )}

      {/* Pending Trade Reflections Reminder */}
      {pendingTrades.length > 0 && (
        <Card className="p-6 bg-linear-to-br from-amber/10 to-orange/10 border-amber/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber/20">
                <FileText className="h-8 w-8 text-amber" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Complete Your Decision Reflections</h3>
                <p className="text-sm text-muted-foreground">
                  You have {pendingTrades.length} pending {pendingTrades.length === 1 ? 'entry' : 'entries'} waiting for post-decision reflection
                </p>
              </div>
            </div>
            <div className="text-center md:text-right flex flex-col gap-2">
              <p className="text-sm font-semibold text-amber">+{pendingTrades.length * 20} XP Available</p>
              <Button 
                onClick={onNavigateToEmotions}
                size="sm"
                className="bg-amber hover:bg-amber/90 text-white"
              >
                Complete Now
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Breathing and Meditation Exercises */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-teal/10">
              <Wind className="h-6 w-6 text-teal" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Breathing Exercise</h3>
              <p className="text-xs text-muted-foreground">Box breathing to calm your mind</p>
            </div>
          </div>
          {!showBreathing ? (
            <Button onClick={() => setShowBreathing(true)} className="w-full">
              Start Breathing Exercise
            </Button>
          ) : (
            <div className="space-y-4">
              <BreathingExercise userData={userData} updateUserData={updateUserData} />
              <Button onClick={() => setShowBreathing(false)} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-amber/10">
              <Timer className="h-6 w-6 text-amber" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Meditation</h3>
              <p className="text-xs text-muted-foreground">Mindfulness timer for focus</p>
            </div>
          </div>
          {!showMeditation ? (
            <Button onClick={() => setShowMeditation(true)} className="w-full">
              Start Meditation
            </Button>
          ) : (
            <div className="space-y-4">
              <MindfulnessTimer userData={userData} updateUserData={updateUserData} />
              <Button onClick={() => setShowMeditation(false)} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Daily Activity Rings</h3>
          {checkPerfectDay(userData) && (
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Perfect Day! 2x XP Tomorrow
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
          <ActivityRing
            progress={userData.dailyRings.emotionalAwareness}
            color="#10b981"
            label="Emotional Awareness"
            value={`${Math.round(userData.dailyRings.emotionalAwareness)}%`}
          />
          <ActivityRing
            progress={userData.dailyRings.biasRecognition}
            color="#3b82f6"
            label="Bias Recognition"
            value={`${Math.round(userData.dailyRings.biasRecognition)}%`}
          />
          <ActivityRing
            progress={userData.dailyRings.mindfulness}
            color="#fbbf24"
            label="Mindfulness"
            value={`${Math.round(userData.dailyRings.mindfulness)}%`}
          />
        </div>
        <p className="text-xs text-center text-muted-foreground mt-4">
          Complete all three rings to earn a Perfect Day badge and 2x XP multiplier
        </p>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Heart className="h-5 w-5" />}
          label="Emotions Logged"
          value={userData.totalEmotionsLogged}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          icon={<Brain className="h-5 w-5" />}
          label="Biases Identified"
          value={userData.totalBiasesIdentified}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Mindful Decisions"
          value={`${userData.mindfulTrades}/${userData.totalTrades}`}
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Level {userData.level} - {getLevelTitle(userData.level)}
            </h3>
            <p className="text-sm text-muted-foreground">Keep going to reach the next level</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{userData.xp} XP</p>
            <p className="text-xs text-muted-foreground">{userData.xpToNextLevel - userData.xp} XP to next level</p>
          </div>
        </div>
        <ProgressBar current={userData.xp} max={userData.xpToNextLevel} label="Progress to Next Level" />
      </Card>

      {/* Weekly Challenges */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Challenges</h3>
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{challenge.title}</p>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                </div>
                <span className="text-sm font-medium text-primary">+{challenge.xpReward} XP</span>
              </div>
              <ProgressBar current={challenge.progress} max={challenge.maxProgress} label="" showPercentage={true} />
            </div>
          ))}
        </div>
      </Card>

      <EmotionCheckInDialog open={showCheckIn} onOpenChange={setShowCheckIn} onComplete={handleCheckInComplete} />
      <PerfectDayNotification show={showPerfectDay} />
    </div>
  )
}
