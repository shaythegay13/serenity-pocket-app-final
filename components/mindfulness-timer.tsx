"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"
import type { UserData } from "@/lib/types"

interface MindfulnessTimerProps {
  userData?: UserData
  updateUserData?: (updates: Partial<UserData>) => Promise<void>
}

export function MindfulnessTimer({ userData, updateUserData }: MindfulnessTimerProps = {}) {
  const [duration, setDuration] = useState(5)
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    setTimeLeft(duration * 60)
  }, [duration])

  useEffect(() => {
    if (!isActive || timeLeft === 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false)
          // Award XP and update mindfulness ring when timer completes
          if (userData && updateUserData) {
            const newRingProgress = Math.min(userData.dailyRings.mindfulness + 25, 100)
            updateUserData({
              xp: userData.xp + 10,
              dailyRings: {
                ...userData.dailyRings,
                mindfulness: newRingProgress,
              },
            })
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, timeLeft, userData, updateUserData])

  const handleReset = () => {
    setIsActive(false)
    setTimeLeft(duration * 60)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-foreground mb-6 text-center">Mindfulness Timer</h3>

      <div className="flex flex-col items-center space-y-6">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-primary transition-all duration-1000"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="relative z-10 text-center">
            <div className="text-5xl font-bold text-foreground">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>
        </div>

        {!isActive && timeLeft === duration * 60 && (
          <div className="flex gap-2">
            {[3, 5, 10, 15].map((min) => (
              <Button
                key={min}
                variant={duration === min ? "default" : "outline"}
                onClick={() => setDuration(min)}
                size="sm"
              >
                {min}m
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={() => setIsActive(!isActive)} size="lg" className="gap-2">
            {isActive ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            )}
          </Button>
          <Button onClick={handleReset} variant="outline" size="lg" className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {timeLeft === 0 && (
          <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="font-semibold text-foreground">Session Complete!</p>
            <p className="text-sm text-muted-foreground">Great job taking time for mindfulness</p>
          </div>
        )}
      </div>
    </Card>
  )
}
