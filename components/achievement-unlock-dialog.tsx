"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Award } from "lucide-react"
import type { Achievement } from "@/lib/types"

interface AchievementUnlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  achievement: Achievement | null
}

export function AchievementUnlockDialog({ open, onOpenChange, achievement }: AchievementUnlockDialogProps) {
  if (!achievement) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="text-6xl animate-bounce">{achievement.icon}</div>
          </div>
          <DialogTitle className="text-center text-2xl">Achievement Achieved!</DialogTitle>
          <DialogDescription className="text-center text-lg font-semibold text-foreground">
            {achievement.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">{achievement.description}</p>
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-lavender/20 border border-primary/20">
            <div className="flex items-center justify-center gap-2 text-sm text-foreground">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-semibold">+100 XP Bonus</span>
            </div>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full" size="lg">
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
