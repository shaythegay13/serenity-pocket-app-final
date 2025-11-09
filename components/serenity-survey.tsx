"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"

export interface SurveyData {
  name: string
  email: string
  userType: "sports-bettor" | "day-trader" | "both"
  experience: "beginner" | "intermediate" | "advanced"
  primaryGoal: string
  emotionalChallenges: string[]
  weeklyActivity: string
  // New fields
  motivation: string
  triggerSituations: string[]
  triggerOther?: string
  trackingMethod: string
  preferredSupport: string[]
  monthlyBudget: string
  referralSource: string
  referralOther?: string
  // Optional demographics
  ageRange?: string
  region?: string
  occupation?: string
}

interface SerenitySurveyProps {
  onComplete: (data: SurveyData) => void
  onSwitchToSignIn?: () => void
}

export function SerenitySurvey({ onComplete, onSwitchToSignIn }: SerenitySurveyProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<SurveyData>({
    name: "",
    email: "",
    userType: "day-trader",
    experience: "beginner",
    primaryGoal: "",
    emotionalChallenges: [],
    weeklyActivity: "",
    // New fields
    motivation: "",
    triggerSituations: [],
    trackingMethod: "",
    preferredSupport: [],
    monthlyBudget: "",
    referralSource: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const emotionalChallengeOptions = [
    "Fear of missing out (FOMO)",
    "Revenge trading after losses",
    "Overconfidence after wins",
    "Analysis paralysis",
    "Emotional attachment to positions",
    "Difficulty accepting losses",
    "Impulsive decision-making",
    "Stress and anxiety",
  ]

  const validateStep = (currentStep: number): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Name is required"
      }
      if (!formData.email.trim() || !formData.email.includes("@")) {
        newErrors.email = "Valid email is required"
      }
    } else if (currentStep === 3) {
      if (!formData.primaryGoal.trim()) {
        newErrors.primaryGoal = "Please select a primary goal"
      }
    } else if (currentStep === 5) {
      if (!formData.motivation.trim()) {
        newErrors.motivation = "Please select your motivation"
      }
    } else if (currentStep === 7) {
      if (!formData.trackingMethod.trim()) {
        newErrors.trackingMethod = "Please select a tracking method"
      }
    } else if (currentStep === 9) {
      if (!formData.monthlyBudget.trim()) {
        newErrors.monthlyBudget = "Please select your monthly budget"
      }
    } else if (currentStep === 10) {
      if (!formData.referralSource.trim()) {
        newErrors.referralSource = "Please tell us how you heard about us"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 11) {
        setStep(step + 1)
      } else {
        onComplete(formData)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const toggleChallenge = (challenge: string) => {
    setFormData({
      ...formData,
      emotionalChallenges: formData.emotionalChallenges.includes(challenge)
        ? formData.emotionalChallenges.filter((c) => c !== challenge)
        : [...formData.emotionalChallenges, challenge],
    })
  }

  const toggleTrigger = (trigger: string) => {
    setFormData({
      ...formData,
      triggerSituations: formData.triggerSituations.includes(trigger)
        ? formData.triggerSituations.filter((t) => t !== trigger)
        : [...formData.triggerSituations, trigger],
    })
  }

  const toggleSupport = (support: string) => {
    setFormData({
      ...formData,
      preferredSupport: formData.preferredSupport.includes(support)
        ? formData.preferredSupport.filter((s) => s !== support)
        : [...formData.preferredSupport, support],
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-2xl p-8 space-y-6 shadow-lg">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Serenity Pocket" width={80} height={80} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to Serenity Pocket</h1>
          <p className="text-muted-foreground">
            Master the psychological game of sports betting and day trading
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((s) => (
            <div
              key={s}
              className={`h-2 w-8 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Let's get started</h2>
              <p className="text-sm text-muted-foreground">
                Tell us a bit about yourself
              </p>
              {onSwitchToSignIn && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    onSwitchToSignIn()
                  }}
                  className="mt-3 text-sm text-primary hover:underline cursor-pointer"
                >
                  Already Have an Account?
                </button>
              )}
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
          </div>
        )}

        {/* Step 2: User Type & Experience */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">What brings you here?</h2>
              <p className="text-sm text-muted-foreground">
                Help us personalize your experience
              </p>
            </div>

            <div className="space-y-3">
              <Label>I primarily engage in:</Label>
              <RadioGroup
                value={formData.userType}
                onValueChange={(value) => setFormData({ ...formData, userType: value as any })}
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="sports-bettor" id="sports-bettor" />
                  <Label htmlFor="sports-bettor" className="cursor-pointer flex-1">
                    Sports Betting
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="day-trader" id="day-trader" />
                  <Label htmlFor="day-trader" className="cursor-pointer flex-1">
                    Day Trading (Stocks, Crypto, Forex)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="cursor-pointer flex-1">
                    Both
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Experience Level:</Label>
              <RadioGroup
                value={formData.experience}
                onValueChange={(value) => setFormData({ ...formData, experience: value as any })}
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <Label htmlFor="beginner" className="cursor-pointer flex-1">
                    Beginner (Less than 1 year)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate" className="cursor-pointer flex-1">
                    Intermediate (1-3 years)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced" className="cursor-pointer flex-1">
                    Advanced (3+ years)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Step 3: Goals & Activity */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Your goals and activity</h2>
              <p className="text-sm text-muted-foreground">
                What do you hope to achieve with Serenity Pocket?
              </p>
            </div>

            <div className="space-y-3">
              <Label>Primary Goal:</Label>
              <RadioGroup
                value={formData.primaryGoal}
                onValueChange={(value) => setFormData({ ...formData, primaryGoal: value })}
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="emotional-control" id="emotional-control" />
                  <Label htmlFor="emotional-control" className="cursor-pointer flex-1">
                    Better emotional control during trades/bets
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="reduce-losses" id="reduce-losses" />
                  <Label htmlFor="reduce-losses" className="cursor-pointer flex-1">
                    Reduce emotionally-driven losses
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="bias-awareness" id="bias-awareness" />
                  <Label htmlFor="bias-awareness" className="cursor-pointer flex-1">
                    Identify and overcome cognitive biases
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="discipline" id="discipline" />
                  <Label htmlFor="discipline" className="cursor-pointer flex-1">
                    Build consistent discipline and routines
                  </Label>
                </div>
              </RadioGroup>
              {errors.primaryGoal && <p className="text-sm text-red-500">{errors.primaryGoal}</p>}
            </div>

            <div className="space-y-3">
              <Label>Weekly Activity Level:</Label>
              <RadioGroup
                value={formData.weeklyActivity}
                onValueChange={(value) => setFormData({ ...formData, weeklyActivity: value })}
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="cursor-pointer flex-1">
                    Daily (5-7 days/week)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="frequent" id="frequent" />
                  <Label htmlFor="frequent" className="cursor-pointer flex-1">
                    Frequent (3-4 days/week)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="occasional" id="occasional" />
                  <Label htmlFor="occasional" className="cursor-pointer flex-1">
                    Occasional (1-2 days/week)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Step 4: Emotional Challenges */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Emotional challenges</h2>
              <p className="text-sm text-muted-foreground">
                Select all that apply to you (optional)
              </p>
            </div>

            <div className="space-y-3">
              {emotionalChallengeOptions.map((challenge) => (
                <div
                  key={challenge}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer"
                  onClick={() => toggleChallenge(challenge)}
                >
                  <Checkbox
                    checked={formData.emotionalChallenges.includes(challenge)}
                    onCheckedChange={() => toggleChallenge(challenge)}
                  />
                  <Label className="cursor-pointer flex-1">{challenge}</Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Account Creation Motivation */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">What brought you here?</h2>
              <p className="text-sm text-muted-foreground">
                What motivated you to seek a tool like Serenity Pocket?
              </p>
            </div>

            <div className="space-y-3">
              <RadioGroup
                value={formData.motivation}
                onValueChange={(value) => setFormData({ ...formData, motivation: value })}
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="struggling-losses" id="struggling-losses" />
                  <Label htmlFor="struggling-losses" className="cursor-pointer flex-1">
                    Struggling with losses
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="need-discipline" id="need-discipline" />
                  <Label htmlFor="need-discipline" className="cursor-pointer flex-1">
                    Need more discipline
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="peers-recommended" id="peers-recommended" />
                  <Label htmlFor="peers-recommended" className="cursor-pointer flex-1">
                    Peers recommended
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="saw-online" id="saw-online" />
                  <Label htmlFor="saw-online" className="cursor-pointer flex-1">
                    Saw online
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="general-curiosity" id="general-curiosity" />
                  <Label htmlFor="general-curiosity" className="cursor-pointer flex-1">
                    General curiosity
                  </Label>
                </div>
              </RadioGroup>
              {errors.motivation && <p className="text-sm text-red-500">{errors.motivation}</p>}
            </div>
          </div>
        )}

        {/* Step 6: Biggest Trigger Situations */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Your triggers</h2>
              <p className="text-sm text-muted-foreground">
                Which situations most often lead you to make unplanned or emotional trades/bets?
              </p>
            </div>

            <div className="space-y-3">
              {["Losing streak", "Big win", "Social influence", "Deadline pressure"].map((trigger) => (
                <div
                  key={trigger}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer"
                  onClick={() => toggleTrigger(trigger)}
                >
                  <Checkbox
                    checked={formData.triggerSituations.includes(trigger)}
                    onCheckedChange={() => toggleTrigger(trigger)}
                  />
                  <Label className="cursor-pointer flex-1">{trigger}</Label>
                </div>
              ))}
              <div className="space-y-2">
                <div
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer"
                  onClick={() => toggleTrigger("Other")}
                >
                  <Checkbox
                    checked={formData.triggerSituations.includes("Other")}
                    onCheckedChange={() => toggleTrigger("Other")}
                  />
                  <Label className="cursor-pointer flex-1">Other</Label>
                </div>
                {formData.triggerSituations.includes("Other") && (
                  <Input
                    placeholder="Please specify..."
                    value={formData.triggerOther || ""}
                    onChange={(e) => setFormData({ ...formData, triggerOther: e.target.value })}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Tracking Methods */}
        {step === 7 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Current tracking habits</h2>
              <p className="text-sm text-muted-foreground">
                Do you currently track your bets or trades and emotional state in any way?
              </p>
            </div>

            <div className="space-y-3">
              <RadioGroup
                value={formData.trackingMethod}
                onValueChange={(value) => setFormData({ ...formData, trackingMethod: value })}
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="journal-app" id="journal-app" />
                  <Label htmlFor="journal-app" className="cursor-pointer flex-1">
                    Yes, with a journal or app
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="mentally" id="mentally" />
                  <Label htmlFor="mentally" className="cursor-pointer flex-1">
                    Yes, but only mentally
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="no-tracking" id="no-tracking" />
                  <Label htmlFor="no-tracking" className="cursor-pointer flex-1">
                    No, I don't track
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="other" id="tracking-other" />
                  <Label htmlFor="tracking-other" className="cursor-pointer flex-1">
                    Other
                  </Label>
                </div>
              </RadioGroup>
              {errors.trackingMethod && <p className="text-sm text-red-500">{errors.trackingMethod}</p>}
            </div>
          </div>
        )}

        {/* Step 8: Preferred Support Methods */}
        {step === 8 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Support preferences</h2>
              <p className="text-sm text-muted-foreground">
                Which support methods are you most interested in? (Select all that apply)
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Personalized analytics",
                "Peer support groups",
                "Educational content",
                "AI chat/bot support",
                "1-on-1 coaching"
              ].map((support) => (
                <div
                  key={support}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer"
                  onClick={() => toggleSupport(support)}
                >
                  <Checkbox
                    checked={formData.preferredSupport.includes(support)}
                    onCheckedChange={() => toggleSupport(support)}
                  />
                  <Label className="cursor-pointer flex-1">{support}</Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 9: Budget/Scale Insight */}
        {step === 9 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Activity scale</h2>
              <p className="text-sm text-muted-foreground">
                What is your typical monthly budget or volume for betting/trading?
              </p>
            </div>

            <div className="space-y-3">
              <RadioGroup
                value={formData.monthlyBudget}
                onValueChange={(value) => setFormData({ ...formData, monthlyBudget: value })}
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="under-100" id="under-100" />
                  <Label htmlFor="under-100" className="cursor-pointer flex-1">
                    Under $100
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="100-500" id="100-500" />
                  <Label htmlFor="100-500" className="cursor-pointer flex-1">
                    $100 - $500
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="500-2000" id="500-2000" />
                  <Label htmlFor="500-2000" className="cursor-pointer flex-1">
                    $500 - $2,000
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="2000-plus" id="2000-plus" />
                  <Label htmlFor="2000-plus" className="cursor-pointer flex-1">
                    $2,000+
                  </Label>
                </div>
              </RadioGroup>
              {errors.monthlyBudget && <p className="text-sm text-red-500">{errors.monthlyBudget}</p>}
            </div>
          </div>
        )}

        {/* Step 10: Platform Referral */}
        {step === 10 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">How did you find us?</h2>
              <p className="text-sm text-muted-foreground">
                How did you hear about Serenity Pocket?
              </p>
            </div>

            <div className="space-y-3">
              <RadioGroup
                value={formData.referralSource}
                onValueChange={(value) => setFormData({ ...formData, referralSource: value })}
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="friend" id="friend" />
                  <Label htmlFor="friend" className="cursor-pointer flex-1">
                    Friend
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="online-ad" id="online-ad" />
                  <Label htmlFor="online-ad" className="cursor-pointer flex-1">
                    Online ad
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="social-media" id="social-media" />
                  <Label htmlFor="social-media" className="cursor-pointer flex-1">
                    Social media
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="community-forum" id="community-forum" />
                  <Label htmlFor="community-forum" className="cursor-pointer flex-1">
                    Community/forum
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="referral-other" id="referral-other" />
                  <Label htmlFor="referral-other" className="cursor-pointer flex-1">
                    Other
                  </Label>
                </div>
              </RadioGroup>
              {formData.referralSource === "referral-other" && (
                <Input
                  placeholder="Please specify..."
                  value={formData.referralOther || ""}
                  onChange={(e) => setFormData({ ...formData, referralOther: e.target.value })}
                />
              )}
              {errors.referralSource && <p className="text-sm text-red-500">{errors.referralSource}</p>}
            </div>
          </div>
        )}

        {/* Step 11: Optional Demographics */}
        {step === 11 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">A little more about you</h2>
              <p className="text-sm text-muted-foreground">
                Optional: Help us tailor content for you (all fields optional)
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ageRange">Age Range (Optional)</Label>
                <RadioGroup
                  value={formData.ageRange || ""}
                  onValueChange={(value) => setFormData({ ...formData, ageRange: value })}
                >
                  <div className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="18-24" id="18-24" />
                    <Label htmlFor="18-24" className="cursor-pointer flex-1">18-24</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="25-34" id="25-34" />
                    <Label htmlFor="25-34" className="cursor-pointer flex-1">25-34</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="35-44" id="35-44" />
                    <Label htmlFor="35-44" className="cursor-pointer flex-1">35-44</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="45-54" id="45-54" />
                    <Label htmlFor="45-54" className="cursor-pointer flex-1">45-54</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="55-plus" id="55-plus" />
                    <Label htmlFor="55-plus" className="cursor-pointer flex-1">55+</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region/Time Zone (Optional)</Label>
                <Input
                  id="region"
                  type="text"
                  placeholder="e.g., Eastern US, Europe, Asia Pacific"
                  value={formData.region || ""}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">General Occupation (Optional)</Label>
                <Input
                  id="occupation"
                  type="text"
                  placeholder="e.g., Student, Professional, Retired"
                  value={formData.occupation || ""}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          <Button onClick={handleNext} className="flex-1">
            {step < 11 ? "Continue" : "Complete Survey"}
          </Button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-center text-muted-foreground">
          Your information is secure and will only be used to personalize your experience
        </p>
      </Card>
    </div>
  )
}
