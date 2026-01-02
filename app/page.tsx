"use client"

import { Suspense } from "react"
import { HomeContent } from "@/components/home-content"

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>}>
      <HomeContent />
    </Suspense>
  )
}
