"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import type { UserData } from "@/lib/types"

interface EmotionCheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
  userData?: UserData
  updateUserData?: (updates: Partial<UserData>) => Promise<void>
}

// Core emotions with 10 sub-emotions each
const coreEmotions = [
  {
    id: "joy",
    label: "JOY",
    color: "#f59e0b",
    subEmotions: ["Happy", "Excited", "Optimistic", "Grateful", "Confident", "Proud", "Hopeful", "Content", "Cheerful", "Inspired"]
  },
  {
    id: "calm",
    label: "CALM",
    color: "#14b8a6",
    subEmotions: ["Peaceful", "Relaxed", "Centered", "Focused", "Balanced", "Serene", "Patient", "Composed", "Tranquil", "Stable"]
  },
  {
    id: "fear",
    label: "FEAR",
    color: "#ef4444",
    subEmotions: ["Anxious", "Worried", "Nervous", "Scared", "Uncertain", "Panicked", "Hesitant", "Overwhelmed", "Tense", "Uneasy"]
  },
  {
    id: "greed",
    label: "GREED",
    color: "#8b5cf6",
    subEmotions: ["FOMO", "Euphoric", "Impulsive", "Overconfident", "Eager", "Craving", "Obsessed", "Compulsive", "Restless", "Driven"]
  },
  {
    id: "frustration",
    label: "FRUSTRATION",
    color: "#f97316",
    subEmotions: ["Angry", "Irritated", "Disappointed", "Impatient", "Stressed", "Resentful", "Annoyed", "Agitated", "Bitter", "Exhausted"]
  },
  {
    id: "sadness",
    label: "SADNESS",
    color: "#6366f1",
    subEmotions: ["Down", "Discouraged", "Regretful", "Defeated", "Helpless", "Lonely", "Empty", "Hopeless", "Dejected", "Grief"]
  }
]

