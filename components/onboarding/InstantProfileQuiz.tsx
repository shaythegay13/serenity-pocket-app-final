"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export interface InstantProfile {
  riskTolerance: "low" | "medium" | "high"
  impulsivity: "low" | "medium" | "high"
  bankrollDiscipline: "low" | "medium" | "high"
  typicalBetSize: "small" | "medium" | "large"
}

interface Props {
  onComplete: (profile: InstantProfile) => void
}

export function InstantProfileQuiz({ onComplete }: Props) {
  const [risk, setRisk] = useState<InstantProfile["riskTolerance"] | null>(null)
  const [imp, setImp] = useState<InstantProfile["impulsivity"] | null>(null)
  const [disc, setDisc] = useState<InstantProfile["bankrollDiscipline"] | null>(null)
  const [bet, setBet] = useState<InstantProfile["typicalBetSize"] | null>(null)

  const canSubmit = !!(risk && imp && disc && bet)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Instant Profile</h2>
          <p className="text-sm text-muted-foreground">Answer 4 quick questions to personalize your experience</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Risk Tolerance</Label>
            <RadioGroup value={risk || undefined} onValueChange={(v) => setRisk(v as any)}>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="low" id="risk-low" /><Label htmlFor="risk-low" className="cursor-pointer flex-1">Low</Label></div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="medium" id="risk-med" /><Label htmlFor="risk-med" className="cursor-pointer flex-1">Medium</Label></div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="high" id="risk-high" /><Label htmlFor="risk-high" className="cursor-pointer flex-1">High</Label></div>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block">Impulsivity</Label>
            <RadioGroup value={imp || undefined} onValueChange={(v) => setImp(v as any)}>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="low" id="imp-low" /><Label htmlFor="imp-low" className="cursor-pointer flex-1">Low</Label></div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="medium" id="imp-med" /><Label htmlFor="imp-med" className="cursor-pointer flex-1">Medium</Label></div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="high" id="imp-high" /><Label htmlFor="imp-high" className="cursor-pointer flex-1">High</Label></div>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block">Bankroll Discipline</Label>
            <RadioGroup value={disc || undefined} onValueChange={(v) => setDisc(v as any)}>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="low" id="disc-low" /><Label htmlFor="disc-low" className="cursor-pointer flex-1">Low</Label></div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="medium" id="disc-med" /><Label htmlFor="disc-med" className="cursor-pointer flex-1">Medium</Label></div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="high" id="disc-high" /><Label htmlFor="disc-high" className="cursor-pointer flex-1">High</Label></div>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block">Typical Bet Size</Label>
            <RadioGroup value={bet || undefined} onValueChange={(v) => setBet(v as any)}>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="small" id="bet-small" /><Label htmlFor="bet-small" className="cursor-pointer flex-1">Small</Label></div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="medium" id="bet-med" /><Label htmlFor="bet-med" className="cursor-pointer flex-1">Medium</Label></div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer"><RadioGroupItem value="large" id="bet-large" /><Label htmlFor="bet-large" className="cursor-pointer flex-1">Large</Label></div>
            </RadioGroup>
          </div>
        </div>

        <Button className="w-full" disabled={!canSubmit} onClick={() => onComplete({
          riskTolerance: risk!, impulsivity: imp!, bankrollDiscipline: disc!, typicalBetSize: bet!
        })}>See Profile Preview</Button>
      </Card>
    </div>
  )
}
