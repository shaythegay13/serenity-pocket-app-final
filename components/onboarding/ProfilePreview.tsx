"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { InstantProfile } from "./InstantProfileQuiz"

interface Props {
  profile: InstantProfile
  onContinue: () => void
  onRetake: () => void
}

export function ProfilePreview({ profile, onContinue, onRetake }: Props) {
  const riskMessage = profile.impulsivity === 'high' ? 'We will limit risky suggestions.' : 'You are in good shape to analyze bets.'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Your Instant Profile</h2>
          <p className="text-sm text-muted-foreground">Personalized safeguards and insights based on your answers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Risk Tolerance</p>
            <p className="text-lg font-semibold capitalize">{profile.riskTolerance}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Impulsivity</p>
            <p className="text-lg font-semibold capitalize">{profile.impulsivity}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Bankroll Discipline</p>
            <p className="text-lg font-semibold capitalize">{profile.bankrollDiscipline}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Typical Bet Size</p>
            <p className="text-lg font-semibold capitalize">{profile.typicalBetSize}</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-background border">
          <p className="text-sm">{riskMessage}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onRetake}>Retake</Button>
          <Button className="flex-1" onClick={onContinue}>Continue</Button>
        </div>
      </Card>
    </div>
  )
}
