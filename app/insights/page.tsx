"use client"

import { Suspense } from "react"
import { InsightsContent } from "@/components/insights-content"

export default function Insights() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading Insights...</div>
    </div>}>
      <InsightsContent />
    </Suspense>
  )
}
