"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, Sparkles } from "lucide-react"

interface LevelUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  level: number
}

export function LevelUpDialog({ open, onOpenChange, level }: LevelUpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Trophy className="h-16 w-16 text-primary opacity-75" />
              </div>
              <Trophy className="h-16 w-16 text-primary relative" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Level Up!</DialogTitle>
          <DialogDescription className="text-center text-lg">
            Congratulations! You've reached <span className="font-bold text-primary">Level {level}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-lavender/20 border border-primary/20">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Keep building mindful trading habits to unlock more achievements!</span>
            </div>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full" size="lg">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
