"use client"

import { Suspense } from "react"
import { ProfileContent } from "@/components/profile-content"

export default function Profile() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading Profile...</div>
    </div>}>
      <ProfileContent />
    </Suspense>
  )
}
