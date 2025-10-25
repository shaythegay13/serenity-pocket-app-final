"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Trophy } from "lucide-react"
import { getLevelTitle } from "@/lib/gamification"
import confetti from "canvas-confetti"

interface LevelUpCelebrationProps {
  open: boolean
  onClose: () => void
  newLevel: number
  unlockedFeatures: string[]
}

export function LevelUpCelebration({ open, onClose, newLevel, unlockedFeatures }: LevelUpCelebrationProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (open) {
      // Trigger confetti
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#10b981", "#3b82f6", "#fbbf24"],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#10b981", "#3b82f6", "#fbbf24"],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
      setTimeout(() => setShowContent(true), 500)
    } else {
      setShowContent(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div
          className={`text-center space-y-6 py-6 transition-all duration-500 ${showContent ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
        >
          <div className="flex justify-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-blue/20 animate-pulse">
              <Trophy className="h-16 w-16 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-foreground">Level {newLevel}!</h2>
            <p className="text-2xl font-semibold text-primary">{getLevelTitle(newLevel)}</p>
            <p className="text-muted-foreground">You've reached a new milestone in your journey</p>
          </div>

          {unlockedFeatures.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Sparkles className="h-4 w-4" />
                <span>New Features Unlocked</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {unlockedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={onClose} size="lg" className="w-full bg-primary hover:bg-primary-dark text-white">
            Continue Your Journey
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
