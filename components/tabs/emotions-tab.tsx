"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { EmotionHistory } from "@/components/emotion-history"
import { EmotionInsights } from "@/components/emotion-insights"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { UserData, EmotionLog, Trade } from "@/lib/types"
import { Plus, History, Lightbulb, ArrowLeft, Check, FileText } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface EmotionsTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  refreshKey?: number
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

const commonBiases = [
  { id: "confirmation", label: "Confirmation Bias" },
  { id: "loss-aversion", label: "Loss Aversion" },
  { id: "anchoring", label: "Anchoring" },
  { id: "recency", label: "Recency Bias" },
  { id: "overconfidence", label: "Overconfidence" },
  { id: "herd", label: "Herd Mentality" },
]

export function EmotionsTab({ userData, updateUserData, refreshKey = 0 }: EmotionsTabProps) {
  const [view, setView] = useState<"log" | "history" | "insights">("log")
  const [step, setStep] = useState<"core" | "sub" | "details" | "biases">("core")
  const [selectedCore, setSelectedCore] = useState<typeof coreEmotions[0] | null>(null)
  const [selectedEmotion, setSelectedEmotion] = useState<string>("")
  const [intensity, setIntensity] = useState([3])
  const [context, setContext] = useState<string>("")
  const [phase, setPhase] = useState<"before" | "during" | "after">("before")
  const [outcome, setOutcome] = useState<"profit" | "loss" | "breakeven" | "">("")
  const [selectedBiases, setSelectedBiases] = useState<string[]>([])
  const [logs, setLogs] = useState<EmotionLog[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const emotionFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadLogs = async () => {
      const emotionLogs = await storage.getEmotionLogs()
      setLogs(emotionLogs)
    }
    const loadTrades = async () => {
      const tradesData = await storage.getTrades()
      setTrades(tradesData)
    }
    const loadChallenges = async () => {
      const challengesData = await storage.getChallenges()
      setChallenges(challengesData)
    }
    loadLogs()
    loadTrades()
    loadChallenges()
  }, [refreshKey])

  const handleCoreSelect = (emotion: typeof coreEmotions[0]) => {
    setSelectedCore(emotion)
    setStep("sub")
  }

  const handleSubSelect = (subEmotion: string) => {
    setSelectedEmotion(subEmotion)
    // Go to bias checking if pre-trade or post-trade, otherwise details
    if (phase === "before" || phase === "after") {
      setStep("biases")
    } else {
      setStep("details")
    }
  }

  const handleBiasToggle = (biasId: string) => {
    setSelectedBiases((prev) => (prev.includes(biasId) ? prev.filter((b) => b !== biasId) : [...prev, biasId]))
  }

  const handleBack = () => {
    if (step === "sub") {
      setStep("core")
      setSelectedCore(null)
    } else if (step === "biases") {
      setStep("sub")
      setSelectedEmotion("")
    } else if (step === "details") {
      // Go back to biases if pre/post-trade, otherwise to sub
      if (phase === "before" || phase === "after") {
        setStep("biases")
      } else {
        setStep("sub")
        setSelectedEmotion("")
      }
    }
  }

  const handleReset = () => {
    setStep("core")
    setSelectedCore(null)
    setSelectedEmotion("")
    setIntensity([3])
    setContext("")
    setPhase("before")
    setOutcome("")
    setSelectedBiases([])
  }

  const handleLogEmotion = async () => {
    if (!selectedEmotion) return

    const newLog: EmotionLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      emotion: selectedEmotion,
      intensity: intensity[0],
      context,
      phase,
    }

    await storage.addEmotionLog(newLog)
    const updatedLogs = await storage.getEmotionLogs()
    setLogs(updatedLogs)

    // Different XP and gamification based on phase
    let xpEarned = 10
    let updates: Partial<UserData> = {
      totalEmotionsLogged: userData.totalEmotionsLogged + 1,
    }

    if (phase === "before") {
      // Pre-trade: +15 XP, update bias recognition ring
      xpEarned = 15
      const biasCount = selectedBiases.length
      const newBiasRingProgress = Math.min(userData.dailyRings.biasRecognition + (biasCount * 15), 100)
      
      // Create new trade entry
      const newTrade: Trade = {
        id: Date.now().toString(),
        timestamp: new Date(),
        preTradeEmotion: selectedEmotion,
        preTradeIntensity: intensity[0],
        biasesIdentified: selectedBiases,
        confidenceLevel: 5,
        reasoning: context || "No context provided",
      }
      await storage.addTrade(newTrade)
      const updatedTrades = await storage.getTrades()
      setTrades(updatedTrades)
      
      updates = {
        ...updates,
        xp: userData.xp + xpEarned,
        totalTrades: userData.totalTrades + 1,
        totalBiasesIdentified: userData.totalBiasesIdentified + biasCount,
        dailyRings: {
          ...userData.dailyRings,
          biasRecognition: newBiasRingProgress,
        },
      }

      // Update pause challenge
      const updatedChallenges = challenges.map(c => {
        if (c.id === "pause-challenge" && c.progress < c.maxProgress) {
          return { ...c, progress: c.progress + 1 }
        }
        return c
      })
      if (JSON.stringify(updatedChallenges) !== JSON.stringify(challenges)) {
        await storage.setChallenges(updatedChallenges)
        setChallenges(updatedChallenges)
      }
    } else if (phase === "after") {
      // Post-trade: +20 XP, update mindfulness ring
      xpEarned = 20
      const mindfulTrade = selectedBiases.length > 0
      const newMindfulnessProgress = Math.min(userData.dailyRings.mindfulness + 20, 100)
      
      // Find most recent trade without an outcome and update it
      const pendingTrade = trades.find(t => !t.outcome)
      if (pendingTrade) {
        await storage.updateTrade(pendingTrade.id, {
          postTradeEmotion: selectedEmotion,
          postTradeIntensity: intensity[0],
          reflection: context,
          outcome: outcome || "breakeven", // Use selected outcome or default to breakeven
        })
        const updatedTrades = await storage.getTrades()
        setTrades(updatedTrades)
      }
      
      updates = {
        ...updates,
        xp: userData.xp + xpEarned,
        mindfulTrades: mindfulTrade ? userData.mindfulTrades + 1 : userData.mindfulTrades,
        totalJournalsCompleted: userData.totalJournalsCompleted + 1,
        dailyRings: {
          ...userData.dailyRings,
          mindfulness: newMindfulnessProgress,
        },
      }
    } else {
      // During-trade: +5 XP, update emotional awareness ring
      xpEarned = 5
      const newRingProgress = Math.min(userData.dailyRings.emotionalAwareness + 10, 100)
      updates = {
        ...updates,
        xp: userData.xp + xpEarned,
        dailyRings: {
          ...userData.dailyRings,
          emotionalAwareness: newRingProgress,
        },
      }
    }

    await updateUserData(updates)
    toast.success(`Emotion logged successfully! +${xpEarned} XP earned`)

    // Reset form
    handleReset()
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header with View Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Emotion Tracking</h2>
          <p className="text-muted-foreground">Understand your emotional patterns in betting and trading</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "log" ? "default" : "outline"} onClick={() => setView("log")} className="gap-2">
            <Plus className="h-4 w-4" />
            Log
          </Button>
          <Button
            variant={view === "history" ? "default" : "outline"}
            onClick={() => setView("history")}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
          <Button
            variant={view === "insights" ? "default" : "outline"}
            onClick={() => setView("insights")}
            className="gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            Insights
          </Button>
        </div>
      </div>

      {/* Log Emotion View */}
      {view === "log" && (
        <div className="space-y-6">
          {/* Pending Trades Alert */}
          {trades.filter(t => !t.outcome).length > 0 && (
            <Card className="p-6 bg-linear-to-br from-amber/10 to-orange/10 border-amber/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber/20">
                    <FileText className="h-5 w-5 text-amber" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Pending Post-Betting Emotions</h3>
                    <p className="text-xs text-muted-foreground">
                      Complete these to earn +20 XP and track your outcomes
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber/10">
                  {trades.filter(t => !t.outcome).length} pending
                </Badge>
              </div>
              <div className="space-y-2">
                {trades.filter(t => !t.outcome).slice(0, 3).map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-card border border-border">
                    <div className="flex-1 pointer-events-none">
                      <p className="text-sm font-medium text-foreground">{trade.preTradeEmotion}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(trade.timestamp), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReset()
                        setTimeout(() => {
                          setPhase("after")
                          emotionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }, 100)
                      }}
                    >
                      Complete (+20 XP)
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

        <Card className="p-6" ref={emotionFormRef}>
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {step !== "core" && (
                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {step === "core" && "Select a core emotion"}
                  {step === "sub" && "Refine your emotion"}
                  {step === "biases" && "Check for cognitive biases"}
                  {step === "details" && "Tell us more"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step === "core" && "Choose the emotion that best represents how you're feeling"}
                  {step === "sub" && "Pick a specific emotion that describes your state"}
                  {step === "biases" && "Be honest - which biases might be influencing your decision?"}
                  {step === "details" && "Add intensity, phase, and context"}
                </p>
              </div>
            </div>
            {step !== "core" && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                Start Over
              </Button>
            )}
          </div>

          {/* Step 1: Core Emotion Selection */}
          {step === "core" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {coreEmotions.map((emotion) => (
                  <button
                    key={emotion.id}
                    onClick={() => handleCoreSelect(emotion)}
                    className="group relative aspect-square flex flex-col items-center justify-center rounded-full transition-all hover:scale-105 hover:shadow-2xl"
                    style={{ backgroundColor: emotion.color }}
                  >
                    {/* Inner white circle border */}
                    <div className="absolute inset-2 rounded-full border-50 border-white/40 pointer-events-none" />
                    <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg relative z-10">
                      {emotion.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Sub-Emotion Selection - Zoomed In View */}
          {step === "sub" && selectedCore && (
            <div className="flex flex-col items-center justify-center zoom-in-emotion min-h-[500px]">
              {/* Circular container that mimics the large circle size */}
              <div className="relative w-full max-w-lg aspect-square mx-auto flex items-center justify-center" style={{ padding: 0, margin: '0 auto', boxSizing: 'border-box' }}>
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
                        <span className="text-sm text-center px-1 leading-tight font-bold">{subEmotion}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <p className="text-center text-sm text-muted-foreground mt-6">
                Select a specific emotion
              </p>
            </div>
          )}

          {/* Step 3: Cognitive Bias Checking (for pre/post-trade) */}
          {step === "biases" && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <Card className="p-6 bg-primary/5 border border-primary/20">
                <h3 className="text-lg font-semibold text-foreground mb-2">Identify Potential Biases</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Be honest with yourself. Which cognitive biases might be influencing this trade?
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

                <Button
                  onClick={() => setStep("details")}
                  className="w-full"
                  size="lg"
                  style={{ backgroundColor: selectedCore?.color }}
                >
                  Continue to Details
                </Button>
              </Card>
            </div>
          )}

          {/* Step 4: Details Form */}
          {step === "details" && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-6">
                {/* Selected emotion display */}
                <div className="text-center pb-4 border-b">
                  <p className="text-sm text-muted-foreground mb-1">You selected</p>
                  <p className="text-3xl font-bold" style={{ color: selectedCore?.color }}>
                    {selectedEmotion}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">from {selectedCore?.label}</p>
                </div>

                {/* Intensity Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Intensity</Label>
                    <span className="text-2xl font-bold" style={{ color: selectedCore?.color }}>
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
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="before" id="before" />
                      <Label htmlFor="before" className="cursor-pointer flex-1 font-normal">Before Betting</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="during" id="during" />
                      <Label htmlFor="during" className="cursor-pointer flex-1 font-normal">During Betting</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="after" id="after" />
                      <Label htmlFor="after" className="cursor-pointer flex-1 font-normal">After Betting</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Outcome (only for after betting) */}
                {phase === "after" && (
                  <div className="space-y-3">
                    <Label>What was the outcome?</Label>
                    <RadioGroup value={outcome} onValueChange={(val) => setOutcome(val as any)}>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="profit" id="profit" />
                        <Label htmlFor="profit" className="cursor-pointer flex-1 font-normal">Won 💰</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="loss" id="loss" />
                        <Label htmlFor="loss" className="cursor-pointer flex-1 font-normal">Lost 📉</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="breakeven" id="breakeven" />
                        <Label htmlFor="breakeven" className="cursor-pointer flex-1 font-normal">Broke Even ⚖️</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Context */}
                <div className="space-y-3">
                  <Label htmlFor="context">Optional context</Label>
                  <Textarea
                    id="context"
                    placeholder="What triggered this emotion? What were you thinking about?"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <Button 
                onClick={handleLogEmotion} 
                className="w-full text-white font-semibold" 
                size="lg"
                style={{ backgroundColor: selectedCore?.color }}
              >
                <Check className="h-5 w-5 mr-2" />
                Log Emotion (+10 XP)
              </Button>
            </div>
          )}
        </Card>
        </div>
      )}

      {/* History View */}
      {view === "history" && (
        <div className="space-y-6">
          <EmotionInsights logs={logs} />
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Recent Emotion Logs</h3>
            <EmotionHistory logs={logs} trades={trades} />
          </div>
        </div>
      )}

      {/* Insights View */}
      {view === "insights" && (
        <div className="space-y-6">
          <EmotionInsights logs={logs} />

          <Card className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Emotional Patterns</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">Pre-Trade Emotions</h4>
                <p className="text-sm text-muted-foreground">
                  Track emotions before trades to identify patterns that lead to impulsive decisions. Anxiety and
                  excitement often precede risky trades.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue/5 border border-blue/20">
                <h4 className="font-semibold text-foreground mb-2">During-Trade Emotions</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor emotions while positions are open. Fear and greed can cause premature exits or holding too
                  long.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <h4 className="font-semibold text-foreground mb-2">Post-Trade Emotions</h4>
                <p className="text-sm text-muted-foreground">
                  Reflect on emotions after closing trades. Regret and frustration can lead to revenge trading.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}