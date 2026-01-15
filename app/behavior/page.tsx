"use client"

import { Suspense } from "react"
import { BehaviorContent } from "@/components/behavior-content"

export default function Behavior() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading Behavior...</div>
    </div>}>
      <BehaviorContent />
    </Suspense>
  )
}
