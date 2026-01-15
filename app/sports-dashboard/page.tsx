"use client"

import { Suspense } from "react"
import { SportsDashboardContent } from "@/components/sports-dashboard-content"

export default function SportsDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading Sports Dashboard...</div>
    </div>}>
      <SportsDashboardContent />
    </Suspense>
  )
}