export function EmotionCheckInDialog({ open, onOpenChange, onComplete, userData, updateUserData }: EmotionCheckInDialogProps) {
  const [step, setStep] = useState<"core" | "sub" | "details">("core")
  const [selectedCore, setSelectedCore] = useState<typeof coreEmotions[0] | null>(null)
  const [selectedEmotion, setSelectedEmotion] = useState("")
  const [intensity, setIntensity] = useState([5])
  const [phase, setPhase] = useState<"before" | "during" | "after">("before")
  const [outcome, setOutcome] = useState<"profit" | "loss" | "breakeven" | "">("")
  const [context, setContext] = useState("")

  const handleSubmit = async () => {
    if (!selectedEmotion) return

    // Check if this completes a pending emotion track
    const isCompletingPendingTrack = 
      phase === "after" && 
      userData?.pendingEmotionTradeId && 
      updateUserData

    await storage.addEmotionLog({
      id: Date.now().toString(),
      timestamp: new Date(),
      emotion: selectedEmotion,
      intensity: intensity[0],
      context,
      phase: phase,
      tradeId: isCompletingPendingTrack ? userData.pendingEmotionTradeId : undefined
    })

    // If completing pending track, award bonus XP and clear pending ID
    if (isCompletingPendingTrack && userData && updateUserData) {
      await updateUserData({
        pendingEmotionTradeId: undefined,
        xp: userData.xp + 35, // +10 base + 25 bonus for completing the track
        totalEmotionsLogged: (userData.totalEmotionsLogged || 0) + 1
      })
      
      toast.success("Full emotion track completed! +35 XP earned", {
        description: "Great job completing your pre and post-bet emotions!"
      })
    } else {
      toast.success("Emotion check-in completed! +10 XP earned", {
        description: "Your emotional awareness is improving. Keep it up!"
      })
    }

    onComplete()
    handleReset()
  }

  const handleReset = () => {
    setStep("core")
    setSelectedCore(null)
    setSelectedEmotion("")
    setIntensity([5])
    setPhase("before")
    setOutcome("")
    setContext("")
  }

  const handleCoreSelect = (emotion: typeof coreEmotions[0]) => {
    setSelectedCore(emotion)
    setStep("sub")
  }

  const handleSubSelect = (subEmotion: string) => {
    setSelectedEmotion(subEmotion)
    setStep("details")
  }

  const handleBack = () => {
    if (step === "sub") {
      setStep("core")
      setSelectedCore(null)
    } else if (step === "details") {
      setStep("sub")
      setSelectedEmotion("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleReset()
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-[90vw] sm:max-w-[700px] w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "core" && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle>Welcome! Daily Emotion Check-In</DialogTitle>
              <DialogDescription>
                {step === "core" && "Select a core emotion"}
                {step === "sub" && "Refine your emotion"}
                {step === "details" && "Tell us more"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3">
          {/* Step 1: Core Emotion Selection */}
          {step === "core" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-4">
                {coreEmotions.map((emotion) => (
                  <button
                    key={emotion.id}
                    onClick={() => handleCoreSelect(emotion)}
                    className="group relative aspect-square flex flex-col items-center justify-center rounded-full transition-all hover:scale-105 hover:shadow-xl min-h-[100px] min-w-[100px] md:min-h-[110px] md:min-w-[110px]"
                    style={{ backgroundColor: emotion.color }}
                  >
                    {/* Inner white circle border */}
                    <div className="absolute inset-2 rounded-full border-50 border-white/40 pointer-events-none" />
                    <span className="text-sm md:text-base lg:text-lg font-bold text-white drop-shadow-lg relative z-10 px-2">
                      {emotion.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Select a core emotion that best represents how you're feeling
              </p>
            </div>
          )}

          {/* Step 2: Sub-Emotion Selection - Zoomed In View */}
          {step === "sub" && selectedCore && (
            <div className="flex flex-col items-center justify-center zoom-in-emotion">
              {/* Circular container that mimics the large circle size */}
              <div className="relative w-full max-w-xl aspect-square mx-auto flex items-center justify-center" style={{ padding: 0, margin: '0 auto', boxSizing: 'border-box' }}>
                {/* Outer circle boundary using emotion color */}
                <div 
                  className="absolute inset-0 rounded-full shadow-2xl"
                  style={{ 
                    backgroundColor: `${selectedCore.color}15`
                  }}
                />
                
                
                {/* 10 circles: 1 center + 9 in optimal packing ring */}
                <div className="absolute inset-0" style={{ transformOrigin: 'center center' }}>
                  {selectedCore.subEmotions.map((subEmotion, index) => {
                    // Circle-packing geometry for 9 circles around 1 center:
                    // 
                    // For adjacent outer circles to touch (not overlap):
                    //   Distance between centers = 2r
                    //   2·d·sin(π/9) = 2r  (where d = ring radius, θ = 40°)
                    //   d = r / sin(π/9) = r / sin(20°) ≈ 2.924r
                    //
                    // For all circles to fit in parent (R = 50%):
                    //   d + r ≤ 50
                    //   2.924r + r ≤ 50
                    //   3.924r ≤ 50
                    //   r ≤ 12.74%
                    //
                    const parentRadius = 50
                    const angleStep = Math.PI / 9 // 20° in radians
                    const sinAngle = Math.sin(angleStep) // sin(20°) ≈ 0.342
                    
                    // Calculate optimal circle radius
                    const circleRadiusPercent = parentRadius / (1 / sinAngle + 1) // ≈ 12.74%
                    const circleDiameter = circleRadiusPercent * 2
                    const circleSize = `${circleDiameter}%`
                    
                    let x = 0, y = 0
                    
                    if (index === 0) {
                      // Center circle at exact geometric center
                      x = 0
                      y = 0
                    } else {
                      // Ring radius calculated for adjacent tangency
                      const ringRadius = circleRadiusPercent / sinAngle // ≈ 37.26%
                      
                      const angleIndex = index - 1
                      const angleDegrees = (360 / 9) * angleIndex // 0°, 40°, 80°, ...
                      const angleRadians = (angleDegrees * Math.PI) / 180
                      
                      // Position using polar coordinates, starting from top
                      x = ringRadius * Math.cos(angleRadians - Math.PI / 2)
                      y = ringRadius * Math.sin(angleRadians - Math.PI / 2)
                    }
                    
                    return (
                      <button
                        key={subEmotion}
                        onClick={() => handleSubSelect(subEmotion)}
                        className="absolute rounded-full flex items-center justify-center font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:z-10 active:scale-95"
                        style={{
                          width: circleSize,
                          aspectRatio: '1',
                          backgroundColor: selectedCore.color,
                          // --- START OF EDITS ---
                          // Reverted to your original, correct positioning logic
                          left: `calc(50% + ${x}%)`,
                          top: `calc(50% + ${y}%)`,
                          transform: 'translate(-50%, -50%)',
                          // Removed animation styles that were causing invisibility
                          // animation: `stagger-zoom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                          // animationDelay: `${index * 50}ms`,
                          // opacity: 0
                          // --- END OF EDITS ---
                        }}
                      >
                        <span className="text-base text-center px-1 leading-tight font-bold">{subEmotion}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <p className="text-center text-sm text-muted-foreground mt-4">
                Select a specific emotion
              </p>
            </div>
          )}

          {/* Step 3: Details Form */}
          {step === "details" && (
            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-6">
                {/* Selected emotion display */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">You selected</p>
                  <p className="text-2xl font-bold" style={{ color: selectedCore?.color }}>
                    {selectedEmotion}
                  </p>
                </div>

                {/* Intensity Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Intensity</Label>
                    <span className="text-lg font-bold" style={{ color: selectedCore?.color }}>
                      {intensity[0]}
                    </span>
                  </div>
                  <Slider 
                    value={intensity} 
                    onValueChange={setIntensity} 
                    min={1} 
                    max={5} 
                    step={1} 
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 (Mild)</span>
                    <span>5 (Intense)</span>
                  </div>
                </div>

                {/* Betting Phase */}
                <div className="space-y-3">
                  <Label>Select Betting Phase</Label>
                  <RadioGroup value={phase} onValueChange={(val) => setPhase(val as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="before" id="before" />
                      <Label htmlFor="before" className="cursor-pointer">Before Betting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="during" id="during" />
                      <Label htmlFor="during" className="cursor-pointer">During Betting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="after" id="after" />
                      <Label htmlFor="after" className="cursor-pointer">After Betting</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Outcome (only for after betting) */}
                {phase === "after" && (
                  <div className="space-y-3">
                    <Label>What was the outcome?</Label>
                    <RadioGroup value={outcome} onValueChange={(val) => setOutcome(val as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="profit" id="profit-dialog" />
                        <Label htmlFor="profit-dialog" className="cursor-pointer">Won 💰</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="loss" id="loss-dialog" />
                        <Label htmlFor="loss-dialog" className="cursor-pointer">Lost 📉</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="breakeven" id="breakeven-dialog" />
                        <Label htmlFor="breakeven-dialog" className="cursor-pointer">Broke Even ⚖️</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Context */}
                <div className="space-y-3">
                  <Label htmlFor="context">Optional context</Label>
                  <Textarea
                    id="context"
                    placeholder="e.g., I was profitable today"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1"
                  style={{ backgroundColor: selectedCore?.color }}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}