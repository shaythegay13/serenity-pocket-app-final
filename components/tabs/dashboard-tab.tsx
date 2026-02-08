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
import { AIPicksInsights } from "@/components/ai-picks-insights"

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
  const [performanceTrends, setPerformanceTrends] = useState<{
    winRate: { current: number; change: number; changePercent: number }
    avgROI: { current: number; change: number; changePercent: number }
    totalBets: { current: number; change: number; changePercent: number }
    profitLoss: { current: number; change: number; changePercent: number }
  } | null>(null)
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
      
      // Calculate performance trends
      const calculatePerformanceTrends = () => {
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
        
        // Filter trades for current and last month
        const currentMonthTrades = tradesData.filter(trade => {
          const tradeDate = new Date(trade.timestamp)
          return tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear
        })
        
        const lastMonthTrades = tradesData.filter(trade => {
          const tradeDate = new Date(trade.timestamp)
          return tradeDate.getMonth() === lastMonth && tradeDate.getFullYear() === lastMonthYear
        })
        
        // Calculate Win Rate
        const calculateWinRate = (trades: any[]) => {
          const completedTrades = trades.filter(t => t.outcome && t.outcome !== 'pending')
          if (completedTrades.length === 0) return 0
          const wins = completedTrades.filter(t => t.outcome === 'profit').length
          return (wins / completedTrades.length) * 100
        }
        
        const currentWinRate = calculateWinRate(currentMonthTrades)
        const lastWinRate = calculateWinRate(lastMonthTrades)
        const winRateChange = currentWinRate - lastWinRate
        const winRateChangePercent = lastWinRate !== 0 ? (winRateChange / Math.abs(lastWinRate)) * 100 : 0
        
        // Calculate Average ROI
        const calculateAvgROI = (trades: any[]) => {
          const completedTrades = trades.filter(t => t.stake && t.outcome && t.outcome !== 'pending')
          if (completedTrades.length === 0) return 0
          const totalROI = completedTrades.reduce((sum, trade) => {
            const stake = trade.stake || 0
            if (trade.outcome === 'profit') return sum + (stake * 0.9) // Assuming 90% profit
            if (trade.outcome === 'loss') return sum - stake
            return sum // breakeven
          }, 0)
          const totalStaked = completedTrades.reduce((sum, trade) => sum + (trade.stake || 0), 0)
          return totalStaked > 0 ? (totalROI / totalStaked) * 100 : 0
        }
        
        const currentROI = calculateAvgROI(currentMonthTrades)
        const lastROI = calculateAvgROI(lastMonthTrades)
        const roiChange = currentROI - lastROI
        const roiChangePercent = lastROI !== 0 ? (roiChange / Math.abs(lastROI)) * 100 : 0
        
        // Calculate Total Bets
        const currentBets = currentMonthTrades.length
        const lastBets = lastMonthTrades.length
        const betsChange = currentBets - lastBets
        const betsChangePercent = lastBets !== 0 ? (betsChange / Math.abs(lastBets)) * 100 : 0
        
        // Calculate Profit/Loss
        const calculateProfitLoss = (trades: any[]) => {
          return trades.reduce((sum, trade) => {
            if (!trade.stake || !trade.outcome || trade.outcome === 'pending') return sum
            const stake = trade.stake || 0
            if (trade.outcome === 'profit') return sum + (stake * 0.9)
            if (trade.outcome === 'loss') return sum - stake
            return sum // breakeven
          }, 0)
        }
        
        const currentPL = calculateProfitLoss(currentMonthTrades)
        const lastPL = calculateProfitLoss(lastMonthTrades)
        const plChange = currentPL - lastPL
        const plChangePercent = lastPL !== 0 ? (plChange / Math.abs(lastPL)) * 100 : 0
        
        // Only show trends if we have sufficient data
        if (currentMonthTrades.length >= 5) {
          setPerformanceTrends({
            winRate: {
              current: currentWinRate,
              change: winRateChange,
              changePercent: winRateChangePercent
            },
            avgROI: {
              current: currentROI,
              change: roiChange,
              changePercent: roiChangePercent
            },
            totalBets: {
              current: currentBets,
              change: betsChange,
              changePercent: betsChangePercent
            },
            profitLoss: {
              current: currentPL,
              change: plChange,
              changePercent: plChangePercent
            }
          })
        } else {
          setPerformanceTrends(null)
        }
      }
      
      calculatePerformanceTrends()
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

    if (checkPerfectDay(userData.dailyRings)) {
      setShowPerfectDay(true)
      if (userData.perfectDays === 0 || !checkPerfectDay(userData.dailyRings)) {
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

      {/* AI Picks Insights */}
      <div className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold">AI Picks Performance</h2>
        <AIPicksInsights />
      </div>

      {/* Performance Trends */}
      {performanceTrends && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Performance Trends</h3>
              <p className="text-sm text-muted-foreground">Month-over-month comparison</p>
            </div>
            <div className="p-2 rounded-full bg-blue/10">
              <TrendingUp className="h-5 w-5 text-blue" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Win Rate */}
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Win Rate</span>
                <span className={`text-xs font-medium ${
                  performanceTrends.winRate.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {performanceTrends.winRate.change >= 0 ? '+' : ''}{performanceTrends.winRate.changePercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {performanceTrends.winRate.current.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {performanceTrends.winRate.change >= 0 ? 'up' : 'down'} {Math.abs(performanceTrends.winRate.change).toFixed(1)}% from last month
              </div>
            </div>

            {/* Avg. ROI */}
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg. ROI</span>
                <span className={`text-xs font-medium ${
                  performanceTrends.avgROI.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {performanceTrends.avgROI.change >= 0 ? '+' : ''}{performanceTrends.avgROI.changePercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {performanceTrends.avgROI.current >= 0 ? '+' : ''}{performanceTrends.avgROI.current.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {performanceTrends.avgROI.change >= 0 ? 'up' : 'down'} {Math.abs(performanceTrends.avgROI.change).toFixed(1)}% from last month
              </div>
            </div>

            {/* Total Bets */}
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Bets</span>
                <span className={`text-xs font-medium ${
                  performanceTrends.totalBets.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {performanceTrends.totalBets.change >= 0 ? '+' : ''}{performanceTrends.totalBets.changePercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {performanceTrends.totalBets.current}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {performanceTrends.totalBets.change >= 0 ? 'up' : 'down'} {Math.abs(performanceTrends.totalBets.change)} from last month
              </div>
            </div>

            {/* Profit/Loss */}
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Profit/Loss</span>
                <span className={`text-xs font-medium ${
                  performanceTrends.profitLoss.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {performanceTrends.profitLoss.change >= 0 ? '+' : ''}{performanceTrends.profitLoss.changePercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                ${performanceTrends.profitLoss.current >= 0 ? '+' : ''}{Math.abs(performanceTrends.profitLoss.current).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {performanceTrends.profitLoss.change >= 0 ? 'up' : 'down'} ${Math.abs(performanceTrends.profitLoss.change).toLocaleString()} from last month
              </div>
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
          {checkPerfectDay(userData.dailyRings) && (
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
