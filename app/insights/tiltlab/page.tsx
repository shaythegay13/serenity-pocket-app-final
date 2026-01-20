"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { TiltLabFlowController } from "@/features/tiltLab"

export default function TiltLabPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <TiltLabFlowController
        onComplete={() => {
          router.push("/insights/smartslip")
        }}
      />
    </div>
  )
}
