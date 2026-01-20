"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SmartSlipFlowController } from "@/features/smartSlip"

export default function SmartSlipPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <SmartSlipFlowController
        onComplete={() => {
          router.push("/dashboard")
        }}
      />
    </div>
  )
}
