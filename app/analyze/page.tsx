"use client"

import { Suspense } from "react"
import { AnalyzeContent } from "@/components/analyze-content"

export default function Analyze() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading Analyze...</div>
    </div>}>
      <AnalyzeContent />
    </Suspense>
  )
}
