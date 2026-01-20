"use client"

import { Suspense } from "react"
import { lazy } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function SurveyPage() {
  const router = useRouter()

  const handleSurveyComplete = (score: number, level: string, email: string) => {
    console.log('🔧 Survey completed on dedicated page:', { score, level, email })
    
    // Redirect to home after survey completion
    setTimeout(() => {
      console.log('🔧 Redirecting to /home after survey completion')
      router.push("/home")
    }, 100)
  }

  const handleSwitchToLogin = () => {
    console.log('🔧 Survey switch to login')
    router.push("/login")
  }

  const handleClose = () => {
    console.log('🔧 Survey closed, redirecting to home')
    router.push("/home")
  }

  // Lazy load the survey component
  const SurveyComponent = lazy(() =>
    import("@/components/integrated-survey-flow/IntegratedSurveyWrapper").then((m) => ({
      default: m.IntegratedSurveyWrapper,
    }))
  )

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading survey...</div>
        </div>
      }>
        <SurveyComponent 
          onComplete={handleSurveyComplete}
          onSwitchToLogin={handleSwitchToLogin}
          onClose={handleClose}
        />
      </Suspense>
    </div>
  )
}
