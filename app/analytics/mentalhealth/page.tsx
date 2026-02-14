"use client"

import { Suspense } from "react"
import { AnalyticsContent } from "@/components/analytics-content"

export default function MentalHealthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading Analytics...</div>
    </div>}>
      <AnalyticsContent />
    </Suspense>
  )
}
