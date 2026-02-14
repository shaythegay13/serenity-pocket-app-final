"use client"

import { Suspense } from "react"
import { BetLabContent } from "@/components/betlab-content"

export default function SmartSlipPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading BetLab...</div>
    </div>}>
      <BetLabContent />
    </Suspense>
  )
}
