"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { EmotionWheel } from "@/components/emotion-wheel"
import type { Trade } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { analyticsEvents, ANALYTICS_EVENTS } from "@/lib/events"

interface PreTradeFormProps {
  onComplete: (trade: Trade) => void
}

const commonBiases = [
  { id: "confirmation", label: "Confirmation Bias" },
  { id: "loss-aversion", label: "Loss Aversion" },
  { id: "anchoring", label: "Anchoring" },
  { id: "recency", label: "Recency Bias" },
  { id: "overconfidence", label: "Overconfidence" },
  { id: "herd", label: "Herd Mentality" },
]

export function PreTradeForm({ onComplete }: PreTradeFormProps) {
  const [step, setStep] = useState<"emotion" | "biases" | "details" | "reasoning">("emotion")
  const [emotion, setEmotion] = useState("")
  const [intensity, setIntensity] = useState(3)
  const [selectedBiases, setSelectedBiases] = useState<string[]>([])
  const [confidence, setConfidence] = useState(5)
  const [reasoning, setReasoning] = useState("")
  const [betType, setBetType] = useState<"moneyline" | "spread" | "total" | "parlay" | "prop" | "future" | "live">("moneyline")
  const [stake, setStake] = useState("")
  const [odds, setOdds] = useState("")

  const handleEmotionSelect = (selectedEmotion: string) => {
    setEmotion(selectedEmotion)
  }

  const handleBiasToggle = (biasId: string) => {
    setSelectedBiases((prev) => (prev.includes(biasId) ? prev.filter((b) => b !== biasId) : [...prev, biasId]))
  }

  const handleSubmit = async () => {
    const trade: Trade = {
      id: Date.now().toString(),
      timestamp: new Date(),
      preTradeEmotion: emotion,
      preTradeIntensity: intensity,
      biasesIdentified: selectedBiases,
      confidenceLevel: confidence,
      reasoning,
      betType,
      stake: stake ? parseFloat(stake) : undefined,
      odds: odds ? parseFloat(odds) : undefined,
    }

    await storage.addTrade(trade)

    // Also log the pre-bet emotion so it impacts emotional stability and charts
    if (emotion) {
      const emotionLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        emotion,
        intensity,
        context: `Pre-trade: ${reasoning.substring(0, 200)}`,
        phase: "before" as const,
        tradeId: trade.id,
      }
      await storage.addEmotionLog(emotionLog)

      // Emit event to refresh emotion-based analytics
      analyticsEvents.emit(ANALYTICS_EVENTS.EMOTION_LOGGED, emotionLog)
    }

    // Emit event to refresh betting analytics
    analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)

    onComplete(trade)
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className={`h-2 w-16 rounded-full ${step === "emotion" ? "bg-primary" : "bg-muted"}`} />
        <div className={`h-2 w-16 rounded-full ${step === "biases" ? "bg-primary" : "bg-muted"}`} />
        <div className={`h-2 w-16 rounded-full ${step === "details" ? "bg-primary" : "bg-muted"}`} />
        <div className={`h-2 w-16 rounded-full ${step === "reasoning" ? "bg-primary" : "bg-muted"}`} />
      </div>

      {/* Step 1: Emotion */}
      {step === "emotion" && (
        <Card className="p-6 fade-in">
          <h3 className="text-xl font-semibold text-foreground mb-4">How are you feeling before this trade?</h3>
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
              <Button onClick={() => setStep("biases")} className="w-full">
                Next: Identify Biases
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Biases */}
      {step === "biases" && (
        <Card className="p-6 fade-in">
          <h3 className="text-xl font-semibold text-foreground mb-2">Check for cognitive biases</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Be honest with yourself. Which biases might be influencing this decision?
          </p>

          <div className="space-y-3 mb-6">
            {commonBiases.map((bias) => (
              <div
                key={bias.id}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedBiases.includes(bias.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleBiasToggle(bias.id)}
              >
                <Checkbox
                  checked={selectedBiases.includes(bias.id)}
                  onCheckedChange={() => handleBiasToggle(bias.id)}
                />
                <Label className="flex-1 cursor-pointer">{bias.label}</Label>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("emotion")} className="flex-1">
              Back
            </Button>
            <Button onClick={() => setStep("details")} className="flex-1">
              Next: Bet Details
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Bet Details */}
      {step === "details" && (
        <Card className="p-6 fade-in">
          <h3 className="text-xl font-semibold text-foreground mb-4">Bet Details</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bet Type</Label>
              <select
                value={betType}
                onChange={(e) => setBetType(e.target.value as any)}
                className="w-full p-3 border border-border rounded-lg bg-background"
              >
                <option value="moneyline">Moneyline</option>
                <option value="spread">Spread</option>
                <option value="total">Total (Over/Under)</option>
                <option value="parlay">Parlay</option>
                <option value="prop">Prop Bet</option>
                <option value="future">Future</option>
                <option value="live">Live Bet</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Stake Amount (Optional)</Label>
              <input
                type="number"
                placeholder="Enter stake amount"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Odds (Optional)</Label>
              <input
                type="number"
                placeholder="Enter odds (e.g., -110, +150)"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background"
                step="1"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setStep("biases")} className="flex-1">
              Back
            </Button>
            <Button onClick={() => setStep("reasoning")} className="flex-1">
              Next: Add Reasoning
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Reasoning */}
      {step === "reasoning" && (
        <Card className="p-6 fade-in">
          <h3 className="text-xl font-semibold text-foreground mb-4">Document your reasoning</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Confidence Level</Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-lg font-semibold text-foreground w-8">{confidence}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reasoning">Trade Reasoning</Label>
              <Textarea
                id="reasoning"
                placeholder="Why are you making this trade? What's your thesis? What are your entry/exit criteria?"
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("details")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={!reasoning.trim()} className="flex-1">
                Save Pre-Trade Entry
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
