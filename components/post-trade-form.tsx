"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { EmotionWheel } from "@/components/emotion-wheel"
import type { Trade } from "@/lib/types"
import { storage } from "@/lib/storage"

interface PostTradeFormProps {
  trade: Trade
  onComplete: () => void
}

export function PostTradeForm({ trade, onComplete }: PostTradeFormProps) {
  const [step, setStep] = useState<"outcome" | "emotion" | "reflection">("outcome")
  const [outcome, setOutcome] = useState<"profit" | "loss" | "breakeven">("breakeven")
  const [emotion, setEmotion] = useState("")
  const [intensity, setIntensity] = useState(3)
  const [reflection, setReflection] = useState("")
  const [emotionalImpact, setEmotionalImpact] = useState(5)

  const handleEmotionSelect = (selectedEmotion: string) => {
    setEmotion(selectedEmotion)
  }

  const handleSubmit = () => {
    storage.updateTrade(trade.id, {
      outcome,
      postTradeEmotion: emotion,
      postTradeIntensity: intensity,
      reflection,
      emotionalImpact,
    })
    onComplete()
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className={`h-2 w-16 rounded-full ${step === "outcome" ? "bg-primary" : "bg-muted"}`} />
        <div className={`h-2 w-16 rounded-full ${step === "emotion" ? "bg-primary" : "bg-muted"}`} />
        <div className={`h-2 w-16 rounded-full ${step === "reflection" ? "bg-primary" : "bg-muted"}`} />
      </div>

      {/* Step 1: Outcome */}
      {step === "outcome" && (
        <Card className="p-6 fade-in">
          <h3 className="text-xl font-semibold text-foreground mb-4">What was the outcome?</h3>

          <RadioGroup value={outcome} onValueChange={(value: any) => setOutcome(value)}>
            <div className="space-y-3">
              <div
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  outcome === "profit" ? "border-green-500 bg-green-500/5" : "border-border hover:border-green-500/50"
                }`}
                onClick={() => setOutcome("profit")}
              >
                <RadioGroupItem value="profit" id="profit" />
                <Label htmlFor="profit" className="flex-1 cursor-pointer text-base">
                  Profit - The trade was profitable
                </Label>
              </div>
              <div
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  outcome === "loss" ? "border-red-500 bg-red-500/5" : "border-border hover:border-red-500/50"
                }`}
                onClick={() => setOutcome("loss")}
              >
                <RadioGroupItem value="loss" id="loss" />
                <Label htmlFor="loss" className="flex-1 cursor-pointer text-base">
                  Loss - The trade resulted in a loss
                </Label>
              </div>
              <div
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  outcome === "breakeven" ? "border-blue-500 bg-blue-500/5" : "border-border hover:border-blue-500/50"
                }`}
                onClick={() => setOutcome("breakeven")}
              >
                <RadioGroupItem value="breakeven" id="breakeven" />
                <Label htmlFor="breakeven" className="flex-1 cursor-pointer text-base">
                  Breakeven - No profit or loss
                </Label>
              </div>
            </div>
          </RadioGroup>

          <Button onClick={() => setStep("emotion")} className="w-full mt-6">
            Next: Log Emotion
          </Button>
        </Card>
      )}

      {/* Step 2: Emotion */}
      {step === "emotion" && (
        <Card className="p-6 fade-in">
          <h3 className="text-xl font-semibold text-foreground mb-4">How are you feeling after this trade?</h3>
          <EmotionWheel onEmotionSelect={handleEmotionSelect} selectedEmotion={emotion} />

          {emotion && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Intensity Level</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-lg font-semibold text-foreground w-8">{intensity}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("outcome")} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep("reflection")} className="flex-1">
                  Next: Reflect
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Reflection */}
      {step === "reflection" && (
        <Card className="p-6 fade-in">
          <h3 className="text-xl font-semibold text-foreground mb-4">Reflect on the trade</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Emotional Impact (1-10)</Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={emotionalImpact}
                  onChange={(e) => setEmotionalImpact(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-lg font-semibold text-foreground w-8">{emotionalImpact}</span>
              </div>
              <p className="text-xs text-muted-foreground">How much did emotions influence this trade?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reflection">Reflection</Label>
              <Textarea
                id="reflection"
                placeholder="What did you learn? What would you do differently? Did you follow your plan?"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("emotion")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={!reflection.trim()} className="flex-1">
                Complete Post-Trade Entry
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
