"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, Lock, LogOut } from "lucide-react"
import type { UserData } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface OnboardingGateProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  onComplete: () => void
}

// Core emotions for emotion tracking
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

export function OnboardingGate({ userData, updateUserData, onComplete }: OnboardingGateProps) {
  const [activeStep, setActiveStep] = useState<"biography" | "emotion-pre">("biography")
  
  // Biography state
  const [biography, setBiography] = useState(userData?.biography || "")
  const [ageRange, setAgeRange] = useState(userData?.surveyData?.ageRange || "")
  const [region, setRegion] = useState(userData?.surveyData?.region || "")
  const [occupation, setOccupation] = useState(userData?.surveyData?.occupation || "")
  
  // Emotion tracking state - only pre-bet during onboarding
  const [preSelectedCore, setPreSelectedCore] = useState<typeof coreEmotions[0] | null>(null)
  const [preEmotion, setPreEmotion] = useState("")
  const [preIntensity, setPreIntensity] = useState([5])
  const [preContext, setPreContext] = useState("")

  const biographyComplete = userData?.biographyComplete || false
  const emotionTrackComplete = userData?.emotionTrackComplete || false

  useEffect(() => {
    if (!biographyComplete) {
      setActiveStep("biography")
    } else if (!emotionTrackComplete) {
      setActiveStep("emotion-pre")
    }
  }, [biographyComplete, emotionTrackComplete])

  const handleBiographySubmit = async () => {
    if (biography.trim().length < 50) {
      toast.error("Please write at least 50 characters about yourself")
      return
    }

    // Calculate XP bonus for optional demographics
    let xpBonus = 0
    const hasAllDemographics = ageRange && region && occupation
    if (hasAllDemographics) {
      xpBonus = 200
    }

    await updateUserData({
      biography: biography.trim(),
      biographyComplete: true,
      surveyData: userData?.surveyData ? {
        ...userData.surveyData,
        ageRange: ageRange || userData.surveyData.ageRange,
        region: region || userData.surveyData.region,
        occupation: occupation || userData.surveyData.occupation,
      } : undefined,
      xp: (userData?.xp || 0) + xpBonus
    })

    toast.success(`Biography saved!${xpBonus > 0 ? ` +${xpBonus} XP for completing demographics!` : ""}`)
    setActiveStep("emotion-pre")
  }

  const handlePreEmotionSubmit = async () => {
    if (!preEmotion) {
      toast.error("Please select an emotion")
      return
    }

    // Generate a unique trade ID for tracking - user will complete post-bet later
    const tradeId = `trade-${Date.now()}`

    await storage.addEmotionLog({
      id: `${Date.now()}-pre`,
      timestamp: new Date(),
      emotion: preEmotion,
      intensity: preIntensity[0],
      context: preContext,
      phase: "before",
      tradeId: tradeId
    })

    // Store the pending trade ID so user can complete it later
    await updateUserData({
      emotionTrackComplete: true,
      onboardingComplete: true,
      lastEmotionCheckIn: new Date(),
      xp: (userData?.xp || 0) + 25, // Half XP now, rest when they complete post-bet
      totalEmotionsLogged: (userData?.totalEmotionsLogged || 0) + 1,
      pendingEmotionTradeId: tradeId // Store for later completion
    })

    toast.success("Pre-bet emotion logged! +25 XP", {
      description: "Complete your post-bet emotion later to earn +25 more XP!"
    })

    onComplete()
  }

  const handleSignOut = async () => {
    try {
      console.log('🔐 Onboarding gate: Starting logout...')
      
      // Reset any error handling flags that might interfere
      const { resetErrorHandling } = await import('@/lib/auth-utils')
      resetErrorHandling()
      
      // Force sign out with global scope
      await supabase.auth.signOut({ scope: 'global' })
      
      // Clear storage
      if (typeof window !== "undefined") {
        sessionStorage.clear()
        localStorage.clear()
      }
      
      // Redirect with delay
      setTimeout(() => {
        window.location.href = "/"
      }, 100)
      
    } catch (error) {
      console.error("Onboarding gate logout error:", error)
      // Fallback: force redirect even if logout fails
      setTimeout(() => {
        window.location.href = "/"
      }, 100)
    }
  }

  const progressPercentage = biographyComplete && emotionTrackComplete ? 100 : biographyComplete ? 50 : 0

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        {/* Sign Out Option */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Complete Your Onboarding</h1>
          <p className="text-sm text-muted-foreground">
            To prevent spam and ensure quality, complete these 2 quick steps
          </p>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between items-center px-4">
          <div className="flex flex-col items-center gap-2">
            {biographyComplete ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : (
              <Circle className={`h-8 w-8 ${activeStep === "biography" ? "text-primary" : "text-muted-foreground"}`} />
            )}
            <span className="text-xs font-medium">Biography</span>
          </div>
          
          <div className="flex-1 h-px bg-border mx-4" />
          
          <div className="flex flex-col items-center gap-2">
            {emotionTrackComplete ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : biographyComplete ? (
              <Circle className={`h-8 w-8 ${activeStep.startsWith("emotion") ? "text-primary" : "text-muted-foreground"}`} />
            ) : (
              <Lock className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="text-xs font-medium">Emotion Track</span>
          </div>
        </div>

        {/* Biography Step */}
        {activeStep === "biography" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold mb-2">Tell us about yourself</h2>
              <p className="text-sm text-muted-foreground">
                Share your background, trading/betting experience, and goals (min 50 characters)
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="biography">Your Story</Label>
                <Textarea
                  id="biography"
                  placeholder="Example: I've been day trading for 2 years, mostly tech stocks. I struggle with FOMO and tend to overtrade when I'm up. Looking to build better emotional discipline..."
                  value={biography}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBiography(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {biography.length}/50 characters minimum
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">
                  Optional Demographics (+200 XP bonus for completing all)
                </p>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="age">Age Range</Label>
                    <RadioGroup value={ageRange} onValueChange={setAgeRange}>
                      <div className="grid grid-cols-2 gap-2">
                        {["18-24", "25-34", "35-44", "45-54", "55+"].map((age) => (
                          <div key={age} className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-accent cursor-pointer">
                            <RadioGroupItem value={age} id={`age-${age}`} />
                            <Label htmlFor={`age-${age}`} className="cursor-pointer flex-1">{age}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="region">Region/Time Zone</Label>
                    <Input
                      id="region"
                      placeholder="e.g., Eastern US, Europe, Asia Pacific"
                      value={region}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegion(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      placeholder="e.g., Student, Professional, Retired"
                      value={occupation}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setOccupation(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleBiographySubmit} className="w-full" disabled={biography.trim().length < 50}>
              Save & Continue
            </Button>
          </div>
        )}

        {/* Pre-Bet Emotion Step */}
        {activeStep === "emotion-pre" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold mb-2">Log Your Pre-Bet Emotion</h2>
              <p className="text-sm text-muted-foreground">
                How are you feeling right now BEFORE placing your bet? You'll log your post-bet emotion on the dashboard later.
              </p>
            </div>

            {!preSelectedCore ? (
              <div className="grid grid-cols-2 gap-3">
                {coreEmotions.map((emotion) => (
                  <button
                    key={emotion.id}
                    onClick={() => setPreSelectedCore(emotion)}
                    className="p-4 rounded-lg border-2 border-border hover:border-primary transition-all hover:scale-105"
                    style={{ borderColor: emotion.color + "40" }}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        <span style={{ color: emotion.color }}>●</span>
                      </div>
                      <span className="font-semibold" style={{ color: emotion.color }}>
                        {emotion.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="outline" size="sm" onClick={() => setPreSelectedCore(null)}>
                  ← Back to emotions
                </Button>
                
                <div className="space-y-3">
                  <Label>Specific Emotion</Label>
                  <RadioGroup value={preEmotion} onValueChange={setPreEmotion}>
                    <div className="grid grid-cols-2 gap-2">
                      {preSelectedCore.subEmotions.map((emotion: string) => (
                        <div key={emotion} className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-accent cursor-pointer">
                          <RadioGroupItem value={emotion} id={`pre-${emotion}`} />
                          <Label htmlFor={`pre-${emotion}`} className="cursor-pointer flex-1">{emotion}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Intensity: {preIntensity[0]}/10</Label>
                  <Slider
                    value={preIntensity}
                    onValueChange={setPreIntensity}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pre-context">Context (Optional)</Label>
                  <Textarea
                    id="pre-context"
                    placeholder="What's happening? Why do you feel this way?"
                    value={preContext}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPreContext(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handlePreEmotionSubmit} className="w-full" disabled={!preEmotion}>
                  Log Pre-Bet Emotion
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground border-t pt-4">
          <p>This helps us verify real users and provide better personalized insights.</p>
        </div>
      </Card>
    </div>
  )
}
