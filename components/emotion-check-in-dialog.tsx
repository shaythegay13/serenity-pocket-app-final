"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { storageHybrid as storage } from "@/lib/storage-hybrid"

interface EmotionCheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

const emotions = [
  { id: "calm", label: "Calm", color: "#14b8a6" },
  { id: "confident", label: "Confident", color: "#3b82f6" },
  { id: "anxious", label: "Anxious", color: "#f59e0b" },
  { id: "fearful", label: "Fearful", color: "#ef4444" },
  { id: "greedy", label: "Greedy", color: "#f59e0b" },
  { id: "fomo", label: "FOMO", color: "#ec4899" },
  { id: "euphoric", label: "Euphoric", color: "#8b5cf6" },
  { id: "frustrated", label: "Frustrated", color: "#f97316" },
]

export function EmotionCheckInDialog({ open, onOpenChange, onComplete }: EmotionCheckInDialogProps) {
  const [selectedEmotion, setSelectedEmotion] = useState("")
  const [intensity, setIntensity] = useState([5])
  const [context, setContext] = useState("")

  const handleSubmit = async () => {
    if (!selectedEmotion) return

    await storage.addEmotionLog({
      id: Date.now().toString(),
      timestamp: new Date(),
      emotion: selectedEmotion,
      intensity: intensity[0],
      context,
      phase: "before",
    })

    onComplete()
    setSelectedEmotion("")
    setIntensity([5])
    setContext("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Daily Emotion Check-In</DialogTitle>
          <DialogDescription>Take a moment to reflect on how you're feeling right now</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Emotion Selection */}
          <div className="space-y-3">
            <Label>How are you feeling?</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {emotions.map((emotion) => (
                <button
                  key={emotion.id}
                  onClick={() => setSelectedEmotion(emotion.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedEmotion === emotion.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  style={{
                    borderColor: selectedEmotion === emotion.id ? emotion.color : undefined,
                  }}
                >
                  <span className="text-sm font-medium">{emotion.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity Slider */}
          {selectedEmotion && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Intensity</Label>
                <span className="text-sm font-medium text-primary">{intensity[0]}/10</span>
              </div>
              <Slider value={intensity} onValueChange={setIntensity} min={1} max={10} step={1} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mild</span>
                <span>Intense</span>
              </div>
            </div>
          )}

          {/* Context */}
          <div className="space-y-3">
            <Label htmlFor="context">What's on your mind? (Optional)</Label>
            <Textarea
              id="context"
              placeholder="Any thoughts or context about your current emotional state..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedEmotion}>
            Complete Check-In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
