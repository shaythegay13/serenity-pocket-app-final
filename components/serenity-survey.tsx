"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import type { SurveyData } from "@/lib/types"

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
    weeklyActivity: "",
    referralSource: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

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
    } else if (currentStep === 4) {
      if (!formData.referralSource.trim()) {
        newErrors.referralSource = "Please tell us how you heard about us"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 4) {
        setStep(step + 1)
      } else {
        onComplete({
          ...formData,
          completedAt: new Date().toISOString()
        })
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
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
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
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

        {/* Step 4: Referral & Demographics */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Almost done!</h2>
              <p className="text-sm text-muted-foreground">
                Help us understand how you found us
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>How did you hear about Serenity Pocket?</Label>
                <RadioGroup
                  value={formData.referralSource}
                  onValueChange={(value) => setFormData({ ...formData, referralSource: value })}
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="friend" id="friend" />
                    <Label htmlFor="friend" className="cursor-pointer flex-1">
                      Friend or colleague
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="online-ad" id="online-ad" />
                    <Label htmlFor="online-ad" className="cursor-pointer flex-1">
                      Online advertisement
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
                    <RadioGroupItem value="search-engine" id="search-engine" />
                    <Label htmlFor="search-engine" className="cursor-pointer flex-1">
                      Search engine
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

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-3">Optional: Demographics (for investor insights)</p>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="ageRange">Age Range</Label>
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
                    <Label htmlFor="region">Region/Time Zone</Label>
                    <Input
                      id="region"
                      type="text"
                      placeholder="e.g., Eastern US, Europe, Asia Pacific"
                      value={formData.region || ""}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupation">General Occupation</Label>
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
            {step < 4 ? "Continue" : "Complete Survey"}
          </Button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-center text-muted-foreground">
          Your information is secure and will only be used to personalize your experience
        </p>

        {/* Sign In Option for Returning Users */}
        {onSwitchToSignIn && (
          <div className="pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Already have an account?
              </p>
              <Button
                variant="ghost"
                onClick={onSwitchToSignIn}
                className="text-primary hover:text-primary hover:underline"
              >
                Sign In Instead
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
