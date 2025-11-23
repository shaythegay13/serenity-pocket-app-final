"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Sparkles } from "lucide-react"

interface Props {
  onContinueToFull: () => void
  onLogin: () => void
}

export function SoftGate({ onContinueToFull, onLogin }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl p-6 space-y-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Unlock More with Full Assessment</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Your instant profile is saved. Complete the full assessment to personalize analytics, enable safeguards, and access the dashboard.
        </p>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={onContinueToFull}>
            <Sparkles className="h-4 w-4 mr-2" />
            Continue to Full Assessment
          </Button>
          <Button variant="outline" className="flex-1" onClick={onLogin}>Log In</Button>
        </div>
      </Card>
    </div>
  )
}
