"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, ClipboardCheck, Shield, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface PgsiSurveyPromptProps {
  /** Called when the prompt should be hidden (completed or dismissed) */
  onComplete?: () => void
  /** Custom class name */
  className?: string
}

export function PgsiSurveyPrompt({ onComplete, className = "" }: PgsiSurveyPromptProps) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasSurvey, setHasSurvey] = useState(false)

  useEffect(() => {
    const checkSurveyStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }

        // Check if user has already completed the PGSI-SB survey
        const response = await fetch("/api/pgsi-survey", {
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) {
          setLoading(false)
          setVisible(true) // Show prompt if we can't check (assume not completed)
          return
        }

        const data = await response.json()
        setHasSurvey(data.hasSurvey)
        setVisible(!data.hasSurvey) // Only show if survey not completed
      } catch (error) {
        console.error("Error checking PGSI survey status:", error)
        setVisible(true) // Show prompt on error (conservative approach)
      } finally {
        setLoading(false)
      }
    }

    checkSurveyStatus()
  }, [])

  const handleDismiss = () => {
    // Store in sessionStorage so it doesn't show again this session
    sessionStorage.setItem("pgsi_prompt_dismissed", "true")
    setVisible(false)
    onComplete?.()
  }

  const handleTakeSurvey = () => {
    router.push("/pgsi-survey")
  }

  // Don't render while loading or if not visible
  if (loading || !visible) {
    return null
  }

  // Check if dismissed this session
  if (typeof window !== "undefined" && sessionStorage.getItem("pgsi_prompt_dismissed")) {
    return null
  }

  return (
    <Card className={`border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5 overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-stretch">
          {/* Icon Section */}
          <div className="hidden sm:flex items-center justify-center px-6 bg-primary/10">
            <div className="p-4 rounded-full bg-primary/20">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="h-5 w-5 text-primary sm:hidden" />
                  <h3 className="font-semibold text-lg">Complete Your Risk Assessment</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Take the PGSI-SB survey (2 minutes) to unlock personalized risk insights and
                  improve the accuracy of your betting behavior analysis.
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span>Personalized risk profile</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span>Better intervention timing</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span>Research-validated</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleTakeSurvey}
                    className="gap-2"
                  >
                    Take Survey
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    className="text-muted-foreground"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
