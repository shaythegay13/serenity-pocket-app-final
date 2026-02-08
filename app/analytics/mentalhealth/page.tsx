"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MentalHealthPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main analytics page with mental-health tab selected
    router.replace("/analytics?tab=mental-health")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="animate-pulse text-muted-foreground">Loading Mental Health Analytics...</div>
      </div>
    </div>
  )
}
